import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Landmark,
  FileText,
  Scale
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const SchemeCard = ({ scheme, isSaved = false, onSaveToggle }) => {
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [saved, setSaved] = useState(isSaved);
  const [loading, setLoading] = useState(false);

  const getLocalizedName = () => {
    if (language === 'pa' && scheme.name_pa) return scheme.name_pa;
    if (language === 'hi' && scheme.name_hi) return scheme.name_hi;
    return scheme.name;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Please sign in to save schemes to your personal workspace.', 'info');
      return;
    }
    setLoading(true);
    try {
      if (saved) {
        await api.user.removeSavedScheme(scheme.id);
        setSaved(false);
        addToast('Scheme removed from saved list.', 'info');
        if (onSaveToggle) onSaveToggle(scheme.id, false);
      } else {
        await api.user.saveScheme(scheme.id);
        setSaved(true);
        addToast('Scheme saved to your workspace!', 'success');
        if (onSaveToggle) onSaveToggle(scheme.id, true);
      }
    } catch (err) {
      addToast(err.message || 'Failed to update saved scheme', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-card" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      position: 'relative',
    }}>
      <div>
        {/* Badges Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span className={`badge ${scheme.level === 'state' ? 'badge-state' : 'badge-central'}`}>
              <Landmark size={11} /> {scheme.level === 'state' ? 'Punjab State' : 'Central Govt'}
            </span>
            <span className="badge" style={{ backgroundColor: 'var(--color-ivory-warm)', color: 'var(--color-forest-dark)', border: '1px solid var(--color-border)' }}>
              {scheme.category?.replace('_', ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {scheme.verification_status === 'verified' ? (
              <span className="badge badge-verified" title="Verified against official government gazette">
                <CheckCircle size={11} /> Verified
              </span>
            ) : (
              <span className="badge badge-pending">
                <Clock size={11} /> Review
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              title={saved ? 'Remove from Saved' : 'Save Scheme'}
              aria-label={saved ? 'Remove from Saved' : 'Save Scheme'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: saved ? 'var(--color-terracotta)' : 'var(--color-text-light)',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                transition: 'var(--transition)'
              }}
            >
              {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          </div>
        </div>

        {/* Scheme Name */}
        <h3 style={{
          fontSize: '1.15rem',
          marginBottom: '0.35rem',
          lineHeight: 1.3,
          color: 'var(--color-forest-dark)',
          fontFamily: language === 'pa' || language === 'hi' ? 'var(--font-indic)' : 'var(--font-display)',
        }}>
          <Link to={`/schemes/${scheme.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {getLocalizedName()}
          </Link>
        </h3>

        {/* Department */}
        {scheme.department && (
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.65rem' }}>
            {scheme.department}
          </div>
        )}

        {/* Short Summary */}
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
          marginBottom: '1rem',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {scheme.short_description}
        </p>

        {/* Key Benefits Highlight Box */}
        {scheme.benefits_summary && (
          <div style={{
            backgroundColor: 'var(--color-forest-surface)',
            borderLeft: '3px solid var(--color-forest)',
            padding: '0.6rem 0.75rem',
            borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
            fontSize: '0.8rem',
            color: 'var(--color-forest-dark)',
            marginBottom: '1rem'
          }}>
            <strong>Key Benefit:</strong> {scheme.benefits_summary}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--color-border-subtle)',
          marginBottom: '0.85rem'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Scale size={13} /> {scheme.rules_count || 2} Eligibility Rules
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <FileText size={13} /> {scheme.documents_count || 3} Required Docs
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/schemes/${scheme.id}`}
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
          >
            <span>{t('schemes.viewDetails')}</span>
            <ChevronRight size={14} />
          </Link>

          <Link
            to={`/wizard?scheme=${scheme.id}`}
            className="btn btn-secondary btn-sm"
            title="Check eligibility for this scheme"
          >
            <span>Check</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
