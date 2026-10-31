import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Database,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Scale,
  RefreshCw,
  Landmark
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

export const AdminDashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = () => {
    setLoading(true);
    Promise.all([
      api.admin.getStats(),
      api.admin.getAuditLogs(),
      api.schemes.list({ limit: 50 })
    ])
      .then(([statsData, logsData, schemesData]) => {
        setStats(statsData);
        setAuditLogs(logsData || []);
        setSchemes(schemesData.items || []);
      })
      .catch((err) => {
        addToast(err.message || 'Failed to load administrative data', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const handleToggleVerification = async (schemeId, newStatus) => {
    try {
      await api.admin.toggleVerification(schemeId, newStatus);
      addToast(`Scheme verification updated to ${newStatus}`, 'success');
      loadAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to update verification', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-wrapper container" style={{ maxWidth: '550px', textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="surface-card" style={{ padding: '3rem 2rem' }}>
          <ShieldAlert size={48} color="var(--color-danger)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-forest-dark)', marginBottom: '0.75rem' }}>
            Restricted Administration Area
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            This console requires verified system administrative credentials. Please sign in with an authorized administrator account.
          </p>
          <Link to="/login" className="btn btn-primary">
            Sign In with Admin Account
          </Link>
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
            <div className="editorial-kicker">Supervisory Console</div>
            <h1 style={{ fontSize: '2.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.25rem' }}>
              Administration & Data Integrity
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              Oversee government scheme verifications, deterministic rule databases, and immutable audit trails.
            </p>
          </div>

          <button onClick={loadAdminData} className="btn btn-secondary">
            <RefreshCw size={15} />
            <span>Refresh Console</span>
          </button>
        </div>

        {/* Database & Engine Status Card */}
        {stats?.database_status && (
          <div className="surface-card" style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: stats.database_status.active_dialect === 'postgresql' ? '#F0FDF4' : '#FFFBEB',
            borderColor: stats.database_status.active_dialect === 'postgresql' ? '#BBF7D0' : '#FDE68A'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Database size={18} color={stats.database_status.active_dialect === 'postgresql' ? '#15803D' : '#B45309'} />
              <h3 style={{ fontSize: '1.1rem', color: '#1E293B' }}>
                Active Database Engine: <strong style={{ textTransform: 'uppercase' }}>{stats.database_status.active_dialect}</strong>
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
              {stats.database_status.setup_guide || stats.database_status.error_message}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
            <div className="surface-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Total Welfare Schemes
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                {stats.overview.total_schemes}
              </div>
            </div>

            <div className="surface-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Verified Official Records
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)' }}>
                {stats.overview.verified_schemes}
              </div>
            </div>

            <div className="surface-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Deterministic Rules
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-terracotta)' }}>
                {stats.overview.total_rules}
              </div>
            </div>

            <div className="surface-card">
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Canonical Documents
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-saffron-dark)' }}>
                {stats.overview.total_documents}
              </div>
            </div>
          </div>
        )}

        {/* Scheme Verification Status Management Table */}
        <div className="surface-card" style={{ marginBottom: '2.5rem', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', color: 'var(--color-forest-dark)' }}>
            Scheme Gazette Verification Console
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-ivory-warm)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem' }}>Scheme Name</th>
                  <th style={{ padding: '0.75rem' }}>Level</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem' }}>Current Status</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {schemes.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--color-forest-dark)' }}>
                      <Link to={`/schemes/${s.id}`}>{s.name}</Link>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${s.level === 'state' ? 'badge-state' : 'badge-central'}`}>
                        {s.level}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {s.category}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${s.verification_status === 'verified' ? 'badge-verified' : 'badge-pending'}`}>
                        {s.verification_status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {s.verification_status === 'verified' ? (
                        <button
                          onClick={() => handleToggleVerification(s.id, 'partially_verified')}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Mark for Review
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleVerification(s.id, 'verified')}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Approve Verification
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Immutable Administrative Audit Logs */}
        <div className="surface-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', color: 'var(--color-forest-dark)' }}>
            Immutable Administrative Audit Trail
          </h2>
          {auditLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {auditLogs.map((log) => (
                <div key={log.id} style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-ivory-warm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong>{log.action} on {log.target_type} ({log.target_id})</strong>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>
                    {log.change_summary}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Admin: {log.admin_email}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No audit log entries recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
