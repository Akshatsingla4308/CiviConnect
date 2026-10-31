import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  FileText,
  MapPin,
  LayoutDashboard,
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
      backgroundColor: 'var(--color-ivory-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Top Advisory Pill Banner */}
      <div style={{
        backgroundColor: 'var(--color-forest-dark)',
        color: '#E2E8F0',
        fontSize: '0.75rem',
        padding: '0.35rem 1rem',
        textAlign: 'center',
        fontWeight: 500,
        letterSpacing: '0.02em',
      }}>
        <span>🇮🇳 {t('hero.disclaimer')}</span>
      </div>

      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-forest)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-emblem)',
            fontWeight: 700,
            fontSize: '1.15rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            CC
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.25rem',
              color: 'var(--color-forest-dark)',
              lineHeight: 1.1
            }}>
              CiviConnect
            </div>
            <div style={{
              fontSize: '0.68rem',
              color: 'var(--color-terracotta)',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Public Service Navigator
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem'
        }} className="desktop-nav">
          <Link
            to="/schemes"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isActive('/schemes') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
              borderBottom: isActive('/schemes') ? '2px solid var(--color-terracotta)' : '2px solid transparent',
              paddingBottom: '0.25rem'
            }}
          >
            <Compass size={16} />
            <span>{t('nav.explore')}</span>
          </Link>

          <Link
            to="/assistant"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isActive('/assistant') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
              borderBottom: isActive('/assistant') ? '2px solid var(--color-terracotta)' : '2px solid transparent',
              paddingBottom: '0.25rem'
            }}
          >
            <Sparkles size={16} color="var(--color-terracotta)" />
            <span>{t('nav.assistant')}</span>
          </Link>

          <Link
            to="/wizard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isActive('/wizard') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
              borderBottom: isActive('/wizard') ? '2px solid var(--color-terracotta)' : '2px solid transparent',
              paddingBottom: '0.25rem'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{t('nav.wizard')}</span>
          </Link>

          <Link
            to="/documents"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isActive('/documents') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
              borderBottom: isActive('/documents') ? '2px solid var(--color-terracotta)' : '2px solid transparent',
              paddingBottom: '0.25rem'
            }}
          >
            <FileText size={16} />
            <span>{t('nav.documents')}</span>
          </Link>

          <Link
            to="/directory"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isActive('/directory') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
              borderBottom: isActive('/directory') ? '2px solid var(--color-terracotta)' : '2px solid transparent',
              paddingBottom: '0.25rem'
            }}
          >
            <MapPin size={16} />
            <span>{t('nav.directory')}</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: isActive('/dashboard') ? 'var(--color-terracotta)' : 'var(--color-forest-dark)',
                borderBottom: isActive('/dashboard') ? '2px solid var(--color-terracotta)' : '2px solid transparent',
                paddingBottom: '0.25rem'
              }}
            >
              <LayoutDashboard size={16} />
              <span>{t('nav.dashboard')}</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: isActive('/admin') ? 'var(--color-terracotta)' : '#991B1B',
                borderBottom: isActive('/admin') ? '2px solid var(--color-terracotta)' : '2px solid transparent',
                paddingBottom: '0.25rem'
              }}
            >
              <ShieldAlert size={16} />
              <span>{t('nav.admin')}</span>
            </Link>
          )}
        </nav>

        {/* Right Actions: Language Selector & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Language Selector */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Globe size={15} style={{ marginRight: '0.25rem', color: 'var(--color-forest)' }} />
            <select
              aria-label="Select Interface Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                backgroundColor: 'var(--color-ivory-surface)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-xs)',
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
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

          {/* Auth Action */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  backgroundColor: 'var(--color-forest-surface)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-forest-dark)',
                  textDecoration: 'none'
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
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="nav-auth-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={14} />
                <span>{t('nav.login')}</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
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
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'var(--color-ivory-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <Link to="/schemes" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Compass size={18} /> {t('nav.explore')}
          </Link>
          <Link to="/assistant" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Sparkles size={18} color="var(--color-terracotta)" /> {t('nav.assistant')}
          </Link>
          <Link to="/wizard" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> {t('nav.wizard')}
          </Link>
          <Link to="/documents" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <FileText size={18} /> {t('nav.documents')}
          </Link>
          <Link to="/directory" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <MapPin size={18} /> {t('nav.directory')}
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <LayoutDashboard size={18} /> {t('nav.dashboard')}
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#991B1B' }}>
              <ShieldAlert size={18} /> {t('nav.admin')}
            </Link>
          )}

          {!isAuthenticated && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                <LogIn size={14} />
                <span>{t('nav.login')}</span>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                <span>{t('nav.register')}</span>
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-nav-toggle { display: block !important; }
        }
        @media (max-width: 640px) {
          .nav-auth-buttons { display: none !important; }
        }
      `}</style>
    </header>
  );
};
