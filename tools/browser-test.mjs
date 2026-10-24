/* 真实浏览器交互测试（Edge DevTools 协议）：node tools/browser-test.mjs [url] */
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.argv[2] || 'file:///D:/game/%E4%BB%BF%E6%A2%85%E5%B0%94%E6%B2%83%E6%94%BE%E7%BD%AE%E6%B8%B8%E6%88%8F/index.html?demo&page=job:gathering';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9400 + Math.floor(Math.random() * 200);
const prof = process.env.ERA_PROFILE || mkdtempSync(join(tmpdir(), 'era-bt-'));
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

  console.log('== HUD 布局 ==');
  const layout = await js(`(function(){
    const b=document.querySelector('.brand').getBoundingClientRect();
    const r=document.getElementById('resbar').getBoundingClientRect();
    const a=document.querySelector('.acts').getBoundingClientRect();
    return Math.round(r.left)+','+Math.round(r.top)+','+Math.round(b.right)+','+Math.round(a.left);
  })()`);
  const [rl, rt, br, al] = layout.split(',').map(Number);
  ok(rl > br - 5 && rl < al, '资源条在版本号右侧、按钮左侧：' + layout);
  const rate = await js(`(document.querySelector('.res.food .rate')||{}).textContent||''`);
  ok(/-\d+\.\d\d\/秒|0\/秒/.test(rate), '食物显示每秒消耗：' + rate);

  console.log('== 开局导航：只显示采集 ==');
  const nav = await js(`(function(){
    const items=[...document.querySelectorAll('#side .nav')].map(n=>(n.querySelector('.nm')||{}).textContent||'');
    return JSON.stringify(items);
  })()`);
  const navNames = JSON.parse(nav);
  ok(navNames.includes('采集'), '开局有采集：' + navNames.join('/'));
  ok(!navNames.includes('科研') && !navNames.includes('伐木') && !navNames.includes('采矿') && !navNames.includes('医疗'), '开局不显示科研 / 伐木 / 采矿 / 医疗');

  console.log('== 里程碑：停在工作页也会出现 ==');
  const milestoneGain = await js(`(function(){
    Engine.addItem('木材',1); Engine.addItem('石头',1);
    return JSON.stringify(Engine.S.milestones);
  })()`);
  await sleep(700);
  const navAfter = JSON.parse(await js(`JSON.stringify([...document.querySelectorAll('#side .nav .nm')].map(n=>n.textContent))`));
  ok(milestoneGain.includes('wood_stone') && navAfter.includes('伐木') && navAfter.includes('采矿'), '拿到 1 木材 + 1 石头后，伐木 / 采矿立刻出现在导航：' + navAfter.join('/'));

  console.log('== 点击入驻槽：下拉菜单 ==');
  const dropdown = await js(`(function(){
    const slot=document.querySelector('[data-act="recslot"]');
    if(!slot) return 'NO_SLOT';
    slot.click();
    const menu=document.getElementById('slotMenu');
    const modal=document.getElementById('modal').classList.contains('show');
    return (menu? 'OPEN ':'MISSING ') + 'modal=' + modal + ' ' + (menu?menu.textContent.slice(0,24):'');
  })()`);
  ok(/^OPEN/.test(dropdown) && dropdown.includes('modal=false'), '点击槽位弹出下拉菜单而非弹窗：' + dropdown);

  const picked = await js(`(function(){
    const chip=document.querySelector('#slotMenu [data-pickchar]');
    if(!chip) return 'NO_CHIP';
    chip.click();
    return 'menu=' + (document.getElementById('slotMenu')?'OPEN':'CLOSED') + ' n=' + Engine.assignedCount(Engine.JOB_BY_ID.gathering);
  })()`);
  ok(picked.startsWith('menu=CLOSED') && picked.endsWith('n=1'), '下拉选人后入驻成功（采集）：' + picked);

  console.log('== 整张项目卡拖拽 ==');
  const dropped = await js(`(function(){
    const S=Engine.S;
    Object.keys(S.jobs.gathering.slots).forEach((_,i)=>{ Engine.clearSlot('gathering',i); });
    UI.render();
    const chip=document.querySelector('[data-drag="char"]');
    const cards=[...document.querySelectorAll('[data-drop-job]')];
    const card=cards[1]||cards[0];
    if(!chip||!card) return 'MISSING';
    const dt=new DataTransfer();
    chip.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));
    card.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt}));
    const highlighted=card.classList.contains('dropok');
    card.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));
    return 'hl=' + highlighted + ' n=' + Engine.assignedCount(Engine.JOB_BY_ID.gathering) + ' slots=' + JSON.stringify(Engine.S.jobs.gathering.slots);
  })()`);
  ok(/^hl=true/.test(dropped) && / n=1/.test(dropped), '整张项目卡片可拖入：' + dropped);

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
  await sleep(250);
  const lightAudit = await js(`(function(){
    const bad=[];
    document.querySelectorAll('body *').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.width*r.height<250) return;
      const bg=getComputedStyle(el).backgroundColor;
      const m=bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
      if(!m) return;
      const a=m[4]===undefined?1:parseFloat(m[4]);
      if(a<0.5) return;
      const L=(+m[1]*0.2126 + +m[2]*0.7152 + +m[3]*0.0722)/255;
      if(L>=0.45) return;
      const cls=el.getAttribute('class')||'';
      if(el.tagName.toLowerCase()==='i') return;
      if(cls.includes('av') || cls.includes('primary')) return;
      bad.push(el.tagName.toLowerCase()+'.'+cls.split(/\\s+/).join('.')+' '+bg);
    });
    return [...new Set(bad)].join(' | ') || 'NONE';
  })()`);
  ok(lightAudit === 'NONE', '浅色主题无深色底残留：' + lightAudit);
  const back = await js(`(function(){
    document.getElementById('btnSettings').click();
    [...document.querySelectorAll('#modalBox [data-theme]')].find(b=>b.dataset.theme==='dark').click();
    return document.documentElement.dataset.theme;
  })()`);
  ok(back === 'dark', '切回深色：' + back);

  console.log('== 精通条实时更新 ==');
  const mastery = await js(`(function(){
    UI.closeModal();
    Engine.S.ui.page='job:gathering';
    Engine.S.ui.scroll=0;
    UI.render();
    Engine.assignSlot('gathering',1,'player');
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
    const S=Engine.S;
    S.milestones.research_ready=true;
    S.jobs.research.up[0]=1;
    S.ui.page='job:research'; S.ui.scroll=0; UI.render();
    return (document.body.textContent.indexOf('科技树')>=0) + '|' + document.querySelectorAll('[data-act="tech"]').length;
  })()`);
  ok(/^true\|/.test(tech), '科研页含科技树：' + tech);

  console.log('== 导航：无战斗分组 / 被动名称无 # ==');
  const navGroups = await js(`(function(){
    const groups=[...document.querySelectorAll('#side .grp')].map(g=>g.textContent.trim());
    const names=[...document.querySelectorAll('#side .nav .nm')].map(n=>n.textContent.trim());
    return JSON.stringify({groups,names});
  })()`);
  const ng = JSON.parse(navGroups);
  ok(!ng.groups.includes('战斗'), '导航不再有「战斗」分组：' + ng.groups.join('/'));
  ok(!ng.names.some(n => n.startsWith('#')), '导航名称不含 #');
  ok(['住所与娱乐','防御','商店','角色','图鉴','仓库'].every(n => ng.names.includes(n)), '被动六项使用无 # 名称');

  console.log('== 科技卡显示作用 ==');
  const techEffect = await js(`(function(){
    const card=document.querySelector('.tech');
    if(!card) return 'NO_CARD';
    const k=card.querySelector('.tu .tk');
    const li=card.querySelector('.tu li');
    return (k?k.textContent:'') + '|' + (li?li.textContent:'') + '|' + document.querySelectorAll('.tech .tu').length;
  })()`);
  ok(/^作用\|解锁工作「烹饪」\|[1-9]/.test(techEffect), '科技卡列出具体作用：' + techEffect);

  console.log('== 招募：限定 / 常驻 ==');
  const recruit = await js(`(function(){
    Engine.S.ui.page='recruit';
    Engine.addItem('招募券', 30);
    UI.render();
    const btns=[...document.querySelectorAll('[data-act="pull"]')];
    const txt=document.getElementById('mainWrap').textContent;
    return JSON.stringify({
      pools: btns.map(b=>b.dataset.id),
      btn: btns.map(b=>b.textContent.trim()),
      hint: txt.includes('使用招募券概率获取到角色'),
      normal: txt.includes('随机普通角色')
    });
  })()`);
  const rc = JSON.parse(recruit);
  ok(rc.pools.join(',') === 'limited,standard', '招募页只有限定 / 常驻两个池：' + rc.pools.join(','));
  ok(rc.btn.length === 2 && rc.btn.every(t => t.includes('10 招募券')), '每池按钮都是 10 招募券：' + rc.btn.join(' | '));
  ok(rc.hint && rc.normal, '招募页写明招募券概率、随机普通角色');

  console.log('== 开除随机普通角色 ==');
  const dismiss = await js(`(function(){
    const S=Engine.S;
    S.gacha.noNew.standard=30;
    Engine.addItem('招募券', 20);
    const r=Engine.pull('standard');
    if(!r.ok||!r.gen) return JSON.stringify({bad:'抽卡没出普通角色：'+r.type});
    const cid=r.hero.id;
    S.ui.page='characters'; S.ui.charSel=cid;
    UI.render();
    const del=document.querySelector('[data-act="dismissChar"]');
    if(!del) return JSON.stringify({bad:'角色页没有开除按钮'});
    del.click();
    const okBtn=document.getElementById('okDismiss');
    if(!okBtn) return JSON.stringify({bad:'没有确认框'});
    okBtn.click();
    return JSON.stringify({gone: !Engine.S.chars[cid], inList: Engine.S.order.indexOf(cid)>=0, btn: true});
  })()`);
  const dm = JSON.parse(dismiss);
  ok(!dm.bad, '开除流程可用：' + (dm.bad || '有按钮 → 有确认框'));
  ok(dm.gone && !dm.inList, '确认后角色永久移出存档与角色列表');

  console.log('== 角色页滚动不跳回顶部 ==');
  const sc1 = await js(`(function(){
    const S=Engine.S; S.ui.page='characters';
    Engine.TECHS.forEach(t => { S.techs[t.id] = true; });   // 解锁全部工作，让精通窗口够长、能滚动
    S.ui.charSel = Object.keys(S.chars)[0];
    UI.render();
    const box=document.querySelector('.mastery');
    if(!box) return JSON.stringify({miss:true});
    box.scrollTop = 80;
    return JSON.stringify({overflow: box.scrollHeight > box.clientHeight + 20, top: box.scrollTop, sh: box.scrollHeight, ch: box.clientHeight});
  })()`);
  const s1 = JSON.parse(sc1);
  ok(!s1.miss && s1.overflow && s1.top > 0, '精通窗口可滚动且已下拉：top=' + s1.top + ' overflow=' + s1.overflow + ' h=' + s1.sh + '/' + s1.ch);
  await sleep(2000);
  const sc2 = await js(`JSON.stringify({top: document.querySelector('.mastery') ? document.querySelector('.mastery').scrollTop : -1})`);
  const s2 = JSON.parse(sc2);
  ok(s2.top === s1.top, '1.5 秒整页重绘后滚动位置保持：' + s2.top);

  console.log('== 图鉴领取 ==');
  const codex = await js(`(function(){
    Engine.S.ui.page='codex';
    Engine.S.ui.tab.codex='items';
    Engine.addItem('木材',1);
    UI.render();
    const claims=[...document.querySelectorAll('[data-act="claimCodex"]')];
    const all=document.querySelector('[data-act="claimAllCodex"]');
    const gold=document.querySelectorAll('.card.claim').length;
    const before=Engine.shardCount();
    const btn=claims[0];
    if(btn) btn.click();
    return JSON.stringify({claims: claims.length, gold, all: !!all, before, after: Engine.shardCount()});
  })()`);
  const cx = JSON.parse(codex);
  ok(cx.gold > 0 && cx.claims > 0, '收录条目有金边 + 领取按钮：金边 ' + cx.gold + ' / 按钮 ' + cx.claims);
  ok(cx.all, '有未领奖励时显示「全部领取」');
  ok(cx.after === cx.before + 1, '点领取到账 1 张招募券：' + cx.before + ' → ' + cx.after);

  console.log('== 物品悬浮面板 ==');
  const tipCodex = await js(`(function(){
    const S=Engine.S;
    S.ui.page='codex'; S.ui.tab.codex='items';
    Engine.addItem('石斧',1); S.seen.items['stone_axe']=true;
    UI.render();
    const card=document.querySelector('#mainWrap [data-tip-item="stone_axe"]');
    if(!card) return JSON.stringify({miss:'图鉴卡片没有 data-tip-item'});
    card.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,clientX:300,clientY:300}));
    const tip=document.getElementById('itemTip');
    const txt=tip.textContent;
    return JSON.stringify({show:tip.classList.contains('show'), name:txt.includes('石斧'), str:txt.includes('+18'),
      pen:txt.includes('破甲'), price:txt.includes('90'), power:txt.includes('+36'), rows:tip.querySelectorAll('.ttRow').length});
  })()`);
  const tc = JSON.parse(tipCodex);
  ok(!tc.miss, '图鉴物品卡挂上悬浮锚点：' + (tc.miss || '有 data-tip-item'));
  ok(tc.show && tc.name && tc.str, '面板显示名称与力量：show=' + tc.show + ' 力量+' + tc.str + ' 行数=' + tc.rows);
  ok(tc.pen && tc.power && tc.price, '武器专属行出现：破甲=' + tc.pen + ' 战力=' + tc.power + ' 卖价=' + tc.price);

  const tipJob = await js(`(function(){
    const S=Engine.S;
    S.ui.page='job:crafting'; UI.render();
    const card=document.querySelector('#mainWrap .card.recipe[data-tip-item]');
    if(!card) return JSON.stringify({miss:'加工页没有物品卡片'});
    card.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,clientX:300,clientY:300}));
    const tip=document.getElementById('itemTip');
    const badges=[...document.querySelectorAll('#mainWrap .badge.io')];
    const noIcon=badges.filter(b=>!b.querySelector('svg.icSvg') && !b.querySelector('.icSvg')).map(b=>b.textContent.trim());
    return JSON.stringify({show:tip.classList.contains('show'), badges:badges.length,
      noIcon:noIcon.slice(0,3), title:document.body.innerHTML.indexOf('拖入角色到整张卡即可入驻')});
  })()`);
  const tj = JSON.parse(tipJob);
  ok(!tj.miss && tj.show, '工作页物品卡片可悬浮出面板：' + (tj.miss || 'show=' + tj.show));
  ok(tj.badges > 0 && tj.noIcon.length === 0, '产出/消耗徽章都带物品图标：' + tj.badges + ' 个，缺图标 [' + tj.noIcon.join('、') + ']');
  ok(tj.title === -1, '不再显示「拖入角色到整张卡即可入驻」');

  const tipPos = await js(`(function(){
    const card=document.querySelector('#mainWrap [data-tip-item]');
    if(!card) return JSON.stringify({miss:true});
    const r=card.getBoundingClientRect();
    card.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,clientX:r.left+6,clientY:r.top+6}));
    const t=document.getElementById('itemTip').getBoundingClientRect();
    const anchor=UI._tipEl ? UI._tipEl.getBoundingClientRect() : null;
    return JSON.stringify({cb:Math.round(r.bottom),ct:Math.round(r.top),tt:Math.round(t.top),tb:Math.round(t.bottom),
      cm:Math.round(r.left+r.width/2),tm:Math.round(t.left+t.width/2),
      ab: anchor?Math.round(anchor.bottom):-1, at: anchor?Math.round(anchor.top):-1,
      style: document.getElementById('itemTip').style.top, tag: UI._tipEl ? UI._tipEl.className : 'none'});
  })()`);
  const tp = JSON.parse(tipPos);
  const below = tp.tt >= tp.cb - 1, above = tp.tb <= tp.ct + 1;
  ok(!tp.miss && (below || above), '面板固定在卡片上/下一侧，不跟鼠标：' + JSON.stringify(tp));
  ok(!tp.miss && Math.abs(tp.tm - tp.cm) <= 26, '面板水平居中对齐卡片：卡片 ' + tp.cm + ' / 面板 ' + tp.tm);

  const tipAnchor = await js(`(function(){
    const card=document.querySelector('#mainWrap [data-tip-item]');
    if(!card) return JSON.stringify({miss:true});
    const r=card.getBoundingClientRect();
    const x=Math.round(r.left+r.width/2), y=Math.round(r.top+r.height/2);
    card.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,clientX:x,clientY:y}));
    return JSON.stringify({x,y,before:document.getElementById('itemTip').classList.contains('show')});
  })()`);
  const ta = JSON.parse(tipAnchor);
  await sleep(1900);
  const tipAfter = JSON.parse(await js(`JSON.stringify({show:document.getElementById('itemTip').classList.contains('show'), id:UI._tipId})`));
  ok(ta.before && tipAfter.show && tipAfter.id, '1.5 秒整页重绘后面板仍然跟随：' + JSON.stringify({before:ta.before,after:tipAfter.show,id:tipAfter.id}));

  console.log('== 住房页（5→18，无舒适度门槛）==');
  const house = await js(`(function(){
    Engine.S.ui.page='housing'; UI.render();
    const txt=document.getElementById('mainWrap').textContent;
    const badges=[...document.querySelectorAll('#mainWrap .badge')].map(b=>b.textContent.trim());
    return JSON.stringify({hasMin: txt.indexOf('min(')>=0, comfortGate: txt.indexOf('舒适度 ≥')>=0,
      caps: badges.filter(b=>/可上场 \\d+ 人/.test(b))});
  })()`);
  const hh = JSON.parse(house);
  ok(!hh.hasMin && !hh.comfortGate, '住房页不再有 min() 公式 / 舒适度门槛：min=' + hh.hasMin + ' 门槛=' + hh.comfortGate);
  ok(hh.caps.length > 0 && hh.caps[0] === '可上场 7 人', '当前档显示「可上场 N 人」：' + hh.caps.join(' / '));

  console.log('== 角色页装备悬停看面板 ==');
  const charTip = await js(`(function(){
    const S=Engine.S;
    S.ui.page='characters'; S.ui.charSel='player';
    Engine.addItem('石斧',2);
    S.chars.player.eq.mainhand='stone_axe';
    UI.render();
    const slot=document.querySelector('[data-act="eqslot"][data-slot="mainhand"]');
    if(!slot) return JSON.stringify({miss:'没有主手装备槽'});
    slot.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,clientX:400,clientY:400}));
    const tip=document.getElementById('itemTip');
    const txt=tip.textContent;
    const grid=document.querySelector('#mainWrap .wgrid [data-tip-item="stone_axe"]');
    return JSON.stringify({show:tip.classList.contains('show'), name:txt.includes('石斧'),
      pen:txt.includes('破甲'), grid:!!grid, title:slot.hasAttribute('title')});
  })()`);
  const ct = JSON.parse(charTip);
  ok(!ct.miss && ct.show && ct.name && ct.pen, '悬停已装备的物品弹出面板（含破甲）：' + (ct.miss || JSON.stringify({show:ct.show,name:ct.name,pen:ct.pen})));
  ok(ct.grid, '仓库装备格也挂了面板锚点');
  ok(ct.title === false, '装备槽不再用 title 原生提示（避免双份提示）');

  console.log('== 角色补给栏：食物 / 医物下拉 ==');
  const supply = await js(`(function(){
    const S=Engine.S;
    S.ui.page='characters'; S.ui.charSel='player'; S.ui.scroll=0;
    Engine.addItem('素餐',5); Engine.addItem('草药',3);
    UI.render();
    const fs=document.querySelector('[data-act="foodslot"]');
    if(!fs) return JSON.stringify({miss:'没有食物栏'});
    fs.click();
    const foodTxt=(document.getElementById('modalBox')||{}).textContent||'';
    const foodBtn=[...document.querySelectorAll('#modalBox [data-pick]')].find(b=>b.dataset.pick===Engine.N2I('素餐'));
    if(!foodBtn) return JSON.stringify({miss:'食物列表没有素餐'});
    foodBtn.click();
    const foodSet=S.chars.player.food===Engine.N2I('素餐');
    const ms=document.querySelector('[data-act="medslot"]');
    if(!ms) return JSON.stringify({miss:'没有医物栏'});
    ms.click();
    const medTxt=(document.getElementById('modalBox')||{}).textContent||'';
    const medBtn=[...document.querySelectorAll('#modalBox [data-pick]')].find(b=>b.dataset.pick===Engine.N2I('草药'));
    if(!medBtn) return JSON.stringify({miss:'医物列表没有草药'});
    medBtn.click();
    return JSON.stringify({foodTitle:foodTxt.includes('食物栏'), foodList:foodTxt.includes('素餐'), foodSet:foodSet,
      medTitle:medTxt.includes('医物栏'), medList:medTxt.includes('草药'), medSet:S.chars.player.med===Engine.N2I('草药'),
      buff:Engine.foodXpMult(S.chars.player)});
  })()`);
  const sp = JSON.parse(supply);
  ok(!sp.miss && sp.foodTitle && sp.foodList && sp.foodSet, '食物栏下拉列出食物并装备成功：' + (sp.miss || JSON.stringify(sp)));
  ok(!sp.miss && sp.medTitle && sp.medList && sp.medSet, '医物栏下拉列出医物并装备成功');
  ok(sp.buff === 1.25, '装备素餐且粮仓有货 → 精通经验 ×1.25');

  console.log('== 图鉴：滚动 / 选中文本不会被重绘清掉 ==');
  const codexScroll = await js(`(function(){
    const S=Engine.S;
    S.ui.page='codex'; S.ui.tab.codex='items'; S.ui.scroll=0;
    UI.render();
    const p=document.getElementById('page');
    p.scrollTop=180;
    const sel=window.getSelection();
    const walker=document.createTreeWalker(document.getElementById('mainWrap'),NodeFilter.SHOW_TEXT);
    let node=null, guard=0;
    while((node=walker.nextNode())&&guard++<500){ if(node.nodeValue && node.nodeValue.trim().length>3) break; }
    if(node){ const r=document.createRange(); r.setStart(node,0); r.setEnd(node,Math.min(4,node.nodeValue.length)); sel.removeAllRanges(); sel.addRange(r); }
    return JSON.stringify({top:p.scrollTop, sel:sel.toString(), hasNode:!!node});
  })()`);
  const cs0 = JSON.parse(codexScroll);
  ok(cs0.top > 0 && cs0.sel.length > 0, '图鉴已滚动并选中文本：top=' + cs0.top + ' sel=' + cs0.sel);
  await sleep(2100);
  const codexAfter = JSON.parse(await js(`JSON.stringify({top:document.getElementById('page').scrollTop, sel:window.getSelection().toString()})`));
  ok(codexAfter.top === cs0.top, '图鉴滚动位置 2 秒后保持：' + codexAfter.top);
  ok(codexAfter.sel === cs0.sel, '图鉴选中文本 2 秒后保持：' + codexAfter.sel);

  const warehouseSel = await js(`(function(){
    const S=Engine.S;
    S.ui.page='warehouse'; S.ui.tab.wh='warehouse'; S.ui.scroll=0;
    Engine.addItem('石斧',2); Engine.addItem('木材',200);
    UI.render();
    const sel=window.getSelection();
    const walker=document.createTreeWalker(document.getElementById('mainWrap'),NodeFilter.SHOW_TEXT);
    let node=null, guard=0;
    while((node=walker.nextNode())&&guard++<1000){ if(node.nodeValue && node.nodeValue.trim().length>3) break; }
    if(!node) return 'NO_NODE';
    const r=document.createRange(); r.setStart(node,0); r.setEnd(node,Math.min(4,node.nodeValue.length)); sel.removeAllRanges(); sel.addRange(r);
    return sel.toString();
  })()`);
  ok(warehouseSel !== 'NO_NODE' && warehouseSel.length > 0, '仓库页选中文本：' + warehouseSel);
  await sleep(2100);
  const warehouseAfter = await js(`window.getSelection().toString()`);
  ok(warehouseAfter === warehouseSel, '1.5 秒整页重绘后选中文本仍保持：' + warehouseAfter);

  console.log('== 资源包悬浮显示产物概率 ==');
  const bundleTip = await js(`(function(){
    const S=Engine.S;
    S.ui.page='job:gathering'; S.ui.scroll=0; UI.render();
    const card=document.querySelector('#mainWrap .card.recipe[data-tip-item]');
    if(!card) return JSON.stringify({miss:'没有采集项目卡'});
    card.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,clientX:320,clientY:320}));
    const txt=document.getElementById('itemTip').textContent;
    return JSON.stringify({show:document.getElementById('itemTip').classList.contains('show'), list:txt.includes('产物列表'), pct:txt.includes('%'), fiber:txt.includes('植物纤维')});
  })()`);
  const bt = JSON.parse(bundleTip);
  ok(!bt.miss && bt.show && bt.list && bt.pct && bt.fiber, '资源包悬停：产物列表 + 概率 + 物品名：' + (bt.miss || JSON.stringify(bt)));

  console.log('== 开发者模式后门 ==');
  const dev = await js(`(function(){
    Engine.S.dev=true;
    window.DEV.open();
    const txt=document.getElementById('modalBox').textContent;
    const before=Engine.S.gold;
    const btn=document.querySelector('#modalBox [data-dev="gold"]');
    if(!btn) return JSON.stringify({miss:'没有金币按钮'});
    btn.click();
    return JSON.stringify({open:txt.includes('开发者模式'), gain:Engine.S.gold-before, hasUnlock:!!document.querySelector('#modalBox [data-dev="unlock"]')});
  })()`);
  const dv = JSON.parse(dev);
  ok(!dv.miss && dv.open && dv.gain === 100000 && dv.hasUnlock, '开发者面板打开且操作生效：' + (dv.miss || JSON.stringify(dv)));
  await js('window.DEV.off(); true');
  ok(await js('Engine.S.dev === false'), '开发者模式可关闭');
} catch (e) {
  console.error('测试异常：', e.message);
  fails++;
} finally {
  try { ws.close(); } catch (e) {}
  proc.kill();
}
console.log(fails ? ('\n✗ 失败 ' + fails + ' 项') : '\n✓ 浏览器交互全部通过');
process.exit(fails ? 1 : 0);
