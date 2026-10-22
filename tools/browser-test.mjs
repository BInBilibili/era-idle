/* 真实浏览器交互测试（Edge DevTools 协议）：node tools/browser-test.mjs [url] */
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.argv[2] || 'file:///D:/game/%E4%BB%BF%E6%A2%85%E5%B0%94%E6%B2%83%E6%94%BE%E7%BD%AE%E6%B8%B8%E6%88%8F/index.html?demo&page=job:mining';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9400 + Math.floor(Math.random() * 200);
const prof = mkdtempSync(join(tmpdir(), 'era-bt-'));
const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, '--window-size=1440,900', url], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let fails = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };

async function target() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json`);
      if (r.ok) {
        const page = (await r.json()).find(t => t.type === 'page');
        if (page) return page;
      }
    } catch (e) {}
    await sleep(250);
  }
  throw new Error('DevTools 未就绪');
}

const page = await target();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0;
const pending = new Map();
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function call(method, params) {
  const id = ++seq;
  return new Promise(res => { pending.set(id, res); ws.send(JSON.stringify({ id, method, params: params || {} })); });
}
async function js(expr) {
  const r = await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result.exceptionDetails) throw new Error((r.result.exceptionDetails.exception || {}).description || JSON.stringify(r.result.exceptionDetails));
  return r.result.result.value;
}
try {
  await call('Runtime.enable');
  await sleep(1600);
  await js('UI.closeModal()');
  await sleep(200);

  console.log('== 版本号 ==');
  const ver = await js(`document.getElementById('hudVer').textContent`);
  ok(/^v0\.0\.\d+$/.test(ver), 'HUD 显示测试版版本号：' + ver);

  console.log('== 点击入驻槽 ==');
  const modalOpened = await js(`(function(){
    const slot=document.querySelector('[data-act="recslot"]');
    if(!slot) return 'NO_SLOT';
    slot.click();
    const m=document.getElementById('modal');
    return (m.classList.contains('show')? 'OPEN ':'CLOSED ') + document.getElementById('modalBox').textContent.slice(0,24);
  })()`);
  ok(/^OPEN/.test(modalOpened), '点击槽位弹出选择框：' + modalOpened);

  const picked = await js(`(function(){
    const chip=document.querySelector('[data-act="pickchar"]');
    if(!chip) return 'NO_CHIP';
    chip.click();
    return 'n=' + Engine.assignedCount(Engine.JOB_BY_ID.mining);
  })()`);
  ok(picked === 'n=1', '弹窗选人后入驻成功：' + picked);

  console.log('== 拖拽入驻（切到另一条配方）==');
  const dropped = await js(`(function(){
    Engine.clearSlot('mining',0);
    UI.render();
    const chip=document.querySelector('[data-drag="char"]');
    const slots=[...document.querySelectorAll('[data-act="recslot"]')];
    const slot=slots[3]||slots[1];
    if(!chip||!slot) return 'MISSING';
    const dt=new DataTransfer();
    chip.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));
    slot.dispatchEvent(new DragEvent('dragover',{bubbles:true,dataTransfer:dt}));
    slot.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt}));
    return 'n=' + Engine.assignedCount(Engine.JOB_BY_ID.mining) + ' slots=' + JSON.stringify(Engine.S.jobs.mining.slots);
  })()`);
  ok(/^n=1/.test(dropped), '拖拽入驻成功：' + dropped);

  console.log('== 设置 / 主题 ==');
  const dbg = await js(`(function(){
    const b=document.getElementById('btnSettings');
    const orig=UI.modal, oc=UI.closeModal; let calls=0, closed=0, stack='';
    UI.modal=function(h){ calls++; return orig.call(UI,h); };
    UI.closeModal=function(){ closed++; stack=new Error().stack.split('\\n').slice(1,4).join(' / '); return oc.call(UI); };
    b.click();
    UI.modal=orig; UI.closeModal=oc;
    return 'modalCalls=' + calls + ' closeCalls=' + closed + ' modal=' + document.getElementById('modal').className + ' stack=' + stack;
  })()`);
  const dbg2 = await js(`(function(){
    const b=document.getElementById('btnSettings');
    if(!b) return 'NO_BTN';
    try { b.onclick(); } catch(e) { return 'ERR '+e.message; }
    return 'modal=' + document.getElementById('modal').className + ' btns=' + document.querySelectorAll('#modalBox [data-theme]').length;
  })()`);
  console.log('  · 诊断1：' + dbg);
  console.log('  · 诊断2：' + dbg2);
  const theme = await js(`(function(){
    const light=[...document.querySelectorAll('#modalBox [data-theme]')].find(x=>x.dataset.theme==='light');
    if(!light) return 'NO_LIGHT';
    light.click();
    return document.documentElement.dataset.theme + '|' + (Engine.S.settings||{}).theme;
  })()`);
  ok(theme === 'light|light', '切到浅色主题：' + theme);
  const back = await js(`(function(){
    document.getElementById('btnSettings').click();
    [...document.querySelectorAll('#modalBox [data-theme]')].find(b=>b.dataset.theme==='dark').click();
    return document.documentElement.dataset.theme;
  })()`);
  ok(back === 'dark', '切回深色：' + back);

  console.log('== 精通条实时更新 ==');
  const mastery = await js(`(function(){
    UI.closeModal();
    Engine.S.ui.page='job:woodcutting';
    UI.render();
    Engine.assignSlot('woodcutting',0,'player');
    UI.render();
    const bar=document.querySelector('[data-live="mastery"]');
    if(!bar) return 'NO_BAR';
    const before=bar.querySelector('i').style.width;
    for(let i=0;i<300;i++){ Engine.tick(0.2); }
    UI.tick();
    const after=bar.querySelector('i').style.width;
    const lvl=document.querySelector('[data-live="masterylvl"]').textContent;
    return before+' -> '+after+' lv='+lvl;
  })()`);
  ok(mastery.includes(' -> ') && mastery.split(' -> ')[0] !== mastery.split(' -> ')[1], '精通条宽度变化：' + mastery);

  console.log('== 科技树在科研页 ==');
  const tech = await js(`(function(){
    Engine.S.ui.page='job:research'; UI.render();
    return (document.body.textContent.indexOf('科技树')>=0) + '|' + document.querySelectorAll('[data-act="tech"]').length;
  })()`);
  ok(/^true\|/.test(tech), '科研页含科技树：' + tech);
} catch (e) {
  console.error('测试异常：', e.message);
  fails++;
} finally {
  try { ws.close(); } catch (e) {}
  proc.kill();
}
console.log(fails ? ('\n✗ 失败 ' + fails + ' 项') : '\n✓ 浏览器交互全部通过');
process.exit(fails ? 1 : 0);
