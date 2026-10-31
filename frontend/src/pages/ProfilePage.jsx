import React, { useState, useEffect } from 'react';
import { User, Save, MapPin, GraduationCap, Banknote, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    state: 'Punjab',
    district: '',
    age: '',
    gender: '',
    social_category: '',
    occupation: '',
    education_level: '',
    course: '',
    annual_household_income: '',
    owns_cultivable_land: false,
    is_taxpayer: false,
    is_bpl: false,
    preferred_language: 'en'
  });

  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    api.system.getStates()
      .then((data) => {
        setStates(data);
        const pb = data.find(s => s.name === 'Punjab');
        if (pb) setDistricts(pb.districts);
      })
      .catch((err) => console.log('State load error:', err));

    if (user?.profile) {
      setFormData((prev) => ({
        ...prev,
        ...user.profile,
        preferred_language: user.preferred_language || 'en'
      }));
    }
  }, [user]);

  const handleStateChange = (stateName) => {
    const sObj = states.find(s => s.name === stateName);
    const dList = sObj ? sObj.districts : [];
    setDistricts(dList);
    setFormData((prev) => ({
      ...prev,
      state: stateName,
      district: dList[0] || ''
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.user.updateProfile(formData);
      await refreshProfile();
      addToast('Profile demographics updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '750px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="editorial-kicker">Account & Demographics</div>
          <h1 style={{ fontSize: '2.25rem', color: 'var(--color-forest-dark)', marginBottom: '0.25rem' }}>
            Profile Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Updating your demographic details ensures scheme eligibility checks and AI consultations accurately reflect your situation.
          </p>
        </div>

        <form onSubmit={handleSave} className="surface-card" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" disabled className="form-control" value={user?.name || ''} style={{ backgroundColor: '#F1F5F9' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" disabled className="form-control" value={user?.email || ''} style={{ backgroundColor: '#F1F5F9' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">State of Residence</label>
              <select
                className="form-select"
                value={formData.state}
                onChange={(e) => handleStateChange(e.target.value)}
              >
                <option value="Punjab">Punjab</option>
                {states.filter(s => s.name !== 'Punjab').map(s => (
                  <option key={s.code} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">District</label>
              <select
                className="form-select"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              >
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-control"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Social Reservation Category</label>
              <select
                className="form-select"
                value={formData.social_category}
                onChange={(e) => setFormData({ ...formData, social_category: e.target.value })}
              >
                <option value="General">General</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Primary Occupation</label>
              <select
                className="form-select"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              >
                <option value="Student">Student</option>
                <option value="Farmer">Farmer</option>
                <option value="Unorganized Worker">Unorganized Worker</option>
                <option value="Street Vendor">Street Vendor</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Salaried Employee">Salaried Employee</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Retired">Retired / Senior Citizen</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Education Level</label>
              <select
                className="form-select"
                value={formData.education_level}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
              >
                <option value="Below 10th">Below 10th</option>
                <option value="10th Pass">10th Pass</option>
                <option value="12th Pass">12th Pass</option>
                <option value="Undergraduate">Undergraduate / College</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Annual Family Income (₹)</label>
            <input
              type="number"
              step={10000}
              className="form-control"
              value={formData.annual_household_income}
              onChange={(e) => setFormData({ ...formData, annual_household_income: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={formData.owns_cultivable_land}
                onChange={(e) => setFormData({ ...formData, owns_cultivable_land: e.target.checked })}
              />
              <span>Family owns agricultural cultivable land (Jamabandi verified)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={formData.is_bpl}
                onChange={(e) => setFormData({ ...formData, is_bpl: e.target.checked })}
              />
              <span>Holds BPL / Antyodaya Ration Card</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
          >
            <Save size={18} />
            <span>{saving ? 'Saving Changes...' : 'Save Profile Demographics'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
