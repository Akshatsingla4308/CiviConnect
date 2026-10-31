import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-'));

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
      throw new Error(res.exceptionDetails.text || 'Eval error');
    }
    return res.result ? res.result.value : undefined;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runBrowserTests() {
  console.log('=== STARTING AUTOMATED BROWSER VERIFICATION SUITE ===');
  console.log(`Launching Chrome headless with remote debugging on port ${PORT}...`);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempUserDataDir}`,
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'http://127.0.0.1:5173/assistant'
  ], { stdio: 'ignore' });

  // Wait for Chrome CDP to become available
  let targetWs = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const targets = await getJson(`http://127.0.0.1:${PORT}/json`);
      if (targets && targets.length > 0) {
        const page = targets.find(t => t.type === 'page' && t.url.includes('5173'));
        if (page && page.webSocketDebuggerUrl) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      }
    } catch {
      // Chrome still starting
    }
  }

  if (!targetWs) {
    // If exact url match not yet loaded, find any page type
    const targets = await getJson(`http://127.0.0.1:${PORT}/json`);
    const page = targets.find(t => t.type === 'page');
    if (page) targetWs = page.webSocketDebuggerUrl;
  }

  if (!targetWs) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome CDP within timeout');
  }

  console.log('Connected to Chrome DevTools Protocol target:', targetWs);
  const cdp = new CDPClient(targetWs);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // TEST 1: Assistant Page Desktop Layout & Footer
    console.log('\n--- TEST 1: Assistant Page Desktop Layout & Initial Footer Position ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/assistant' });
    await sleep(2500);

    const layout1 = await cdp.eval(`
      (() => {
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        const main = document.querySelector('main');
        const chatPanel = document.querySelector('.assistant-markdown-content');

        const hRect = header ? header.getBoundingClientRect() : null;
        const fRect = footer ? footer.getBoundingClientRect() : null;
        const mRect = main ? main.getBoundingClientRect() : null;

        return {
          hasHeader: !!header,
          headerTop: hRect ? hRect.top : -1,
          hasFooter: !!footer,
          footerTop: fRect ? fRect.top : -1,
          mainBottom: mRect ? mRect.bottom : -1,
          hasMarkdownContent: !!chatPanel,
          footerAfterContent: fRect && mRect ? fRect.top >= (mRect.bottom - 5) : false
        };
      })()
    `);

    assert(layout1.hasHeader, 'Header exists');
    assert(layout1.headerTop === 0, 'Header is pinned at the top (top: 0)');
    assert(layout1.hasFooter, 'Footer exists');
    assert(layout1.footerAfterContent, 'Footer is placed in normal flow after main content');
    assert(layout1.hasMarkdownContent, 'Assistant initial greeting renders inside markdown component');

    // TEST 2: Markdown Rendering Verification
    console.log('\n--- TEST 2: Assistant Markdown Formatting & Elements ---');
    // Click suggested prompt button to trigger a real API assistant response
    const clickResult = await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const promptBtn = buttons.find(b => b.innerText.includes('Scholarships in Punjab'));
        if (promptBtn) {
          promptBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          return 'Dispatched click: ' + promptBtn.innerText;
        }
        return 'No button found';
      })()
    `);
    console.log(`  Button action: ${clickResult}`);

    console.log('  Waiting for assistant grounded response...');
    let renderedElements = null;
    for (let i = 0; i < 25; i++) {
      await sleep(1000);
      const pollInfo = await cdp.eval(`
        (() => {
          const contents = document.querySelectorAll('.assistant-markdown-content');
          const loadingEl = document.querySelector('div[style*="Retrieving verified"]');
          return {
            contentCount: contents.length,
            isLoading: !!loadingEl,
            lastText: contents.length > 0 ? contents[contents.length - 1].innerText.substring(0, 80) : ''
          };
        })()
      `);
      console.log(`    Poll ${i + 1}: count=${pollInfo.contentCount}, loading=${pollInfo.isLoading}`);

      if (pollInfo.contentCount >= 2) {
        renderedElements = await cdp.eval(`
          (() => {
            const contents = document.querySelectorAll('.assistant-markdown-content');
            const latest = contents[contents.length - 1];
            const text = latest.innerText;
            
            return {
              h3Count: latest.querySelectorAll('h3').length,
              strongCount: latest.querySelectorAll('strong').length,
              ulCount: latest.querySelectorAll('ul').length,
              liCount: latest.querySelectorAll('li').length,
              linkCount: latest.querySelectorAll('a').length,
              hasRawHeadingSymbols: text.includes('### ') || text.includes('## '),
              hasRawBoldSymbols: text.includes('**Summary:**') || text.includes('**Key Benefits:**'),
              textPreview: text.substring(0, 160)
            };
          })()
        `);
        break;
      }
    }

    assert(renderedElements !== null, 'Assistant returned and rendered second message');
    assert(renderedElements.h3Count > 0, `Headings rendered as HTML <h3> elements (found ${renderedElements.h3Count})`);
    assert(renderedElements.strongCount > 0, `Bold text rendered as HTML <strong> elements (found ${renderedElements.strongCount})`);
    assert(renderedElements.ulCount > 0 && renderedElements.liCount > 0, `Bullet points rendered as HTML <ul>/<li> elements (found ${renderedElements.liCount} items)`);
    assert(renderedElements.linkCount > 0, `Hyperlinks rendered as clickable <a> tags (found ${renderedElements.linkCount} links)`);
    assert(!renderedElements.hasRawHeadingSymbols, 'No raw "### " markdown syntax visible in text');
    assert(!renderedElements.hasRawBoldSymbols, 'No raw "**Summary:**" markdown syntax visible in text');

    // TEST 3: Scroll and Footer Position After Long Conversation
    console.log('\n--- TEST 3: Scroll & Footer Overlap Check with Long Content ---');
    const scrollAndFooter = await cdp.eval(`
      (() => {
        // Scroll to the very bottom
        window.scrollTo(0, document.body.scrollHeight);
        
        const header = document.querySelector('header').getBoundingClientRect();
        const footer = document.querySelector('footer').getBoundingClientRect();
        const messages = document.querySelectorAll('.assistant-markdown-content');
        const lastMsg = messages[messages.length - 1].getBoundingClientRect();

        return {
          windowScrollY: window.scrollY,
          documentHeight: document.body.scrollHeight,
          footerTop: footer.top,
          lastMsgBottom: lastMsg.bottom,
          footerBelowLastMessage: footer.top >= (lastMsg.bottom - 80),
          footerIsNotCoveringCenter: footer.top > 150
        };
      })()
    `);

    assert(scrollAndFooter.windowScrollY > 0, `Page scrolled naturally (window.scrollY = ${Math.round(scrollAndFooter.windowScrollY)}px)`);
    assert(scrollAndFooter.footerBelowLastMessage, 'Footer is below the conversation messages, never overlapping them');
    assert(scrollAndFooter.footerIsNotCoveringCenter, 'Footer does not cut across the middle of the response');

    // TEST 4: Mobile Viewport Responsiveness
    console.log('\n--- TEST 4: Mobile Viewport (375x667) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(500);

    const mobileCheck = await cdp.eval(`
      (() => {
        const bodyWidth = document.body.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const footer = document.querySelector('footer').getBoundingClientRect();
        const main = document.querySelector('main').getBoundingClientRect();

        return {
          bodyWidth,
          scrollWidth,
          noHorizontalOverflow: scrollWidth <= 375,
          footerAfterContent: footer.top >= (main.bottom - 20)
        };
      })()
    `);

    assert(mobileCheck.noHorizontalOverflow, `No horizontal layout overflow on mobile (scrollWidth: ${mobileCheck.scrollWidth}px <= 375px)`);
    assert(mobileCheck.footerAfterContent, 'Footer remains below content on mobile layout');

    // TEST 5: Verify Explore Schemes Route
    console.log('\n--- TEST 5: Explore Schemes Live Database Route ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/schemes' });
    await sleep(2000);

    const schemesCheck = await cdp.eval(`
      (() => {
        const text = document.body.innerText;
        const countMatch = text.match(/Showing (\\d+) verified/);
        return {
          hasSchemesText: text.includes('verified public welfare scheme'),
          countMatch: countMatch,
          count: countMatch ? parseInt(countMatch[1]) : 0
        };
      })()
    `);
    assert(schemesCheck.hasSchemesText, 'Explore Schemes displays verified welfare schemes from database');
    assert(schemesCheck.count >= 50, `Schemes count reflects database (loaded ${schemesCheck.count} schemes)`);

    // TEST 6: Verify State Directory Route
    console.log('\n--- TEST 6: State Directory Route ---');
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/directory' });
    await sleep(1500);

    const dirCheck = await cdp.eval(`
      (() => {
        const text = document.body.innerText;
        return {
          hasPunjab: text.includes('Punjab'),
          hasAmritsar: text.includes('Amritsar'),
          hasStateDirTitle: text.includes('State & District Directory')
        };
      })()
    `);
    assert(dirCheck.hasPunjab && dirCheck.hasAmritsar, 'State directory correctly renders Punjab and its verified districts');

    console.log(`\n======================================================`);
    console.log(`BROWSER VERIFICATION SUMMARY: ALL ${passedTests}/${totalTests} TESTS PASSED!`);
    console.log(`======================================================\n`);

  } finally {
    cdp.close();
    chromeProc.kill();
    try { fs.rmSync(tempUserDataDir, { recursive: true, force: true }); } catch {}
  }
}

runBrowserTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Browser Test Error:', err);
    process.exit(1);
  });
