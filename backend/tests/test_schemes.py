def test_schemes_catalog_populated(client):
    res = client.get("/api/schemes?limit=100")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 50
    assert len(data["items"]) >= 50


def test_scheme_detail_and_sources(client):
    res = client.get("/api/schemes/pm-kisan")
    assert res.status_code == 200
    scheme = res.json()
    assert scheme["id"] == "pm-kisan"
    assert "PM-KISAN" in scheme["name"]
    assert len(scheme["rules"]) > 0
    assert len(scheme["documents"]) > 0
    assert len(scheme["sources"]) > 0


def test_scheme_filtering_by_category(client):
    res = client.get("/api/schemes?category=agriculture")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) > 0
    for s in items:
        assert s["category"] == "agriculture"


def test_scheme_search_keyword(client):
    res = client.get("/api/schemes?search=scholarship")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) > 0
    assert any("scholarship" in s["name"].lower() or "scholarship" in s["short_description"].lower() for s in items)
