import React from 'react';
import { FileText, Building2, CheckSquare, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const DocumentCard = ({ document, onOpenChecklist }) => {
  const { language, t } = useLanguage();

  const getLocalizedName = () => {
    if (language === 'pa' && document.name_pa) return document.name_pa;
    if (language === 'hi' && document.name_hi) return document.name_hi;
    return document.name;
  };

  return (
    <div className="surface-card" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span className="badge" style={{ backgroundColor: 'var(--color-ivory-warm)', color: 'var(--color-forest-dark)', border: '1px solid var(--color-border)' }}>
            {document.category?.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Used in {document.associated_schemes_count || 1} scheme(s)
          </span>
        </div>

        <h3 style={{
          fontSize: '1.15rem',
          marginBottom: '0.4rem',
          color: 'var(--color-forest-dark)',
          fontFamily: language === 'pa' || language === 'hi' ? 'var(--font-indic)' : 'var(--font-display)',
        }}>
          {getLocalizedName()}
        </h3>

        {document.issuing_authority && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            <Building2 size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-terracotta)' }} />
            <span><strong>Authority:</strong> {document.issuing_authority}</span>
          </div>
        )}

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
          {document.general_guidance || document.description}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--color-border-subtle)',
        gap: '0.5rem'
      }}>
        {document.official_portal_url ? (
          <a
            href={document.official_portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem' }}
          >
            <span>Apply / Portal</span>
            <ExternalLink size={12} />
          </a>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Offline / Sewa Kendra</span>
        )}

        <button
          onClick={() => onOpenChecklist && onOpenChecklist(document)}
          className="btn btn-outline btn-sm"
          style={{ fontSize: '0.75rem' }}
        >
          <CheckSquare size={13} />
          <span>View Guidelines</span>
        </button>
      </div>
    </div>
  );
};
