import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HelpPage = () => {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'How does CiviConnect calculate eligibility?',
      a: 'CiviConnect utilizes a deterministic rule engine running on the backend. When you input your demographic information (such as age, state, social reservation category, and income), the system evaluates structured mathematical operators (like equal, greater than or equal, less than or equal) against verified official criteria. We never use generative AI to guess or invent legal qualification rules.'
    },
    {
      q: 'Does CiviConnect submit my government scheme application?',
      a: 'No. CiviConnect is strictly an informational and preparation navigator. Once you verify your eligibility and prepare your document checklist, we provide direct links to the official government portals (such as scholarships.punjab.gov.in, pmkisan.gov.in, or beneficiary.nha.gov.in) where you submit your formal application.'
    },
    {
      q: 'Do I need to upload my Aadhaar card or identity documents?',
      a: 'No. CiviConnect never asks you to upload confidential identity documents. Our document checklists are for your personal preparation tracking so you know which documents to have ready before visiting an official portal or local Sewa Kendra.'
    },
    {
      q: 'What languages does the AI assistant support?',
      a: 'CiviConnect fully supports English, Hindi (हिंदी), and Punjabi (ਪੰਜਾਬੀ in Gurmukhi as well as romanized input). The assistant cites official schemes directly from our verified knowledge base.'
    },
    {
      q: 'What should I do if a government portal link is down?',
      a: 'Government portals may undergo scheduled maintenance. You can call the official national or state helpline number provided on each scheme details page, or visit your nearest district Sewa Kendra / Common Service Centre (CSC).'
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="editorial-kicker">Citizen Support</div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
            Help & Frequently Asked Questions
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem' }}>
            Find answers regarding scheme eligibility evaluation, document preparation, and platform navigation.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => (
            <div key={idx} className="surface-card" style={{ padding: '1.25rem' }}>
              <button
                onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--color-forest-dark)'
                }}
              >
                <span>{faq.q}</span>
                {openIdx === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {openIdx === idx && (
                <div style={{ marginTop: '0.85rem', color: 'var(--color-text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="surface-card" style={{ marginTop: '3rem', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--color-forest-surface)', borderColor: 'var(--color-forest-border)' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
            Still have questions?
          </h3>
          <p style={{ color: 'var(--color-forest-dark)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Ask our AI Public Service Assistant in your preferred language for instant guidance.
          </p>
          <Link to="/assistant" className="btn btn-primary">
            Ask AI Assistant
          </Link>
        </div>
      </div>
    </div>
  );
};
