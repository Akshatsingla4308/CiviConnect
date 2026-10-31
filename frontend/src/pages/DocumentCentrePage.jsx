import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckSquare, Building2, ExternalLink, X, Landmark, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DocumentCard } from '../components/DocumentCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

export const DocumentCentrePage = () => {
  const { language, t } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeDoc, setActiveDoc] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.documents.list(selectedCategory !== 'all' ? selectedCategory : null, search || null)
      .then((data) => {
        setDocuments(data.items || []);
      })
      .catch((err) => console.log('Documents load error:', err))
      .finally(() => setLoading(false));
  }, [search, selectedCategory]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveDoc(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getDocName = (doc) => {
    if (!doc) return '';
    if (language === 'pa' && doc.name_pa) return doc.name_pa;
    if (language === 'hi' && doc.name_hi) return doc.name_hi;
    return doc.name;
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="editorial-kicker">Paperwork & Verification Directory</div>
          <h1 style={{ fontSize: '2.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
            {t('documents.title')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '750px' }}>
            {t('documents.subtitle')}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="surface-card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }} className="doc-filter-grid">
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder={t('documents.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            <div>
              <select
                aria-label="Filter documents by category"
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Document Categories</option>
                <option value="identity">Identity & Civil Status</option>
                <option value="financial">Financial & Income Proofs</option>
                <option value="residence_and_category">Residence & Social Category</option>
                <option value="property">Land & Property Records</option>
                <option value="education">Educational Marksheets & Proofs</option>
                <option value="medical">Medical & Disability Certificates</option>
                <option value="occupation">Occupational / Vending IDs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <LoadingSkeleton count={6} height="220px" />
        ) : documents.length > 0 ? (
          <div className="grid-3">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onOpenChecklist={(selected) => setActiveDoc(selected)}
              />
            ))}
          </div>
        ) : (
          <div className="surface-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p>No documents matched your search filter.</p>
          </div>
        )}

        {/* Document Guidelines Modal */}
        {activeDoc && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '1rem'
            }}
            onClick={() => setActiveDoc(null)}
          >
            <div
              className="surface-card"
              style={{
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                position: 'relative',
                animation: 'fadeIn 0.2s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ backgroundColor: 'var(--color-ivory-warm)', color: 'var(--color-forest-dark)', border: '1px solid var(--color-border)' }}>
                      {activeDoc.category?.toUpperCase()}
                    </span>
                    <span className="badge badge-verified">
                      <ShieldCheck size={12} /> Canonical Welfare Document
                    </span>
                  </div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    color: 'var(--color-forest-dark)',
                    margin: 0,
                    fontFamily: language === 'pa' || language === 'hi' ? 'var(--font-indic)' : 'var(--font-display)'
                  }}>
                    {getDocName(activeDoc)}
                  </h2>
                </div>

                <button
                  onClick={() => setActiveDoc(null)}
                  aria-label="Close modal"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: '0.4rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Issuing Authority */}
              {activeDoc.issuing_authority && (
                <div style={{
                  backgroundColor: 'var(--color-forest-surface)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.875rem',
                  color: 'var(--color-forest-dark)'
                }}>
                  <Building2 size={16} color="var(--color-forest)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Issuing Authority:</strong> {activeDoc.issuing_authority}
                  </div>
                </div>
              )}

              {/* Guidelines / Preparation Guidance */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} color="var(--color-terracotta)" />
                  <span>Preparation Instructions & Guidelines</span>
                </h4>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--color-text-main)',
                  lineHeight: 1.6,
                  backgroundColor: 'var(--color-ivory)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)'
                }}>
                  {activeDoc.general_guidance || activeDoc.description || 'Obtain or verify this document at your nearest Tehsildar office, Sub-Divisional Magistrate (SDM), or District Sewa Kendra.'}
                </div>
              </div>

              {/* Associated Schemes that require this document */}
              {activeDoc.associated_schemes && activeDoc.associated_schemes.length > 0 && (
                <div style={{ marginBottom: '1.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--color-forest-dark)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Landmark size={16} color="var(--color-forest)" />
                    <span>Required for {activeDoc.associated_schemes.length} Verified Scheme(s):</span>
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    paddingRight: '0.25rem'
                  }}>
                    {activeDoc.associated_schemes.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--color-ivory-surface)',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--color-forest-dark)' }}>
                          {item.scheme_name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                            {item.requirement_type || 'Mandatory'}
                          </span>
                          <Link
                            to={`/schemes/${item.scheme_id}`}
                            onClick={() => setActiveDoc(null)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              color: 'var(--color-terracotta)',
                              fontSize: '0.78rem',
                              fontWeight: 600
                            }}
                          >
                            <span>View</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '1.25rem'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveDoc(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>

                {activeDoc.official_portal_url && (
                  <a
                    href={activeDoc.official_portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>Apply / Download via Official Portal</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 700px) {
          .doc-filter-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};