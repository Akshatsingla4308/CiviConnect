const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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
      fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),

    login: (credentials) =>
      fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }).then(handleResponse),

    getMe: () =>
      fetch(`${BASE_URL}/api/auth/me`, {
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

      return fetch(`${BASE_URL}/api/schemes?${query.toString()}`).then(handleResponse);
    },

    getCategories: () =>
      fetch(`${BASE_URL}/api/schemes/categories`).then(handleResponse),

    getById: (id) =>
      fetch(`${BASE_URL}/api/schemes/${id}`).then(handleResponse),
  },

  // Eligibility Engine
  eligibility: {
    checkSingle: (schemeId, profile) =>
      fetch(`${BASE_URL}/api/eligibility/check`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ scheme_id: schemeId, profile }),
      }).then(handleResponse),

    evaluateAll: (profile) =>
      fetch(`${BASE_URL}/api/eligibility/evaluate-all`, {
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
      return fetch(`${BASE_URL}/api/documents?${query.toString()}`).then(handleResponse);
    },

    getById: (id) =>
      fetch(`${BASE_URL}/api/documents/${id}`).then(handleResponse),
  },

  // Checklists
  checklists: {
    list: () =>
      fetch(`${BASE_URL}/api/checklists`, {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    getForScheme: (schemeId) =>
      fetch(`${BASE_URL}/api/checklists/${schemeId}`, {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    update: (schemeId, items, status = null) =>
      fetch(`${BASE_URL}/api/checklists/${schemeId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items, status }),
      }).then(handleResponse),
  },

  // User Workspace
  user: {
    getProfile: () =>
      fetch(`${BASE_URL}/api/user/profile`, {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    updateProfile: (profileData) =>
      fetch(`${BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      }).then(handleResponse),

    getSavedSchemes: () =>
      fetch(`${BASE_URL}/api/user/saved-schemes`, {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    saveScheme: (schemeId, notes = '') =>
      fetch(`${BASE_URL}/api/user/saved-schemes/${schemeId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes }),
      }).then(handleResponse),

    removeSavedScheme: (schemeId) =>
      fetch(`${BASE_URL}/api/user/saved-schemes/${schemeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse),

    getAssessments: () =>
      fetch(`${BASE_URL}/api/user/assessments`, {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    recordAssessment: (data) =>
      fetch(`${BASE_URL}/api/user/assessments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),

    getApplications: () =>
      fetch(`${BASE_URL}/api/user/applications`, {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    createApplication: (data) =>
      fetch(`${BASE_URL}/api/user/applications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),
  },

  // AI Assistant
  assistant: {
    chat: (message, sessionId = null, language = 'en', userProfile = null) =>
      fetch(`${BASE_URL}/api/assistant/chat`, {
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
      fetch(`${BASE_URL}/api/assistant/status`).then(handleResponse),
  },

  // Admin
  admin: {
    getStats: () =>
      fetch(`${BASE_URL}/api/admin/stats`, {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    getAuditLogs: () =>
      fetch(`${BASE_URL}/api/admin/audit-logs`, {
        headers: getAuthHeaders(),
      }).then(handleResponse),

    toggleVerification: (schemeId, status) =>
      fetch(`${BASE_URL}/api/admin/schemes/${schemeId}/verification`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      }).then(handleResponse),
  },

  // System
  system: {
    getHealth: () =>
      fetch(`${BASE_URL}/api/system/health`).then(handleResponse),

    getStates: () =>
      fetch(`${BASE_URL}/api/system/states`).then(handleResponse),
  },
};
