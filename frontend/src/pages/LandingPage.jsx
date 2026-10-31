import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Compass,
  Sparkles,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldCheck,
  Landmark,
  Scale,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SchemeCard } from '../components/SchemeCard';
import { api } from '../api/client';

export const LandingPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [totalSchemes, setTotalSchemes] = useState(52);
  const [totalDocs, setTotalDocs] = useState(39);
  const [totalStates, setTotalStates] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch real system summary metrics
    api.system.getHealth()
      .then((health) => {
        if (health?.data_summary) {
          setTotalSchemes(health.data_summary.total_schemes || 52);
          setTotalDocs(health.data_summary.canonical_documents || 39);
        }
      })
      .catch(() => {});

    // 2. Fetch states count
    api.system.getStates()
      .then((states) => {
        if (Array.isArray(states) && states.length > 0) {
          setTotalStates(states.length);
        }
      })
      .catch(() => {});

    // 3. Fetch top featured schemes
    api.schemes.list({ limit: 4 })
      .then((data) => {
        setFeaturedSchemes(data.items || []);
        if (data.total) setTotalSchemes(data.total);
      })
      .catch((err) => console.log('Featured schemes load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/schemes?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/schemes');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        backgroundColor: 'var(--color-ivory)',
        borderBottom: '1px solid var(--color-border)',
        paddingTop: '3.5rem',
        paddingBottom: '3.5rem',
        position: 'relative'
      }}>
        <div className="container">
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            <div className="editorial-kicker">
              {t('hero.badge')}
            </div>

            <h1 style={{
              fontSize: '2.65rem',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: '1.25rem',
              color: 'var(--color-forest-dark)',
              letterSpacing: '-0.02em'
            }}>
              {t('hero.title')}
            </h1>

            <p style={{
              fontSize: '1.1rem',
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              marginBottom: '2rem',
              maxWidth: '720px',
              margin: '0 auto 2rem auto'
            }}>
              {t('hero.subtitle')}
            </p>

            {/* Prominent Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--color-ivory-surface)',
                border: '2px solid var(--color-forest)',
                borderRadius: 'var(--radius-md)',
                padding: '0.4rem 0.5rem 0.4rem 1rem',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '1.25rem',
                gap: '0.5rem'
              }}
            >
              <Search size={20} color="var(--color-forest)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder={t('schemes.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-main)',
                  backgroundColor: 'transparent'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.625rem 1.5rem', whiteSpace: 'nowrap' }}>
                <span>Search Schemes</span>
              </button>
            </form>

            {/* Quick Category Tag Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              fontSize: '0.825rem',
              color: 'var(--color-text-muted)'
            }}>
              <span style={{ fontWeight: 600 }}>Quick topics:</span>
              <Link to="/schemes?category=education" className="badge" style={{ backgroundColor: 'var(--color-ivory-surface)', border: '1px solid var(--color-border-strong)', textTransform: 'none', cursor: 'pointer' }}>
                🎓 Scholarships
              </Link>
              <Link to="/schemes?category=agriculture" className="badge" style={{ backgroundColor: 'var(--color-ivory-surface)', border: '1px solid var(--color-border-strong)', textTransform: 'none', cursor: 'pointer' }}>
                🌾 Farmers (PM-KISAN)
              </Link>
              <Link to="/schemes?category=health" className="badge" style={{ backgroundColor: 'var(--color-ivory-surface)', border: '1px solid var(--color-border-strong)', textTransform: 'none', cursor: 'pointer' }}>
                🏥 Ayushman Bharat
              </Link>
              <Link to="/schemes?state=Punjab" className="badge" style={{ backgroundColor: 'var(--color-ivory-surface)', border: '1px solid var(--color-border-strong)', textTransform: 'none', cursor: 'pointer' }}>
                🏛️ Punjab State Schemes
              </Link>
              <Link to="/schemes?category=social_security" className="badge" style={{ backgroundColor: 'var(--color-ivory-surface)', border: '1px solid var(--color-border-strong)', textTransform: 'none', cursor: 'pointer' }}>
                🛡️ Pensions & Social Security
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Real Live Database Authority Metrics */}
      <section style={{
        backgroundColor: 'var(--color-forest-dark)',
        color: '#FFFFFF',
        padding: '2rem 0'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5rem',
            textAlign: 'center'
          }} className="stat-grid">
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', fontWeight: 700, color: '#FCD34D' }}>
                {totalSchemes}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                Verified Welfare Schemes
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', fontWeight: 700, color: '#FCD34D' }}>
                {totalDocs}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                Canonical Identity Documents
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', fontWeight: 700, color: '#FCD34D' }}>
                {totalStates}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                States & Union Territories
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', fontWeight: 700, color: '#FCD34D' }}>
                100%
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                Official .gov.in Gazette Citations
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
          }
        `}</style>
      </section>

      {/* Citizen Guidance Pathways (Four Key Services) */}
      <section style={{ padding: '3.5rem 0', backgroundColor: 'var(--color-ivory-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem auto' }}>
            <div className="editorial-kicker">Citizen Navigation Services</div>
            <h2 style={{ fontSize: '1.85rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
              How CiviConnect Helps You
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              Direct access to public welfare programs without middleman fees or complicated terminology.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem'
          }}>
            {/* Service 1 */}
            <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-forest-surface)',
                  color: 'var(--color-forest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Compass size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: 'var(--color-forest-dark)' }}>
                  Scheme Explorer
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Search 52 verified Central and Punjab State schemes categorized by target group, sector, and jurisdiction.
                </p>
              </div>
              <Link to="/schemes" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-terracotta)', fontSize: '0.875rem' }}>
                <span>Explore Directory</span> <ArrowRight size={14} />
              </Link>
            </div>

            {/* Service 2 */}
            <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-terracotta-surface)',
                  color: 'var(--color-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Scale size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: 'var(--color-forest-dark)' }}>
                  Eligibility Wizard
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Evaluate your age, category, income, and state with 93 mathematical rules to see exactly what you qualify for.
                </p>
              </div>
              <Link to="/wizard" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-terracotta)', fontSize: '0.875rem' }}>
                <span>Launch Wizard</span> <ArrowRight size={14} />
              </Link>
            </div>

            {/* Service 3 */}
            <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-saffron-surface)',
                  color: 'var(--color-saffron-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <FileText size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: 'var(--color-forest-dark)' }}>
                  Document Centre
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  View preparation guidelines, official issuing portals, and required paperwork before visiting a Sewa Kendra.
                </p>
              </div>
              <Link to="/documents" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-terracotta)', fontSize: '0.875rem' }}>
                <span>Browse Documents</span> <ArrowRight size={14} />
              </Link>
            </div>

            {/* Service 4 */}
            <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-forest-surface)',
                  color: 'var(--color-forest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Sparkles size={22} color="var(--color-terracotta)" />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: 'var(--color-forest-dark)' }}>
                  AI Public Navigator
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Ask questions in English, Hindi, or Punjabi. Get grounded answers citing official portal URLs and benefits.
                </p>
              </div>
              <Link to="/assistant" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-terracotta)', fontSize: '0.875rem' }}>
                <span>Ask Navigator</span> <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Schemes Showcase */}
      <section style={{ padding: '3.5rem 0', backgroundColor: 'var(--color-ivory)' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div className="editorial-kicker">Verified Knowledge Base</div>
              <h2 style={{ fontSize: '1.85rem', color: 'var(--color-forest-dark)', margin: 0 }}>
                Featured Government Welfare Schemes
              </h2>
            </div>
            <Link to="/schemes" className="btn btn-outline btn-sm">
              <span>View All {totalSchemes} Schemes</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid-2">
            {featuredSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        </div>
      </section>

      {/* Direct Call to Action Banner */}
      <section style={{
        backgroundColor: 'var(--color-forest)',
        color: '#FFFFFF',
        padding: '3.5rem 0',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '720px' }}>
          <h2 style={{ color: '#FFFFFF', fontSize: '2rem', marginBottom: '0.85rem' }}>
            Check Your Eligibility in Less Than Two Minutes
          </h2>
          <p style={{ color: '#E2E8F0', fontSize: '1rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            No document uploads required. Our deterministic rules engine checks your age, income, and state to show exactly what you qualify for.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <Link to="/wizard" className="btn btn-terracotta btn-lg" style={{ borderRadius: '9999px' }}>
              <CheckCircle2 size={18} />
              <span>Launch Eligibility Wizard</span>
            </Link>
            <Link to="/assistant" className="btn btn-secondary btn-lg" style={{ borderRadius: '9999px' }}>
              <Sparkles size={18} />
              <span>Ask AI Navigator</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};