// Visual QA capture: serves the static export in out/ and screenshots each
// representative template at mobile + desktop widths, recording console errors,
// page errors, and horizontal-overflow diagnostics for the QA swarm to inspect.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'out')
const artDir = path.join(root, 'qa-artifacts')
fs.mkdirSync(artDir, { recursive: true })

// One representative URL per distinct page template.
const templates = [
  { key: 'home', url: '/' },
  { key: 'trade-landing', url: '/quotes-for-electricians/' },
  { key: 'trade-city', url: '/quotes-for-carpenters/melbourne/' },
  { key: 'trades-index', url: '/trades/' },
  { key: 'article-detail', url: '/articles/after-hours-leads-tradies/' },
  { key: 'articles-index', url: '/articles/' },
  { key: 'compare-detail', url: '/compare/chatgpt/' },
  { key: 'get-paid', url: '/get-paid/automated-payment-reminders/' },
  { key: 'manage-jobs', url: '/manage-jobs/google-calendar-sync/' },
  { key: 'quoting', url: '/quoting/section-templates/' },
  { key: 'templates-detail', url: '/templates/bathroom-renovation-quote-template/' },
  { key: 'templates-index', url: '/templates/' },
  { key: 'pricing', url: '/pricing/' },
  { key: 'about', url: '/about/' },
  { key: 'join', url: '/join/' },
  { key: 'shower-tool', url: '/shower-quoting-tool/' },
  { key: 'reece', url: '/integrations/reece/bathroom-rough-in/' },
  { key: 'portal', url: '/portal/dashboard/' },
  { key: 'legal-privacy', url: '/privacy/' },
  { key: 'legal-terms', url: '/terms/' },
]

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.txt': 'text/plain', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
}

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0].split('#')[0])
  const candidates = []
  const base = path.join(outDir, p)
  if (p.endsWith('/')) candidates.push(path.join(base, 'index.html'))
  candidates.push(base)
  candidates.push(base + '.html')
  candidates.push(path.join(base, 'index.html'))
  for (const c of candidates) {
    try { if (fs.statSync(c).isFile()) return c } catch {}
  }
  return null
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || '/')
  if (!file) {
    const nf = path.join(outDir, '404.html')
    try {
      const buf = fs.readFileSync(nf)
      res.writeHead(404, { 'content-type': 'text/html' }); res.end(buf); return
    } catch { res.writeHead(404); res.end('Not found'); return }
  }
  const ext = path.extname(file).toLowerCase()
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' })
  res.end(fs.readFileSync(file))
})

const overflowProbe = `(() => {
  const vw = window.innerWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      const id = el.id ? '#' + el.id : '';
      const cls = (typeof el.className === 'string' && el.className) ? '.' + el.className.trim().split(/\\s+/).slice(0,3).join('.') : '';
      offenders.push({ tag: el.tagName.toLowerCase() + id + cls, right: Math.round(r.right), left: Math.round(r.left) });
    }
  }
  // de-dup by selector, keep worst few
  const seen = new Set(); const uniq = [];
  for (const o of offenders.sort((a,b)=>b.right-a.right)) { if (!seen.has(o.tag)) { seen.add(o.tag); uniq.push(o); } if (uniq.length>=12) break; }
  return { scrollWidth: document.documentElement.scrollWidth, innerWidth: vw, horizontalOverflow: document.documentElement.scrollWidth > vw + 1, offenders: uniq };
})()`

await new Promise(r => server.listen(0, r))
const port = server.address().port
const origin = 'http://127.0.0.1:' + port
console.log('Static server on', origin)

const browser = await chromium.launch()
const report = []

for (const t of templates) {
  const entry = { key: t.key, url: t.url, viewports: {} }
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    const consoleErrors = []
    const pageErrors = []
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)) })
    page.on('pageerror', e => pageErrors.push(String(e).slice(0, 300)))
    const failedReq = []
    page.on('requestfailed', r => failedReq.push(r.url().slice(0, 200) + ' (' + (r.failure()?.errorText || '?') + ')'))
    let status = null
    try {
      const resp = await page.goto(origin + t.url, { waitUntil: 'networkidle', timeout: 30000 })
      status = resp ? resp.status() : null
    } catch (e) {
      pageErrors.push('NAV: ' + String(e).slice(0, 200))
    }
    await page.waitForTimeout(700)
    let probe = null
    try { probe = await page.evaluate(overflowProbe) } catch {}
    const shot = path.join(artDir, `${t.key}-${vp.name}.png`)
    try { await page.screenshot({ path: shot, fullPage: true }) } catch (e) { pageErrors.push('SHOT: ' + String(e).slice(0,150)) }
    entry.viewports[vp.name] = {
      screenshot: path.relative(root, shot),
      httpStatus: status,
      consoleErrors,
      pageErrors,
      failedRequests: failedReq.slice(0, 10),
      overflow: probe,
    }
    await ctx.close()
    console.log(`  captured ${t.key} @ ${vp.name}  (overflow=${probe?.horizontalOverflow}, consoleErr=${consoleErrors.length})`)
  }
  report.push(entry)
}

await browser.close()
server.close()
fs.writeFileSync(path.join(artDir, 'capture-report.json'), JSON.stringify(report, null, 2))
console.log('\nWrote', path.join(artDir, 'capture-report.json'), '—', report.length, 'templates,', report.length * viewports.length, 'screenshots')
