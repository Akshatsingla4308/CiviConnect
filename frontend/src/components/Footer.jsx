import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Database, Cpu, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';

export const Footer = () => {
  const { t } = useLanguage();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.system.getHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.log('System health check:', err));
  }, []);

  return (
    <footer style={{
      backgroundColor: 'var(--color-forest-dark)',
      color: '#CBD5E1',
      borderTop: '1px solid #1E3A2F',
      paddingTop: '3rem',
      paddingBottom: '2rem',
      fontSize: '0.875rem',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }} className="footer-grid">
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-terracotta)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-emblem)',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                CC
              </div>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: '#FFFFFF'
              }}>
                CiviConnect
              </span>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              {t('footer.tagline')}
            </p>
            <div style={{
              fontSize: '0.75rem',
              color: '#F87171',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1.5
            }}>
              ⚠️ <strong>Disclaimer:</strong> {t('footer.disclaimer')}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link to="/schemes" style={{ color: '#94A3B8' }}>{t('nav.explore')}</Link></li>
              <li><Link to="/assistant" style={{ color: '#94A3B8' }}>{t('nav.assistant')}</Link></li>
              <li><Link to="/wizard" style={{ color: '#94A3B8' }}>{t('nav.wizard')}</Link></li>
              <li><Link to="/documents" style={{ color: '#94A3B8' }}>{t('nav.documents')}</Link></li>
              <li><Link to="/directory" style={{ color: '#94A3B8' }}>{t('nav.directory')}</Link></li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              Information
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link to="/about" style={{ color: '#94A3B8' }}>{t('footer.about')}</Link></li>
              <li><Link to="/help" style={{ color: '#94A3B8' }}>{t('footer.help')}</Link></li>
              <li><Link to="/privacy" style={{ color: '#94A3B8' }}>{t('footer.privacy')}</Link></li>
              <li><a href="https://india.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>India.gov.in <ExternalLink size={12} /></a></li>
              <li><a href="https://punjab.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Punjab.gov.in <ExternalLink size={12} /></a></li>
            </ul>
          </div>

          {/* System & Database Status */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              System Integrity
            </h4>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94A3B8' }}>
                  <Database size={13} /> Database Engine:
                </span>
                <span style={{
                  color: health?.database?.active_dialect === 'postgresql' ? '#4ADE80' : '#FBBF24',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {health?.database?.active_dialect || 'Connecting...'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94A3B8' }}>
                  <Cpu size={13} /> AI Provider:
                </span>
                <span style={{
                  color: health?.ai_provider?.status === 'ready' ? '#4ADE80' : '#FBBF24',
                  fontWeight: 600
                }}>
                  {health?.ai_provider?.status === 'ready' ? 'Live Gemini 3.8' : 'DB Fallback'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94A3B8' }}>
                  <ShieldCheck size={13} /> Verified Records:
                </span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                  {health?.data_summary?.verified_schemes || 52} Schemes
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="editorial-divider" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '1.5rem 0' }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.78rem',
          color: '#64748B'
        }}>
          <div>
            © 2026 CiviConnect. Independent Public Service Information Initiative.
          </div>
          <div>
            Designed for Citizens of India • English • हिंदी • ਪੰਜਾਬੀ
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 850px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 500px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
};
