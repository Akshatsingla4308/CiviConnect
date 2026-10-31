import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Landmark,
  CheckCircle,
  FileText,
  Scale,
  ExternalLink,
  Phone,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  Calendar,
  Building,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const SchemeDetailsPage = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.schemes.getById(id)
      .then((data) => {
        setScheme(data);
      })
      .catch((err) => {
        addToast(err.message || 'Scheme not found', 'error');
      })
      .finally(() => setLoading(false));

    if (isAuthenticated) {
      api.user.getSavedSchemes()
        .then((savedList) => {
          const found = savedList.some((s) => s.scheme_id === id);
          setIsSaved(found);
        })
        .catch(() => {});
    }
  }, [id, isAuthenticated]);

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      addToast('Please sign in to save schemes to your personal workspace.', 'info');
      return;
    }
    try {
      if (isSaved) {
        await api.user.removeSavedScheme(id);
        setIsSaved(false);
        addToast('Scheme removed from saved list.', 'info');
      } else {
        await api.user.saveScheme(id);
        setIsSaved(true);
        addToast('Scheme saved to your personal workspace!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update saved scheme', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p>Loading verified scheme details...</p>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="page-wrapper container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <h2>Scheme not found</h2>
        <Link to="/schemes" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Scheme Directory
        </Link>
      </div>
    );
  }

  const getLocalizedName = () => {
    if (language === 'pa' && scheme.name_pa) return scheme.name_pa;
    if (language === 'hi' && scheme.name_hi) return scheme.name_hi;
    return scheme.name;
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Breadcrumb & Navigation */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/schemes" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-forest-dark)', fontSize: '0.875rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Directory
          </Link>

          <button
            onClick={handleSaveToggle}
            className={`btn btn-sm ${isSaved ? 'btn-terracotta' : 'btn-secondary'}`}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            <span>{isSaved ? 'Saved in Workspace' : 'Save Scheme'}</span>
          </button>
        </div>

        {/* Scheme Header Box */}
        <div className="surface-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span className={`badge ${scheme.level === 'state' ? 'badge-state' : 'badge-central'}`}>
              <Landmark size={12} /> {scheme.level === 'state' ? 'Punjab State' : 'Central Government'}
            </span>
            <span className="badge" style={{ backgroundColor: 'var(--color-ivory-warm)', color: 'var(--color-forest-dark)' }}>
              {scheme.category?.toUpperCase()}
            </span>
            <span className="badge badge-verified">
              <CheckCircle size={12} /> Verified ({scheme.last_verified_date || '2026-10-31'})
            </span>
          </div>

          <h1 style={{
            fontSize: '2.25rem',
            marginBottom: '0.75rem',
            color: 'var(--color-forest-dark)',
            fontFamily: language === 'pa' || language === 'hi' ? 'var(--font-indic)' : 'var(--font-display)',
          }}>
            {getLocalizedName()}
          </h1>

          {/* Alternate names */}
          {(scheme.name_hi || scheme.name_pa) && (
            <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              {scheme.name_hi && <span><strong>हिंदी:</strong> {scheme.name_hi} </span>}
              {scheme.name_pa && <span>• <strong>ਪੰਜਾਬੀ:</strong> {scheme.name_pa}</span>}
            </div>
          )}

          {scheme.department && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <Building size={16} color="var(--color-terracotta)" />
              <span><strong>Department:</strong> {scheme.department}</span>
            </div>
          )}

          <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            {scheme.detailed_description || scheme.short_description}
          </p>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to={`/wizard?scheme=${scheme.id}`} className="btn btn-primary">
              <Scale size={16} />
              <span>Evaluate My Eligibility</span>
            </Link>

            <Link to={`/checklists/${scheme.id}`} className="btn btn-terracotta">
              <CheckSquare size={16} />
              <span>Document Checklist Tracker</span>
            </Link>

            {scheme.official_portal_url && (
              <a
                href={scheme.official_portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <span>Visit Official Portal</span>
                <ExternalLink size={15} />
              </a>
            )}

            {scheme.helpline_number && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-forest-dark)', padding: '0.5rem 0.85rem', backgroundColor: 'var(--color-forest-surface)', borderRadius: 'var(--radius-sm)' }}>
                <Phone size={14} color="var(--color-forest)" />
                <span><strong>Helpline:</strong> {scheme.helpline_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Grid for Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }} className="details-layout">
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Key Benefits */}
            <div className="surface-card">
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="var(--color-forest)" />
                <span>Verified Benefits & Financial Assistance</span>
              </h2>
              {scheme.benefits && scheme.benefits.length > 0 ? (
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {scheme.benefits.map((b, idx) => (
                    <li key={idx} style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                      {b}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{scheme.benefits_summary}</p>
              )}
            </div>

            {/* Eligibility Rules (Deterministic Table) */}
            <div className="surface-card">
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={20} color="var(--color-forest)" />
                <span>Deterministic Eligibility Criteria</span>
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-ivory-warm)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.75rem' }}>Criterion</th>
                      <th style={{ padding: '0.75rem' }}>Condition / Limit</th>
                      <th style={{ padding: '0.75rem' }}>Requirement Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheme.rules && scheme.rules.length > 0 ? (
                      scheme.rules.map((rule, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--color-forest-dark)' }}>
                            {rule.field_name.replace('_', ' ').toUpperCase()}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--color-text-main)' }}>
                            <code>{rule.operator} {JSON.stringify(rule.expected_value)}</code>
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {rule.description}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          General criteria: Citizen of India.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Exclusions */}
              {scheme.exclusions && scheme.exclusions.length > 0 && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ color: 'var(--color-danger)', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={16} /> Excluded Categories:
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {scheme.exclusions.map((ex, idx) => (
                      <li key={idx}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Application Procedure */}
            {scheme.application_process && (
              <div className="surface-card">
                <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', color: 'var(--color-forest-dark)' }}>
                  Official Application Procedure
                </h2>
                <div style={{ whiteSpace: 'pre-line', color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                  {scheme.application_process}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Documents & Official Citations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Required Documents */}
            <div className="surface-card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={18} color="var(--color-terracotta)" />
                <span>Required Documents</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scheme.documents && scheme.documents.length > 0 ? (
                  scheme.documents.map((doc, idx) => (
                    <div key={idx} style={{ padding: '0.65rem', backgroundColor: 'var(--color-ivory-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-forest-dark)' }}>
                          {doc.name}
                        </span>
                        <span className={`badge ${doc.requirement_type === 'mandatory' ? 'badge-verified' : 'badge-pending'}`} style={{ fontSize: '0.68rem' }}>
                          {doc.requirement_type}
                        </span>
                      </div>
                      {doc.preparation_instructions && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          {doc.preparation_instructions}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Aadhaar card and bank account details required.</p>
                )}
              </div>

              <Link to={`/checklists/${scheme.id}`} className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: '1rem' }}>
                <CheckSquare size={14} />
                <span>Start Preparation Checklist</span>
              </Link>
            </div>

            {/* Official Sources & Citations */}
            <div className="surface-card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Landmark size={18} color="var(--color-forest)" />
                <span>Official Gazettes & Sources</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scheme.sources && scheme.sources.length > 0 ? (
                  scheme.sources.map((src, idx) => (
                    <div key={idx} style={{ fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-forest-dark)' }}>
                        {src.title}
                      </div>
                      {src.publisher && (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          {src.publisher}
                        </div>
                      )}
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-terracotta)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}
                      >
                        <span>View Official Gazette</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Sourced from National Portal of India (india.gov.in).</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 850px) {
          .details-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
