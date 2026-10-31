import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, Landmark, Compass, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SchemeCard } from '../components/SchemeCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { api } from '../api/client';

export const ExploreSchemesPage = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [schemes, setSchemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || 'all';
  const currentState = searchParams.get('state') || 'all';
  const currentLevel = searchParams.get('level') || 'all';
  const currentVerification = searchParams.get('verification') || 'all';

  // Load initial filter taxonomy
  useEffect(() => {
    Promise.all([
      api.schemes.getCategories(),
      api.system.getStates()
    ]).then(([catData, stateData]) => {
      setCategories(catData.categories || []);
      setStates(stateData || []);
    }).catch(err => console.log('Taxonomy load error:', err));
  }, []);

  // Fetch schemes whenever filters change
  useEffect(() => {
    setLoading(true);
    const params = {
      search: currentSearch,
      category: currentCategory !== 'all' ? currentCategory : undefined,
      state: currentState !== 'all' ? currentState : undefined,
      level: currentLevel !== 'all' ? currentLevel : undefined,
      verification_status: currentVerification !== 'all' ? currentVerification : undefined,
      limit: 100
    };

    api.schemes.list(params)
      .then((data) => {
        setSchemes(data.items || []);
      })
      .catch((err) => console.log('Schemes list error:', err))
      .finally(() => setLoading(false));
  }, [currentSearch, currentCategory, currentState, currentLevel, currentVerification]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="editorial-kicker">Scheme Knowledge Base</div>
          <h1 style={{ fontSize: '2.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
            {t('schemes.title')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '750px' }}>
            {t('schemes.subtitle')}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="surface-card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
            gap: '1rem',
            alignItems: 'center'
          }} className="filters-grid">
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder={t('schemes.searchPlaceholder')}
                value={currentSearch}
                onChange={(e) => updateFilter('search', e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                aria-label="Filter by Category"
                className="form-select"
                value={currentCategory}
                onChange={(e) => updateFilter('category', e.target.value)}
              >
                <option value="all">{t('schemes.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div>
              <select
                aria-label="Filter by State"
                className="form-select"
                value={currentState}
                onChange={(e) => updateFilter('state', e.target.value)}
              >
                <option value="all">{t('schemes.allStates')}</option>
                <option value="Punjab">Punjab</option>
                {states.filter(s => s.name !== 'Punjab').map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <select
                aria-label="Filter by Level"
                className="form-select"
                value={currentLevel}
                onChange={(e) => updateFilter('level', e.target.value)}
              >
                <option value="all">{t('schemes.allLevels')}</option>
                <option value="central">{t('schemes.central')}</option>
                <option value="state">{t('schemes.state')}</option>
              </select>
            </div>

            {/* Reset Button */}
            <div>
              <button
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm"
                title="Reset all filters"
                style={{ height: '38px', padding: '0 0.75rem' }}
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Info Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)'
        }}>
          <div>
            Showing <strong>{schemes.length}</strong> verified public welfare scheme(s)
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-verified">
              Official .gov.in Gazette Verified
            </span>
          </div>
        </div>

        {/* Schemes Grid */}
        {loading ? (
          <LoadingSkeleton count={6} height="260px" />
        ) : schemes.length > 0 ? (
          <div className="grid-2">
            {schemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        ) : (
          <div className="surface-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <AlertCircle size={40} color="var(--color-terracotta)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-forest-dark)' }}>
              {t('schemes.noResults')}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
              Try broadening your search term or resetting the state/category filters.
            </p>
            <button onClick={handleResetFilters} className="btn btn-primary">
              <RotateCcw size={15} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .filters-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .filters-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
