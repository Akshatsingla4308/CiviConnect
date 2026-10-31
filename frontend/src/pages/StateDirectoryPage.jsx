import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Compass, Landmark, ExternalLink, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';

export const StateDirectoryPage = () => {
  const { t } = useLanguage();
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.system.getStates()
      .then((data) => {
        setStates(data);
        const pb = data.find((s) => s.name === 'Punjab') || data[0];
        setSelectedState(pb);
      })
      .catch((err) => console.log('States load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredStates = states.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.districts && s.districts.some(d => d.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="editorial-kicker">Geographic & State Governance Directory</div>
          <h1 style={{ fontSize: '2.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
            State & District Directory
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '750px' }}>
            Explore state-level welfare delivery portals, administrative districts, and schemes tailored to residents of Indian states and Union Territories.
          </p>
        </div>

        {/* Search */}
        <div className="surface-card" style={{ marginBottom: '2rem', padding: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by state name or district (e.g. Amritsar, Ludhiana, Delhi)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        {/* Two-column layout: States list on left, District details on right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }} className="state-layout">
          {/* State List */}
          <div className="surface-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
            {filteredStates.map((s) => (
              <button
                key={s.code}
                onClick={() => setSelectedState(s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedState?.code === s.code ? '1px solid var(--color-forest)' : '1px solid transparent',
                  backgroundColor: selectedState?.code === s.code ? 'var(--color-forest-surface)' : 'transparent',
                  color: selectedState?.code === s.code ? 'var(--color-forest-dark)' : 'var(--color-text-main)',
                  fontWeight: selectedState?.code === s.code ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.95rem' }}>{s.name}</div>
                  {s.name_pa && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.name_pa} • {s.name_hi}</div>}
                </div>
                <span className={`badge ${s.is_ut ? 'badge-central' : 'badge-state'}`} style={{ fontSize: '0.65rem' }}>
                  {s.is_ut ? 'UT' : 'State'}
                </span>
              </button>
            ))}
          </div>

          {/* District Breakdown & Applicable Schemes */}
          {selectedState ? (
            <div className="surface-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div className="editorial-kicker">Administrative Jurisdiction</div>
                  <h2 style={{ fontSize: '1.75rem', color: 'var(--color-forest-dark)' }}>
                    {selectedState.name}
                  </h2>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Code: <strong>{selectedState.code}</strong> • {selectedState.districts?.length || 0} Administrative Districts
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to={`/schemes?state=${encodeURIComponent(selectedState.name)}`}
                    className="btn btn-primary btn-sm"
                  >
                    <Compass size={14} />
                    <span>View {selectedState.name} Schemes</span>
                  </Link>

                  {selectedState.name === 'Punjab' && (
                    <a
                      href="https://punjab.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <span>Punjab.gov.in</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              {/* Districts Pills */}
              <h4 style={{ fontSize: '1rem', color: 'var(--color-forest-dark)', marginBottom: '0.75rem' }}>
                Districts Covered:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                {selectedState.districts && selectedState.districts.map((dist, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.4rem 0.75rem',
                      backgroundColor: 'var(--color-ivory-warm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    📍 {dist}
                  </span>
                ))}
              </div>

              {/* Portal Links & Guidance */}
              <div style={{ backgroundColor: 'var(--color-forest-surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-forest-border)' }}>
                <h4 style={{ color: 'var(--color-forest-dark)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                  Citizen Services in {selectedState.name}:
                </h4>
                <p style={{ color: 'var(--color-forest-dark)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  Residents of {selectedState.name} can obtain Domicile, Caste, and Income Certificates through authorized District eDistrict portals or offline Sewa Kendras / Suwidha Centres.
                </p>
              </div>
            </div>
          ) : (
            <div className="surface-card" style={{ padding: '3rem', textAlign: 'center' }}>
              Select a state to inspect administrative districts and government portals.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 850px) {
          .state-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
