import React, { useState } from 'react';
import { BookOpen, CheckCircle, ExternalLink, Phone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ApplicationGuidesPage = () => {
  const [activeGuide, setActiveGuide] = useState('punjab-scholarship');

  const guides = [
    {
      id: 'punjab-scholarship',
      title: 'Punjab Post-Matric Scholarship for SC/BC Students',
      authority: 'Department of Social Justice, Empowerment & Minorities, Punjab',
      portal: 'https://scholarships.punjab.gov.in',
      helpline: '1800-137-0015',
      steps: [
        'Visit Dr. Ambedkar Scholarship Portal (scholarships.punjab.gov.in) and register using student Aadhaar number.',
        'Complete student profile: enter family annual income (must be <= ₹2,50,000 for SC), caste category, and bank details.',
        'Upload required documents: Aadhaar card, Punjab Domicile certificate, Tehsildar Income Certificate, Caste Certificate, and fee receipt.',
        'Apply for Free-ship Card / Scholarship application for your ongoing degree course (e.g. BTech, BSc).',
        'Submit the downloaded application printout to your college scholarship nodal officer for institutional verification.'
      ]
    },
    {
      id: 'pm-kisan',
      title: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      authority: 'Ministry of Agriculture and Farmers Welfare, Govt of India',
      portal: 'https://pmkisan.gov.in',
      helpline: '155261 / 1800115526',
      steps: [
        'Go to pmkisan.gov.in and click on "Farmers Corner" -> "New Farmer Registration".',
        'Select Rural or Urban Farmer registration, enter your 12-digit Aadhaar number and registered mobile number.',
        'Enter state (e.g. Punjab), district, sub-district, block, and village.',
        'Provide landholding details: Khasra number, Khata number, and upload land Jamabandi / Fard copy.',
        'Complete mandatory e-KYC using OTP or biometric authentication at a local CSC centre.'
      ]
    },
    {
      id: 'ayushman-bharat',
      title: 'Ayushman Bharat PM-JAY Golden Health Card',
      authority: 'National Health Authority (NHA)',
      portal: 'https://beneficiary.nha.gov.in',
      helpline: '14555 / 1800-111-565',
      steps: [
        'Visit the official Beneficiary Portal at beneficiary.nha.gov.in.',
        'Login as "Beneficiary" using your mobile number and authenticate with OTP.',
        'Search beneficiary status by State (Punjab), Sub-scheme (PMJAY / State Sehat Bima), and Ration Card / Aadhaar Number.',
        'If family members are listed, click "e-KYC" to authenticate through Aadhaar OTP or facial recognition.',
        'Download your official Ayushman Card for ₹5,00,000/year cashless treatment across empanelled hospitals.'
      ]
    },
    {
      id: 'punjab-ashirwad',
      title: 'Punjab Ashirwad Scheme (Shagun Scheme ₹51,000)',
      authority: 'Department of Social Justice & Empowerment, Govt of Punjab',
      portal: 'https://edistrict.punjab.gov.in',
      helpline: '1800-137-0015',
      steps: [
        'Application must be submitted either 30 days before or within 30 days of the daughter\'s marriage.',
        'Obtain an application form from District Social Justice and Empowerment Office or visit edistrict.punjab.gov.in.',
        'Attach Punjab residence proof, bride age proof (18+), caste certificate (SC/BC), and income certificate (family income <= ₹32,790/year).',
        'Submit via nearest Sewa Kendra or online citizen portal.',
        'The ₹51,000 grant is credited directly into the bride\'s bank account via DBT.'
      ]
    }
  ];

  const current = guides.find((g) => g.id === activeGuide) || guides[0];

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="editorial-kicker">Step-by-Step Procedure Guides</div>
          <h1 style={{ fontSize: '2.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
            Application Guides & Portals
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '750px' }}>
            Plain-language walkthroughs of government application portals, registration requirements, and procedural steps.
          </p>
        </div>

        {/* Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }} className="guides-layout">
          {/* Guide Selector */}
          <div className="surface-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {guides.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGuide(g.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: activeGuide === g.id ? '1px solid var(--color-forest)' : '1px solid transparent',
                  backgroundColor: activeGuide === g.id ? 'var(--color-forest-surface)' : 'transparent',
                  color: activeGuide === g.id ? 'var(--color-forest-dark)' : 'var(--color-text-main)',
                  fontWeight: activeGuide === g.id ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  lineHeight: 1.4
                }}
              >
                {g.title}
              </button>
            ))}
          </div>

          {/* Guide Body */}
          <div className="surface-card" style={{ padding: '2rem' }}>
            <div className="editorial-kicker">{current.authority}</div>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--color-forest-dark)', marginBottom: '1rem' }}>
              {current.title}
            </h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <a
                href={current.portal}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                <span>Visit Official Portal</span>
                <ExternalLink size={14} />
              </a>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', padding: '0.4rem 0.75rem', backgroundColor: 'var(--color-ivory-warm)', borderRadius: 'var(--radius-sm)' }}>
                <Phone size={14} color="var(--color-forest)" />
                <span>Helpline: {current.helpline}</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', marginBottom: '1rem' }}>
              Sequential Application Steps:
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {current.steps.map((st, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-forest)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    {st}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem' }}>
              <Link to="/wizard" className="btn btn-outline btn-sm">
                <span>Check Eligibility First</span>
              </Link>
              <Link to="/documents" className="btn btn-secondary btn-sm">
                <span>Check Required Certificates</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 850px) {
          .guides-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
