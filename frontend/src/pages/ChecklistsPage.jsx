import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Square,
  Save,
  CheckCircle2,
  FileText,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const ChecklistsPage = () => {
  const { schemeId } = useParams();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState(schemeId || 'pm-kisan');
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load available schemes for switcher
  useEffect(() => {
    api.schemes.list({ limit: 50 })
      .then((data) => setSchemes(data.items || []))
      .catch((err) => console.log('Schemes load error:', err));
  }, []);

  useEffect(() => {
    if (schemeId && schemeId !== selectedSchemeId) {
      setSelectedSchemeId(schemeId);
    }
  }, [schemeId]);

  // Fetch or create checklist
  useEffect(() => {
    if (!selectedSchemeId) return;
    setLoading(true);

    if (isAuthenticated) {
      api.checklists.getForScheme(selectedSchemeId)
        .then((data) => setChecklist(data))
        .catch((err) => addToast(err.message || 'Failed to load checklist', 'error'))
        .finally(() => setLoading(false));
    } else {
      // Guest demo checklist from scheme detail
      api.schemes.getById(selectedSchemeId)
        .then((sch) => {
          const guestItems = (sch.documents || []).map((d) => ({
            doc_id: d.document_id,
            name: d.name,
            category: d.category || 'general',
            requirement_type: d.requirement_type || 'mandatory',
            instructions: d.preparation_instructions || '',
            is_ready: false,
            notes: ''
          }));
          setChecklist({
            id: 'guest',
            scheme_id: sch.id,
            scheme_name: sch.name,
            status: 'in_progress',
            items: guestItems,
            completion_percentage: 0
          });
        })
        .catch((err) => addToast(err.message || 'Failed to load scheme', 'error'))
        .finally(() => setLoading(false));
    }
  }, [selectedSchemeId, isAuthenticated]);

  const handleToggleItem = (index) => {
    if (!checklist) return;
    const updatedItems = [...checklist.items];
    updatedItems[index].is_ready = !updatedItems[index].is_ready;

    // Recalculate percentage
    const totalMandatory = updatedItems.filter(i => i.requirement_type === 'mandatory').length;
    const readyMandatory = updatedItems.filter(i => i.requirement_type === 'mandatory' && i.is_ready).length;
    const newPct = totalMandatory > 0
      ? Math.round((readyMandatory / totalMandatory) * 100)
      : Math.round((updatedItems.filter(i => i.is_ready).length / updatedItems.length) * 100);

    setChecklist({
      ...checklist,
      items: updatedItems,
      completion_percentage: newPct,
      status: newPct === 100 ? 'completed' : 'in_progress'
    });
  };

  const handleNotesChange = (index, notes) => {
    if (!checklist) return;
    const updatedItems = [...checklist.items];
    updatedItems[index].notes = notes;
    setChecklist({
      ...checklist,
      items: updatedItems
    });
  };

  const handleSaveChecklist = async () => {
    if (!isAuthenticated) {
      addToast('Please sign in to permanently save your checklist progress across sessions.', 'info');
      navigate('/login');
      return;
    }
    setSaving(true);
    try {
      const res = await api.checklists.update(selectedSchemeId, checklist.items, checklist.status);
      setChecklist(res);
      addToast('Checklist successfully persisted to your database account!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save checklist', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '850px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-forest-dark)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
            <ArrowLeft size={16} /> Back to Document Directory
          </Link>

          <div className="editorial-kicker">Personalized Document Preparation</div>
          <h1 style={{ fontSize: '2.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
            Document Checklist Tracker
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            Mark your certificates and proofs as ready, add personal notes, and monitor your document readiness before submitting government applications.
          </p>
        </div>

        {/* Scheme Selector */}
        <div className="surface-card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
          <label className="form-label" style={{ marginBottom: '0.5rem' }}>
            Active Scheme:
          </label>
          <select
            className="form-select"
            value={selectedSchemeId}
            onChange={(e) => setSelectedSchemeId(e.target.value)}
          >
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.level === 'state' ? 'Punjab' : 'Central'})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading checklist items...</p>
        ) : checklist ? (
          <div>
            {/* Progress Bar Card */}
            <div className="surface-card" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-forest-surface)', borderColor: 'var(--color-forest-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest-dark)' }}>
                    {checklist.scheme_name}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-forest)' }}>
                    Status: <strong>{checklist.completion_percentage === 100 ? 'All Mandatory Docs Ready' : 'In Progress'}</strong>
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                  {checklist.completion_percentage}%
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(24, 55, 43, 0.15)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${checklist.completion_percentage}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-forest)',
                  borderRadius: '5px',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {!isAuthenticated && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--color-terracotta)' }}>
                  ⚠️ You are currently using guest mode. <Link to="/login" style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}>Sign in</Link> to permanently save checklist state to your database account.
                </div>
              )}
            </div>

            {/* Checklist Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {checklist.items.map((item, idx) => (
                <div
                  key={item.doc_id || idx}
                  className="surface-card"
                  style={{
                    padding: '1.25rem',
                    borderLeft: item.is_ready ? '4px solid var(--color-success)' : '4px solid var(--color-terracotta)',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                      <button
                        type="button"
                        onClick={() => handleToggleItem(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: item.is_ready ? 'var(--color-success)' : 'var(--color-text-muted)',
                          padding: 0,
                          marginTop: '2px'
                        }}
                      >
                        {item.is_ready ? <CheckCircle2 size={22} /> : <Square size={22} />}
                      </button>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            color: item.is_ready ? 'var(--color-text-muted)' : 'var(--color-forest-dark)',
                            textDecoration: item.is_ready ? 'line-through' : 'none'
                          }}>
                            {item.name}
                          </span>
                          <span className={`badge ${item.requirement_type === 'mandatory' ? 'badge-verified' : 'badge-pending'}`} style={{ fontSize: '0.7rem' }}>
                            {item.requirement_type}
                          </span>
                        </div>

                        {item.instructions && (
                          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            {item.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes Input */}
                  <div style={{ marginTop: '0.75rem', paddingLeft: '2.25rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add personal notes (e.g., 'Copy in locker', 'Renewal pending at Tehsil')..."
                      value={item.notes || ''}
                      onChange={(e) => handleNotesChange(idx, e.target.value)}
                      style={{ fontSize: '0.825rem', padding: '0.35rem 0.65rem' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to={`/schemes/${selectedSchemeId}`} className="btn btn-secondary">
                <ArrowLeft size={16} />
                <span>View Scheme Details</span>
              </Link>

              <button
                onClick={handleSaveChecklist}
                disabled={saving}
                className="btn btn-primary btn-lg"
              >
                <Save size={18} />
                <span>{saving ? 'Saving...' : 'Save Checklist Progress'}</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
