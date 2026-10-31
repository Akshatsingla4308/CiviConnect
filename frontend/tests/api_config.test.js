import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PRODUCTION_DEFAULT_API_URL,
  DEVELOPMENT_DEFAULT_API_URL,
  resolveApiBaseUrl,
  buildApiUrl,
} from '../src/api/config.js';

test('Production API configuration resolves to deployed Render backend by default', () => {
  const env = { PROD: true, DEV: false, MODE: 'production' };
  const base = resolveApiBaseUrl(env);
  assert.equal(base, 'https://civiconnect-backend.onrender.com');
  assert.equal(base, PRODUCTION_DEFAULT_API_URL);
});

test('Production API configuration uses custom VITE_API_BASE_URL when valid', () => {
  const env = {
    PROD: true,
    DEV: false,
    MODE: 'production',
    VITE_API_BASE_URL: 'https://custom-backend.onrender.com',
  };
  const base = resolveApiBaseUrl(env);
  assert.equal(base, 'https://custom-backend.onrender.com');
});

test('Production API configuration supports VITE_API_URL backward-compatibility', () => {
  const env = {
    PROD: true,
    DEV: false,
    MODE: 'production',
    VITE_API_URL: 'https://legacy-env-backend.onrender.com',
  };
  const base = resolveApiBaseUrl(env);
  assert.equal(base, 'https://legacy-env-backend.onrender.com');
});

test('Production API rejects localhost and 127.0.0.1, forcing Render backend with diagnostic error', () => {
  const envLocalhost = {
    PROD: true,
    DEV: false,
    MODE: 'production',
    VITE_API_BASE_URL: 'http://localhost:8000',
  };
  const base1 = resolveApiBaseUrl(envLocalhost);
  assert.equal(base1, 'https://civiconnect-backend.onrender.com');

  const envLoopback = {
    PROD: true,
    DEV: false,
    MODE: 'production',
    VITE_API_BASE_URL: 'http://127.0.0.1:8000',
  };
  const base2 = resolveApiBaseUrl(envLoopback);
  assert.equal(base2, 'https://civiconnect-backend.onrender.com');
});

test('The assistant endpoint specifically resolves to Render backend in production and never localhost', () => {
  const env = { PROD: true, DEV: false, MODE: 'production' };
  const prodBase = resolveApiBaseUrl(env);
  const assistantUrl = buildApiUrl('/api/assistant/chat', prodBase);

  assert.equal(assistantUrl, 'https://civiconnect-backend.onrender.com/api/assistant/chat');
  assert.ok(!assistantUrl.includes('127.0.0.1'));
  assert.ok(!assistantUrl.includes('localhost'));
});

test('URL joining strips trailing slashes from base and prevents double slashes', () => {
  const customBase = 'https://civiconnect-backend.onrender.com///';
  const url = buildApiUrl('/api/assistant/chat', customBase);
  assert.equal(url, 'https://civiconnect-backend.onrender.com/api/assistant/chat');
});

test('URL joining does not duplicate /api if base already ends with /api', () => {
  const baseWithApi = 'https://civiconnect-backend.onrender.com/api';
  const url1 = buildApiUrl('/api/assistant/chat', baseWithApi);
  assert.equal(url1, 'https://civiconnect-backend.onrender.com/api/assistant/chat');

  const url2 = buildApiUrl('api/schemes', baseWithApi);
  assert.equal(url2, 'https://civiconnect-backend.onrender.com/api/schemes');

  const url3 = buildApiUrl('/api', baseWithApi);
  assert.equal(url3, 'https://civiconnect-backend.onrender.com/api');
});

test('URL joining prepends /api if base does not have /api and path lacks /api', () => {
  const base = 'https://civiconnect-backend.onrender.com';
  const url = buildApiUrl('assistant/chat', base);
  assert.equal(url, 'https://civiconnect-backend.onrender.com/api/assistant/chat');
});

test('URL joining preserves query parameters and dynamic IDs correctly', () => {
  const base = 'https://civiconnect-backend.onrender.com';
  const urlSchemes = buildApiUrl('/api/schemes?category=agriculture&limit=10', base);
  assert.equal(
    urlSchemes,
    'https://civiconnect-backend.onrender.com/api/schemes?category=agriculture&limit=10'
  );

  const urlVault = buildApiUrl('/api/vault/doc-999/download', base);
  assert.equal(
    urlVault,
    'https://civiconnect-backend.onrender.com/api/vault/doc-999/download'
  );
});

test('Local development configuration defaults to http://127.0.0.1:8000 in DEV mode', () => {
  const env = { DEV: true, PROD: false, MODE: 'development' };
  const base = resolveApiBaseUrl(env);
  assert.equal(base, 'http://127.0.0.1:8000');
  assert.equal(base, DEVELOPMENT_DEFAULT_API_URL);

  const assistantUrl = buildApiUrl('/api/assistant/chat', base);
  assert.equal(assistantUrl, 'http://127.0.0.1:8000/api/assistant/chat');
});

test('Missing production configuration does not silently route requests to localhost', () => {
  const emptyEnv = {};
  const base = resolveApiBaseUrl(emptyEnv);
  assert.notEqual(base, 'http://127.0.0.1:8000');
  assert.notEqual(base, 'http://localhost:8000');
  assert.equal(base, 'https://civiconnect-backend.onrender.com');
});
