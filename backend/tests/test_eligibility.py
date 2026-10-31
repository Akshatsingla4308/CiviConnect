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


def test_eligibility_pmmvy_gender_and_taxpayer_rules(client):
    # 1. Male user must fail PMMVY on gender rule
    male_profile = {
        "state": "Punjab",
        "age": 25,
        "gender": "male",
        "is_taxpayer": False
    }
    res_male = client.post("/api/eligibility/check", json={"scheme_id": "pmmvy", "profile": male_profile})
    assert res_male.status_code == 200
    data_male = res_male.json()
    assert data_male["verdict"] == "not_eligible_based_on_known_rules"
    assert any(c["field"] == "gender" and c["status"] == "fail" for c in data_male["checks"])

    # 2. Eligible female user passes
    female_profile = {
        "state": "Punjab",
        "age": 22,
        "gender": "female",
        "is_taxpayer": False
    }
    res_female = client.post("/api/eligibility/check", json={"scheme_id": "pmmvy", "profile": female_profile})
    assert res_female.status_code == 200
    data_female = res_female.json()
    assert data_female["verdict"] in ["likely_eligible", "possibly_eligible"]


def test_eligibility_stand_up_india_sc_st_woman_requirement(client):
    # General male fails stand-up-india (requires SC/ST or Woman entrepreneur)
    general_male = {
        "age": 30,
        "gender": "male",
        "social_category": "General"
    }
    res_fail = client.post("/api/eligibility/check", json={"scheme_id": "stand-up-india", "profile": general_male})
    assert res_fail.status_code == 200
    assert res_fail.json()["verdict"] == "not_eligible_based_on_known_rules"

    # SC male passes
    sc_male = {
        "age": 30,
        "gender": "male",
        "social_category": "SC"
    }
    res_pass = client.post("/api/eligibility/check", json={"scheme_id": "stand-up-india", "profile": sc_male})
    assert res_pass.status_code == 200
    assert res_pass.json()["verdict"] in ["likely_eligible", "possibly_eligible"]

