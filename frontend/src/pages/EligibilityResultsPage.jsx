import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  FileCheck2,
  ExternalLink,
  Save
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const EligibilityResultsPage = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();

  const stateData = location.state || {};
  const isSingle = stateData.isSingle || false;
  const singleResult = stateData.singleResult;
  const evaluationData = stateData.evaluationData || { results: [] };
  const results = isSingle && singleResult ? [singleResult] : (evaluationData.results || []);

  const [activeTab, setActiveTab] = useState('all');

  const filteredResults = results.filter((r) => {
    if (activeTab === 'likely') return r.verdict === 'likely_eligible';
    if (activeTab === 'possible') return r.verdict === 'possibly_eligible';
    if (activeTab === 'insufficient') return r.verdict === 'insufficient_information';
    if (activeTab === 'not_eligible') return r.verdict === 'not_eligible_based_on_known_rules';
    return true;
  });

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'likely_eligible':
        return <span className="badge verdict-likely"><CheckCircle2 size={13} /> Likely Eligible</span>;
      case 'possibly_eligible':
        return <span className="badge verdict-possible"><AlertTriangle size={13} /> Possibly Eligible</span>;
      case 'insufficient_information':
        return <span className="badge verdict-unknown"><HelpCircle size={13} /> Details Needed</span>;
      case 'not_eligible_based_on_known_rules':
        return <span className="badge verdict-not-eligible"><XCircle size={13} /> Excluded by Criteria</span>;
      default:
        return <span className="badge verdict-unknown">Review</span>;
    }
  };

  const handleSaveAssessment = async (item) => {
    if (!isAuthenticated) {
      addToast('Please sign in to record assessments in your history.', 'info');
      return;
    }
    try {
      await api.user.recordAssessment({
        scheme_id: item.scheme_id,
        verdict: item.verdict,
        checks: item.checks,
        missing_fields: item.missing_fields
      });
      addToast('Assessment recorded to your workspace history!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to record assessment', 'error');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="editorial-kicker">Deterministic Evaluation Output</div>
            <h1 style={{ fontSize: '2.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.25rem' }}>
              {t('wizard.resultsTitle')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              {isSingle ? 'Single scheme eligibility assessment' : `Evaluated ${results.length} verified government welfare schemes.`}
            </p>
          </div>

          <Link to="/wizard" className="btn btn-secondary">
            <RotateCcw size={15} />
            <span>Refine Criteria</span>
          </Link>
        </div>

        {/* Tab Filters */}
        {!isSingle && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '2rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {[
              { id: 'all', label: `All Schemes (${results.length})` },
              { id: 'likely', label: `Likely Eligible (${results.filter(r => r.verdict === 'likely_eligible').length})` },
              { id: 'possible', label: `Possibly Eligible (${results.filter(r => r.verdict === 'possibly_eligible').length})` },
              { id: 'insufficient', label: `Details Needed (${results.filter(r => r.verdict === 'insufficient_information').length})` },
              { id: 'not_eligible', label: `Excluded (${results.filter(r => r.verdict === 'not_eligible_based_on_known_rules').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? 'var(--color-forest)' : 'var(--color-text-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--color-forest)' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredResults.length > 0 ? (
            filteredResults.map((item) => (
              <div key={item.scheme_id} className="surface-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      {getVerdictBadge(item.verdict)}
                    </div>
                    <h2 style={{ fontSize: '1.35rem', color: 'var(--color-forest-dark)' }}>
                      <Link to={`/schemes/${item.scheme_id}`} style={{ color: 'inherit' }}>
                        {item.scheme_name}
                      </Link>
                    </h2>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleSaveAssessment(item)}
                      className="btn btn-secondary btn-sm"
                      title="Save assessment result to your account"
                    >
                      <Save size={14} />
                      <span>Record</span>
                    </button>
                    <Link to={`/schemes/${item.scheme_id}`} className="btn btn-primary btn-sm">
                      <span>View Scheme</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.925rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  {item.summary}
                </p>

                {/* Criteria Checks Grid */}
                <div style={{ backgroundColor: 'var(--color-ivory-warm)', borderRadius: 'var(--radius-sm)', padding: '1rem', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-forest-dark)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Evaluated Conditions Checklist:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {item.checks && item.checks.map((chk, cIdx) => (
                      <div key={cIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem' }}>
                        {chk.status === 'pass' && <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />}
                        {chk.status === 'fail' && <XCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />}
                        {chk.status === 'unknown' && <HelpCircle size={16} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />}

                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {chk.description}:
                          </span>{' '}
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {chk.reason}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Fields Prompt */}
                {item.missing_fields && item.missing_fields.length > 0 && (
                  <div style={{ marginTop: '1rem', fontSize: '0.825rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <HelpCircle size={14} color="var(--color-terracotta)" />
                    <span>To confirm final status, provide: <strong>{item.missing_fields.join(', ')}</strong></span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="surface-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p>No schemes matched this tab filter.</p>
              <button onClick={() => setActiveTab('all')} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
                Show All Schemes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
