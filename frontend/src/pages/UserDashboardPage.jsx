import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Bookmark,
  FileCheck2,
  Scale,
  User,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const UserDashboardPage = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [savedSchemes, setSavedSchemes] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);

    Promise.all([
      api.user.getSavedSchemes(),
      api.checklists.list(),
      api.user.getAssessments()
    ])
      .then(([saved, chk, ass]) => {
        setSavedSchemes(saved || []);
        setChecklists(chk || []);
        setAssessments(ass || []);
      })
      .catch((err) => console.log('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleRemoveSaved = async (schemeId) => {
    try {
      await api.user.removeSavedScheme(schemeId);
      setSavedSchemes((prev) => prev.filter((s) => s.scheme_id !== schemeId));
      addToast('Scheme removed from saved list.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to remove', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page-wrapper container" style={{ maxWidth: '600px', textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div className="surface-card" style={{ padding: '3rem 2rem' }}>
          <User size={48} color="var(--color-terracotta)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h2 style={{ fontSize: '1.75rem', color: 'var(--color-forest-dark)', marginBottom: '0.75rem' }}>
            Citizen Workspace
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Sign in to track your bookmarked schemes, monitor document preparation checklists, and keep a history of your eligibility evaluations.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/login" className="btn btn-primary">
              <LogIn size={16} />
              <span>Sign In</span>
            </Link>
            <Link to="/register" className="btn btn-secondary">
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="editorial-kicker">Personal Workspace</div>
            <h1 style={{ fontSize: '2.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.25rem' }}>
              Welcome back, {user?.name || 'Citizen'}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              Manage your verified welfare schemes, document checklists, and eligibility assessments.
            </p>
          </div>

          <Link to="/profile" className="btn btn-secondary">
            <User size={15} />
            <span>Profile & Demographics</span>
          </Link>
        </div>

        {/* Overview Stats */}
        <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
          <div className="surface-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-forest-surface)', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bookmark size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                {savedSchemes.length}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Saved Schemes
              </div>
            </div>
          </div>

          <div className="surface-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-terracotta-surface)', color: 'var(--color-terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                {checklists.length}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Active Document Checklists
              </div>
            </div>
          </div>

          <div className="surface-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-saffron-surface)', color: 'var(--color-saffron-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                {assessments.length}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Eligibility Evaluations
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Workspace Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="workspace-grid">
          {/* Active Checklists */}
          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck2 size={18} color="var(--color-terracotta)" />
                <span>Document Checklists</span>
              </h2>
              <Link to="/documents" style={{ fontSize: '0.825rem', color: 'var(--color-terracotta)', fontWeight: 600 }}>
                Explore Docs →
              </Link>
            </div>

            {checklists.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {checklists.map((chk) => (
                  <div key={chk.id} style={{ padding: '1rem', backgroundColor: 'var(--color-ivory-warm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--color-forest-dark)' }}>
                        {chk.scheme_name}
                      </strong>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-forest)' }}>
                        {chk.completion_percentage}%
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                      <div style={{ width: `${chk.completion_percentage}%`, height: '100%', backgroundColor: 'var(--color-forest)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Link to={`/checklists/${chk.scheme_id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                        <span>Manage Items</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                {t('dashboard.emptyChecklists')}
              </p>
            )}
          </div>

          {/* Bookmarked Schemes */}
          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bookmark size={18} color="var(--color-forest)" />
                <span>Saved Schemes</span>
              </h2>
              <Link to="/schemes" style={{ fontSize: '0.825rem', color: 'var(--color-forest)', fontWeight: 600 }}>
                Browse All →
              </Link>
            </div>

            {savedSchemes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {savedSchemes.map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--color-ivory-warm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <div>
                      <Link to={`/schemes/${s.scheme_id}`} style={{ fontWeight: 600, color: 'var(--color-forest-dark)', fontSize: '0.925rem' }}>
                        {s.scheme?.name || s.scheme_id}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Saved {new Date(s.saved_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Link to={`/schemes/${s.scheme_id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        View
                      </Link>
                      <button
                        onClick={() => handleRemoveSaved(s.scheme_id)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.2rem 0.4rem', color: 'var(--color-danger)', borderColor: 'transparent' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                {t('dashboard.emptySaved')}
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .workspace-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
