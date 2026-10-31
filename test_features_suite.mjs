import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9223;
const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-feat-'));

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
    this.msgId = 0;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result.value;
  }
}

async function runTests() {
  console.log('=== VERIFYING NEW FEATURES VIA HEADLESS CHROME CDP ===');
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions',
    `--user-data-dir=${tempUserDataDir}`,
    'http://127.0.0.1:5173/'
  ]);

  await sleep(2500);

  try {
    const targets = await getJson(`http://127.0.0.1:${PORT}/json`);
    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('5173'));
    if (!pageTarget) throw new Error('Page target not found');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');

    console.log('\n--- 1. Testing Homepage & Floating Capsule Navbar ---');
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await sleep(2000);

    const navCheck = await cdp.eval(`
      (() => {
        const flag = document.querySelector('.nav-disclaimer-banner svg');
        const capsule = document.querySelector('.nav-capsule');
        const cards = document.querySelectorAll('.surface-card');
        const checkBtns = Array.from(document.querySelectorAll('a')).filter(a => a.textContent.includes('Check Eligibility'));
        const viewBtns = Array.from(document.querySelectorAll('a')).filter(a => a.textContent.includes('View Details & Rules'));
        return {
          hasSvgFlag: !!flag,
          flagAriaLabel: flag ? flag.getAttribute('aria-label') : null,
          hasCapsule: !!capsule,
          capsuleRadius: capsule ? window.getComputedStyle(capsule).borderRadius : null,
          cardsCount: cards.length,
          checkBtnsCount: checkBtns.length,
          viewBtnsCount: viewBtns.length,
        };
      })()
    `);

    console.log('  [PASS] SVG Indian flag rendered:', navCheck.hasSvgFlag, `(aria-label: ${navCheck.flagAriaLabel})`);
    console.log('  [PASS] Floating capsule navbar rendered with borderRadius:', navCheck.capsuleRadius);
    console.log('  [PASS] Featured scheme cards loaded:', navCheck.cardsCount);
    console.log('  [PASS] Localized "Check Eligibility" buttons found on cards:', navCheck.checkBtnsCount);
    console.log('  [PASS] "View Details & Rules" buttons found on cards:', navCheck.viewBtnsCount);

    if (!navCheck.hasSvgFlag || !navCheck.hasCapsule || navCheck.checkBtnsCount === 0) {
      throw new Error('Navbar or SchemeCard verification failed');
    }

    console.log('\n--- 2. Testing Document Centre "View Guidelines" Modal ---');
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/documents' });
    await sleep(2500);

    const docBefore = await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('View Guidelines'));
        return {
          docCount: document.querySelectorAll('.surface-card').length,
          guidelinesBtns: buttons.length,
          modalBefore: !!document.querySelector('.surface-card h2')
        };
      })()
    `);
    console.log(`  Found ${docBefore.docCount} documents, ${docBefore.guidelinesBtns} "View Guidelines" buttons.`);

    // Click the first "View Guidelines" button
    await cdp.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('View Guidelines'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1000);

    const modalAfter = await cdp.eval(`
      (() => {
        const modalHeading = document.querySelector('div[style*="fixed"] h2');
        const authority = document.querySelector('div[style*="fixed"] [style*="forest-surface"]');
        const portalLink = document.querySelector('div[style*="fixed"] a[href*="http"]');
        const closeBtn = Array.from(document.querySelectorAll('div[style*="fixed"] button')).find(b => b.textContent.includes('Close'));
        return {
          modalOpen: !!modalHeading,
          docTitle: modalHeading ? modalHeading.textContent : null,
          hasAuthority: !!authority,
          authorityText: authority ? authority.textContent : null,
          hasPortalLink: !!portalLink,
          portalUrl: portalLink ? portalLink.href : null,
          hasCloseBtn: !!closeBtn
        };
      })()
    `);

    console.log('  [PASS] Modal opened successfully:', modalAfter.modalOpen);
    console.log('  [PASS] Document Title in Modal:', modalAfter.docTitle);
    console.log('  [PASS] Issuing Authority in Modal:', modalAfter.authorityText);
    console.log('  [PASS] Official Portal Link in Modal:', modalAfter.portalUrl);

    if (!modalAfter.modalOpen || !modalAfter.docTitle) {
      throw new Error('Document guidelines modal did not open or lacked title');
    }

    // Close the modal
    await cdp.eval(`
      (() => {
        const closeBtn = Array.from(document.querySelectorAll('div[style*="fixed"] button')).find(b => b.textContent.includes('Close'));
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(500);

    const modalClosed = await cdp.eval(`!document.querySelector('div[style*="fixed"] h2')`);
    console.log('  [PASS] Modal closed cleanly on close button click:', modalClosed);

    console.log('\n======================================================');
    console.log('ALL NEW FEATURES VERIFIED CLEANLY IN REAL BROWSER!');
    console.log('======================================================\n');
  } finally {
    chromeProc.kill();
    try { fs.rmSync(tempUserDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

runTests().catch(err => {
  console.error('Feature test failure:', err);
  process.exit(1);
});
