import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  Edit3,
  Calendar,
  Building,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

const STATUS_CONFIG = {
  Draft: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', icon: Clock, label: 'Draft' },
  Submitted: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', icon: FileCheck2, label: 'Submitted' },
  'Under Scrutiny': { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)', icon: Clock, label: 'Under Scrutiny' },
  Approved: { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)', icon: CheckCircle2, label: 'Approved' },
  Disbursed: { color: '#059669', bg: 'rgba(5, 150, 105, 0.15)', icon: CheckCircle2, label: 'Benefit Disbursed' },
  'Action Required': { color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', icon: AlertCircle, label: 'Action Required' },
  Rejected: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', icon: XCircle, label: 'Rejected' },
};

export const ApplicationTrackerPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // New Application Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState({
    scheme_id: 'general',
    scheme_name: '',
    application_number: '',
    status: 'Draft',
    submission_date: new Date().toISOString().split('T')[0],
    department: '',
    portal_url: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Status Update Modal State
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [newStatus, setNewStatus] = useState('Submitted');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadApplications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.applications.list();
      setApplications(res.items || []);
    } catch (err) {
      addToast(err.message || 'Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [isAuthenticated]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.scheme_name.trim()) {
      addToast('Please enter the scheme or service name.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        scheme_id: formData.scheme_id || formData.scheme_name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      };
      await api.applications.create(payload);
      addToast('Application record created in your tracker.', 'success');
      setShowNewModal(false);
      setFormData({
        scheme_id: 'general',
        scheme_name: '',
        application_number: '',
        status: 'Draft',
        submission_date: new Date().toISOString().split('T')[0],
        department: '',
        portal_url: '',
        notes: '',
      });
      loadApplications();
    } catch (err) {
      addToast(err.message || 'Failed to create record', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalApp) return;

    setUpdating(true);
    try {
      await api.applications.update(statusModalApp.id, {
        status: newStatus,
        status_note: statusNote.trim() || undefined,
      });
      addToast(`Status updated to "${newStatus}".`, 'success');
      setStatusModalApp(null);
      setStatusNote('');
      loadApplications();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (appId, schemeName) => {
    if (!window.confirm(`Delete tracker entry for "${schemeName}"?`)) {
      return;
    }
    try {
      await api.applications.delete(appId);
      addToast('Application entry removed.', 'info');
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      addToast(err.message || 'Failed to delete record', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '640px', textAlign: 'center' }}>
        <div className="surface-card" style={{ padding: '3rem 2rem', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
          <FileCheck2 size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Application Milestone Tracker
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Track application reference numbers, department verification stages, and disbursement timelines across central and state welfare programs. Please sign in to access your tracker.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              Sign In to View Tracker
            </Link>
            <Link to="/register" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredApps = applications.filter((app) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return ['Submitted', 'Under Scrutiny', 'Action Required'].includes(app.status);
    if (filterStatus === 'COMPLETED') return ['Approved', 'Disbursed'].includes(app.status);
    if (filterStatus === 'DRAFT') return app.status === 'Draft';
    if (filterStatus === 'REJECTED') return app.status === 'Rejected';
    return true;
  });

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(26, 77, 46, 0.1)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
              <FileCheck2 size={24} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
              Citizen Application Tracker
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '1rem' }}>
            Record official application numbers, track department scrutiny milestones, and monitor DBT disbursement timelines.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '0.5rem' }}
        >
          <Plus size={18} />
          Track New Application
        </button>
      </div>

      {/* Advisory Banner */}
      <div
        style={{
          background: 'rgba(217, 119, 6, 0.05)',
          border: '1px solid rgba(217, 119, 6, 0.2)',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <Info size={24} style={{ color: '#d97706', flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
          <strong>Citizen-Reported Status Log:</strong> CiviConnect is an independent information service and does not file applications or promise government benefits. Use this tracker to log your official receipt numbers and track progress made on government portals.
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
        {[
          { key: 'ALL', label: `All (${applications.length})` },
          { key: 'ACTIVE', label: `Active / In Progress (${applications.filter((a) => ['Submitted', 'Under Scrutiny', 'Action Required'].includes(a.status)).length})` },
          { key: 'COMPLETED', label: `Approved / Disbursed (${applications.filter((a) => ['Approved', 'Disbursed'].includes(a.status)).length})` },
          { key: 'DRAFT', label: `Drafts (${applications.filter((a) => a.status === 'Draft').length})` },
          { key: 'REJECTED', label: `Rejected (${applications.filter((a) => a.status === 'Rejected').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              border: 'none',
              background: filterStatus === tab.key ? 'var(--color-primary)' : 'rgba(0,0,0,0.05)',
              color: filterStatus === tab.key ? '#ffffff' : 'var(--color-text-main)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Application Cards */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading your application tracker...
        </div>
      ) : filteredApps.length === 0 ? (
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
          <FileCheck2 size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No Applications Logged in this Category
          </h3>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Keep track of any government scheme, scholarship, or welfare pension application you submit.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem' }}
          >
            <Plus size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Log Application
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredApps.map((app) => {
            const statusStyle = STATUS_CONFIG[app.status] || STATUS_CONFIG.Draft;
            const StatusIcon = statusStyle.icon;

            return (
              <div
                key={app.id}
                className="surface-card"
                style={{
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-border)',
                  padding: '1.5rem',
                  background: 'var(--color-surface)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--color-text-main)' }}>
                      {app.scheme_name}
                    </h3>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      {app.application_number && (
                        <span>
                          <strong>Ref #:</strong> {app.application_number}
                        </span>
                      )}
                      {app.submission_date && (
                        <span>
                          <strong>Date:</strong> {app.submission_date}
                        </span>
                      )}
                      {app.department && (
                        <span>
                          <strong>Department:</strong> {app.department}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '2rem',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      <StatusIcon size={16} />
                      {statusStyle.label}
                    </span>

                    <button
                      onClick={() => {
                        setStatusModalApp(app);
                        setNewStatus(app.status);
                        setStatusNote('');
                      }}
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Edit3 size={14} /> Update Status
                    </button>

                    <button
                      onClick={() => handleDelete(app.id, app.scheme_name)}
                      className="btn btn-outline"
                      title="Delete entry"
                      style={{ padding: '0.4rem 0.6rem', color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.2)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                {app.notes && (
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.02)',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--color-text-main)',
                      marginBottom: '1rem',
                      lineHeight: 1.5
                    }}
                  >
                    <strong>Notes:</strong> {app.notes}
                  </div>
                )}

                {/* Milestones / History Timeline */}
                {app.history && app.history.length > 0 && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      Milestone Timeline
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {app.history.map((h, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--color-text-muted)', minWidth: '90px' }}>
                            {h.timestamp ? new Date(h.timestamp).toLocaleDateString() : ''}
                          </span>
                          <span style={{ fontWeight: 600, color: (STATUS_CONFIG[h.status] || {}).color || 'inherit' }}>
                            {h.status}:
                          </span>
                          <span style={{ color: 'var(--color-text-main)' }}>{h.note || 'Status updated'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Portal Link */}
                {app.portal_url && (
                  <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                    <a
                      href={app.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      Open Official Portal <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Application Modal */}
      {showNewModal && (
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
          onClick={() => setShowNewModal(false)}
        >
          <div
            className="surface-card"
            style={{
              background: 'var(--color-surface)',
              width: '100%',
              maxWidth: '540px',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                Log Application for Tracking
              </h2>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Scheme / Service Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. PM-KISAN, Post Matric SC Scholarship, PMJDY"
                  value={formData.scheme_name}
                  onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Application / Ref #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PB-2026-9012"
                    value={formData.application_number}
                    onChange={(e) => setFormData({ ...formData, application_number: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Current Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Scrutiny">Under Scrutiny</option>
                    <option value="Approved">Approved</option>
                    <option value="Disbursed">Disbursed</option>
                    <option value="Action Required">Action Required</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Submission Date
                  </label>
                  <input
                    type="date"
                    value={formData.submission_date}
                    onChange={(e) => setFormData({ ...formData, submission_date: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Department / Agency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dept of Social Justice"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Official Portal URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://scholarships.punjab.gov.in"
                  value={formData.portal_url}
                  onChange={(e) => setFormData({ ...formData, portal_url: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Notes & Details
                </label>
                <textarea
                  placeholder="e.g. Application submitted at Suwidha centre with Aadhaar and income certificate."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  {saving ? 'Saving...' : 'Add to Tracker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalApp && (
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
          onClick={() => setStatusModalApp(null)}
        >
          <div
            className="surface-card"
            style={{
              background: 'var(--color-surface)',
              width: '100%',
              maxWidth: '480px',
              borderRadius: '1rem',
              padding: '2rem',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Update Status: {statusModalApp.scheme_name}
              </h2>
              <button
                onClick={() => setStatusModalApp(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleStatusUpdateSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Select New Milestone Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Scrutiny">Under Scrutiny (Official Verification)</option>
                  <option value="Approved">Approved</option>
                  <option value="Disbursed">Benefit Disbursed</option>
                  <option value="Action Required">Action Required (Correction Needed)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Progress Note (Recorded in Timeline)
                </label>
                <textarea
                  placeholder="e.g. Received SMS notification; physical document inspection completed."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setStatusModalApp(null)}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  {updating ? 'Updating...' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
