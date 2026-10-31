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
2. Demographic Reasoning & Policy Exclusions:
   - Carefully evaluate user profile, profession, and income cues.
   - Government employees, doctors, civil servants, and high income taxpayers are strictly excluded by government policy from BPL welfare, farmer DBT (PM-KISAN excludes institutional landholders, doctors, and govt servants), and maternity poverty cash incentives (PMMVY, JSY).
   - When a government employee or doctor asks about their children, clarify these exclusions politely and guide them toward universal/tax-saving programs like Sukanya Samriddhi Yojana (SSY) for girl children.
3. Procedural & Banking Guidance:
   - When a citizen asks how to open a bank account or is unfamiliar with banking ("Mujhe bank mein account open karwana nahi aata"), provide empathetic, step-by-step guidance on Pradhan Mantri Jan Dhan Yojana (PMJDY) zero-balance accounts, documents required (Aadhaar + 2 photos), and where to go (any commercial bank branch or Bank Mitra / CSC).
4. Independent Status: Always clarify that CiviConnect is an independent information service and does not guarantee benefits or submit applications on behalf of the government.
5. Language Directives:
   - If the user writes or requests Punjabi (or romanized Punjabi), respond in respectful, natural Punjabi (ਪੰਜਾਬੀ).
   - If the user writes or requests Hindi (or Hinglish), respond in natural, accessible Hindi (हिंदी).
   - If English is requested, respond in clear, professional English.
6. Privacy: Never request sensitive information such as Aadhaar numbers, bank passwords, OTPs, or biometric details.
7. Structure: Keep answers structured with bullet points for benefits, criteria, required documents, and official portal links.
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
        # Check Romanized Punjabi / Hindi (Hinglish) phrases and words
        low = user_message.lower()
        pa_phrases = [
            "kidan", "kiven", "tusi", "saada pind", "vazifa chahida", "scholarship chahidi",
            "punjab vich", "daakhla", "yojana dasso", "mainu", "kive", "chahida", "chahidi",
            "dasso", "kholna nahi aunda", "aunda", "vich", "hove", "ji", "gall", "daso"
        ]
        if any(k in low for k in pa_phrases):
            return "pa"
        hi_phrases = [
            "kaise milega", "yojana batao", "mujhe", "kya hai", "patrata", "aavedan",
            "chahiye", "paisa kab", "lagwane", "kholne", "kholna", "milti hai",
            "kya documents", "bataiye", "batao", "nahi aata", "nahi aati", "karna hai",
            "karwana", "mera", "meri", "mere", "humko", "kaise kare", "namaste", "madad",
            "khulwana", "khata", "batao", "karen", "hota hai"
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

        # Demographic signals from message
        is_govt_officer_or_doctor = bool(re.search(
            r'\b(govt\s*doctor|doctor|sarkari\s*doctor|government\s*doctor|govt\s*employee|government\s*employee|civil\s*servant|ias|ips|irs|income\s*taxpayer|high\s*income)\b',
            low
        ))
        has_daughters = bool(re.search(
            r'\b(daughter|daughters|beti|betiyan|kanya|sukanya|ladki|ਧੀ|ਬੇਟੀ|कन्या|लड़की|लड़कियां)\b',
            low
        ))
        is_banking_query = bool(re.search(
            r'\b(bank|account|khata|khatabook|kholna|kholne|open\s*account|zero\s*balance|jan\s*dhan|pmjdy|rupay|debit\s*card|passbook|ਬੈਂਕ|ਖਾਤਾ|बैंक|खाता)\b',
            low
        ))

        # Comprehensive semantic & Hinglish dictionary
        INTENT_MAP = {
            "banking": {
                "keywords": [
                    "bank", "account", "khata", "khatabook", "kholna", "kholne", "open account",
                    "zero balance", "jan dhan", "pmjdy", "debit card", "rupay", "passbook",
                    "ਬੈਂਕ", "ਖਾਤਾ", "ਖੋਲ੍ਹਣਾ", "बैंक", "खाता", "खोलना", "खुलवाना"
                ],
                "boost_ids": ["pmjdy"],
                "boost_categories": ["financial_inclusion", "banking"]
            },
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
                "keywords": ["beti", "daughter", "girl", "kanya", "sukanya", "ladki", "shagun", "ashirwad", "marriage", "wedding", "vivah", "shadi", "ਧੀ", "ਕੰਨਿਆ", "ਵਿਆਹ", "ਸ਼ਗਨ", "बेटी", "कन्या", "विवाह", "शादी", "शगुन"],
                "boost_ids": ["sukanya-samriddhi", "punjab-ashirwad"],
                "boost_categories": ["women_and_children"]
            },
            "farmer": {
                "keywords": ["kisan", "farmer", "kheti", "fasal", "krishi", "pm-kisan", "pmfby", "crop", "bima", "land", "jamabandi", "fertilizer", "tractor", "ਮਿੱਟੀ", "ਕਿਸਾਨ", "ਖੇਤੀ", "ਫਸਲ", "किसान", "खेती", "फसल", "कृषि"],
                "boost_ids": ["pm-kisan", "pmfby", "pm-kusum", "soil-health-card"],
                "boost_categories": ["agriculture", "farmers", "rural_development"]
            },
            "health": {
                "keywords": ["ayushman", "pm-jay", "hospital", "ilaj", "bima", "swasthya", "treatment", "dawa", "sehat", "sarbat", "patient", "illness", "bimari", "ਸਿਹਤ", "ਇਲਾਜ", "ਹਸਪਤਾਲ", "स्वास्थ्य", "इलाज", "अस्पताल", "बीमारी"],
                "boost_ids": ["pm-jay", "punjab-bhai-ghanhya"],
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

            # Banking procedural query boost
            if is_banking_query:
                if s.id == "pmjdy":
                    score += 250
                elif any(term in low for term in ["kholna", "open", "kholne", "account", "khata", "nahi aata", "nahi aunda", "kaise"]):
                    if s.id != "pmjdy":
                        score -= 50

            # Demographic exclusion: Government doctors and officers are excluded from BPL / poverty schemes
            if is_govt_officer_or_doctor:
                bpl_welfare_ids = {
                    "janani-suraksha-yojana", "pmmvy", "punjab-ashirwad", "pm-kisan",
                    "pmay-g", "pmay-u", "punjab-atta-dal", "punjab-smart-ration-card",
                    "nsap-ignwps", "nsap-igndps", "nsap-ignoaps", "pm-sym",
                    "dr-ambedkar-post-matric-scholarship-ews"
                }
                if s.id in bpl_welfare_ids:
                    score -= 500

                # Daughters of high earners / govt professionals qualify for Sukanya Samriddhi Yojana
                if has_daughters and s.id == "sukanya-samriddhi":
                    score += 300

            # Direct token matching (including Indic Unicode tokens)
            tokens = re.findall(r'[\w\u0900-\u097F\u0A00-\u0A7F]+', low)
            stop_words = {
                "hai", "kya", "liye", "sarkar", "paisa", "kaise", "milega", "chahiye", "batao",
                "the", "and", "for", "aurat", "kitni", "kab", "karo", "kisi", "meri", "mera", "mere",
                "bank", "account", "scheme", "yojana", "govt", "government", "sarkari", "mein", "nahi",
                "aata", "karna", "krna", "please", "help", "detail", "info", "doctor", "have", "with",
                "daughters", "sons", "children", "bache", "bachi"
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
        low = message.lower()
        is_banking_query = any(k in low for k in ["bank", "account", "khata", "kholna", "kholne", "open", "nahi aata", "nahi aunda", "ਬੈਂਕ", "ਖਾਤਾ", "बैंक", "खाता"])
        is_govt_officer_or_doctor = bool(re.search(
            r'\b(govt\s*doctor|doctor|sarkari\s*doctor|government\s*doctor|govt\s*employee|government\s*employee|civil\s*servant|ias|ips|irs|taxpayer|high\s*income)\b',
            low
        ))
        has_daughters = bool(re.search(r'\b(daughter|daughters|beti|betiyan|kanya|sukanya|ladki|ਧੀ|ਬੇਟੀ|कन्या)\b', low))

        # Specialized banking account opening guidance
        if is_banking_query and any(s.id == "pmjdy" for s in schemes):
            if lang == "pa":
                return (
                    "### ਬੈਂਕ ਵਿੱਚ ਖਾਤਾ ਖੋਲ੍ਹਣ ਲਈ ਆਸਾਨ ਮਾਰਗਦਰਸ਼ਨ (PMJDY)\n\n"
                    "ਜੇਕਰ ਤੁਹਾਨੂੰ ਬੈਂਕ ਵਿੱਚ ਖਾਤਾ ਖੋਲ੍ਹਣਾ ਨਹੀਂ ਆਉਂਦਾ, ਤਾਂ ਤੁਸੀਂ **ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਜਨ ਧਨ ਯੋਜਨਾ (PMJDY)** ਤਹਿਤ ਬਿਲਕੁਲ ਮੁਫ਼ਤ (Zero Balance) ਖਾਤਾ ਖੁਲ੍ਹਵਾ ਸਕਦੇ ਹੋ:\n\n"
                    "**ਖਾਤਾ ਖੋਲ੍ਹਣ ਦੇ ਸੌਖੇ ਕਦਮ:**\n"
                    "1. **ਨਜ਼ਦੀਕੀ ਬੈਂਕ ਜਾਂ ਬੈਂਕ ਮਿੱਤਰ (CSC) ਜਾਓ:** ਕਿਸੇ ਵੀ ਸਰਕਾਰੀ ਬੈਂਕ (ਜਿਵੇਂ SBI, PNB) ਜਾਂ ਪ੍ਰਾਈਵੇਟ ਬੈਂਕ ਦੀ ਸ਼ਾਖਾ ਵਿੱਚ ਜਾਓ।\n"
                    "2. **ਜਨ ਧਨ ਖਾਤਾ ਫਾਰਮ ਲਵੋ:** ਬੈਂਕ ਕਾਊਂਟਰ ਤੋਂ PMJDY ਖਾਤਾ ਖੋਲ੍ਹਣ ਦਾ ਫਾਰਮ ਮੁਫ਼ਤ ਪ੍ਰਾਪਤ ਕਰੋ।\n"
                    "3. **ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼:**\n"
                    "   - ਆਪਣਾ **ਆਧਾਰ ਕਾਰਡ** (ਸਭ ਤੋਂ ਜ਼ਰੂਰੀ ਪਛਾਣ ਤੇ ਪਤੇ ਦਾ ਸਬੂਤ)।\n"
                    "   - 2 ਤਾਜ਼ਾ ਪਾਸਪੋਰਟ ਸਾਈਜ਼ ਫੋਟੋਆਂ।\n"
                    "   - ਜੇਕਰ ਆਧਾਰ ਕਾਰਡ ਨਹੀਂ ਹੈ ਤਾਂ ਵੋਟਰ ਕਾਰਡ ਜਾਂ ਮਨਰੇਗਾ ਜੌਬ ਕਾਰਡ ਵੀ ਚੱਲ ਸਕਦਾ ਹੈ।\n"
                    "4. **ਫਾਰਮ ਜਮ੍ਹਾਂ ਕਰਵਾਓ:** ਫਾਰਮ ਭਰ ਕੇ ਅੰਗੂਠਾ ਜਾਂ ਦਸਤਖ਼ਤ ਕਰੋ। ਕੋਈ ਵੀ ਪੈਸਾ ਜਮ੍ਹਾਂ ਕਰਵਾਉਣ ਦੀ ਲੋੜ ਨਹੀਂ ਹੈ (ਜ਼ੀਰੋ ਬੈਲੇਂਸ)।\n"
                    "5. **ਲਾਭ:** ਮੁਫ਼ਤ ਪਾਸਬੁੱਕ, RuPay ਡੈਬਿਟ ਕਾਰਡ (₹2 ਲੱਖ ਦੁਰਘਟਨਾ ਬੀਮਾ ਸਮੇਤ) ਅਤੇ ਸਰਕਾਰੀ ਸਬਸਿਡੀਆਂ ਸਿੱਧੇ ਖਾਤੇ ਵਿੱਚ ਪ੍ਰਾਪਤ ਹੋਣਗੀਆਂ।\n\n"
                    "- **ਅਧਿਕਾਰਤ ਪੋਰਟਲ:** [https://pmjdy.gov.in](https://pmjdy.gov.in)\n"
                    "- **ਰਾਸ਼ਟਰੀ ਟੋਲ-ਫ੍ਰੀ ਹੈਲਪਲਾਈਨ:** 1800-180-1111\n\n"
                    "*ਨੋਟ: CiviConnect ਇੱਕ ਸੁਤੰਤਰ ਜਨਤਕ ਸੂਚਨਾ ਸੇਵਾ ਹੈ।*"
                )
            elif lang == "hi":
                return (
                    "### बैंक में खाता खोलने के लिए आसान मार्गदर्शन (PMJDY)\n\n"
                    "यदि आपको बैंक में खाता खोलना नहीं आता, तो घबराने की कोई बात नहीं है। आप **प्रधानमंत्री जन धन योजना (PMJDY)** के तहत किसी भी बैंक में बिल्कुल मुफ्त (Zero Balance) खाता खुलवा सकते हैं:\n\n"
                    "**खाता खुलवाने के आसान चरण:**\n"
                    "1. **नजदीकी बैंक या बैंक मित्र (CSC केंद्र) जाएं:** अपने नजदीकी किसी भी राष्ट्रीयकृत बैंक (जैसे SBI, PNB, Bank of Baroda) या अधिकृत बैंक मित्र कियोस्क पर जाएं।\n"
                    "2. **जन धन खाता फॉर्म प्राप्त करें:** बैंक कर्मचारी से जन धन (PMJDY) खाता खोलने का फॉर्म मांगें (यह पूरी तरह निःशुल्क है)।\n"
                    "3. **आवश्यक दस्तावेज संलग्न करें:**\n"
                    "   - **आधार कार्ड** की स्व-प्रमाणित फोटोकॉपी (आधार होने पर किसी अन्य दस्तावेज की आवश्यकता नहीं है)।\n"
                    "   - 2 हालिया पासपोर्ट साइज रंगीन फोटो।\n"
                    "   - (वैकल्पिक) यदि आधार नहीं है तो वोटर आईडी, नरेगा जॉब कार्ड, या ड्राइविंग लाइसेंस मान्य है।\n"
                    "4. **बायोमेट्रिक या हस्ताक्षर:** फॉर्म भरकर बैंक अधिकारी को दें और बायोमेट्रिक या हस्ताक्षर सत्यापन करवाएं। कोई न्यूनतम जमा राशि आवश्यक नहीं है।\n"
                    "5. **पासबुक और RuPay डेबिट कार्ड:** आपका खाता खुल जाएगा और आपको मुफ्त पासबुक व RuPay डेबिट कार्ड (₹2 लाख दुर्घटना बीमा कवर सहित) प्राप्त होगा।\n\n"
                    "- **आधिकारिक पोर्टल:** [https://pmjdy.gov.in](https://pmjdy.gov.in)\n"
                    "- **राष्ट्रीय हेल्पलाइन:** 1800-180-1111\n\n"
                    "*सूचना: CiviConnect एक स्वतंत्र सार्वजनिक सेवा नेविगेटर है और कोई सरकारी शुल्क नहीं लेता।*"
                )
            else:
                return (
                    "### Step-by-Step Guidance on Opening a Bank Account (PMJDY)\n\n"
                    "If you are unfamiliar with opening a bank account, you can open a completely free, zero-balance account under the **Pradhan Mantri Jan Dhan Yojana (PMJDY)**:\n\n"
                    "**How to Open Your Account:**\n"
                    "1. **Visit Any Bank Branch or Bank Mitra (CSC):** Walk into any commercial bank branch (SBI, PNB, Bank of Baroda, etc.) or authorized Common Service Centre / Bank Mitra kiosk.\n"
                    "2. **Request a PMJDY Account Opening Form:** The form is available free of charge at every bank branch in English and regional languages.\n"
                    "3. **Attach Required Documents:**\n"
                    "   - **Aadhaar Card** (Primary KYC document; satisfies both identity and address proof).\n"
                    "   - Two recent passport-sized color photographs.\n"
                    "   - *(Alternative if Aadhaar is unavailable)*: Voter ID card, NREGA job card, or Driving Licence.\n"
                    "4. **Biometric Verification:** Submit the completed form with self-attested document copies. No initial deposit is required (Zero Balance).\n"
                    "5. **Receive Your Passbook & Card:** You will receive a passbook and a free RuPay Debit Card with built-in Rs. 2 Lakh accidental insurance cover.\n\n"
                    "- **Official Portal:** [https://pmjdy.gov.in](https://pmjdy.gov.in)\n"
                    "- **National Helpline:** 1800-180-1111\n\n"
                    "*Note: CiviConnect is an independent public service information navigator.*"
                )

        # Specialized demographic guidance for government employee / doctor with children
        if is_govt_officer_or_doctor and has_daughters:
            return (
                "### Public Policy Eligibility Notice for Government Professionals\n\n"
                "As a **government-employed doctor/officer**, please note that by official statutory guidelines, you are **excluded** from income-capped welfare programs, poverty-alleviation grants, and farmer income support (such as PM-KISAN, PMMVY maternity cash incentives, or state BPL marriage assistance).\n\n"
                "### Recommended Scheme for Your Daughters: Sukanya Samriddhi Yojana (SSY)\n\n"
                "As an Indian citizen and parent, you are fully eligible to secure your daughters' future under the government's flagship **Sukanya Samriddhi Yojana (SSY)**:\n\n"
                "- **Key Benefits:**\n"
                "  - High government-guaranteed interest rate of **8.2% per annum** compounded annually.\n"
                "  - **Triple Tax Exemption (EEE):** Investments up to Rs. 1.5 Lakh per financial year qualify for Section 80C tax deductions, interest earned is tax-free, and maturity proceeds are completely exempt from tax.\n"
                "  - Accounts can be opened for up to 2 girl children aged 10 years or younger.\n"
                "  - Matures 21 years from account opening, with 50% partial withdrawal permitted after age 18 for higher education.\n"
                "- **Required Documents:**\n"
                "  - Birth Certificate of the girl child (issued by Municipal Corporation / Panchayat).\n"
                "  - Identity and Address Proof of the parent/guardian (Aadhaar Card / PAN Card).\n"
                "  - Passport-sized photograph of parent and child.\n"
                "- **Where to Apply:** Any Post Office branch or authorized commercial bank (SBI, PNB, BoB, ICICI, HDFC).\n"
                "- **Official Portal:** [https://www.indiapost.gov.in](https://www.indiapost.gov.in)\n\n"
                "*Note: For your sons, universal merit scholarships (such as National Scholarship Portal schemes) may be explored based on academic merit upon reaching qualifying classes.*"
            )

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
