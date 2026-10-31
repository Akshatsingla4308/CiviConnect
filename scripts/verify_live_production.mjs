import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-verify-'));

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        } else if (msg.method) {
          const listeners = this.eventListeners.get(msg.method) || [];
          for (const listener of listeners) {
            listener(msg.params);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, []);
    }
    this.eventListeners.get(method).push(listener);
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runLiveVerification() {
  console.log('--- CIVICONNECT LIVE PRODUCTION VERIFICATION ---');
  console.log('Target Frontend:', 'https://civi-connect-seven.vercel.app/assistant');
  console.log('Target Backend :', 'https://civiconnect-backend.onrender.com');

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempUserDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,800',
  ]);

  try {
    let connected = false;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        await getJson(`http://127.0.0.1:${PORT}/json/version`);
        connected = true;
        break;
      } catch {}
    }
    if (!connected) throw new Error('Chrome failed to start on port ' + PORT);

    const targets = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Network.enable');
    await client.send('Page.enable');

    const networkRequests = [];
    client.on('Network.requestWillBeSent', (params) => {
      const url = params.request.url;
      if (url.includes('/api/')) {
        networkRequests.push({
          url,
          method: params.request.method,
          requestId: params.requestId,
        });
      }
    });

    const networkResponses = [];
    client.on('Network.responseReceived', (params) => {
      const url = params.response.url;
      if (url.includes('/api/')) {
        networkResponses.push({
          url,
          status: params.response.status,
          statusText: params.response.statusText,
        });
      }
    });

    console.log('[1/4] Navigating to deployed assistant page...');
    await client.send('Page.navigate', { url: 'https://civi-connect-seven.vercel.app/assistant' });
    await sleep(4000);

    const pageTitle = await client.eval('document.title');
    console.log('[2/4] Page loaded. Title:', pageTitle);

    // Verify what baseUrl is configured in the running app
    const resolvedBase = await client.eval(`
      (() => {
        const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
        return {
          scripts,
          origin: window.location.origin,
          href: window.location.href
        };
      })()
    `);
    console.log('[3/4] Live scripts loaded:', resolvedBase.scripts);

    // Check if initial status or any requests were made
    console.log('[4/4] Executing assistant query in page context...');
    const chatResult = await client.eval(`
      (async () => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return { error: 'No textarea found' };
        
        // Use native value setter for React controlled component
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(textarea, 'Mujhe bank mein zero balance khata kholna hai');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Find send button inside the form or container
        await new Promise(r => setTimeout(r, 300));
        const form = textarea.closest('form');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        if (submitBtn) {
          submitBtn.click();
          return { success: true, method: 'submitBtn.click()' };
        }
        
        // Fallback: enter key
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        return { success: true, method: 'keydown.Enter' };
      })()
    `);
    console.log('Action result:', chatResult);

    // Wait for the assistant chat API request and response
    console.log('Waiting for assistant API network response...');
    for (let i = 0; i < 25; i++) {
      await sleep(1000);
      const hasChatResponse = networkResponses.some(r => r.url.includes('/api/assistant/chat'));
      if (hasChatResponse) break;
    }

    console.log('\n--- INTERCEPTED API NETWORK REQUESTS ---');
    networkRequests.forEach(req => {
      console.log(`-> ${req.method} ${req.url}`);
    });

    console.log('\n--- INTERCEPTED API NETWORK RESPONSES ---');
    networkResponses.forEach(res => {
      console.log(`<- ${res.status} ${res.url}`);
    });

    // Check other routes: schemes and documents
    console.log('[5/5] Testing live schemes and documents routes...');
    await client.send('Page.navigate', { url: 'https://civi-connect-seven.vercel.app/schemes' });
    await sleep(3000);
    await client.send('Page.navigate', { url: 'https://civi-connect-seven.vercel.app/documents' });
    await sleep(3000);
    const localhostRequests = networkRequests.filter(r => r.url.includes('127.0.0.1') || r.url.includes('localhost'));
    const renderRequests = networkRequests.filter(r => r.url.startsWith('https://civiconnect-backend.onrender.com'));

    console.log('\n--- VERIFICATION VERDICT ---');
    console.log('Localhost requests count:', localhostRequests.length);
    console.log('Render backend requests count:', renderRequests.length);

    if (localhostRequests.length > 0) {
      console.error('FAILED: Localhost requests were detected in production!');
      process.exit(1);
    }

    if (renderRequests.length === 0) {
      console.warn('WARNING: No Render requests were recorded.');
    } else {
      console.log('SUCCESS: All production requests routed cleanly to https://civiconnect-backend.onrender.com');
    }

    client.close();
  } finally {
    try { chromeProc.kill(); } catch {}
    try { fs.rmSync(tempUserDataDir, { recursive: true, force: true }); } catch {}
  }
}

runLiveVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
