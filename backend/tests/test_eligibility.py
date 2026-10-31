def test_eligibility_pm_kisan_pass(client):
    # PM-KISAN requires cultivable land and Indian citizenship
    profile = {
        "state": "Punjab",
        "citizenship": "Indian",
        "owns_cultivable_land": True,
        "is_institutional_landholder": False,
        "is_constitutional_post_holder": False
    }
    res = client.post("/api/eligibility/check", json={"scheme_id": "pm-kisan", "profile": profile})
    assert res.status_code == 200
    data = res.json()
    assert data["verdict"] in ["likely_eligible", "possibly_eligible"]
    assert data["failed_rules"] == 0


def test_eligibility_pm_kisan_fail_no_land(client):
    # Landless applicant should fail PM-KISAN
    profile = {
        "state": "Punjab",
        "citizenship": "Indian",
        "owns_cultivable_land": False
    }
    res = client.post("/api/eligibility/check", json={"scheme_id": "pm-kisan", "profile": profile})
    assert res.status_code == 200
    data = res.json()
    assert data["verdict"] == "not_eligible_based_on_known_rules"
    assert data["failed_rules"] > 0


def test_eligibility_insufficient_information(client):
    # Completely empty profile
    res = client.post("/api/eligibility/check", json={"scheme_id": "pm-kisan", "profile": {}})
    assert res.status_code == 200
    data = res.json()
    assert data["verdict"] == "insufficient_information"
    assert len(data["missing_fields"]) > 0


def test_evaluate_all_schemes_ranking(client):
    profile = {
        "state": "Punjab",
        "age": 20,
        "education_level": "Undergraduate",
        "social_category": "SC",
        "annual_household_income": 180000
    }
    res = client.post("/api/eligibility/evaluate-all", json={"profile": profile})
    assert res.status_code == 200
    data = res.json()
    assert data["total_evaluated"] >= 50
    assert len(data["results"]) > 0
    # Top result should have positive status
    assert data["results"][0]["verdict"] in ["likely_eligible", "possibly_eligible"]
