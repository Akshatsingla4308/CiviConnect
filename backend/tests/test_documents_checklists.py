def test_list_canonical_documents(client):
    res = client.get("/api/documents")
    assert res.status_code == 200
    docs = res.json()["items"]
    assert len(docs) >= 30
    doc_ids = [d["id"] for d in docs]
    assert "aadhaar_card" in doc_ids
    assert "income_certificate" in doc_ids
    assert "voter_id_card" in doc_ids
    # Verify pseudo-documents are eradicated
    assert "active_mobile_number" not in doc_ids
    assert "no_document_required" not in doc_ids
    # Verify every canonical document has a verified issuing authority
    for d in docs:
        assert d.get("issuing_authority"), f"Document {d['id']} missing issuing_authority"
        assert len(d.get("issuing_authority").strip()) > 3


def test_user_checklist_flow(client):
    # Register a user
    reg = client.post("/api/auth/register", json={
        "name": "Checklist Tester",
        "email": "checklist.tester@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch/create checklist for pm-kisan
    res = client.get("/api/checklists/pm-kisan", headers=headers)
    assert res.status_code == 200
    checklist = res.json()
    assert checklist["scheme_id"] == "pm-kisan"
    assert len(checklist["items"]) > 0
    assert checklist["completion_percentage"] == 0

    # Mark first item as ready
    items = checklist["items"]
    items[0]["is_ready"] = True
    items[0]["notes"] = "Scanned copy ready on phone."

    update_res = client.put("/api/checklists/pm-kisan", json={"items": items}, headers=headers)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["completion_percentage"] > 0
    assert updated["items"][0]["is_ready"] is True
    assert updated["items"][0]["notes"] == "Scanned copy ready on phone."
