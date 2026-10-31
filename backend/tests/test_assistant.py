def test_assistant_status(client):
    res = client.get("/api/assistant/status")
    assert res.status_code == 200
    data = res.json()
    assert data["provider"] == "Google Gemini"
    assert "status" in data


def test_assistant_chat_punjabi_intent(client):
    res = client.post("/api/assistant/chat", json={
        "message": "ਮੈਨੂੰ ਪੰਜਾਬ ਵਿੱਚ ਸਕਾਲਰਸ਼ਿਪ ਦੀ ਲੋੜ ਹੈ",
        "language": "pa"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "pa"
    assert len(data["grounded_schemes"]) > 0
    # Provider status should be transparent
    assert data["provider_status"] in ["live", "configuration_required", "database_fallback", "error"]


def test_assistant_chat_scholarship_retrieval(client):
    res = client.post("/api/assistant/chat", json={
        "message": "I am a college student studying BTech. What scholarships can I apply for in Punjab?",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    schemes = data["grounded_schemes"]
    assert len(schemes) > 0
    # Should retrieve scholarship / education schemes
    categories = [s["category"] for s in schemes]
    assert any(c in ["education", "scholarships"] for c in categories)


def test_assistant_chat_quota_429_clean_fallback(client, monkeypatch):
    """Verify that a 429 RESOURCE_EXHAUSTED error gracefully yields database fallback without raw errors."""
    from app.services.assistant_service import assistant_service
    from google.genai.errors import ClientError

    def mock_429(**kwargs):
        raise ClientError(429, {
            "error": {
                "code": 429,
                "message": "Resource has been exhausted (e.g. check quota).",
                "status": "RESOURCE_EXHAUSTED",
                "details": [{"@type": "type.googleapis.com/google.rpc.QuotaFailure"}]
            }
        }, None)

    monkeypatch.setattr(assistant_service.client.models, "generate_content", mock_429)

    res = client.post("/api/assistant/chat", json={
        "message": "What is PM-KISAN?",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["provider_status"] == "database_fallback"
    assert "RESOURCE_EXHAUSTED" not in data["diagnostic_message"]
    assert "429" not in data["diagnostic_message"]
    assert "at capacity" in data["diagnostic_message"].lower() or "volume" in data["diagnostic_message"].lower()
    # Reply contains grounded scheme details in Markdown
    assert "### " in data["reply"]
    assert len(data["grounded_schemes"]) > 0


def test_assistant_chat_hinglish_queries_relevance(client):
    """Verify that natural Hinglish queries retrieve the exact corresponding welfare schemes."""
    # 1. Widow pension in Hinglish
    res_widow = client.post("/api/assistant/chat", json={
        "message": "vidhwa aurat ko pension milti hai kya"
    })
    assert res_widow.status_code == 200
    data_widow = res_widow.json()
    widow_ids = [s["id"] for s in data_widow["grounded_schemes"]]
    assert any(x in ["punjab-widow-pension", "nsap-ignwps"] for x in widow_ids)

    # 2. Solar panel subsidy in Hinglish
    res_solar = client.post("/api/assistant/chat", json={
        "message": "solar panel lagwane ke liye subsidy kitni hai"
    })
    assert res_solar.status_code == 200
    data_solar = res_solar.json()
    solar_ids = [s["id"] for s in data_solar["grounded_schemes"]]
    assert "pm-surya-ghar" in solar_ids

    # 3. Housing financial aid in Hinglish
    res_housing = client.post("/api/assistant/chat", json={
        "message": "ghar banane ke liye sarkar se paisa kaise milega"
    })
    assert res_housing.status_code == 200
    data_housing = res_housing.json()
    housing_ids = [s["id"] for s in data_housing["grounded_schemes"]]
    assert any(x in ["pmay-g", "pmay-u"] for x in housing_ids)


def test_assistant_chat_banking_pmjdy_retrieval(client):
    """Verify that a banking guidance query correctly detects Hinglish/Hindi and retrieves PMJDY."""
    res = client.post("/api/assistant/chat", json={
        "message": "Mujhe bank mein account open karwana nahi aata."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "hi"
    scheme_ids = [s["id"] for s in data["grounded_schemes"]]
    assert "pmjdy" in scheme_ids
    # Response must contain step-by-step guidance on zero balance / Jan Dhan account
    assert "प्रधानमंत्री जन धन योजना" in data["reply"] or "PMJDY" in data["reply"]
    assert "Zero Balance" in data["reply"] or "आधार कार्ड" in data["reply"] or "बैंक" in data["reply"]


def test_assistant_chat_govt_doctor_daughter_reasoning(client):
    """Verify that a government doctor with daughters receives policy exclusion explanations and SSY, not BPL maternity."""
    res = client.post("/api/assistant/chat", json={
        "message": "I am a govt doctor and I have 4 daughters and 2 sons."
    })
    assert res.status_code == 200
    data = res.json()
    scheme_ids = [s["id"] for s in data["grounded_schemes"]]
    # Should retrieve Sukanya Samriddhi Yojana for the daughters
    assert "sukanya-samriddhi" in scheme_ids
    # Must NOT dump BPL maternity schemes or PM-KISAN
    assert "janani-suraksha-yojana" not in scheme_ids
    assert "pmmvy" not in scheme_ids
    assert "punjab-ashirwad" not in scheme_ids
    assert "pm-kisan" not in scheme_ids
    # Reply text must acknowledge doctor / government status and guide to SSY
    assert "Sukanya Samriddhi" in data["reply"]


def test_assistant_grounded_fallback_banking_and_doctor_direct(db_session):
    """Directly test _generate_grounded_fallback for procedural banking and demographic exclusions."""
    from app.services.assistant_service import assistant_service
    from app.models.db_models import DBScheme

    # 1. Test banking guidance fallback
    pmjdy_scheme = db_session.query(DBScheme).filter_by(id="pmjdy").all()
    hindi_fallback = assistant_service._generate_grounded_fallback(
        message="Mujhe bank mein account open karwana nahi aata.",
        lang="hi",
        schemes=pmjdy_scheme
    )
    assert "प्रधानमंत्री जन धन योजना (PMJDY)" in hindi_fallback
    assert "Zero Balance" in hindi_fallback
    assert "आधार कार्ड" in hindi_fallback
    assert "1800-180-1111" in hindi_fallback

    # 2. Test doctor demographic exclusion fallback
    ssy_scheme = db_session.query(DBScheme).filter_by(id="sukanya-samriddhi").all()
    doctor_fallback = assistant_service._generate_grounded_fallback(
        message="I am a govt doctor and I have 4 daughters and 2 sons.",
        lang="en",
        schemes=ssy_scheme
    )
    assert "government-employed doctor/officer" in doctor_fallback
    assert "excluded" in doctor_fallback.lower()
    assert "Sukanya Samriddhi Yojana (SSY)" in doctor_fallback
    assert "8.2%" in doctor_fallback


