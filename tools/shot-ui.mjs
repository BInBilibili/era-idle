/* 真实页面截图：node tools/shot-ui.mjs warehouse hunt codex
 * 打开 ?demo 局，塞一批物品 / 标记敌人已知 / 入驻狩猎，然后逐页截图。
 * 只用于校对界面，不参与游戏运行。 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const pages = process.argv.slice(2);
if (!pages.length) pages.push('warehouse');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const base = 'file:///D:/game/%E4%BB%BF%E6%A2%85%E5%B0%94%E6%B2%83%E6%94%BE%E7%BD%AE%E6%B8%B8%E6%88%8F/index.html?demo';
const outDir = join(tmpdir(), 'era-ui');
mkdirSync(outDir, { recursive: true });
const port = 9700 + Math.floor(Math.random() * 200);
const prof = mkdtempSync(join(tmpdir(), 'era-ui-'));
const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--remote-debugging-port=' + port, '--user-data-dir=' + prof, '--window-size=1440,980', base], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let target;
for (let i = 0; i < 100 && !target; i++) {
  try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); target = j.find(t => t.type === 'page'); } catch (e) {}
  if (!target) await sleep(220);
}
if (!target) { proc.kill(); throw new Error('DevTools 未就绪'); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pending = new Map(); const errs = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || ''));
};
const call = (method, params = {}) => new Promise(res => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const js = async expr => (await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result;

try {
  await call('Runtime.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 980, deviceScaleFactor: 1.6, mobile: false });
  for (let i = 0; i < 40; i++) {
    const ok = await js('typeof U !== "undefined" && !!E.S');
    if (ok.result.value) break;
    await sleep(250);
  }
  /* 布置一个“有货”的局面，方便看图标在真实界面的表现 */
  const setup = await js(`(() => {
    UI.closeModal();
    const ids = (Engine.ITEM_ORDER || Object.keys(Engine.ITEMS)).filter(id => !Engine.ITEMS[id].hidden);
    ids.forEach(id => { Engine.S.items[id] = 999; });
    Object.keys(Engine.ITEMS).forEach(id => Engine.S.seen.items[id] = 1);
    const cids = Object.keys(Engine.S.chars);
    (Engine.TECHS || []).forEach(t => { Engine.S.techs[t.id] = 1; });
    // v0.0.30：项目要买第 1 档才出现，截图前把所有升级项拉满
    Object.keys(Engine.S.jobs).forEach(k => {
      const j = Engine.JOB_BY_ID[k];
      if (j) Engine.S.jobs[k].up = new Array((j.upgrades || []).length).fill(1);
    });
    if (Engine.S.jobs.husbandry) {
      Engine.S.chars[cids[0]].know = { '兔子': 100, '鹿': 100, '熊': 100 };
      Engine.S.jobs.husbandry.animals = [{ name: '兔子', prog: .35, done: 3 }, { name: '鹿', prog: .7, done: 1 }, { name: '熊', prog: .15, done: 0 }];
      Engine.ensureSlots(Engine.S.jobs.husbandry, 2);
      Engine.S.jobs.husbandry.slots[1] = cids[0];
      Engine.S.items[Engine.N2I('草料')] = 999;
    }
    if (Engine.S.jobs.hunting) {
      const js = Engine.S.jobs.hunting;
      Engine.ensureSlots(js, 1);
      js.slots[0] = cids[0];
      const cs = Engine.combatState('hunting');
      cs.region = 0;
    }
    (Engine.ENEMIES || []).forEach(e => Engine.S.seen.enemies[e.id] = 1);
    UI.render();
    return { chars: cids.length, enemies: (Engine.ENEMIES || []).length, page: Engine.S.ui.page, seenEnemies: Object.keys(Engine.S.seen.enemies).length };
  })()`);
  console.log('setup:', JSON.stringify(setup.result.value), setup.exceptionDetails ? setup.exceptionDetails.text : '');
  await sleep(700);
  for (const pg of pages) {
    const [p, sub] = pg.split('#');
    await js(`Engine.S.ui.page = ${JSON.stringify(p)}; ${sub ? `Engine.S.ui.tab.codex = ${JSON.stringify(sub)};` : ''} UI.closeModal(); UI.render(); 1`);
    if (p.endsWith('!tip')) {
      await js(`Engine.S.ui.page = ${JSON.stringify(p.replace('!tip', ''))}; UI.render();
        const el = document.querySelector('[data-tip-item]');
        if (el) UI.showTip(el.dataset.tipItem, el);
        1`);
    }
    await sleep(900);
    const shot = await call('Page.captureScreenshot', { format: 'png' });
    const file = join(outDir, pg.replace(/[:\/]/g, '_') + '.png');
    writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
    console.log('已保存', file);
  }
  if (errs.length) console.log('页面异常：', errs.slice(0, 5).join(' | '));
} finally {
  try { ws.close(); } catch (e) {}
  proc.kill();
}
