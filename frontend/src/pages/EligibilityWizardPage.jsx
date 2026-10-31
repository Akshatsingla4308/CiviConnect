import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Scale,
  MapPin,
  Users,
  GraduationCap,
  Banknote,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const EligibilityWizardPage = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetSchemeId = searchParams.get('scheme');

  const [step, setStep] = useState(1);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [evaluating, setEvaluating] = useState(false);

  const [profile, setProfile] = useState({
    state: 'Punjab',
    district: 'Amritsar',
    age: 21,
    gender: 'Male',
    social_category: 'SC',
    occupation: 'Student',
    education_level: 'Undergraduate',
    course: 'BTech CSE',
    annual_household_income: 150000,
    owns_cultivable_land: false,
    is_taxpayer: false,
    is_bpl: false,
    disability_status: 'none'
  });

  // Pre-fill profile if user has profile data
  useEffect(() => {
    if (user?.profile) {
      setProfile((prev) => ({
        ...prev,
        ...user.profile
      }));
    }
  }, [user]);

  // Load states taxonomy
  useEffect(() => {
    api.system.getStates()
      .then((data) => {
        setStates(data);
        const pb = data.find((s) => s.name === 'Punjab');
        if (pb) setDistricts(pb.districts);
      })
      .catch((err) => console.log('State taxonomy load error:', err));
  }, []);

  const handleStateChange = (selectedState) => {
    const sObj = states.find((s) => s.name === selectedState);
    const dList = sObj ? sObj.districts : [];
    setDistricts(dList);
    setProfile((prev) => ({
      ...prev,
      state: selectedState,
      district: dList[0] || ''
    }));
  };

  const handleCalculate = async () => {
    setEvaluating(true);
    try {
      if (targetSchemeId) {
        const result = await api.eligibility.checkSingle(targetSchemeId, profile);
        // Navigate to results
        navigate('/eligibility-results', {
          state: {
            isSingle: true,
            singleResult: result,
            profile
          }
        });
      } else {
        const results = await api.eligibility.evaluateAll(profile);
        navigate('/eligibility-results', {
          state: {
            isSingle: false,
            evaluationData: results,
            profile
          }
        });
      }
    } catch (err) {
      addToast(err.message || 'Failed to evaluate eligibility', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="editorial-kicker">Deterministic Rules Engine</div>
          <h1 style={{ fontSize: '2.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.5rem' }}>
            {t('wizard.title')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            {t('wizard.subtitle')}
          </p>
        </div>

        {/* Step Progress Indicators */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          marginBottom: '2.5rem'
        }}>
          {[
            { num: 1, label: t('wizard.step1') },
            { num: 2, label: t('wizard.step2') },
            { num: 3, label: t('wizard.step3') },
            { num: 4, label: t('wizard.step4') },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => setStep(s.num)}
              style={{
                cursor: 'pointer',
                borderTop: step === s.num ? '3px solid var(--color-forest)' : '3px solid var(--color-border)',
                paddingTop: '0.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: step === s.num ? 'var(--color-forest)' : 'var(--color-text-muted)' }}>
                STEP {s.num}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: step === s.num ? 'var(--color-forest-dark)' : 'var(--color-text-secondary)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Wizard Form Surface */}
        <div className="surface-card" style={{ padding: '2.5rem' }}>
          {/* STEP 1: State & Residence */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} color="var(--color-forest)" />
                <span>State & District Domicile</span>
              </h3>

              <div className="form-group">
                <label className="form-label">Permanent State of Residence</label>
                <select
                  className="form-select"
                  value={profile.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                >
                  <option value="Punjab">Punjab</option>
                  {states.filter((s) => s.name !== 'Punjab').map((s) => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <small style={{ color: 'var(--color-text-muted)' }}>
                  State-specific schemes (e.g. Punjab Post-Matric Scholarship, Ashirwad) require verified state residency.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">District</label>
                <select
                  className="form-select"
                  value={profile.district}
                  onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Demographics & Category */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="var(--color-forest)" />
                <span>Age, Gender & Social Category</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Age (in completed years)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={profile.age}
                    min={1}
                    max={110}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Social Reservation Category</label>
                <select
                  className="form-select"
                  value={profile.social_category}
                  onChange={(e) => setProfile({ ...profile, social_category: e.target.value })}
                >
                  <option value="General">General / Unreserved</option>
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                  <option value="OBC">Other Backward Class (OBC / BC)</option>
                  <option value="EWS">Economically Weaker Section (EWS)</option>
                </select>
                <small style={{ color: 'var(--color-text-muted)' }}>
                  Crucial for affirmative action programs, fee reimbursements, and special welfare schemes.
                </small>
              </div>
            </div>
          )}

          {/* STEP 3: Education & Occupation */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={20} color="var(--color-forest)" />
                <span>Occupation & Educational Level</span>
              </h3>

              <div className="form-group">
                <label className="form-label">Primary Occupation</label>
                <select
                  className="form-select"
                  value={profile.occupation}
                  onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                >
                  <option value="Student">Student (Pursuing education)</option>
                  <option value="Farmer">Farmer / Agriculture</option>
                  <option value="Unorganized Worker">Daily Wage / Construction / Unorganized Labor</option>
                  <option value="Street Vendor">Street Vendor / Hawkers</option>
                  <option value="Self-Employed">Self-Employed / Micro Business</option>
                  <option value="Salaried Employee">Salaried / Private Sector</option>
                  <option value="Unemployed">Unemployed / Job Seeker</option>
                  <option value="Homemaker">Homemaker</option>
                  <option value="Retired">Retired / Senior Citizen</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Highest or Ongoing Educational Level</label>
                <select
                  className="form-select"
                  value={profile.education_level}
                  onChange={(e) => setProfile({ ...profile, education_level: e.target.value })}
                >
                  <option value="Below 10th">Below 10th Class</option>
                  <option value="10th Pass">10th Class Passed (Matric)</option>
                  <option value="12th Pass">12th Class Passed (Senior Secondary)</option>
                  <option value="Undergraduate">College / Undergraduate (BTech, BA, BSc, etc.)</option>
                  <option value="Postgraduate">Postgraduate / Professional (MTech, MA, MSc, etc.)</option>
                  <option value="Diploma / ITI">Diploma / ITI / Polytechnic</option>
                </select>
              </div>

              {profile.occupation === 'Student' && (
                <div className="form-group">
                  <label className="form-label">Current Degree / Course (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. BTech Computer Science, BSc Agriculture"
                    value={profile.course || ''}
                    onChange={(e) => setProfile({ ...profile, course: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Income & Property */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Banknote size={20} color="var(--color-forest)" />
                <span>Financial & Landholding Details</span>
              </h3>

              <div className="form-group">
                <label className="form-label">Annual Family / Household Income (in ₹ INR)</label>
                <input
                  type="number"
                  className="form-control"
                  value={profile.annual_household_income}
                  step={10000}
                  onChange={(e) => setProfile({ ...profile, annual_household_income: parseInt(e.target.value) || 0 })}
                />
                <small style={{ color: 'var(--color-text-muted)' }}>
                  As certified on your official Tehsildar Income Certificate. Many scholarships require income ≤ ₹2,50,000.
                </small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={profile.owns_cultivable_land}
                    onChange={(e) => setProfile({ ...profile, owns_cultivable_land: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Family owns cultivable agricultural land registered in Revenue Jamabandi (required for PM-KISAN)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={profile.is_bpl}
                    onChange={(e) => setProfile({ ...profile, is_bpl: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Household holds Below Poverty Line (BPL) / Antyodaya Ration Card</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={profile.is_taxpayer}
                    onChange={(e) => setProfile({ ...profile, is_taxpayer: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Applicant or family filed income tax in the last assessment year</span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border)'
          }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn btn-secondary"
              >
                <ArrowLeft size={16} />
                <span>{t('wizard.back')}</span>
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="btn btn-primary"
              >
                <span>{t('wizard.next')}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCalculate}
                disabled={evaluating}
                className="btn btn-terracotta btn-lg"
              >
                <Scale size={18} />
                <span>{evaluating ? 'Evaluating Rules...' : t('wizard.evaluate')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
