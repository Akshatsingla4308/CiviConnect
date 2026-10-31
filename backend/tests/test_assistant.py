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
