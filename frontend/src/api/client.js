import { buildApiUrl, resolveApiBaseUrl } from './config.js';

export { buildApiUrl, resolveApiBaseUrl };

const getAuthHeaders = () => {
  const token = localStorage.getItem('civiconnect_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorDetail = 'Network request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText || `${response.status} Error`;
    }
    const err = new Error(errorDetail);
    err.status = response.status;
    throw err;
  }
  return response.json();
};

export const api = {
  // Auth
  auth: {
    register: (data) =>
      fetch(buildApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),

    login: (credentials) =>
      fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }).then(handleResponse),

    getMe: () =>
      fetch(buildApiUrl('/api/auth/me'), {
        headers: getAuthHeaders(),
      }).then(handleResponse),
  },

  // Schemes
  schemes: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.category) query.append('category', params.category);
      if (params.state) query.append('state', params.state);
      if (params.level) query.append('level', params.level);
      if (params.search) query.append('search', params.search);
      if (params.verification_status) query.append('verification_status', params.verification_status);
      if (params.limit) query.append('limit', params.limit);
      if (params.offset) query.append('offset', params.offset);

      const qs = query.toString();
      const endpoint = qs ? `/api/schemes?${qs}` : '/api/schemes';
      return fetch(buildApiUrl(endpoint)).then(handleResponse);
    },

    getCategories: () =>
      fetch(buildApiUrl('/api/schemes/categories')).then(handleResponse),

    getById: (id) =>
      fetch(buildApiUrl(`/api/schemes/${id}`)).then(handleResponse),
  },

  // Eligibility Engine
  eligibility: {
    checkSingle: (schemeId, profile) =>
      fetch(buildApiUrl('/api/eligibility/check'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ scheme_id: schemeId, profile }),
      }).then(handleResponse),

    evaluateAll: (profile) =>
      fetch(buildApiUrl('/api/eligibility/evaluate-all'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ profile }),
      }).then(handleResponse),
  },

  // Documents
  documents: {
    list: (category = null, search = null) => {
      const query = new URLSearchParams();
      if (category) query.append('category', category);
      if (search) query.append('search', search);
      const qs = query.toString();
      const endpoint = qs ? `/api/documents?${qs}` : '/api/documents';
      return fetch(buildApiUrl(endpoint)).then(handleResponse);
    },

    getById: (id) =>
      fetch(buildApiUrl(`/api/documents/${id}`)).then(handleResponse),
  },

  // Checklists
  checklists: {
    list: () =>
      fetch(buildApiUrl('/api/checklists'), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    getForScheme: (schemeId) =>
      fetch(buildApiUrl(`/api/checklists/${schemeId}`), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    update: (schemeId, items, status = null) =>
      fetch(buildApiUrl(`/api/checklists/${schemeId}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items, status }),
      }).then(handleResponse),
  },

  // User Workspace
  user: {
    getProfile: () =>
      fetch(buildApiUrl('/api/user/profile'), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    updateProfile: (profileData) =>
      fetch(buildApiUrl('/api/user/profile'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      }).then(handleResponse),

    getSavedSchemes: () =>
      fetch(buildApiUrl('/api/user/saved-schemes'), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    saveScheme: (schemeId, notes = '') =>
      fetch(buildApiUrl(`/api/user/saved-schemes/${schemeId}`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes }),
      }).then(handleResponse),

    removeSavedScheme: (schemeId) =>
      fetch(buildApiUrl(`/api/user/saved-schemes/${schemeId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse),

    getAssessments: () =>
      fetch(buildApiUrl('/api/user/assessments'), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    recordAssessment: (data) =>
      fetch(buildApiUrl('/api/user/assessments'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),

    getApplications: () =>
      fetch(buildApiUrl('/api/user/applications'), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    createApplication: (data) =>
      fetch(buildApiUrl('/api/user/applications'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),
  },

  // AI Assistant
  assistant: {
    chat: (message, sessionId = null, language = 'en', userProfile = null) =>
      fetch(buildApiUrl('/api/assistant/chat'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message,
          session_id: sessionId,
          language,
          user_profile: userProfile,
        }),
      }).then(handleResponse),

    getStatus: () =>
      fetch(buildApiUrl('/api/assistant/status')).then(handleResponse),
  },

  // Document Vault
  vault: {
    list: () =>
      fetch(buildApiUrl('/api/vault'), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    upload: (formData) => {
      const token = localStorage.getItem('civiconnect_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return fetch(buildApiUrl('/api/vault/upload'), {
        method: 'POST',
        headers,
        body: formData,
      }).then(handleResponse);
    },

    downloadUrl: (docId) => buildApiUrl(`/api/vault/${docId}/download`),

    downloadBlob: async (docId, fileName) => {
      const token = localStorage.getItem('civiconnect_token');
      const res = await fetch(buildApiUrl(`/api/vault/${docId}/download`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to download document');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },

    delete: (docId) =>
      fetch(buildApiUrl(`/api/vault/${docId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse),
  },

  // Citizen Application Tracker
  applications: {
    list: () =>
      fetch(buildApiUrl('/api/applications'), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    getById: (appId) =>
      fetch(buildApiUrl(`/api/applications/${appId}`), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    create: (data) =>
      fetch(buildApiUrl('/api/applications'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),

    update: (appId, data) =>
      fetch(buildApiUrl(`/api/applications/${appId}`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),

    delete: (appId) =>
      fetch(buildApiUrl(`/api/applications/${appId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse),
  },

  // Admin
  admin: {
    getStats: () =>
      fetch(buildApiUrl('/api/admin/stats'), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    getAuditLogs: () =>
      fetch(buildApiUrl('/api/admin/audit-logs'), {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    toggleVerification: (schemeId, status) =>
      fetch(buildApiUrl(`/api/admin/schemes/${schemeId}/verification`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      }).then(handleResponse),
  },

  // System
  system: {
    getHealth: () =>
      fetch(buildApiUrl('/api/system/health')).then(handleResponse),

    getStates: () =>
      fetch(buildApiUrl('/api/system/states')).then(handleResponse),
  },
};
