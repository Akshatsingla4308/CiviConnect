import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ExploreSchemesPage } from './pages/ExploreSchemesPage';
import { SchemeDetailsPage } from './pages/SchemeDetailsPage';
import { AssistantPage } from './pages/AssistantPage';
import { EligibilityWizardPage } from './pages/EligibilityWizardPage';
import { EligibilityResultsPage } from './pages/EligibilityResultsPage';
import { DocumentCentrePage } from './pages/DocumentCentrePage';
import { ChecklistsPage } from './pages/ChecklistsPage';
import { StateDirectoryPage } from './pages/StateDirectoryPage';
import { ApplicationGuidesPage } from './pages/ApplicationGuidesPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { DocumentVaultPage } from './pages/DocumentVaultPage';
import { ApplicationTrackerPage } from './pages/ApplicationTrackerPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AboutPage } from './pages/AboutPage';
import { HelpPage } from './pages/HelpPage';
import { PrivacyPage } from './pages/PrivacyPage';

export function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/schemes" element={<ExploreSchemesPage />} />
                  <Route path="/schemes/:id" element={<SchemeDetailsPage />} />
                  <Route path="/assistant" element={<AssistantPage />} />
                  <Route path="/wizard" element={<EligibilityWizardPage />} />
                  <Route path="/eligibility-results" element={<EligibilityResultsPage />} />
                  <Route path="/documents" element={<DocumentCentrePage />} />
                  <Route path="/checklists" element={<ChecklistsPage />} />
                  <Route path="/checklists/:schemeId" element={<ChecklistsPage />} />
                  <Route path="/directory" element={<StateDirectoryPage />} />
                  <Route path="/guides" element={<ApplicationGuidesPage />} />
                  <Route path="/dashboard" element={<UserDashboardPage />} />
                  <Route path="/vault" element={<DocumentVaultPage />} />
                  <Route path="/applications" element={<ApplicationTrackerPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<SignupPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
