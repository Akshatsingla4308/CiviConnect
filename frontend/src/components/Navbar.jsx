import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  FileText,
  MapPin,
  LayoutDashboard,
  Lock,
  FileCheck2,
  ShieldAlert,
  LogIn,
  LogOut,
  Globe,
  Menu,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      width: '100%',
      pointerEvents: 'none', // let clicks pass through empty wrapper
    }}>
      {/* Top Advisory Banner */}
      <div
        className="nav-disclaimer-banner"
        style={{
          backgroundColor: 'var(--color-forest-dark)',
          color: '#E2E8F0',
          fontSize: '0.75rem',
          padding: '0.35rem 1rem',
          textAlign: 'center',
          fontWeight: 500,
          letterSpacing: '0.02em',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          boxSizing: 'border-box'
        }}
      >
        {/* Inline SVG Indian Tricolor Badge */}
        <svg
          width="18"
          height="12"
          viewBox="0 0 900 600"
          role="img"
          aria-label="Flag of India"
          style={{
            borderRadius: '2px',
            display: 'inline-block',
            verticalAlign: 'middle',
            boxShadow: '0 0 1px rgba(0,0,0,0.4)',
            flexShrink: 0
          }}
        >
          <rect width="900" height="200" fill="#FF9933" />
          <rect y="200" width="900" height="200" fill="#FFFFFF" />
          <rect y="400" width="900" height="200" fill="#138808" />
          <circle cx="450" cy="300" r="80" fill="none" stroke="#000088" strokeWidth="14" />
          <circle cx="450" cy="300" r="16" fill="#000088" />
        </svg>
        <span>{t('hero.disclaimer')}</span>
      </div>

      {/* Floating Capsule Container */}
      <div
        className="nav-capsule-container"
        style={{
          padding: '0.45rem 1rem',
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div
          className="nav-capsule"
          style={{
            width: '100%',
            maxWidth: '1240px',
            backgroundColor: 'rgba(254, 253, 250, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(226, 218, 203, 0.9)',
            borderRadius: mobileMenuOpen ? '20px' : '9999px',
            boxShadow: '0 6px 24px -2px rgba(27, 43, 33, 0.08), 0 2px 8px -1px rgba(27, 43, 33, 0.04)',
            padding: '0.35rem 1rem',
            pointerEvents: 'auto',
            transition: 'border-radius 0.2s ease, box-shadow 0.2s ease',
            boxSizing: 'border-box'
          }}
        >
          {/* Main Top Bar inside Capsule */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            minHeight: '44px'
          }}>
            {/* Brand Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-forest)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-emblem)',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0
              }}>
                CC
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: 'var(--color-forest-dark)',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap'
                }}>
                  CiviConnect
                </div>
                <div
                  className="brand-subtitle"
                  style={{
                    fontSize: '0.6rem',
                    color: 'var(--color-terracotta)',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Public Service Navigator
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }} className="desktop-nav">
              <Link
                to="/schemes"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isActive('/schemes') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                  backgroundColor: isActive('/schemes') ? 'var(--color-forest-surface)' : 'transparent',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  transition: 'var(--transition)'
                }}
              >
                <Compass size={15} />
                <span>{t('nav.explore')}</span>
              </Link>

              <Link
                to="/assistant"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isActive('/assistant') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                  backgroundColor: isActive('/assistant') ? 'var(--color-forest-surface)' : 'transparent',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  transition: 'var(--transition)'
                }}
              >
                <Sparkles size={15} color="var(--color-terracotta)" />
                <span>{t('nav.assistant')}</span>
              </Link>

              <Link
                to="/wizard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isActive('/wizard') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                  backgroundColor: isActive('/wizard') ? 'var(--color-forest-surface)' : 'transparent',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  transition: 'var(--transition)'
                }}
              >
                <CheckCircle2 size={15} />
                <span>{t('nav.wizard')}</span>
              </Link>

              <Link
                to="/documents"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isActive('/documents') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                  backgroundColor: isActive('/documents') ? 'var(--color-forest-surface)' : 'transparent',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  transition: 'var(--transition)'
                }}
              >
                <FileText size={15} />
                <span>{t('nav.documents')}</span>
              </Link>

              <Link
                to="/directory"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isActive('/directory') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                  backgroundColor: isActive('/directory') ? 'var(--color-forest-surface)' : 'transparent',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  transition: 'var(--transition)'
                }}
              >
                <MapPin size={15} />
                <span>{t('nav.directory')}</span>
              </Link>

              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: isActive('/dashboard') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                    backgroundColor: isActive('/dashboard') ? 'var(--color-forest-surface)' : 'transparent',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    transition: 'var(--transition)'
                  }}
                >
                  <LayoutDashboard size={15} />
                  <span>{t('nav.dashboard')}</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: isActive('/admin') ? 'var(--color-terracotta)' : '#991B1B',
                    backgroundColor: isActive('/admin') ? '#FEE2E2' : 'transparent',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    transition: 'var(--transition)'
                  }}
                >
                  <ShieldAlert size={15} />
                  <span>{t('nav.admin')}</span>
                </Link>
              )}
            </nav>

            {/* Right Actions: Language Selector & Auth */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              {/* Language Selector */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Globe size={14} style={{ marginRight: '0.2rem', color: 'var(--color-forest)' }} />
                <select
                  aria-label="Select Interface Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '9999px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--color-forest-dark)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="en">English (EN)</option>
                  <option value="hi">हिंदी (HI)</option>
                  <option value="pa">ਪੰਜਾਬੀ (PA)</option>
                </select>
              </div>

              {/* Auth Actions */}
              {isAuthenticated ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Link
                    to="/profile"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      backgroundColor: 'var(--color-forest-surface)',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--color-forest-dark)',
                      textDecoration: 'none',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    aria-label="Sign Out"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '0.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '50%'
                    }}
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <div className="nav-auth-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Link to="/login" className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem' }}>
                    <LogIn size={13} />
                    <span>{t('nav.login')}</span>
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem' }}>
                    <span>{t('nav.register')}</span>
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="mobile-nav-toggle"
                aria-label="Toggle navigation menu"
                style={{
                  display: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-forest-dark)',
                  padding: '0.25rem'
                }}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Expanded Mobile Menu Drawer */}
          {mobileMenuOpen && (
            <div style={{
              borderTop: '1px solid var(--color-border-subtle)',
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <Link
                to="/schemes"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                  color: isActive('/schemes') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                  backgroundColor: isActive('/schemes') ? 'var(--color-forest-surface)' : 'transparent',
                  textDecoration: 'none'
                }}
              >
                <Compass size={17} /> {t('nav.explore')}
              </Link>
              <Link
                to="/assistant"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                  color: isActive('/assistant') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                  backgroundColor: isActive('/assistant') ? 'var(--color-forest-surface)' : 'transparent',
                  textDecoration: 'none'
                }}
              >
                <Sparkles size={17} color="var(--color-terracotta)" /> {t('nav.assistant')}
              </Link>
              <Link
                to="/wizard"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                  color: isActive('/wizard') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                  backgroundColor: isActive('/wizard') ? 'var(--color-forest-surface)' : 'transparent',
                  textDecoration: 'none'
                }}
              >
                <CheckCircle2 size={17} /> {t('nav.wizard')}
              </Link>
              <Link
                to="/documents"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                  color: isActive('/documents') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                  backgroundColor: isActive('/documents') ? 'var(--color-forest-surface)' : 'transparent',
                  textDecoration: 'none'
                }}
              >
                <FileText size={17} /> {t('nav.documents')}
              </Link>
              <Link
                to="/directory"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                  color: isActive('/directory') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                  backgroundColor: isActive('/directory') ? 'var(--color-forest-surface)' : 'transparent',
                  textDecoration: 'none'
                }}
              >
                <MapPin size={17} /> {t('nav.directory')}
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      color: isActive('/dashboard') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                      backgroundColor: isActive('/dashboard') ? 'var(--color-forest-surface)' : 'transparent',
                      textDecoration: 'none'
                    }}
                  >
                    <LayoutDashboard size={17} /> {t('nav.dashboard')}
                  </Link>
                  <Link
                    to="/vault"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      color: isActive('/vault') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                      backgroundColor: isActive('/vault') ? 'var(--color-forest-surface)' : 'transparent',
                      textDecoration: 'none'
                    }}
                  >
                    <Lock size={17} /> {t('nav.vault')}
                  </Link>
                  <Link
                    to="/applications"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-xs)',
                      color: isActive('/applications') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                      backgroundColor: isActive('/applications') ? 'var(--color-forest-surface)' : 'transparent',
                      textDecoration: 'none'
                    }}
                  >
                    <FileCheck2 size={17} /> {t('nav.applications')}
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    padding: '0.4rem 0.5rem',
                    borderRadius: 'var(--radius-xs)',
                    color: '#991B1B',
                    backgroundColor: '#FEE2E2',
                    textDecoration: 'none'
                  }}
                >
                  <ShieldAlert size={17} /> {t('nav.admin')}
                </Link>
              )}

              {!isAuthenticated && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-sm" style={{ flex: 1, borderRadius: '9999px' }}>
                    <LogIn size={14} />
                    <span>{t('nav.login')}</span>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm" style={{ flex: 1, borderRadius: '9999px' }}>
                    <span>{t('nav.register')}</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .desktop-nav { display: none !important; }
          .mobile-nav-toggle { display: block !important; }
        }
        @media (max-width: 640px) {
          .nav-auth-buttons { display: none !important; }
          .brand-subtitle { display: none !important; }
          .nav-capsule-container { padding: 0.3rem 0.5rem !important; }
          .nav-capsule { padding: 0.25rem 0.6rem !important; }
          .nav-disclaimer-banner { padding: 0.35rem 0.5rem !important; font-size: 0.68rem !important; }
        }
      `}</style>
    </header>
  );
};