const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
 for (const k of (process.argv[2]||'signboard,khata,clean').split(',')) for (const s of ['home', 'review']) { await p.goto('file://' + process.cwd() + `/${k}-${s}.html`); await p.waitForTimeout(1500); await p.screenshot({ path: `${k}-${s}.png` }) }
 await b.close() })();
