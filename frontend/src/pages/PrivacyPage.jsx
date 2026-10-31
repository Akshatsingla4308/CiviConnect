import React from 'react';
import { ShieldCheck, Lock, EyeOff } from 'lucide-react';

export const PrivacyPage = () => {
  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="editorial-kicker">Data Protection & Citizen Rights</div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            Last revised: October 31, 2026. Designed in strict compliance with public interest principles.
          </p>
        </div>

        <div className="surface-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
              1. Non-Collection of Sensitive Identifiers
            </h3>
            <p>
              CiviConnect explicitly refrains from collecting, storing, or processing sensitive Indian national identity identifiers. We do not accept or solicit Aadhaar numbers, biometric data, PAN copies, bank passwords, or debit/credit card information.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
              2. Voluntary Demographic Data
            </h3>
            <p>
              Any demographic parameters (such as state, district, age bracket, education level, or broad income range) entered into the Eligibility Wizard or stored in your user profile are strictly used to evaluate qualification rules and personalize your experience. This data is never sold, shared with advertising networks, or transferred to third parties.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
              3. Independent Operation & Official Portal Handoff
            </h3>
            <p>
              When navigating to official government schemes, links connect you directly to authentic official endpoints (e.g. <code>.gov.in</code> or <code>.nic.in</code> domains). Your interactions on official government domains are governed by the respective ministry's terms of service and privacy policies.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
              4. Data Deletion
            </h3>
            <p>
              Registered users may request complete deletion of their account, saved schemes, and document checklists at any time from their profile settings or by contacting administration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
