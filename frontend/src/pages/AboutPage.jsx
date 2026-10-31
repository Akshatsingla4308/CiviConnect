import React from 'react';
import { Landmark, ShieldCheck, Scale, Globe, FileText, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage = () => {
  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="editorial-kicker">Public Service Mission</div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)', marginBottom: '1rem' }}>
            About CiviConnect
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            CiviConnect is an independent, multilingual public-service information and government scheme navigation initiative designed to make welfare access transparent, verifiable, and understandable for every citizen of India.
          </p>
        </div>

        <div className="surface-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--color-forest-dark)', marginBottom: '1rem' }}>
            Our Non-Impersonation & Independence Principles
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            <p>
              1. <strong>Independent Informational Status:</strong> CiviConnect is not affiliated with, operated by, or endorsed by the Government of India or any State Government. We are an independent civic technology platform.
            </p>
            <p>
              2. <strong>No Application Intermediary:</strong> CiviConnect never promises approval, never charges citizens for welfare information, and never submits formal applications on behalf of citizens. All applications must be submitted directly through authorized government portals.
            </p>
            <p>
              3. <strong>Zero Privacy Invasion:</strong> We never collect Aadhaar numbers, biometric scans, bank passwords, or sensitive identity proofs. All eligibility assessments are computed on voluntary demographic criteria.
            </p>
          </div>
        </div>

        <div className="surface-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--color-forest-dark)', marginBottom: '1rem' }}>
            Data Verification Standards
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
            Every scheme in our knowledge base is extracted directly from published gazette notifications, ministry portals ending in <code>.gov.in</code> or <code>.nic.in</code>, and official state guidelines.
          </p>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Criteria are encoded as mathematical relational rules rather than arbitrary text descriptions.</li>
            <li>Document requirements are categorized by mandatory and conditional rules.</li>
            <li>Direct citations to gazettes and helplines are provided on each scheme page.</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/schemes" className="btn btn-primary btn-lg">
            <span>Explore Verified Schemes</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
