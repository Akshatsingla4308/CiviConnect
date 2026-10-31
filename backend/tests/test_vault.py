import io
import pytest


def test_vault_flow_and_authorization(client):
    # 1. Register User 1
    user1_res = client.post("/api/auth/register", json={
        "name": "Vault User One",
        "email": "vault.user1@example.com",
        "password": "Password123!"
    })
    token1 = user1_res.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 2. Register User 2
    user2_res = client.post("/api/auth/register", json={
        "name": "Vault User Two",
        "email": "vault.user2@example.com",
        "password": "Password123!"
    })
    token2 = user2_res.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 3. Reject invalid MIME type
    bad_file = io.BytesIO(b"fake executable script")
    res_bad = client.post(
        "/api/vault/upload",
        files={"file": ("virus.exe", bad_file, "application/octet-stream")},
        data={"document_name": "Bad File", "document_type": "general"},
        headers=headers1
    )
    assert res_bad.status_code == 400
    assert "Unsupported file format" in res_bad.json()["detail"]

    # 4. Upload valid PDF for User 1
    pdf_content = b"%PDF-1.4 sample pdf content for citizen identity verification"
    pdf_file = io.BytesIO(pdf_content)
    res_upload = client.post(
        "/api/vault/upload",
        files={"file": ("my_aadhaar.pdf", pdf_file, "application/pdf")},
        data={
            "document_name": "My Aadhaar Card (e-Aadhaar)",
            "document_type": "aadhaar_card",
            "notes": "Downloaded from myaadhaar.uidai.gov.in"
        },
        headers=headers1
    )
    assert res_upload.status_code == 200, res_upload.text
    uploaded_doc = res_upload.json()
    doc_id = uploaded_doc["id"]
    assert uploaded_doc["document_name"] == "My Aadhaar Card (e-Aadhaar)"
    assert uploaded_doc["mime_type"] == "application/pdf"
    assert uploaded_doc["sha256_checksum"] is not None

    # 5. List User 1 documents
    list_res = client.get("/api/vault", headers=headers1)
    assert list_res.status_code == 200
    docs = list_res.json()["items"]
    assert len(docs) == 1
    assert docs[0]["id"] == doc_id

    # 6. Verify User 2 has empty vault
    list2_res = client.get("/api/vault", headers=headers2)
    assert list2_res.status_code == 200
    assert len(list2_res.json()["items"]) == 0

    # 7. User 1 downloads document
    dl_res = client.get(f"/api/vault/{doc_id}/download", headers=headers1)
    assert dl_res.status_code == 200
    assert dl_res.content == pdf_content

    # 8. Cross-User Authorization Check: User 2 tries to download User 1's document -> 404
    dl_unauth = client.get(f"/api/vault/{doc_id}/download", headers=headers2)
    assert dl_unauth.status_code == 404

    # 9. Cross-User Authorization Check: User 2 tries to delete User 1's document -> 404
    del_unauth = client.delete(f"/api/vault/{doc_id}", headers=headers2)
    assert del_unauth.status_code == 404

    # 10. User 1 deletes document
    del_res = client.delete(f"/api/vault/{doc_id}", headers=headers1)
    assert del_res.status_code == 200

    # 11. Verify deleted
    list_after = client.get("/api/vault", headers=headers1)
    assert len(list_after.json()["items"]) == 0
