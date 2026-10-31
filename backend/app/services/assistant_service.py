import json
import logging
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.config import settings
from app.models.db_models import DBScheme, DBConversation, DBConversationMessage
from app.models.schemas import ChatMessageResponse

logger = logging.getLogger("civiconnect.assistant")

SYSTEM_PROMPT = """You are CiviConnect, an authoritative, independent public service and government scheme information navigator for Indian citizens and international visitors.
Your objective is to provide accurate, empathetic, and clear guidance on public schemes, eligibility criteria, required documents, and official application procedures.

CRITICAL OPERATIONAL RULES:
1. Grounded Accuracy: Only mention schemes, benefits, documents, and helplines provided in the verified context data. NEVER invent scheme names, fake URLs, non-existent benefits, or arbitrary eligibility criteria.
2. Independent Status: Always clarify that CiviConnect is an independent information service and does not guarantee benefits or submit applications on behalf of the government.
3. Language Directives:
   - If the user writes or requests Punjabi (or romanized Punjabi), respond in respectful, natural Punjabi (ਪੰਜਾਬੀ).
   - If the user writes or requests Hindi (or Hinglish), respond in natural, accessible Hindi (हिंदी).
   - If English is requested, respond in clear, professional English.
4. Privacy: Never request sensitive information such as Aadhaar numbers, bank passwords, OTPs, or biometric details.
5. Structure: Keep answers structured with bullet points for benefits, criteria, required documents, and official portal links.
"""


class AssistantService:
    def __init__(self):
        self.client = None
        self._init_provider()

    def _init_provider(self):
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            try:
                from google import genai
                from google.genai import types
                timeout_ms = 8000
                self.client = genai.Client(
                    api_key=settings.GEMINI_API_KEY.strip(),
                    http_options=types.HttpOptions(
                        timeout=timeout_ms,
                        retry_options=types.HttpRetryOptions(attempts=1)
                    )
                )
                logger.info(f"Gemini AI Client initialized with model {settings.GEMINI_MODEL}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
                self.client = None
        else:
            self.client = None

    def get_provider_status(self) -> Dict[str, Any]:
        has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
        return {
            "provider": "Google Gemini",
            "model": settings.GEMINI_MODEL,
            "has_api_key": has_key,
            "status": "ready" if (self.client and has_key) else "configuration_required",
            "message": (
                "Live Gemini AI model active."
                if (self.client and has_key)
                else "GEMINI_API_KEY environment variable is not configured on the backend. Running in database-grounded fallback mode."
            )
        }

    @staticmethod
    def detect_language(user_message: str, requested_lang: Optional[str] = "en") -> str:
        # Check Gurmukhi script unicode range: \u0A00-\u0A7F
        if re.search(r'[\u0A00-\u0A7F]', user_message):
            return "pa"
        # Check Devanagari script unicode range: \u0900-\u097F
        if re.search(r'[\u0900-\u097F]', user_message):
            return "hi"
        if requested_lang in ("pa", "hi"):
            return requested_lang
        # Check Romanized Punjabi / Hindi (Hinglish) phrases
        low = user_message.lower()
        pa_phrases = ["kidan", "kiven", "tusi", "saada pind", "vazifa chahida", "scholarship chahidi", "punjab vich", "daakhla", "yojana dasso", "mainu", "kive"]
        if any(k in low for k in pa_phrases):
            return "pa"
        hi_phrases = [
            "kaise milega", "yojana batao", "mujhe chahiye", "kya hai", "patrata kya hai",
            "aavedan kaise kare", "ke liye", "chahiye", "paisa kab", "lagwane", "kholne",
            "milti hai", "banane ke liye", "kya documents", "bataiye", "batao"
        ]
        if any(k in low for k in hi_phrases):
            return "hi"
        return "en"

    @staticmethod
    def retrieve_relevant_schemes(db: Session, message: str, user_profile: Optional[Dict[str, Any]] = None) -> List[DBScheme]:
        low = message.lower()
        schemes = db.query(DBScheme).filter(DBScheme.status == "active").all()
        if not schemes:
            return []

        # Comprehensive semantic & Hinglish dictionary
        INTENT_MAP = {
            "housing": {
                "keywords": ["awas", "housing", "pmay", "ghar", "makaan", "chhat", "home", "shelter", "colony", "ਮਕਾਨ", "ਘਰ", "ਆਵਾਸ", "आवास", "घर", "मकान"],
                "boost_ids": ["pmay-g", "pmay-u"],
                "boost_categories": ["housing"]
            },
            "widow": {
                "keywords": ["widow", "vidhwa", "vidva", "destitute", "bewa", "विधवा", "ਵਿਧਵਾ", "ignwps"],
                "boost_ids": ["punjab-widow-pension", "nsap-ignwps"],
                "boost_categories": ["social_security", "pension"]
            },
            "disability": {
                "keywords": ["disability", "disabled", "divyang", "viklang", "handicap", "udid", "igndps", "ਦਿਵਿਆਂਗ", "ਅੰਗਹੀਣ", "दिव्यांग", "विकलांग"],
                "boost_ids": ["punjab-disability-pension", "nsap-igndps"],
                "boost_categories": ["social_security", "pension"]
            },
            "solar": {
                "keywords": ["solar", "surya", "bijli", "electricity", "urja", "panel", "rooftop", "sun", "ਊਰਜਾ", "ਬਿਜਲੀ", "ਸੂਰਜ", "सौर", "बिजली", "सूर्य"],
                "boost_ids": ["pm-surya-ghar", "pm-kusum"],
                "boost_categories": ["infrastructure", "agriculture"]
            },
            "business_loan": {
                "keywords": ["dukan", "shop", "business", "loan", "karz", "mudra", "svanidhi", "pmegp", "vyapar", "startup", "vendor", "rehri", "feriwala", "ਵਪਾਰ", "ਦੁਕਾਨ", "ਲੋਨ", "ਕਰਜ਼ਾ", "व्यापार", "दुकान", "ऋण", "मुद्रा"],
                "boost_ids": ["pm-mudra-yojana", "pm-svanidhi", "pmegp", "stand-up-india"],
                "boost_categories": ["employment", "business", "financial_support"]
            },
            "girl_child": {
                "keywords": ["beti", "daughter", "girl", "kanya", "sukanya", "ladki", "shagun", "ashirwad", "marriage", "wedding", "vivah", "shadi", "ਧੀ", "ਕੰਨਿਆ", "ਵਿਆਹ", "ਸ਼ਗਨ", "बेटी", "कन्या", "विवाह", "शादी", "शगुन", "pmmvy"],
                "boost_ids": ["sukanya-samriddhi", "punjab-ashirwad", "pmmvy", "janani-suraksha-yojana"],
                "boost_categories": ["women_and_children"]
            },
            "farmer": {
                "keywords": ["kisan", "farmer", "kheti", "fasal", "krishi", "pm-kisan", "pmfby", "crop", "bima", "land", "jamabandi", "fertilizer", "tractor", "ਮਿੱਟੀ", "ਕਿਸਾਨ", "ਖੇਤੀ", "ਫਸਲ", "किसान", "खेती", "फसल", "कृषि"],
                "boost_ids": ["pm-kisan", "pmfby", "pm-kusum", "soil-health-card"],
                "boost_categories": ["agriculture", "farmers", "rural_development"]
            },
            "health": {
                "keywords": ["ayushman", "pm-jay", "health", "hospital", "ilaj", "bima", "swasthya", "doctor", "treatment", "dawa", "sehat", "sarbat", "ਸਿਹਤ", "ਇਲਾਜ", "ਹਸਪਤਾਲ", "स्वास्थ्य", "इलाज", "अस्पताल"],
                "boost_ids": ["pm-jay", "punjab-bhai-ghanhya", "janani-suraksha-yojana"],
                "boost_categories": ["health", "healthcare", "insurance"]
            },
            "scholarship": {
                "keywords": ["scholarship", "vazifa", "chhatravritti", "padhai", "college", "school", "student", "btech", "matric", "post-matric", "fee", "study", "ਵਜ਼ੀਫ਼ਾ", "ਪੜ੍ਹਾਈ", "ਵਿਦਿਆਰਥੀ", "छात्रवृत्ति", "पढ़ाई", "विद्यार्थी"],
                "boost_ids": ["nsp-csss", "punjab-post-matric-sc", "dr-ambedkar-post-matric-scholarship-ews", "nmmss"],
                "boost_categories": ["education", "scholarships"]
            },
            "pension": {
                "keywords": ["pension", "vriddha", "old age", "senior", "elderly", "buzurg", "vridh", "atal", "apy", "ignoaps", "ਪੈਨਸ਼ਨ", "ਬਜ਼ੁਰਗ", "पेंशन", "वृद्ध", "बुजुर्ग"],
                "boost_ids": ["nsap-ignoaps", "atal-pension-yojana", "punjab-old-age-pension", "pm-sym"],
                "boost_categories": ["social_security", "pension"]
            },
            "ration": {
                "keywords": ["ration", "rashan", "anaj", "food", "atta dal", "nfsa", "bpl", "card", "ਰਾਸ਼ਨ", "ਅੰਨ", "राशन", "अनाज"],
                "boost_ids": ["punjab-smart-ration-card", "punjab-atta-dal"],
                "boost_categories": ["social_security", "food_security"]
            }
        }

        # Check user profile state if available
        user_state = (user_profile or {}).get("state", "").lower()
        is_punjab_context = any(k in low for k in ["punjab", "pb", "ludhiana", "amritsar", "jalandhar", "patiala", "mohali", "bathinda", "ਪੰਜਾਬ", "पंजाब"]) or "punjab" in user_state

        scores = {}
        for s in schemes:
            score = 0
            s_parts = [
                s.id,
                s.name,
                s.name_hi or "",
                s.name_pa or "",
                s.category or "",
                s.target_beneficiaries_json or "",
                s.benefits_summary or "",
                s.short_description or ""
            ]
            s_text = " ".join(s_parts).lower()

            # Intent boost
            for intent_name, intent_data in INTENT_MAP.items():
                if any(w in low for w in intent_data["keywords"]):
                    if s.id in intent_data["boost_ids"]:
                        score += 90
                    elif s.category in intent_data["boost_categories"]:
                        score += 50
                    elif any(w in s_text for w in intent_data["keywords"][:4]):
                        score += 25

            # Direct token matching (including Indic Unicode tokens)
            tokens = re.findall(r'[\w\u0900-\u097F\u0A00-\u0A7F]+', low)
            stop_words = {
                "hai", "kya", "liye", "sarkar", "paisa", "kaise", "milega", "chahiye", "batao",
                "the", "and", "for", "aurat", "kitni", "kab", "karo", "kisi", "meri", "mera", "mere"
            }
            for t in tokens:
                if len(t) >= 3 and t not in stop_words:
                    if t in s.id:
                        score += 50
                    if t in s.name.lower():
                        score += 35
                    if t in s_text:
                        score += 15

            # Punjab preference when relevant
            if is_punjab_context and (s.level == "state" or "punjab" in (s.applicable_states or "").lower()):
                score += 10

            if score > 0:
                scores[s] = score

        if scores:
            sorted_schemes = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
            return sorted_schemes[:4]

        # General high-impact fallback
        fallback_flagships = ["pm-kisan", "pm-jay", "pmay-g", "nsp-csss"]
        fallback = [s for s in schemes if s.id in fallback_flagships]
        return (fallback or schemes)[:4]

    def _generate_grounded_fallback(
        self,
        message: str,
        lang: str,
        schemes: List[DBScheme],
        user_profile: Optional[Dict[str, Any]] = None
    ) -> str:
        """High-craft deterministic response grounded in verified database schemes."""
        if lang == "pa":
            greeting = "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! CiviConnect ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਬਾਰੇ ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਹਾਜ਼ਰ ਹੈ।"
            intro = f"ਤੁਹਾਡੀ ਪੁੱਛਗਿੱਛ ਦੇ ਆਧਾਰ 'ਤੇ, ਅਸੀਂ ਸਰਕਾਰੀ ਡਾਟਾਬੇਸ ਵਿੱਚੋਂ ਹੇਠ ਲਿਖੀਆਂ ਪ੍ਰਮਾਣਿਤ ਸਕੀਮਾਂ ਲੱਭੀਆਂ ਹਨ:"
            closing = "\n\nਕਿਰਪਾ ਕਰਕੇ ਧਿਆਨ ਦਿਓ: CiviConnect ਇੱਕ ਸੁਤੰਤਰ ਜਾਣਕਾਰੀ ਸੇਵਾ ਹੈ। ਅੰਤਿਮ ਅਰਜ਼ੀ ਹਮੇਸ਼ਾ ਅਧਿਕਾਰਤ ਸਰਕਾਰੀ ਪੋਰਟਲ 'ਤੇ ਹੀ ਦਿਓ।"
        elif lang == "hi":
            greeting = "नमस्ते! CiviConnect सरकारी योजनाओं की जानकारी में आपकी सहायता के लिए प्रस्तुत है।"
            intro = f"आपके प्रश्न के आधार पर, हमने आधिकारिक ज्ञानकोष से निम्नलिखित सत्यापित योजनाएं खोजी हैं:"
            closing = "\n\nकृपया ध्यान दें: CiviConnect एक स्वतंत्र सूचना सेवा है। आधिकारिक आवेदन हमेशा संबंधित सरकारी पोर्टल पर ही करें।"
        else:
            greeting = "Welcome to CiviConnect — your independent public service navigator."
            intro = f"Based on verified government records, here are the most relevant schemes for your inquiry:"
            closing = "\n\n*Note: CiviConnect is an independent informational service. Please submit official applications directly through the authorized government portals listed above.*"

        scheme_texts = []
        for s in schemes:
            name = s.name_pa if (lang == "pa" and s.name_pa) else (s.name_hi if (lang == "hi" and s.name_hi) else s.name)
            desc = s.short_description
            portal = s.official_portal_url or "https://india.gov.in"
            helpline = s.helpline_number or "National Helpline: 1800-11-0001"
            
            # Format required docs
            req_docs = [sd.document.name for sd in s.documents if sd.document]
            docs_str = ", ".join(req_docs) if req_docs else "Aadhaar Card, Bank Account Details, Identity Proof"

            if lang == "pa":
                txt = (
                    f"### {name}\n"
                    f"- **ਵਿਸਥਾਰ:** {desc}\n"
                    f"- **ਮੁੱਖ ਲਾਭ:** {s.benefits_summary}\n"
                    f"- **ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼:** {docs_str}\n"
                    f"- **ਅਧਿਕਾਰਤ ਪੋਰਟਲ:** [{portal}]({portal})\n"
                    f"- **ਹੈਲਪਲਾਈਨ:** {helpline}"
                )
            elif lang == "hi":
                txt = (
                    f"### {name}\n"
                    f"- **विवरण:** {desc}\n"
                    f"- **मुख्य लाभ:** {s.benefits_summary}\n"
                    f"- **आवश्यक दस्तावेज:** {docs_str}\n"
                    f"- **आधिकारिक पोर्टल:** [{portal}]({portal})\n"
                    f"- **हेल्पलाइन:** {helpline}"
                )
            else:
                txt = (
                    f"### {name}\n"
                    f"- **Summary:** {desc}\n"
                    f"- **Key Benefits:** {s.benefits_summary}\n"
                    f"- **Required Documents:** {docs_str}\n"
                    f"- **Official Portal:** [{portal}]({portal})\n"
                    f"- **Helpline:** {helpline}"
                )
            scheme_texts.append(txt)

        return f"{greeting}\n\n{intro}\n\n" + "\n\n".join(scheme_texts) + closing

    def chat(
        self,
        db: Session,
        message: str,
        session_id: Optional[str] = None,
        language: Optional[str] = "en",
        user_profile: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> ChatMessageResponse:
        detected_lang = self.detect_language(message, language)
        relevant_schemes = self.retrieve_relevant_schemes(db, message, user_profile)

        grounded_data = [
            {
                "id": s.id,
                "name": s.name_pa if (detected_lang == "pa" and s.name_pa) else (s.name_hi if (detected_lang == "hi" and s.name_hi) else s.name),
                "category": s.category,
                "benefits_summary": s.benefits_summary,
                "official_portal_url": s.official_portal_url,
                "verification_status": s.verification_status,
                "department": s.department
            }
            for s in relevant_schemes
        ]

        # Check if live Gemini API is configured
        if self.client and settings.GEMINI_API_KEY:
            try:
                schemes_context = [
                    {
                        "name": s.name,
                        "local_name": s.name_pa if detected_lang == "pa" else s.name_hi,
                        "category": s.category,
                        "summary": s.short_description,
                        "benefits": s.benefits_summary,
                        "eligibility": s.eligibility_summary,
                        "required_documents": [sd.document.name for sd in s.documents if sd.document] if hasattr(s, "documents") else [],
                        "official_portal": s.official_portal_url,
                        "helpline": s.helpline_number
                    }
                    for s in relevant_schemes
                ]

                lang_instruction = "Respond in clear, accessible English."
                if detected_lang == "pa":
                    lang_instruction = "Respond entirely in respectful, fluent Punjabi (ਪੰਜਾਬੀ). Clearly state official Punjabi scheme names."
                elif detected_lang == "hi":
                    lang_instruction = (
                        "Respond in natural, respectful, and accessible Hindi (हिंदी). "
                        "If the user queried in Romanized Hindi (Hinglish), you may use clear Hindi with English technical terms in parentheses where helpful."
                    )

                prompt = (
                    f"{SYSTEM_PROMPT}\n\n"
                    f"LANGUAGE INSTRUCTION: {lang_instruction}\n\n"
                    f"USER PROFILE: {json.dumps(user_profile or {}, ensure_ascii=False)}\n\n"
                    f"VERIFIED SCHEMES RETRIEVED FROM DATABASE:\n{json.dumps(schemes_context, indent=2, ensure_ascii=False)}\n\n"
                    f"USER QUERY: {message}\n\n"
                    f"Answer the user query thoroughly and directly based on the verified schemes above. "
                    f"Clearly state the scheme name, key benefits, eligibility requirements, required documents, and official portal URL. "
                    f"Never give generic advice when relevant verified schemes are provided."
                )

                # Modern google-genai call
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt
                )
                
                reply_text = response.text if hasattr(response, "text") and response.text else str(response)

                return ChatMessageResponse(
                    reply=reply_text,
                    session_id=session_id or "default-session",
                    language=detected_lang,
                    grounded_schemes=grounded_data,
                    provider_status="live",
                    diagnostic_message=f"Live response generated via Google Gemini ({settings.GEMINI_MODEL}).",
                    suggested_followups=[
                        "What documents are required to apply?",
                        "Check my eligibility for this scheme",
                        "Show me application steps on the official portal"
                    ]
                )

            except Exception as e:
                err_str = str(e)
                # Secure server-side logging without leaking secrets or full stack to client
                logger.warning(f"Live Gemini provider call failed ({type(e).__name__}): {err_str[:120]}")

                # Friendly, sanitized public diagnostic notice
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                    friendly_notice = "The live AI service is currently at capacity or undergoing high volume. Displaying verified database knowledge base results directly from official government records."
                elif "503" in err_str or "UNAVAILABLE" in err_str or "demand" in err_str.lower():
                    friendly_notice = "The live AI service is temporarily experiencing high demand. Displaying verified database knowledge base results directly from official government records."
                elif "504" in err_str or "DEADLINE" in err_str or "timeout" in err_str.lower():
                    friendly_notice = "The live AI consultation timed out. Displaying verified database knowledge base results directly from official government records."
                else:
                    friendly_notice = "Live AI consultation is temporarily unavailable. Displaying verified database knowledge base results directly from official government records."

                fallback_reply = self._generate_grounded_fallback(message, detected_lang, relevant_schemes, user_profile)
                return ChatMessageResponse(
                    reply=fallback_reply,
                    session_id=session_id or "default-session",
                    language=detected_lang,
                    grounded_schemes=grounded_data,
                    provider_status="database_fallback",
                    diagnostic_message=friendly_notice,
                    suggested_followups=[
                        "Check eligibility criteria",
                        "View official guidelines",
                        "Find required documents"
                    ]
                )
        else:
            # Key not configured
            fallback_reply = self._generate_grounded_fallback(message, detected_lang, relevant_schemes, user_profile)
            return ChatMessageResponse(
                reply=fallback_reply,
                session_id=session_id or "default-session",
                language=detected_lang,
                grounded_schemes=grounded_data,
                provider_status="configuration_required",
                diagnostic_message="GEMINI_API_KEY is not set on the backend server. Grounded database navigator is serving responses directly from verified records.",
                suggested_followups=[
                    "Check my detailed eligibility",
                    "Browse all Central and Punjab schemes",
                    "Download document checklist"
                ]
            )


assistant_service = AssistantService()
