import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  Download,
  Trash2,
  FileCheck2,
  Lock,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const DocumentVaultPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('aadhaar_card');
  const [notes, setNotes] = useState('');

  const loadDocuments = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.vault.list();
      setDocuments(res.items || []);
    } catch (err) {
      addToast(err.message || 'Failed to load vault documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [isAuthenticated]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        addToast('File size exceeds 10MB limit.', 'error');
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        // Auto-suggest name from filename without extension
        const rawName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setDocumentName(rawName.replace(/[_-]/g, ' '));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast('Please select a PDF, JPEG, or PNG file to upload.', 'error');
      return;
    }
    if (!documentName.trim()) {
      addToast('Please provide a document name.', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_name', documentName.trim());
      formData.append('document_type', documentType);
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const created = await api.vault.upload(formData);
      addToast(`"${created.document_name}" successfully saved to your private vault.`, 'success');
      setShowUploadModal(false);
      setSelectedFile(null);
      setDocumentName('');
      setNotes('');
      loadDocuments();
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      addToast(`Downloading ${doc.document_name}...`, 'info');
      await api.vault.downloadBlob(doc.id, doc.file_name);
    } catch (err) {
      addToast(err.message || 'Download failed', 'error');
    }
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Are you sure you want to delete "${docName}" from your private vault? This cannot be undone.`)) {
      return;
    }
    try {
      await api.vault.delete(docId);
      addToast(`"${docName}" removed from your vault.`, 'info');
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      addToast(err.message || 'Failed to delete document', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '640px', textAlign: 'center' }}>
        <div className="surface-card" style={{ padding: '3rem 2rem', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
          <Lock size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Private Document Vault
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Securely store, organize, and manage your verified certificates and official documents in your private encrypted vault. Please sign in or create an account to access your vault.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              Sign In to Access Vault
            </Link>
            <Link to="/register" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredDocs = documents.filter((d) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.document_name.toLowerCase().includes(term) ||
      d.document_type.toLowerCase().includes(term) ||
      (d.notes && d.notes.toLowerCase().includes(term))
    );
  });

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(26, 77, 46, 0.1)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
              <Lock size={24} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
              Personal Document Vault
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '1rem' }}>
            Securely keep your Aadhaar, income certificates, marksheets, and welfare paperwork ready for 1-click eligibility verification.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '0.5rem' }}
        >
          <Plus size={18} />
          Upload New Document
        </button>
      </div>

      {/* Security Privacy Advisory Card */}
      <div
        style={{
          background: 'rgba(26, 77, 46, 0.04)',
          border: '1px solid rgba(26, 77, 46, 0.15)',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <ShieldCheck size={28} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
          <strong>Zero-Access Encrypted Vault:</strong> Documents uploaded here remain private to your citizen account and are never shared with third parties or government portals without your explicit authorization.
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search saved documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-main)',
              fontSize: '0.95rem'
            }}
          />
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span><strong>{documents.length}</strong> Document{documents.length === 1 ? '' : 's'} Stored</span>
          <button
            onClick={loadDocuments}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Document List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading your private vault...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div
          className="surface-card"
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            borderRadius: '1rem',
            border: '1px dashed var(--color-border)',
            background: 'var(--color-surface)'
          }}
        >
          <UploadCloud size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {searchTerm ? 'No matching documents found' : 'Your Document Vault is Empty'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            {searchTerm
              ? 'Try modifying your search term to find what you are looking for.'
              : 'Upload scanned copies or PDFs of your essential paperwork (Aadhaar, Income Certificate, Caste Certificate, Land records) so you have them instantly accessible for public scheme applications.'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem' }}
          >
            <Plus size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Add First Document
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="surface-card"
              style={{
                borderRadius: '0.75rem',
                border: '1px solid var(--color-border)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: 'rgba(26, 77, 46, 0.08)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: '0.375rem' }}>
                      <FileText size={20} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.25rem',
                        background: 'rgba(0,0,0,0.05)',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {doc.document_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {formatFileSize(doc.file_size_bytes)}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--color-text-main)' }}>
                  {doc.document_name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  {doc.file_name}
                </div>

                {doc.notes && (
                  <div
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--color-text-main)',
                      background: 'rgba(0,0,0,0.02)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      marginBottom: '1rem',
                      lineHeight: 1.4
                    }}
                  >
                    {doc.notes}
                  </div>
                )}
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="btn btn-outline"
                    title="Download document"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Download size={14} /> Download
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.document_name)}
                    className="btn btn-outline"
                    title="Delete document"
                    style={{ padding: '0.4rem 0.6rem', color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.2)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal Dialog */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="surface-card"
            style={{
              background: 'var(--color-surface)',
              width: '100%',
              maxWidth: '520px',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                Upload Document to Vault
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              {/* File input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Select File (PDF, JPEG, PNG — Max 10MB) *
                </label>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px dashed var(--color-border)',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    background: 'rgba(0,0,0,0.02)'
                  }}
                />
              </div>

              {/* Document Name */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Aadhaar Card, Income Certificate 2026"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              {/* Document Category */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Document Category
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.95rem',
                    background: 'var(--color-surface)'
                  }}
                >
                  <option value="aadhaar_card">Aadhaar Card (UIDAI)</option>
                  <option value="pan_card">PAN Card (Income Tax Dept)</option>
                  <option value="voter_id_card">Voter ID (EPIC)</option>
                  <option value="income_certificate">Income Certificate</option>
                  <option value="caste_certificate">Caste / Social Category Certificate</option>
                  <option value="domicile_certificate">Domicile / Residence Certificate</option>
                  <option value="bpl_ration_card">BPL / Ration Card</option>
                  <option value="bank_passbook">Bank Passbook / Cancelled Cheque</option>
                  <option value="land_records_jamabandi">Land Records (Jamabandi / Fard)</option>
                  <option value="class_10_marksheet">Class 10th Marksheet / Birth Proof</option>
                  <option value="class_12_marksheet">Class 12th Marksheet</option>
                  <option value="college_admission_proof">College Admission / Bonafide</option>
                  <option value="disability_certificate">Disability Certificate (UDID)</option>
                  <option value="general">Other / General Document</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Notes (Optional)
                </label>
                <textarea
                  placeholder="e.g. Valid until March 2027, issued by Tehsildar Ludhiana"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.95rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {uploading ? 'Saving File...' : 'Save to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
