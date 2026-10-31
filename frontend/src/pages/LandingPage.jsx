import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Compass,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  Landmark,
  Scale,
  Users,
  Building
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SchemeCard } from '../components/SchemeCard';
import { api } from '../api/client';

export const LandingPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [totalSchemes, setTotalSchemes] = useState(52);
  const [totalDocs, setTotalDocs] = useState(39);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.schemes.list({ limit: 4 })
      .then((data) => {
        setFeaturedSchemes(data.items || []);
        if (data.total) setTotalSchemes(data.total);
      })
      .catch((err) => console.log('Featured schemes load error:', err))
      .finally(() => setLoading(false));

    api.documents.list()
      .then((data) => {
        if (data.total) setTotalDocs(data.total);
        else if (data.items) setTotalDocs(data.items.length);
      })
      .catch(() => {});
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
        paddingBottom: '4rem',
        position: 'relative'
      }}>
        <div className="container">
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            <div className="editorial-kicker">
              {t('hero.badge')}
            </div>

            <h1 style={{
              fontSize: '2.75rem',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: '1.25rem',
              color: 'var(--color-forest-dark)',
              letterSpacing: '-0.02em'
            }}>
              {t('hero.title')}
            </h1>

            <p style={{
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              marginBottom: '2rem'
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
                marginBottom: '1.5rem',
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
              <button type="submit" className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}>
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
              <span>Quick filters:</span>
              <Link to="/schemes?category=education" className="badge" style={{ backgroundColor: 'var(--color-ivory-surface)', border: '1px solid var(--color-border-strong)', textTransform: 'none', cursor: 'pointer' }}>
                🎓 Scholarships
              </Link>
              <Link to="/schemes?category=agriculture" className="badge" style={{ backgroundColor: 'var(--color-ivory-surface)', border: '1px solid var(--color-border-strong)', textTransform: 'none', cursor: 'pointer' }}>
                🌾 Farmers & Agriculture
              </Link>
              <Link to="/schemes?state=Punjab" className="badge" style={{ backgroundColor: 'var(--color-ivory-surface)', border: '1px solid var(--color-border-strong)', textTransform: 'none', cursor: 'pointer' }}>
                🏛️ Punjab State Schemes
              </Link>
              <Link to="/schemes?category=social_security" className="badge" style={{ backgroundColor: 'var(--color-ivory-surface)', border: '1px solid var(--color-border-strong)', textTransform: 'none', cursor: 'pointer' }}>
                🛡️ Social Security & Pension
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Authority Proof Grid */}
      <section style={{
        backgroundColor: 'var(--color-forest-dark)',
        color: '#FFFFFF',
        padding: '2.5rem 0'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '2rem',
            textAlign: 'center'
          }} className="stat-grid">
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 700, color: '#FCD34D' }}>
                {totalSchemes}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                Verified Welfare Schemes
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 700, color: '#FCD34D' }}>
                100%
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                Deterministic Rule Logic
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 700, color: '#FCD34D' }}>
                {totalDocs}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                Canonical Identity & Welfare Docs
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 700, color: '#FCD34D' }}>
                3
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                Languages (English, Hindi, Punjabi)
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </section>

      {/* Three Pillars Section */}
      <section style={{ padding: '4.5rem 0', backgroundColor: 'var(--color-ivory-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
            <div className="editorial-kicker">Core System Architecture</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--color-forest-dark)', marginBottom: '0.75rem' }}>
              Engineered for Authenticity and Accuracy
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
              We eliminate guesswork with structured relational rules and grounded AI.
            </p>
          </div>

          <div className="grid-3">
            {/* Pillar 1 */}
            <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-forest-surface)',
                  color: 'var(--color-forest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <Scale size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-forest-dark)' }}>
                  Deterministic Eligibility
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Our rule engine evaluates your state, age, caste, and income using strict mathematical logic. Never relies on generative hallucinations for legal qualification conditions.
                </p>
              </div>
              <Link to="/wizard" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-terracotta)' }}>
                <span>Try the Wizard</span> <ArrowRight size={15} />
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-terracotta-surface)',
                  color: 'var(--color-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <Sparkles size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-forest-dark)' }}>
                  Grounded Multilingual AI
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Ask questions in English, Hindi, or Gurmukhi Punjabi. Responses cite official `.gov.in` gazettes and include direct links to official application portals.
                </p>
              </div>
              <Link to="/assistant" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-terracotta)' }}>
                <span>Chat with AI</span> <ArrowRight size={15} />
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-saffron-surface)',
                  color: 'var(--color-saffron-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <FileCheck2 size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-forest-dark)' }}>
                  Interactive Checklists
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Prepare your paperwork with confidence. Build personalized document checklists for each scheme, check off ready items, and track your readiness percentage.
                </p>
              </div>
              <Link to="/documents" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-terracotta)' }}>
                <span>Explore Documents</span> <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Schemes Showcase */}
      <section style={{ padding: '4.5rem 0', backgroundColor: 'var(--color-ivory)' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div className="editorial-kicker">Verified Knowledge Base</div>
              <h2 style={{ fontSize: '2rem', color: 'var(--color-forest-dark)' }}>
                Featured Government Welfare Schemes
              </h2>
            </div>
            <Link to="/schemes" className="btn btn-outline">
              <span>View All {totalSchemes} Schemes</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid-2">
            {featuredSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        </div>
      </section>

      {/* Direct Call to Action */}
      <section style={{
        backgroundColor: 'var(--color-forest)',
        color: '#FFFFFF',
        padding: '4rem 0',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '700px' }}>
          <h2 style={{ color: '#FFFFFF', fontSize: '2.25rem', marginBottom: '1rem' }}>
            Check Your Eligibility in Less Than Two Minutes
          </h2>
          <p style={{ color: '#E2E8F0', fontSize: '1.05rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            No document uploads required. Our deterministic rules engine instantly shows which schemes you qualify for and what paperwork you need.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/wizard" className="btn btn-terracotta btn-lg">
              <CheckCircle2 size={18} />
              <span>Launch Eligibility Wizard</span>
            </Link>
            <Link to="/assistant" className="btn btn-secondary btn-lg">
              <Sparkles size={18} />
              <span>Ask AI Navigator</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
