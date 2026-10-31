/**
 * CiviConnect Centralized API Configuration & URL Resolution
 *
 * Rules:
 * 1. Production builds NEVER default or fall back to localhost or 127.0.0.1.
 * 2. In production, requests route to the deployed Render backend:
 *    https://civiconnect-backend.onrender.com
 * 3. Local development defaults to http://127.0.0.1:8000 only when explicitly running in DEV mode.
 * 4. URL joining handles base trimming and prevents missing or duplicate /api segments.
 */

export const PRODUCTION_DEFAULT_API_URL = 'https://civiconnect-backend.onrender.com';
export const DEVELOPMENT_DEFAULT_API_URL = 'http://127.0.0.1:8000';

/**
 * Resolves the API Base URL based on environment variables and active mode.
 *
 * @param {Object} [env=import.meta.env]
 * @returns {string} Fully resolved, normalized API base URL
 */
export function resolveApiBaseUrl(env = (typeof import.meta !== 'undefined' ? import.meta.env : {})) {
  const isDev = Boolean(env && (env.DEV === true || env.MODE === 'development'));
  const isProd = Boolean(env && (env.PROD === true || env.MODE === 'production' || !isDev));

  const configuredUrl = (env?.VITE_API_BASE_URL || env?.VITE_API_URL || '').trim();

  if (configuredUrl) {
    const cleanUrl = configuredUrl.replace(/\/+$/, '');

    // Disallow accidental localhost URLs in production builds
    if (isProd && (cleanUrl.includes('127.0.0.1') || cleanUrl.includes('localhost'))) {
      console.error(
        `[CiviConnect API Diagnostic] Insecure/unreachable localhost URL ("${cleanUrl}") detected in production build! Forcing production backend: ${PRODUCTION_DEFAULT_API_URL}`
      );
      return PRODUCTION_DEFAULT_API_URL;
    }

    return cleanUrl;
  }

  // No explicit environment variable supplied
  if (isDev) {
    return DEVELOPMENT_DEFAULT_API_URL;
  }

  // Production fallback with diagnostic logging
  console.warn(
    `[CiviConnect API Diagnostic] VITE_API_BASE_URL is not set in build environment. Using production backend: ${PRODUCTION_DEFAULT_API_URL}`
  );
  return PRODUCTION_DEFAULT_API_URL;
}

/**
 * Constructs an absolute API endpoint URL, preventing duplicate slashes and duplicate /api segments.
 *
 * @param {string} endpoint Path, with or without leading slash or /api prefix (e.g. '/api/assistant/chat', 'assistant/chat')
 * @param {string} [customBase] Optional custom base URL for testing
 * @returns {string} Fully qualified URL (e.g. 'https://civiconnect-backend.onrender.com/api/assistant/chat')
 */
export function buildApiUrl(endpoint = '', customBase = null) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const base = (customBase || resolveApiBaseUrl()).replace(/\/+$/, '');
  const baseHasApi = /\/api$/i.test(base);

  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (baseHasApi) {
    if (cleanEndpoint.toLowerCase().startsWith('/api/')) {
      cleanEndpoint = cleanEndpoint.substring(4);
    } else if (cleanEndpoint.toLowerCase() === '/api') {
      cleanEndpoint = '';
    }
  } else {
    if (!cleanEndpoint.toLowerCase().startsWith('/api/') && cleanEndpoint.toLowerCase() !== '/api') {
      cleanEndpoint = `/api${cleanEndpoint}`;
    }
  }

  return `${base}${cleanEndpoint}`;
}
