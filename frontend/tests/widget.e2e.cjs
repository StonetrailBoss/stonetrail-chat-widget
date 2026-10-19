// Local-only browser check. Requires playwright and built dist/ + widget-dist/.
// Start an isolated API/database before running; never target a live hotel database.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const api = process.env.E2E_API_URL || 'http://127.0.0.1:8177';
const port = Number(process.env.E2E_PORT || 4177);
const email = process.env.E2E_STAFF_EMAIL || 'manager@example.test';
const password = process.env.E2E_STAFF_PASSWORD || 'local-test-password';
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!doctype html><html><head><title>Hotel website test fixture</title><style>button{background:red!important}article{display:none!important}</style></head><body><h1>Hotel website</h1><script defer src="/stonetrail-widget.js" data-api-base-url="${api}"></script></body></html>`);
    return;
  }
  let file = req.url === '/stonetrail-widget.js' ? path.join(root, 'widget-dist/stonetrail-widget.js') : req.url.startsWith('/assets/') ? path.join(root, 'dist', req.url) : path.join(root, 'dist/index.html');
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const guest = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await guest.goto(`http://127.0.0.1:${port}/`);
    await guest.getByRole('button', { name: 'Chat with Stonetrail', exact: true }).click();
    await guest.getByRole('button', { name: 'Talk to our team', exact: true }).click();
    await guest.getByText('Your message has been sent to our team.', { exact: false }).waitFor();
    const staff = await browser.newPage();
    await staff.goto(`http://127.0.0.1:${port}/staff`);
    await staff.getByLabel('Email', { exact: true }).fill(email);
    await staff.getByLabel('Password', { exact: true }).fill(password);
    await staff.getByRole('button', { name: 'Sign in', exact: true }).click();
    await staff.getByRole('button', { name: /Website guest inquiry/ }).click();
    await staff.getByLabel('Message', { exact: true }).fill('PRIVATE-STAFF-NOTE');
    await staff.getByRole('button', { name: 'Submit message', exact: true }).click();
    await staff.getByText('PRIVATE-STAFF-NOTE', { exact: true }).waitFor();
    await staff.getByLabel('Message type', { exact: true }).selectOption('reply');
    await staff.getByLabel('Message', { exact: true }).fill('Hello from the Stonetrail reception team.');
    await staff.getByRole('button', { name: 'Submit message', exact: true }).click();
    await guest.getByText('Hello from the Stonetrail reception team.', { exact: true }).waitFor({ timeout: 15000 });
    assert.equal(await guest.getByText('PRIVATE-STAFF-NOTE', { exact: true }).count(), 0);
    assert.equal(await guest.locator('#stonetrail-widget-host').evaluate(el => !!el.shadowRoot), true);
    const visible = await guest.getByText('Hello from the Stonetrail reception team.', { exact: true }).isVisible();
    assert.ok(visible, 'Host article CSS must not hide shadow-root transcript');
    await guest.getByRole('button', { name: 'New chat', exact: true }).click();
    await guest.waitForTimeout(500);
    assert.equal(await guest.getByText('Hello from the Stonetrail reception team.', { exact: true }).count(), 0);
    console.log('PASS: embedded widget, mobile layout, staff reply roundtrip, private notes, new session, CSS isolation');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
