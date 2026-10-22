/* 图标总览截图：node tools/icon-shot.mjs <from> <to> [out.png]
 * 用 Edge headless + DevTools 协议打开 tools/icon-sheet.html，截取整页。
 * 只为校对图标用，不参与游戏运行。 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const arg = process.argv[2] || '0';
const to = process.argv[3] || '9999';
const out = process.argv[4] || join(tmpdir(), 'era-icons', `sheet-${arg}-${to}.png`);
const query = arg.startsWith('ids=') ? `?${arg}&all=1` : `?from=${arg}&to=${to}`;const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9600 + Math.floor(Math.random() * 300);
const prof = mkdtempSync(join(tmpdir(), 'era-is-'));
const url = pathToFileURL(join(process.cwd(), 'tools', 'icon-sheet.html')).href + query;
const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--force-device-scale-factor=2', '--remote-debugging-port=' + port, '--user-data-dir=' + prof,
  '--window-size=1080,900', url], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let target;
for (let i = 0; i < 100; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/json`);
    const j = await r.json();
    target = j.find(t => t.type === 'page');
    if (target) break;
  } catch (e) { /* 还没起来 */ }
  await sleep(200);
}
if (!target) { proc.kill(); throw new Error('DevTools 未就绪'); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0;
const pending = new Map();
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const call = (method, params = {}) => new Promise(res => {
  const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
});
const js = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true })).result.result.value;

try {
  await call('Page.enable');
  await call('Runtime.enable');
  await sleep(1200);
  const { w, h } = await js(`({ w: document.body.scrollWidth, h: document.body.scrollHeight })`);
  await call('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: false });
  await sleep(300);
  const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  mkdirSync(join(out, '..'), { recursive: true });
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log(`已保存 ${out}  (${w}×${h})`);
} finally {
  try { ws.close(); } catch (e) {}
  proc.kill();
}
