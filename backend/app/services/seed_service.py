import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import bcrypt

from app.config import settings
from app.models.db_models import (
    DBState,
    DBScheme,
    DBSchemeRule,
    DBDocument,
    DBSchemeDocument,
    DBSchemeSource,
    DBUser,
    DBUserProfileRecord,
    utcnow,
)

logger = logging.getLogger("civiconnect.seed")

DOCUMENTS_CATALOG = [
    {
        "id": "aadhaar_card",
        "name": "Aadhaar Card",
        "name_hi": "आधार कार्ड",
        "name_pa": "ਆਧਾਰ ਕਾਰਡ",
        "category": "identity",
        "issuing_authority": "Unique Identification Authority of India (UIDAI)",
        "general_guidance": "12-digit individual identification number; must be mobile-linked for DBT / OTP verification.",
        "official_portal_url": "https://myaadhaar.uidai.gov.in"
    },
    {
        "id": "pan_card",
        "name": "PAN Card",
        "name_hi": "पैन कार्ड",
        "name_pa": "ਪੈਨ ਕਾਰਡ",
        "category": "identity",
        "issuing_authority": "Income Tax Department, Government of India",
        "general_guidance": "Permanent Account Number card required for financial identity, scholarships, and enterprise loans.",
        "official_portal_url": "https://incometax.gov.in"
    },
    {
        "id": "income_certificate",
        "name": "Income Certificate",
        "name_hi": "आय प्रमाण पत्र",
        "name_pa": "ਆਮਦਨ ਸਰਟੀਫਿਕੇਟ",
        "category": "financial",
        "issuing_authority": "Revenue Department / Tehsildar / Sub-Divisional Magistrate (SDM)",
        "general_guidance": "Issued annually. Required to prove household income threshold for scholarships and welfare grants.",
        "official_portal_url": "https://edistrict.punjab.gov.in"
    },
    {
        "id": "caste_certificate",
        "name": "Caste / Social Category Certificate",
        "name_hi": "जाति प्रमाण पत्र",
        "name_pa": "ਜਾਤੀ ਸਰਟੀਫਿਕੇਟ",
        "category": "residence_and_category",
        "issuing_authority": "Tehsildar / Executive Magistrate / Sub-Divisional Officer",
        "general_guidance": "Certifies SC, ST, or OBC community status. Essential for reservation and targeted welfare schemes.",
        "official_portal_url": "https://edistrict.punjab.gov.in"
    },
    {
        "id": "domicile_certificate",
        "name": "Domicile / Residence Certificate",
        "name_hi": "निवास / अधिवास प्रमाण पत्र",
        "name_pa": "ਰਿਹਾਇਸ਼ ਸਰਟੀਫਿਕੇਟ",
        "category": "residence_and_category",
        "issuing_authority": "Tehsildar / District Magistrate / Revenue Office",
        "general_guidance": "Proves legal and permanent residency within the specific State or Union Territory.",
        "official_portal_url": "https://edistrict.punjab.gov.in"
    },
    {
        "id": "bank_passbook",
        "name": "Bank Passbook / Cancelled Cheque",
        "name_hi": "बैंक पासबुक / रद्द चेक",
        "name_pa": "ਬੈਂਕ ਪਾਸਬੁੱਕ / ਰੱਦ ਕੀਤਾ ਚੈੱਕ",
        "category": "financial",
        "issuing_authority": "Scheduled Commercial Bank / Post Office / Regional Rural Bank",
        "general_guidance": "Must display clear account number, IFSC code, and beneficiary name. Must be Aadhaar-seeded for DBT.",
        "official_portal_url": "https://pmkisan.gov.in"
    },
    {
        "id": "land_records_jamabandi",
        "name": "Land Ownership Records (Jamabandi / Fard / RoR)",
        "name_hi": "भूमि रिकॉर्ड (जमाबंदी / फर्द)",
        "name_pa": "ਜ਼ਮੀਨ ਦੇ ਰਿਕਾਰਡ (ਜਮ੍ਹਾਂਬੰਦੀ / ਫ਼ਰਦ)",
        "category": "property",
        "issuing_authority": "State Revenue Department / Land Records Portal (e.g. PLRS Punjab)",
        "general_guidance": "Record of Rights (RoR) / Jamabandi showing cultivable agricultural land title in the applicant's name.",
        "official_portal_url": "https://plrs.org.in"
    },
    {
        "id": "class_10_marksheet",
        "name": "Class 10th Certificate / Marksheet",
        "name_hi": "10वीं कक्षा का प्रमाण पत्र / अंकतालिका",
        "name_pa": "10ਵੀਂ ਜਮਾਤ ਦਾ ਸਰਟੀਫਿਕੇਟ / ਮਾਰਕਸ਼ੀਟ",
        "category": "education",
        "issuing_authority": "State Education Board (PSEB/CBSE/ICSE)",
        "general_guidance": "Valid proof of date of birth, mother/father name spelling, and basic educational qualification.",
        "official_portal_url": "https://pseb.ac.in"
    },
    {
        "id": "class_12_marksheet",
        "name": "Class 12th Certificate / Marksheet",
        "name_hi": "12वीं कक्षा का प्रमाण पत्र / अंकतालिका",
        "name_pa": "12ਵੀਂ ਜਮਾਤ ਦਾ ਸਰਟੀਫਿਕੇਟ / ਮਾਰਕਸ਼ੀਟ",
        "category": "education",
        "issuing_authority": "State Education Board / CBSE / CISCE",
        "general_guidance": "Required for post-matric higher education scholarships and college admissions.",
        "official_portal_url": "https://scholarships.gov.in"
    },
    {
        "id": "college_admission_proof",
        "name": "College Admission / Bonafide / Fee Receipt",
        "name_hi": "कॉलेज प्रवेश प्रमाण / बोनाफाइड / शुल्क रसीद",
        "name_pa": "ਕਾਲਜ ਦਾਖਲਾ ਸਬੂਤ / ਬੋਨਾਫਾਈਡ / ਫੀਸ ਰਸੀਦ",
        "category": "education",
        "issuing_authority": "Registrar / Principal of recognized College or University",
        "general_guidance": "Certifies current ongoing enrollment in a recognized degree, diploma, or technical program.",
        "official_portal_url": "https://scholarships.punjab.gov.in"
    },
    {
        "id": "bpl_ration_card",
        "name": "BPL / Antyodaya / NFSA Ration Card",
        "name_hi": "बीपीएल / अंत्योदय / खाद्य सुरक्षा राशन कार्ड",
        "name_pa": "ਬੀਪੀਐਲ / ਅੰਤੋਦਿਆ / ਖੁਰਾਕ ਸੁਰੱਖਿਆ ਰਾਸ਼ਨ ਕਾਰਡ",
        "category": "financial",
        "issuing_authority": "Department of Food, Civil Supplies & Consumer Affairs",
        "general_guidance": "Establishes household food security and socio-economic vulnerability status.",
        "official_portal_url": "https://epos.punjab.gov.in"
    },
    {
        "id": "disability_certificate",
        "name": "Unique Disability ID (UDID) / Disability Certificate",
        "name_hi": "विशिष्ट दिव्यांगता पहचान पत्र (UDID)",
        "name_pa": "ਯੂਨੀਕ ਡਿਸਏਬਿਲਟੀ ਆਈਡੀ (UDID) / ਸਰਟੀਫਿਕੇਟ",
        "category": "medical",
        "issuing_authority": "District Medical Board / Ministry of Social Justice & Empowerment",
        "general_guidance": "Certified percentage of disability (typically minimum 40% or 80% for severe pension tiers).",
        "official_portal_url": "https://swavlambancard.gov.in"
    },
    {
        "id": "mcp_card",
        "name": "Mother and Child Protection (MCP) Card",
        "name_hi": "मातृ एवं शिशु सुरक्षा (एमसीपी) कार्ड",
        "name_pa": "ਮਾਂ ਅਤੇ ਬਾਲ ਸੁਰੱਖਿਆ (ਐਮਸੀਪੀ) ਕਾਰਡ",
        "category": "medical",
        "issuing_authority": "Ministry of Health & Family Welfare / Anganwadi Centre",
        "general_guidance": "Issued during antenatal registration; tracks institutional health checkups and vaccination.",
        "official_portal_url": "https://pmmvy.wcd.gov.in"
    },
    {
        "id": "street_vendor_id",
        "name": "Street Vendor Certificate of Vending / LoR",
        "name_hi": "स्ट्रीट वेंडर वेंडिंग प्रमाण पत्र / एलओआर",
        "name_pa": "ਸਟ੍ਰੀਟ ਵੈਂਡਰ ਸਰਟੀਫਿਕੇਟ / ਸਿਫ਼ਾਰਸ਼ ਪੱਤਰ",
        "category": "occupation",
        "issuing_authority": "Urban Local Body (ULB) / Municipal Corporation / Town Vending Committee",
        "general_guidance": "Issued to urban street vendors, hawkers, and cart operators.",
        "official_portal_url": "https://pmsvanidhi.mohua.gov.in"
    },
    {
        "id": "age_proof_document",
        "name": "Age Proof (Birth Certificate / Voter ID / School Certificate)",
        "name_hi": "आयु प्रमाण पत्र",
        "name_pa": "ਉਮਰ ਦਾ ਸਬੂਤ",
        "category": "identity",
        "issuing_authority": "Registrar of Births & Deaths / Election Commission of India",
        "general_guidance": "Mandatory proof of chronological age for pensions, marriage grants, and senior citizen benefits.",
        "official_portal_url": "https://services.india.gov.in"
    }
]


def normalize_doc_id(raw_name: str) -> str:
    low = (raw_name or "").lower()
    for cat in DOCUMENTS_CATALOG:
        if cat["id"] in low or cat["name"].lower() in low:
            return cat["id"]
    if "aadhaar" in low:
        return "aadhaar_card"
    if "pan" in low:
        return "pan_card"
    if "income" in low:
        return "income_certificate"
    if "caste" in low or "community" in low or "social" in low:
        return "caste_certificate"
    if "domicile" in low or "residence" in low or "resident" in low or "niwas" in low:
        return "domicile_certificate"
    if "bank" in low or "passbook" in low or "cheque" in low:
        return "bank_passbook"
    if "land" in low or "jamabandi" in low or "fard" in low:
        return "land_records_jamabandi"
    if "10th" in low or "matric" in low:
        return "class_10_marksheet"
    if "12th" in low or "higher secondary" in low:
        return "class_12_marksheet"
    if "college" in low or "admission" in low or "bonafide" in low:
        return "college_admission_proof"
    if "ration" in low or "bpl" in low or "food" in low:
        return "bpl_ration_card"
    if "disability" in low or "udid" in low:
        return "disability_certificate"
    if "mcp" in low or "pregnancy" in low or "mother" in low:
        return "mcp_card"
    if "vendor" in low or "vending" in low or "rehri" in low:
        return "street_vendor_id"
    if "age" in low or "birth" in low or "senior" in low:
        return "age_proof_document"
    clean = "".join(c if c.isalnum() else "_" for c in low).strip("_")
    while "__" in clean:
        clean = clean.replace("__", "_")
    return clean[:32] or "general_document"


class SeedService:
    @staticmethod
    def seed_all(db: Session = None) -> Dict[str, Any]:
        from app.database import SessionLocal, init_db
        init_db()
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True

        stats = {
            "states_seeded": 0,
            "documents_seeded": 0,
            "schemes_seeded": 0,
            "rules_seeded": 0,
            "scheme_documents_seeded": 0,
            "sources_seeded": 0,
            "admin_seeded": False,
        }

        try:
            # 1. Seed States & Districts
            states_file = Path(__file__).resolve().parent.parent / "data" / "states_districts.json"
            if states_file.exists():
                with open(states_file, "r", encoding="utf-8") as f:
                    states_data = json.load(f)
                for s_data in states_data:
                    existing = db.query(DBState).filter_by(code=s_data["code"]).first()
                    if not existing:
                        state_obj = DBState(
                            code=s_data["code"],
                            name=s_data["name"],
                            name_hi=s_data.get("name_hi"),
                            name_pa=s_data.get("name_pa"),
                            is_ut=s_data.get("is_ut", False),
                            districts_json=json.dumps(s_data.get("districts", []), ensure_ascii=False)
                        )
                        db.add(state_obj)
                        stats["states_seeded"] += 1
                    else:
                        existing.name = s_data["name"]
                        existing.name_hi = s_data.get("name_hi")
                        existing.name_pa = s_data.get("name_pa")
                        existing.is_ut = s_data.get("is_ut", False)
                        existing.districts_json = json.dumps(s_data.get("districts", []), ensure_ascii=False)
                db.commit()

            # 2. Seed Document Catalogue
            for doc in DOCUMENTS_CATALOG:
                existing_doc = db.query(DBDocument).filter_by(id=doc["id"]).first()
                if not existing_doc:
                    doc_obj = DBDocument(
                        id=doc["id"],
                        name=doc["name"],
                        name_hi=doc.get("name_hi"),
                        name_pa=doc.get("name_pa"),
                        description=doc.get("general_guidance"),
                        category=doc.get("category", "general"),
                        issuing_authority=doc.get("issuing_authority"),
                        general_guidance=doc.get("general_guidance"),
                        official_portal_url=doc.get("official_portal_url")
                    )
                    db.add(doc_obj)
                    stats["documents_seeded"] += 1
                else:
                    existing_doc.name = doc["name"]
                    existing_doc.name_hi = doc.get("name_hi")
                    existing_doc.name_pa = doc.get("name_pa")
                    existing_doc.description = doc.get("general_guidance")
                    existing_doc.category = doc.get("category", "general")
                    existing_doc.issuing_authority = doc.get("issuing_authority")
                    existing_doc.general_guidance = doc.get("general_guidance")
                    existing_doc.official_portal_url = doc.get("official_portal_url")
            db.commit()

            # 3. Seed Schemes, Rules, Scheme-Documents, and Sources from schemes_seed.json
            schemes_file = Path(__file__).resolve().parent.parent / "data" / "schemes_seed.json"
            if schemes_file.exists():
                with open(schemes_file, "r", encoding="utf-8") as f:
                    schemes_list = json.load(f)

                for item in schemes_list:
                    s_id = item.get("id")
                    s_name = item.get("name")
                    name_local = item.get("name_local", {})
                    name_hi = name_local.get("hi") if isinstance(name_local, dict) else item.get("name_hi")
                    name_pa = name_local.get("pa") if isinstance(name_local, dict) else item.get("name_pa")

                    cat_raw = item.get("category", ["general"])
                    if isinstance(cat_raw, list):
                        primary_category = cat_raw[0] if cat_raw else "general"
                        subcategories = cat_raw[1:]
                    else:
                        primary_category = str(cat_raw)
                        subcategories = []

                    jurisdiction = item.get("jurisdiction", "Central")
                    is_state_level = (jurisdiction.lower() == "state" or "punjab" in s_name.lower())
                    level = "state" if is_state_level else "central"
                    applicable_states = ["Punjab"] if is_state_level else ["ALL"]

                    summary = item.get("summary") or item.get("short_description") or ""
                    benefits_list = item.get("benefits", [])
                    benefits_summary = benefits_list[0] if benefits_list else summary
                    eligibility_summary = item.get("eligibility_summary") or summary
                    exclusions_list = item.get("exclusions", [])

                    sources_list = item.get("sources", [])
                    department = sources_list[0].get("publisher") if sources_list else item.get("department")
                    portal_url = item.get("official_apply_url") or item.get("official_portal_url")
                    source_url = item.get("official_info_url") or item.get("official_source_url") or portal_url
                    helpline = item.get("helpline") or item.get("helpline_number")

                    app_steps = item.get("application_steps", [])
                    app_steps_str = "\n".join(app_steps) if isinstance(app_steps, list) else str(app_steps or "")

                    existing_scheme = db.query(DBScheme).filter_by(id=s_id).first()
                    if not existing_scheme:
                        scheme_obj = DBScheme(
                            id=s_id,
                            name=s_name,
                            name_hi=name_hi,
                            name_pa=name_pa,
                            short_description=summary,
                            detailed_description=summary,
                            level=level,
                            department=department,
                            applicable_states=json.dumps(applicable_states, ensure_ascii=False),
                            category=primary_category,
                            subcategories_json=json.dumps(subcategories, ensure_ascii=False),
                            target_beneficiaries_json=json.dumps(item.get("target_groups", []), ensure_ascii=False),
                            benefits_summary=benefits_summary,
                            benefits_json=json.dumps(benefits_list, ensure_ascii=False),
                            eligibility_summary=eligibility_summary,
                            exclusions_json=json.dumps(exclusions_list, ensure_ascii=False),
                            application_process=app_steps_str,
                            official_portal_url=portal_url,
                            official_source_url=source_url,
                            helpline_number=helpline,
                            status="active",
                            verification_status="verified",
                            last_verified_date=item.get("last_reviewed", "2026-10-31")
                        )
                        db.add(scheme_obj)
                        stats["schemes_seeded"] += 1
                    else:
                        existing_scheme.name = s_name
                        existing_scheme.name_hi = name_hi
                        existing_scheme.name_pa = name_pa
                        existing_scheme.short_description = summary
                        existing_scheme.detailed_description = summary
                        existing_scheme.level = level
                        existing_scheme.department = department
                        existing_scheme.applicable_states = json.dumps(applicable_states, ensure_ascii=False)
                        existing_scheme.category = primary_category
                        existing_scheme.subcategories_json = json.dumps(subcategories, ensure_ascii=False)
                        existing_scheme.target_beneficiaries_json = json.dumps(item.get("target_groups", []), ensure_ascii=False)
                        existing_scheme.benefits_summary = benefits_summary
                        existing_scheme.benefits_json = json.dumps(benefits_list, ensure_ascii=False)
                        existing_scheme.eligibility_summary = eligibility_summary
                        existing_scheme.exclusions_json = json.dumps(exclusions_list, ensure_ascii=False)
                        existing_scheme.application_process = app_steps_str
                        existing_scheme.official_portal_url = portal_url
                        existing_scheme.official_source_url = source_url
                        existing_scheme.helpline_number = helpline
                        existing_scheme.verification_status = "verified"
                        existing_scheme.last_verified_date = item.get("last_reviewed", "2026-10-31")

                    db.commit()

                    # Seed Rules
                    rules_raw = item.get("eligibility_rules", [])
                    for r in rules_raw:
                        field_name = r.get("field") or r.get("field_name")
                        operator = r.get("operator", "eq")
                        expected_value = r.get("value") if "value" in r else r.get("expected_value")
                        description = r.get("description", f"Criterion on {field_name}")
                        source_ref = r.get("source_id") or r.get("source_reference")

                        existing_rule = db.query(DBSchemeRule).filter_by(
                            scheme_id=s_id,
                            field_name=field_name,
                            operator=operator
                        ).first()
                        if not existing_rule:
                            rule_obj = DBSchemeRule(
                                scheme_id=s_id,
                                criterion_type=r.get("criterion_type", field_name),
                                field_name=field_name,
                                operator=operator,
                                expected_value_json=json.dumps(expected_value, ensure_ascii=False),
                                is_mandatory=r.get("is_mandatory", True),
                                description=description,
                                source_reference=source_ref,
                                verification_status="verified"
                            )
                            db.add(rule_obj)
                            stats["rules_seeded"] += 1

                    # Seed Required Documents
                    docs_raw = item.get("documents_required", [])
                    for d in docs_raw:
                        d_name = d.get("name") if isinstance(d, dict) else str(d)
                        d_category = d.get("category", "general") if isinstance(d, dict) else "general"
                        d_notes = d.get("notes") or d.get("instructions") if isinstance(d, dict) else None
                        d_req = "mandatory" if (isinstance(d, dict) and d.get("required", True)) else "conditional"
                        
                        doc_id = normalize_doc_id(d_name)
                        
                        # Ensure document exists in document catalogue
                        cat_doc = db.query(DBDocument).filter_by(id=doc_id).first()
                        if not cat_doc:
                            cat_doc = DBDocument(
                                id=doc_id,
                                name=d_name,
                                description=d_notes or f"Official document required for {s_name}",
                                category=d_category.lower(),
                                general_guidance=d_notes,
                                official_portal_url=portal_url
                            )
                            db.add(cat_doc)
                            db.commit()
                            stats["documents_seeded"] += 1

                        existing_mapping = db.query(DBSchemeDocument).filter_by(
                            scheme_id=s_id,
                            document_id=doc_id
                        ).first()
                        if not existing_mapping:
                            mapping_obj = DBSchemeDocument(
                                scheme_id=s_id,
                                document_id=doc_id,
                                requirement_type=d_req,
                                condition_description=d_notes,
                                preparation_instructions=d_notes,
                                source_reference=portal_url,
                                last_verified_date="2026-10-31"
                            )
                            db.add(mapping_obj)
                            stats["scheme_documents_seeded"] += 1

                    # Seed Sources
                    for src in sources_list:
                        s_title = src.get("title", f"{s_name} Gazette / Official Guidelines")
                        s_url = src.get("url") or portal_url
                        s_pub = src.get("publisher", department)
                        existing_source = db.query(DBSchemeSource).filter_by(
                            scheme_id=s_id,
                            source_url=s_url
                        ).first()
                        if not existing_source:
                            source_obj = DBSchemeSource(
                                scheme_id=s_id,
                                source_title=s_title,
                                source_url=s_url,
                                publisher=s_pub,
                                source_type=src.get("source_type", "official_portal"),
                                last_verified=src.get("last_verified", "2026-10-31"),
                                verification_status="verified"
                            )
                            db.add(source_obj)
                            stats["sources_seeded"] += 1

                    db.commit()

            # 4. Seed Default Administrator
            admin_email = settings.ADMIN_DEFAULT_EMAIL
            existing_admin = db.query(DBUser).filter_by(email=admin_email).first()
            if not existing_admin:
                pw_hash = bcrypt.hashpw(settings.ADMIN_DEFAULT_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                admin_user = DBUser(
                    name="System Administrator",
                    email=admin_email,
                    password_hash=pw_hash,
                    role="admin",
                    preferred_language="en",
                    account_status="active",
                    is_profile_complete=True
                )
                db.add(admin_user)
                db.commit()
                stats["admin_seeded"] = True
            else:
                stats["admin_seeded"] = True

            logger.info(f"Database seeding completed successfully: {stats}")
            return stats

        except Exception as e:
            db.rollback()
            logger.error(f"Error during seeding: {e}", exc_info=True)
            raise
        finally:
            if should_close:
                db.close()
