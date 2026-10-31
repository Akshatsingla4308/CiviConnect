import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckSquare, Building2, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DocumentCard } from '../components/DocumentCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

export const DocumentCentrePage = () => {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    setLoading(true);
    api.documents.list(selectedCategory !== 'all' ? selectedCategory : null, search || null)
      .then((data) => {
        setDocuments(data.items || []);
      })
      .catch((err) => console.log('Documents load error:', err))
      .finally(() => setLoading(false));
  }, [search, selectedCategory]);

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
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        ) : (
          <div className="surface-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p>No documents matched your search filter.</p>
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
