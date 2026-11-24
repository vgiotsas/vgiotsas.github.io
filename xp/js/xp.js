/* VGOS: window manager and apps for v.giotsas.com/xp */
(function () {
  'use strict';
  const D = window.VG, I = window.ICON;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mobile = () => window.matchMedia('(max-width:700px)').matches;
  const HOME = 'C:\\Documents and Settings\\Vasilis';
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------------- Screens ---------------- */
  const boot = $('#boot'), login = $('#login'), shutdown = $('#shutdown');
  const desktop = $('#desktop'), taskbar = $('#taskbar');
  $('#boot-logo').innerHTML = I.mark() + '<div class="boot-name">VGOS<small>Vasilis Giotsas Operating System</small></div>';
  $('#login-off-icon').innerHTML = I.power();
  $('#start-mark').innerHTML = I.mark();
  $('#tray-net').innerHTML = I.tray_net();
  $('#tray-vol').innerHTML = I.speaker();

  let bootTimer = null;
  function showBoot() {
    closeAll(); hideAllScreens(); boot.hidden = false; boot.focus();
    bootTimer = setTimeout(showLogin, 2600);
  }
  function showLogin() {
    clearTimeout(bootTimer); hideAllScreens(); login.hidden = false;
    setTimeout(() => $('#user-tile').focus(), 50);
  }
  function hideAllScreens() { [boot, login, shutdown].forEach(s => { s.hidden = true; }); desktop.hidden = true; taskbar.hidden = true; closeStart(); }
  function logOn() {
    hideAllScreens(); desktop.hidden = false; taskbar.hidden = false; store.set('vg-on', '1'); restoreIcons();
    const deep = (location.hash || '').slice(1);
    if (deep && APPS[deep]) APPS[deep]();
    setTimeout(() => balloon('AS207135 is now connected', `Welcome, visitor. ${mobile() ? 'Tap' : 'Double-click'} any icon to explore my CV, or open the Start menu.`), 900);
  }
  function powerOff() { closeAll(); hideAllScreens(); shutdown.hidden = false; }
  boot.addEventListener('click', showLogin);
  boot.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') showLogin(); });
  $('#user-tile').addEventListener('click', logOn);
  $('#login-off').addEventListener('click', powerOff);
  $('#restart').addEventListener('click', showBoot);

  /* ---------------- Tray, clock, balloons ---------------- */
  function tick() { const d = new Date(); $('#clock').textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  tick(); setInterval(tick, 15000);
  let balloonEl = null, balloonTimer = null;
  function balloon(title, text) {
    if (balloonEl) balloonEl.remove();
    clearTimeout(balloonTimer);
    balloonEl = el(`<div class="balloon" role="status"><button class="x" type="button" aria-label="Close">✕</button><b>${I.info()}${esc(title)}</b>${esc(text)}</div>`);
    balloonEl.querySelector('.x').onclick = () => { balloonEl.remove(); balloonEl = null; };
    document.body.appendChild(balloonEl);
    balloonTimer = setTimeout(() => { if (balloonEl) { balloonEl.remove(); balloonEl = null; } }, 7000);
  }
  $('#tray-net').onclick = () => balloon('AS207135: connected', 'IPv6-only network, run with my son. Speed: plenty. Status: peering is caring.');
  $('#tray-vol').onclick = () => balloon('Volume', 'There is no sound here. Only packets.');

  /* ---------------- Window manager ---------------- */
  const wins = new Map();
  let z = 100, cascade = 0;
  const winLayer = $('#windows'), tasks = $('#tasks');

  function openWin(id, o) {
    if (wins.has(id)) { const w = wins.get(id); restore(id); if (o.update) o.update(w); return w; }
    const vw = window.innerWidth, vh = window.innerHeight - 30;
    const w = Math.min(o.w || 640, vw - 16), h = Math.min(o.h || 440, vh - 16);
    const left = Math.max(8, Math.round((vw - w) / 2 - 120 + (cascade % 6) * 28));
    const top = Math.max(8, Math.round((vh - h) / 2 - 60 + (cascade % 6) * 24));
    cascade++;
    const node = el(`<section class="win" role="dialog" aria-label="${esc(o.title)}" style="left:${left}px;top:${top}px;width:${w}px;height:${h}px">
      <div class="tb">${I[o.icon || 'folder']().replace('<svg', '<svg class="ti"')}<span class="tt">${esc(o.title)}</span>
        <button type="button" class="min" aria-label="Minimise">${I.min()}</button>
        <button type="button" class="max" aria-label="Maximise">${I.maxi()}</button>
        <button type="button" class="close" aria-label="Close">${I.x()}</button></div>
      <div class="body"></div><div class="grip" aria-hidden="true"></div></section>`);
    const body = node.querySelector('.body');
    if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
    const task = el(`<button type="button" class="task" title="${esc(o.title)}">${I[o.icon || 'folder']()}<span>${esc(o.title)}</span></button>`);
    const rec = { id, node, body, task, o, setTitle };
    function setTitle(t) { node.querySelector('.tt').textContent = t; task.querySelector('span').textContent = t; task.title = t; node.setAttribute('aria-label', t); }
    wins.set(id, rec);
    winLayer.appendChild(node); tasks.appendChild(task);
    node.addEventListener('pointerdown', () => focusWin(id));
    node.querySelector('.close').onclick = e => { e.stopPropagation(); closeWin(id); };
    node.querySelector('.min').onclick = e => { e.stopPropagation(); minimise(id); };
    node.querySelector('.max').onclick = e => { e.stopPropagation(); toggleMax(id); };
    task.onclick = () => {
      if (node.hidden) restore(id);
      else if (node.classList.contains('inactive')) focusWin(id);
      else minimise(id);
    };
    drag(node, node.querySelector('.tb'), id);
    resize(node, node.querySelector('.grip'));
    node.querySelector('.tb').addEventListener('dblclick', e => { if (!e.target.closest('button')) toggleMax(id); });
    if (o.max) toggleMax(id);
    focusWin(id);
    if (o.onOpen) o.onOpen(rec);
    return rec;
  }
  function focusWin(id) {
    const rec = wins.get(id); if (!rec) return;
    rec.node.style.zIndex = ++z;
    wins.forEach(r => { const on = r === rec; r.node.classList.toggle('inactive', !on); r.task.classList.toggle('active', on && !r.node.hidden); });
  }
  function restore(id) { const r = wins.get(id); if (!r) return; r.node.hidden = false; focusWin(id); }
  function minimise(id) {
    const r = wins.get(id); if (!r) return; r.node.hidden = true; r.task.classList.remove('active');
    const top = [...wins.values()].filter(x => !x.node.hidden).sort((a, b) => b.node.style.zIndex - a.node.style.zIndex)[0];
    if (top) focusWin(top.id);
  }
  function toggleMax(id) {
    const r = wins.get(id); if (!r) return;
    const on = r.node.classList.toggle('max');
    r.node.querySelector('.max').innerHTML = on ? I.restore() : I.maxi();
    r.node.querySelector('.max').setAttribute('aria-label', on ? 'Restore' : 'Maximise');
  }
  function closeWin(id) {
    const r = wins.get(id); if (!r) return;
    if (r.o.onClose) r.o.onClose(r);
    r.node.remove(); r.task.remove(); wins.delete(id);
    const top = [...wins.values()].filter(x => !x.node.hidden).sort((a, b) => b.node.style.zIndex - a.node.style.zIndex)[0];
    if (top) focusWin(top.id);
  }
  function closeAll() { [...wins.keys()].forEach(closeWin); }
  function drag(node, handle, id) {
    let sx, sy, ox, oy, on = false;
    handle.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || mobile() || node.classList.contains('max')) return;
      on = true; sx = e.clientX; sy = e.clientY; ox = node.offsetLeft; oy = node.offsetTop;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', e => {
      if (!on) return;
      const maxL = window.innerWidth - 80, maxT = window.innerHeight - 30 - 28;
      node.style.left = Math.min(maxL, Math.max(80 - node.offsetWidth, ox + e.clientX - sx)) + 'px';
      node.style.top = Math.min(maxT, Math.max(0, oy + e.clientY - sy)) + 'px';
    });
    const end = () => { on = false; };
    handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
  }
  function resize(node, grip) {
    let sx, sy, ow, oh, on = false;
    grip.addEventListener('pointerdown', e => { on = true; sx = e.clientX; sy = e.clientY; ow = node.offsetWidth; oh = node.offsetHeight; grip.setPointerCapture(e.pointerId); e.stopPropagation(); });
    grip.addEventListener('pointermove', e => {
      if (!on) return;
      node.style.width = Math.max(280, ow + e.clientX - sx) + 'px';
      node.style.height = Math.max(160, oh + e.clientY - sy) + 'px';
    });
    grip.addEventListener('pointerup', () => { on = false; });
  }

  /* Open-on-activate helper: double-click on desktop, single tap on touch screens, Enter on keyboard */
  function activatable(node, open, onSelect) {
    let lastTouch = false;
    node.addEventListener('pointerdown', e => { lastTouch = e.pointerType === 'touch'; });
    node.addEventListener('click', () => { if (onSelect) onSelect(); if (lastTouch || mobile()) open(); });
    node.addEventListener('dblclick', () => { if (!lastTouch && !mobile()) open(); });
    node.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  }

  /* ---------------- Virtual file system ---------------- */
  const ext = url => () => window.open(url, '_blank', 'noopener');
  /* Pictures saved from Paint, kept for this browser session */
  const drawings = () => { try { return JSON.parse(sessionStorage.getItem('vg-drawings')) || []; } catch (e) { return []; } };
  function addDrawing(src) {
    const list = drawings(), name = 'untitled-' + (list.length + 1) + '.png';
    list.push({ name, src });
    try { sessionStorage.setItem('vg-drawings', JSON.stringify(list)); return name; } catch (e) { return null; }
  }

  function fs(path) {
    const P = {
      'My Computer': {
        icon: 'computer', view: 'icons',
        tasks: [['View system information', 'info', () => APPS.system()]],
        items: [
          { name: 'Local Disk (C:)', icon: 'drive', info: 'Everything on this desktop.', open: () => nav('My Documents') },
          { name: 'Research (D:)', icon: 'drive', info: 'Papers, from video coding to BGP.', open: () => nav('My Documents\\Papers') },
          { name: 'Talks (E:)', icon: 'drive', info: 'Recorded talks.', open: () => nav('My Videos') },
          { name: 'AS207135 (N:)', icon: 'netdrive', info: 'My IPv6-only network, run with my son.', open: () => APPS.network() }
        ]
      },
      'My Documents': {
        icon: 'documents', view: 'icons',
        tasks: [['Open my resume', 'doc', () => APPS.resume()], ['Email me', 'mail', () => APPS.compose()]],
        items: [
          { name: 'Papers', icon: 'folder', info: `${D.papers.length} selected papers. All 60 are on Google Scholar.`, open: () => nav('My Documents\\Papers') },
          { name: 'Articles', icon: 'articles', info: 'Blog posts and articles for engineers and operators.', open: () => nav('My Documents\\Articles') },
          { name: 'My Pictures', icon: 'pictures', open: () => nav('My Pictures') },
          { name: 'My Videos', icon: 'videos', open: () => nav('My Videos') },
          { name: 'My Music', icon: 'music', open: () => nav('My Music') },
          { name: 'Downloads', icon: 'downloads', open: () => nav('Downloads') },
          { name: 'Resume.doc', icon: 'doc', info: 'Experience, education, awards and skills.', open: () => APPS.resume() },
          { name: 'readme.txt', icon: 'notepad', open: () => APPS.readme() }
        ]
      },
      'My Documents\\Papers': {
        icon: 'documents', view: 'list',
        tasks: [['All 60 papers on Google Scholar', 'search', ext(D.links.scholar)]],
        items: D.papers.map((p, i) => ({ name: p.file, icon: 'pdf', meta: `${p.venue} ${p.year}`, info: `${p.title}. ${p.venue} ${p.year}.`, open: () => APPS.paper(i) }))
      },
      'My Documents\\Articles': {
        icon: 'articles', view: 'list',
        tasks: [['My Cloudflare Blog author page', 'browser', () => APPS.browser('cfblog')]],
        items: D.articles.map(a => ({ name: a[2] + '.url', icon: 'link', meta: `${a[0]} ${a[1]}`, info: `${a[0]}, ${a[1]}. Opens in a new tab.`, open: ext(a[3]) }))
      },
      'My Pictures': {
        icon: 'pictures', view: 'icons',
        items: [
          { name: 'london-at-night.jpg', icon: 'image', info: 'Tower Bridge and the City, from the Thames.', open: () => APPS.picture('img/vasilis-london.jpg', 'london-at-night.jpg', 'Vasilis Giotsas by the Thames at night, with Tower Bridge and the City of London behind him') },
          { name: 'profile.jpg', icon: 'image', open: () => APPS.picture('img/vasilis.jpg', 'profile.jpg', 'Vasilis Giotsas') },
          ...drawings().map(d => ({ name: d.name, icon: 'image', info: 'Drawn in Paint.', open: () => APPS.picture(d.src, d.name, 'A drawing made in Paint') }))
        ]
      },
      'My Music': {
        icon: 'music', view: 'icons',
        items: [
          { name: 'soho.txt', icon: 'notepad', info: 'A true story.', open: () => APPS.notepad('soho.txt', 'I once met Amy Winehouse in a supermarket in Soho.\n') }
        ]
      },
      'My Videos': {
        icon: 'videos', view: 'list',
        tasks: [['Play all', 'video', () => APPS.player(0)], ['Open the playlist on YouTube', 'browser', ext(D.links.youtube)]],
        items: D.talks.map((t, i) => ({ name: t[2] + '.wmv', icon: 'video', meta: t[1], info: `${t[1]}: ${t[2]}`, open: () => APPS.player(i) }))
      },
      'Downloads': {
        icon: 'downloads', view: 'list',
        tasks: [['View all my repositories on GitHub', 'browser', () => APPS.browser('github')]],
        items: D.software.map((s, i) => ({ name: s.file, icon: 'zip', meta: `${s.lang} · ${s.year}`, info: s.desc, open: () => APPS.download(i) }))
      },
      'Recycle Bin': {
        icon: 'recycle', view: 'icons',
        tasks: [['Empty Recycle Bin', 'recycle', () => APPS.emptyBin()]],
        items: [
          { name: 'reviewer2_comments.txt', icon: 'notepad', open: () => APPS.notepad('reviewer2_comments.txt', 'Reviewer #2\n\nSummary: The paper is well written and the results are convincing.\n\nWeaknesses: The authors should have used a different dataset, a different method, and ideally written a different paper.\n\nOverall merit: Weak reject\nReviewer confidence: Very high\n') },
          { name: 'ipv4_free_pool.txt', icon: 'notepad', open: () => APPS.notepad('ipv4_free_pool.txt', 'Unallocated IPv4 addresses remaining: 0\n\nThis is why AS207135 is IPv6-only.\n\nFurther reading: "IPv4 Transfer Markets Misuse: A First Look" (RIPE Labs, 2020).\n') },
          { name: 'cv_FINAL_v3_really_final.doc', icon: 'doc', open: () => APPS.notepad('cv_FINAL_v3_really_final.doc', 'This version was replaced by Resume.doc on the desktop.\n\nThere were six more "final" versions after this one.\n') }
        ]
      }
    };
    return P[path];
  }
  const ROOT_OF = p => p.startsWith('My Documents') ? 'My Documents' : p;
  const OTHER = [['My Documents', 'documents'], ['My Pictures', 'pictures'], ['My Videos', 'videos'], ['My Music', 'music'], ['Downloads', 'downloads'], ['My Computer', 'computer']];

  function pathLabel(p) { return p === 'My Computer' ? 'My Computer' : p === 'Recycle Bin' ? 'Recycle Bin' : HOME + '\\' + p; }
  function nav(path) {
    const id = 'ex';
    const existing = wins.get(id);
    if (existing) { existing.go(path, true); restore(id); return; }
    const body = el(`<div style="display:flex;flex-direction:column;flex:1;min-height:0">
      <div class="menubar"><span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span></div>
      <div class="toolbar"><button class="tbtn b-back" type="button">${I.back()}Back</button><button class="tbtn b-fwd" type="button" aria-label="Forward">${I.forward()}</button><button class="tbtn b-up" type="button">${I.up()}Up</button><button class="tbtn b-view" type="button">${I.views()}Views</button></div>
      <div class="addr">Address<div class="field"></div></div>
      <div class="ex"><div class="ex-side"></div><div class="ex-main" role="list"></div></div>
      <div class="statusbar"><span class="st"></span></div></div>`);
    const rec = openWin(id, { title: path.split('\\').pop(), icon: fs(path).icon, w: 780, h: 520, body });
    const hist = [], fwd = [];
    let cur = null, viewOverride = {};
    rec.go = (p, push) => {
      if (push && cur && cur !== p) { hist.push(cur); fwd.length = 0; }
      cur = p; render();
    };
    function render() {
      const f = fs(cur);
      rec.setTitle(cur.split('\\').pop());
      rec.node.querySelector('.tb svg.ti').outerHTML = I[f.icon]().replace('<svg', '<svg class="ti"');
      body.querySelector('.field').innerHTML = I[f.icon]() + esc(pathLabel(cur));
      body.querySelector('.b-back').disabled = !hist.length;
      body.querySelector('.b-fwd').disabled = !fwd.length;
      body.querySelector('.b-up').disabled = !cur.includes('\\');
      const main = body.querySelector('.ex-main');
      const view = viewOverride[cur] || f.view;
      main.className = 'ex-main' + (view === 'list' ? ' list' : '');
      main.innerHTML = '';
      const side = body.querySelector('.ex-side');
      const tasksHtml = (f.tasks || []).map((t, i) => `<button type="button" data-t="${i}">${I[t[1]]()}${esc(t[0])}</button>`).join('');
      const others = OTHER.filter(o => o[0] !== cur).map(o => `<button type="button" data-o="${esc(o[0])}">${I[o[1]]()}${esc(o[0])}</button>`).join('');
      side.innerHTML = (tasksHtml ? `<div class="ex-box"><h4>File and Folder Tasks</h4><div>${tasksHtml}</div></div>` : '') +
        `<div class="ex-box"><h4>Other Places</h4><div>${others}</div></div><div class="ex-box"><h4>Details</h4><div class="det"><p><b>${esc(cur.split('\\').pop())}</b><br>${f.items.length} objects</p></div></div>`;
      side.querySelectorAll('[data-t]').forEach(b => { b.onclick = f.tasks[+b.dataset.t][2]; });
      side.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => rec.go(b.dataset.o, true); });
      f.items.forEach(it => {
        const b = el(`<button type="button" class="fi" role="listitem">${I[it.icon]()}<span>${esc(it.name)}</span>${it.meta && view === 'list' ? `<em>${esc(it.meta)}</em>` : ''}</button>`);
        activatable(b, it.open, () => {
          main.querySelectorAll('.fi').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
          side.querySelector('.det').innerHTML = `<p><b>${esc(it.name)}</b>${it.meta ? '<br>' + esc(it.meta) : ''}${it.info ? '<br><br>' + esc(it.info) : ''}</p>`;
          body.querySelector('.st').textContent = it.info || it.name;
        });
        main.appendChild(b);
      });
      body.querySelector('.st').textContent = `${f.items.length} objects`;
    }
    body.querySelector('.b-back').onclick = () => { if (hist.length) { fwd.push(cur); cur = hist.pop(); render(); } };
    body.querySelector('.b-fwd').onclick = () => { if (fwd.length) { hist.push(cur); cur = fwd.pop(); render(); } };
    body.querySelector('.b-up').onclick = () => { if (cur.includes('\\')) rec.go(cur.slice(0, cur.lastIndexOf('\\')), true); };
    body.querySelector('.b-view').onclick = () => { const f = fs(cur); viewOverride[cur] = (viewOverride[cur] || f.view) === 'list' ? 'icons' : 'list'; render(); };
    rec.go(path, false);
  }

  /* ---------------- Apps ---------------- */
  const wordpad = (title, inner) => `<div class="menubar"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Help</span></div><div class="doc"><article class="page">${inner}</article></div>`;

  const APPS = {
    documents: () => nav('My Documents'),
    computer: () => nav('My Computer'),
    pictures: () => nav('My Pictures'),
    videos: () => nav('My Videos'),
    downloads: () => nav('Downloads'),
    papers: () => nav('My Documents\\Papers'),
    recycle: () => nav('Recycle Bin'),

    readme() {
      APPS.notepad('readme.txt',
`Welcome to VGOS, the Vasilis Giotsas Operating System.

This desktop is my CV. Double-click (or tap) an icon:

  My Documents ...... papers, articles and my resume
  My Videos ......... recorded talks
  Downloads ......... open source code I've written
  Mail .............. send me a message
  Internet .......... my profiles around the web
  Command Prompt .... try: tracert vasilis, ping vasilis, help
  Recycle Bin ....... things I'd rather forget

Prefer a normal website? https://v.giotsas.com

Built from scratch. No real operating systems were harmed.`, 560, 420);
    },

    notepad(name, text, w = 520, h = 360) {
      openWin('np-' + name, { title: name + ' - Notepad', icon: 'notepad', w, h,
        body: `<div class="menubar"><span>File</span><span>Edit</span><span>Format</span><span>View</span><span>Help</span></div><pre class="np" tabindex="0">${esc(text)}</pre>` });
    },

    resume() {
      const c = D.career.slice().reverse();
      const html = `<h1>${esc(D.name)}</h1>
        <p class="meta">Senior Research Engineer, Cloudflare · <a href="mailto:${D.email}">${D.email}</a> · <a href="${D.links.home}" target="_blank" rel="noopener">v.giotsas.com</a></p>
        <p>I measure how the Internet is connected and build models that work out what the data can't show directly, such as which IP addresses hide many users and which networks quietly connect to each other. With <a href="${D.links.son}" target="_blank" rel="noopener">my son</a>, I run our own network, AS207135.</p>
        <h2>Experience and education</h2><table>${c.map(r => `<tr><td>${esc(r[1].replace('-', '–'))}</td><td><b>${esc(r[3])}</b><br>${esc(r[4])}</td></tr>`).join('')}</table>
        <h2>Awards</h2><table>${D.awards.map(a => `<tr><td>•</td><td>${esc(a)}</td></tr>`).join('')}</table>
        <h2>Skills</h2><table>${D.skills.map(s => `<tr><td>${esc(s[0])}</td><td>${esc(s[1])}</td></tr>`).join('')}</table>
        <h2>Selected papers</h2><table>${D.papers.map(p => `<tr><td>${p.venue} ${p.year}</td><td>${esc(p.title)}</td></tr>`).join('')}</table>`;
      openWin('resume', { title: 'Resume.doc - WordPad', icon: 'doc', w: 820, h: 600, body: wordpad('Resume', html) });
    },

    paper(i) {
      const p = D.papers[i];
      const q = 'https://scholar.google.com/scholar?q=' + encodeURIComponent(p.title);
      const html = `<h1 style="font-size:20px">${esc(p.title)}</h1><p class="meta">${esc(p.venue)} ${p.year} · ${esc(p.authors)}</p>
        <h2>Summary</h2><p>${esc(p.summary)}</p>
        <p style="margin-top:24px;font-family:Arial,sans-serif;font-size:12px"><a class="btn" href="${q}" target="_blank" rel="noopener">Find the full paper on Google Scholar</a></p>`;
      openWin('paper-' + i, { title: p.file, icon: 'pdf', w: 700, h: 480, body: wordpad(p.file, html) });
    },

    picture(src, name, alt = '') {
      openWin('pic-' + name, { title: name + ' - Picture Viewer', icon: 'image', w: 760, h: 480,
        body: `<div class="pv"><img src="${src}" alt="${esc(alt)}"></div>` });
    },

    player(i = 0) {
      const t = D.talks[i];
      const src = id => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      const listHtml = D.talks.map((x, j) => `<button type="button" data-i="${j}" class="${j === i ? 'on' : ''}">${esc(x[2])}<small>${esc(x[1])}</small></button>`).join('');
      const body = el(`<div class="mp"><div class="mp-screen"><div class="vid"><iframe title="Talk video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
        <div class="mp-now"><b></b><small></small></div></div><div class="mp-list">${listHtml}</div></div>`);
      const play = j => {
        const x = D.talks[j];
        body.querySelector('iframe').src = src(x[0]);
        body.querySelector('.mp-now b').textContent = x[2];
        body.querySelector('.mp-now small').textContent = x[1];
        body.querySelectorAll('.mp-list button').forEach(b => b.classList.toggle('on', +b.dataset.i === j));
      };
      body.querySelectorAll('.mp-list button').forEach(b => { b.onclick = () => play(+b.dataset.i); });
      const existing = wins.get('mp');
      if (existing) { existing.play(i); restore('mp'); return; }
      const rec = openWin('mp', { title: 'Media Player', icon: 'video', w: 900, h: 520, body });
      rec.play = play; play(i);
      void t;
    },

    download(i) {
      const s = D.software[i];
      const url = 'https://github.com/vgiotsas/' + s.repo;
      openWin('dl-' + i, { title: 'File Download', icon: 'zip', w: 440, h: 330, body: `<div class="dlg">
        <div class="dlg-row">${I.zip()}<div>Do you want to open or save this file?<br><br><table>
          <tr><td>Name:</td><td><b>${esc(s.file)}</b></td></tr><tr><td>Type:</td><td>Source code (${esc(s.lang)})</td></tr>
          <tr><td>From:</td><td>github.com/vgiotsas/${esc(s.repo)}</td></tr><tr><td>Updated:</td><td>${s.year}</td></tr></table></div></div>
        <fieldset><legend>About</legend>${esc(s.desc)}</fieldset>
        <div class="acts"><a class="btn primary" href="${url}" target="_blank" rel="noopener">Open on GitHub</a><a class="btn" href="${url}/archive/HEAD.zip">Save</a><button class="btn" type="button" data-close>Cancel</button></div></div>` });
      $('[data-close]', wins.get('dl-' + i).body).onclick = () => closeWin('dl-' + i);
    },

    system() {
      const body = el(`<div style="display:flex;flex-direction:column;flex:1;min-height:0">
        <div class="tabs"><button type="button" class="on" data-tab="g">General</button><button type="button" data-tab="n">Network</button></div>
        <div class="dlg" style="background:#fcfcfe;margin:0 8px;border:1px solid #919b9c"></div>
        <div class="dlg" style="flex:0 0 auto;padding:8px"><div class="acts"><button class="btn" type="button" data-close>OK</button></div></div></div>`);
      const pane = body.querySelector('.dlg');
      const AS = { prefixes: ['2001:678:1284::/48', '2a0c:9a40:8b70::/48'], upstreams: [[35661, 'VIRTUA SYSTEMS SAS'], [209533, 'iFog GmbH']], ixps: ['FogIXP'] };
      const ext = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${esc(text)}</a>`;
      const tabs = {
        g: `<div class="sysprops"><div class="logo"><img src="img/vasilis.jpg" alt="">${I.mark().replace('<svg', '<svg style="width:40px;height:40px;background:#3a9b38;border-radius:6px"')}</div><div>
          <p><b>System:</b><br>VGOS Professional<br>Version 2026</p>
          <p><b>Registered to:</b><br>Vasilis Giotsas<br>Cloudflare Research</p>
          <p><b>Computer:</b><br>Senior Research Engineer<br>60 peer-reviewed papers<br>134,000+ dataset downloads<br>13 years uptime measuring the Internet</p></div></div>`,
        n: `<div class="dlg-row">${I.network()}<div><p style="margin:0 0 8px"><b>AS207135</b></p>
          <p style="margin:0 0 8px">An IPv6-only autonomous system that I run with <a href="${D.links.son}" target="_blank" rel="noopener">my son</a>.</p>
          <p style="margin:0 0 10px">IPv4 address: none. The free pool ran out a while ago.</p></div></div>
          <fieldset class="np-group"><legend>IPv6 prefixes</legend><table>${AS.prefixes.map(p => `<tr><td>${ext('https://bgp.he.net/net/' + p, p)}</td></tr>`).join('')}</table></fieldset>
          <fieldset class="np-group"><legend>Upstream providers</legend><table>${AS.upstreams.map(([asn, name]) => `<tr><td>${ext('https://bgp.he.net/AS' + asn, 'AS' + asn)}</td><td>${ext('https://bgp.he.net/AS' + asn, name)}</td></tr>`).join('')}</table></fieldset>
          <fieldset class="np-group"><legend>Internet exchanges</legend><table>${AS.ixps.map(x => `<tr><td>${ext('https://bgp.he.net/exchange/' + x, x)}</td></tr>`).join('')}</table></fieldset>
          <p class="np-more">${I.network()}${ext('https://bgp.tools/as/207135#asinfo', 'View AS207135 on bgp.tools')}</p>`
      };
      const show = k => { pane.innerHTML = tabs[k]; body.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === k)); };
      body.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => show(b.dataset.tab); });
      show('g');
      openWin('sys', { title: 'System Properties', icon: 'computer', w: 460, h: 500, body });
      body.querySelector('[data-close]').onclick = () => closeWin('sys');
    },

    network() { APPS.system(); const r = wins.get('sys'); if (r) r.body.querySelector('[data-tab="n"]').click(); },

    emptyBin() {
      openWin('bin-confirm', { title: 'Confirm File Delete', icon: 'warn', w: 400, h: 180, body: `<div class="dlg"><div class="dlg-row">${I.warn()}<div>These files keep me humble. Are you sure you want to delete them?<br><br>(They will be back next time anyway.)</div></div>
        <div class="acts"><button class="btn" type="button" data-close>No</button></div></div>` });
      $('[data-close]', wins.get('bin-confirm').body).onclick = () => closeWin('bin-confirm');
    },

    /* ----- Mail ----- */
    mail() {
      const welcome = { from: D.name, date: '2026', subject: 'Welcome to VGOS', unread: true,
        body: `Hi, and thanks for stopping by.\n\nThis desktop is my CV. My papers are in My Documents, my talks are in My Videos and my open source code is in Downloads.\n\nThe other messages in this inbox are my latest news. To get in touch, click Create Mail and write to me.\n\nVasilis` };
      const msgs = [welcome].concat(D.news.map(n => ({ from: D.name, date: n.date, subject: n.subject, body: n.body, unread: true })));
      const sent = APPS._sent || (APPS._sent = []);
      const body = el(`<div style="display:flex;flex-direction:column;flex:1;min-height:0">
        <div class="menubar"><span>File</span><span>Edit</span><span>View</span><span>Tools</span><span>Message</span><span>Help</span></div>
        <div class="toolbar"><button class="tbtn" type="button" data-a="new">${I.write()}Create Mail</button><button class="tbtn" type="button" data-a="reply">${I.send()}Reply</button><button class="tbtn" type="button" data-a="sync">${I.refresh()}Send/Recv</button></div>
        <div class="mail"><div class="mail-folders"></div><div class="mail-main"><div class="mail-list"></div><div class="mail-read"></div></div></div>
        <div class="statusbar"><span class="st"></span></div></div>`);
      let folder = 'inbox', current = null;
      const folders = () => {
        const unread = msgs.filter(m => m.unread).length;
        body.querySelector('.mail-folders').innerHTML =
          [['inbox', 'Inbox' + (unread ? ` (${unread})` : ''), 'inbox'], ['sent', 'Sent Items', 'sent'], ['drafts', 'Drafts', 'drafts']]
            .map(f => `<button type="button" data-f="${f[0]}" class="${folder === f[0] ? 'on' : ''}">${I[f[2]]()}${esc(f[1])}</button>`).join('');
        body.querySelectorAll('[data-f]').forEach(b => { b.onclick = () => { folder = b.dataset.f; current = null; draw(); }; });
      };
      const list = () => folder === 'inbox' ? msgs : folder === 'sent' ? sent : [];
      function draw() {
        folders();
        const L = list();
        body.querySelector('.mail-list').innerHTML = `<table><thead><tr><th style="width:30%">${folder === 'sent' ? 'To' : 'From'}</th><th>Subject</th><th style="width:70px">Received</th></tr></thead><tbody>${
          L.map((m, i) => `<tr data-i="${i}" class="${m.unread ? 'unread' : ''} ${current === i ? 'on' : ''}" tabindex="0"><td>${esc(folder === 'sent' ? D.name : m.from)}</td><td>${esc(m.subject)}</td><td>${esc(m.date)}</td></tr>`).join('') ||
          `<tr><td colspan="3" style="color:#666">There are no items in this view.</td></tr>`}</tbody></table>`;
        body.querySelectorAll('tr[data-i]').forEach(tr => {
          const pick = () => { current = +tr.dataset.i; L[current].unread = false; draw(); };
          tr.onclick = pick; tr.onkeydown = e => { if (e.key === 'Enter') pick(); };
        });
        const m = current != null ? L[current] : null;
        body.querySelector('.mail-read').innerHTML = m ? `<div class="hdr"><b>From:</b> ${esc(folder === 'sent' ? m.from : D.name)}<br><b>Subject:</b> ${esc(m.subject)}</div><pre>${linkify(m.body)}</pre>` : '<p style="color:#666">Select a message to read it.</p>';
        body.querySelector('.st').textContent = `${L.length} message(s), ${L.filter(x => x.unread).length} unread`;
      }
      body.querySelector('[data-a="new"]').onclick = () => APPS.compose();
      body.querySelector('[data-a="reply"]').onclick = () => { const L = list(); APPS.compose(current != null && folder === 'inbox' ? 'Re: ' + L[current].subject : ''); };
      body.querySelector('[data-a="sync"]').onclick = () => balloon('Send/Receive', 'No new messages. Write to me and there will be one soon.');
      const existing = wins.get('mail');
      if (existing) { restore('mail'); existing.draw(); return; }
      const rec = openWin('mail', { title: 'Inbox - Mail', icon: 'mail', w: 860, h: 540, body });
      rec.draw = draw; current = 0; msgs[0].unread = false; draw();
    },

    compose(subject = '') {
      const body = el(`<form class="compose" novalidate>
        <div class="toolbar"><button class="tbtn" type="submit">${I.send()}Send</button></div>
        <div class="f"><label>To:</label><div class="to">${esc(D.name)} &lt;${esc(D.email)}&gt;</div></div>
        <div class="f"><label for="c-name">Your name:</label><input id="c-name" name="name" autocomplete="name"></div>
        <div class="f"><label for="c-from">Your email:</label><input id="c-from" name="from" type="email" autocomplete="email"></div>
        <div class="f"><label for="c-subj">Subject:</label><input id="c-subj" name="subject" value="${esc(subject)}"></div>
        <textarea name="body" aria-label="Message" placeholder="Write your message here"></textarea>
        <div class="note">Send opens your own mail app with this message filled in. Press Send there to deliver it.</div></form>`);
      const id = 'compose';
      if (wins.has(id)) { restore(id); return; }
      openWin(id, { title: 'New Message', icon: 'write', w: 620, h: 460, body });
      body.addEventListener('submit', e => {
        e.preventDefault();
        const f = new FormData(body);
        const text = String(f.get('body') || '').trim();
        if (!text) { body.querySelector('textarea').focus(); balloon('Empty message', 'Write something first, even a hello.'); return; }
        const name = String(f.get('name') || '').trim(), from = String(f.get('from') || '').trim();
        const subj = String(f.get('subject') || '').trim() || 'Hello from v.giotsas.com/xp';
        const sig = (name || from) ? `\n\n— ${name}${from ? ' <' + from + '>' : ''}` : '';
        const href = `mailto:${D.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(text + sig)}`;
        (APPS._sent || (APPS._sent = [])).unshift({ from: (name || 'You') + (from ? ` <${from}>` : ''), date: 'Today', subject: subj, body: text + sig, unread: false });
        window.location.href = href;
        closeWin(id);
        const m = wins.get('mail'); if (m) m.draw();
        balloon('Message ready', 'Your mail app should open with the message. Press Send there to deliver it.');
      });
      setTimeout(() => body.querySelector(subject ? 'textarea' : '#c-name').focus(), 30);
    },

    /* ----- Browser ----- */
    browser(tab = 'home') {
      const T = [
        { k: 'home', fav: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23EDEAE3'/%3E%3Ctext x='32' y='42' text-anchor='middle' font-family='Arial,sans-serif' font-weight='700' font-size='28' fill='%230B0F1A'%3Evg%3C/text%3E%3C/svg%3E", t: 'v.giotsas.com', url: D.links.home, icon: 'home', frame: true },
        { k: 'giotsastech', fav: 'https://giotsastech.com/favicon.ico', t: 'GiotsasTech', url: 'https://giotsastech.com/', icon: 'network', frame: true },
        { k: 'linkedin', fav: "https://www.linkedin.com/favicon.ico", t: 'LinkedIn', url: D.links.linkedin, icon: 'user', page: true },
        { k: 'scholar', fav: "https://scholar.google.com/favicon.ico", t: 'Google Scholar', url: D.links.scholar, icon: 'search', page: true },
        { k: 'github', fav: "https://github.com/favicon.ico", t: 'GitHub', url: D.links.github, icon: 'zip', page: true },
        { k: 'twitter', fav: "https://x.com/favicon.ico", t: 'Twitter / X', url: D.links.twitter, icon: 'send', page: true },
        { k: 'youtube', fav: "https://www.youtube.com/favicon.ico", t: 'YouTube', url: 'https://www.youtube.com/@giotsas', icon: 'video', page: true },
        { k: 'cfblog', fav: "https://blog.cloudflare.com/favicon.ico", t: 'Cloudflare Blog', url: D.links.cfblog, icon: 'articles', page: true }
      ];
      const body = el(`<div style="display:flex;flex-direction:column;flex:1;min-height:0">
        <div class="menubar"><span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span></div>
        <div class="toolbar"><button class="tbtn" type="button" data-a="back" disabled>${I.back()}Back</button><button class="tbtn" type="button" data-a="fwd" disabled aria-label="Forward">${I.forward()}</button><button class="tbtn" type="button" data-a="reload">${I.refresh()}</button><button class="tbtn" type="button" data-a="home">${I.home()}Home</button></div>
        <div class="addr">Address<div class="field"></div><a class="btn" data-a="go" target="_blank" rel="noopener" style="min-width:0;padding:2px 10px">Go</a></div>
        <div class="br-tabs" role="tablist"></div><div class="br-view"></div><div class="statusbar"><span class="st">Done</span></div></div>`);
      let cur = tab;
      /* Pages loaded in the v.giotsas.com frame: our own history, since the frame's may be cross-origin */
      let hist = [], pos = -1, pending = null, stepping = false;
      // Sites known to allow being shown in a frame; links anywhere else open in a real tab
      const FRAMEOK = /(^|\.)(giotsas\.com|giotsastech\.com|github\.io|localhost)$/;
      const bare = u => u.replace(/^https?:\/\/(www\.)?/i, '').split(/[?#]/)[0].replace(/\/$/, '').toLowerCase();
      const tabFor = href => T.find(x => (x.page || (x.frame && x.k !== cur)) && (bare(x.url) === bare(href) || bare(x.url.replace('twitter.com', 'x.com')) === bare(href)));
      const setNav = () => { body.querySelector('[data-a="back"]').disabled = pos <= 0; body.querySelector('[data-a="fwd"]').disabled = pos >= hist.length - 1; };
      function setAddr(href, title) {
        body.querySelector('.field').innerHTML = I.browser() + esc(href);
        body.querySelector('[data-a="go"]').href = href;
        rec.setTitle((title || href.replace(/^https?:\/\//, '')) + ' - Web Browser');
        body.querySelector('.st').textContent = 'Done';
      }
      function frameTo(href) {
        const f = body.querySelector('.br-view iframe');
        if (!f) return;
        pending = href; body.querySelector('.st').textContent = 'Opening page ' + href + '...';
        f.src = href;
      }
      function watch(f) {
        f.addEventListener('load', () => {
          let href = pending, title = null;
          try { href = f.contentWindow.location.href; title = f.contentDocument.title; hook(f.contentDocument); }
          catch (e) { /* another site: we can't read where it went, so keep the link we saw clicked */ }
          pending = null;
          if (!href || href === 'about:blank') return;
          if (!stepping && hist[pos] !== href) { hist = hist.slice(0, pos + 1); hist.push(href); pos = hist.length - 1; }
          stepping = false; setNav(); setAddr(href, title);
        });
      }
      function hook(doc) {
        doc.addEventListener('click', e => {
          const a = e.target.closest && e.target.closest('a[href]');
          if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute('download')) return;
          const href = a.href;
          if (/^mailto:/i.test(href)) { e.preventDefault(); APPS.compose(); return; }
          if (!/^https?:/i.test(href)) return;
          const u = new URL(href), t = tabFor(href);
          if (t) { e.preventDefault(); show(t.k); return; }
          if (!FRAMEOK.test(u.hostname)) { e.preventDefault(); window.open(href, '_blank', 'noopener'); return; }
          if (u.origin !== doc.location.origin || a.target === '_blank') { e.preventDefault(); frameTo(href); return; }
          pending = href; // same site: the load handler reads the real URL
        }, true);
      }
      function show(k) {
        cur = k; const t = T.find(x => x.k === k) || T[0];
        body.querySelector('.br-tabs').innerHTML = T.map(x => `<button type="button" role="tab" aria-selected="${x.k === k}" class="${x.k === k ? 'on' : ''}" data-k="${x.k}"><img class="fav" src="${x.fav}" alt="" width="16" height="16" data-i="${x.icon}"><span>${esc(x.t)}</span></button>`).join('');
        // A site's own icon, as a real browser shows it; our drawn icon if it fails to load
        body.querySelectorAll('.br-tabs img.fav').forEach(im => { im.onerror = () => { im.outerHTML = I[im.dataset.i](); }; });
        body.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => show(b.dataset.k); });
        body.querySelector('.field').innerHTML = I.browser() + esc(t.url);
        body.querySelector('[data-a="go"]').href = t.url;
        const view = body.querySelector('.br-view');
        view.scrollTop = 0;
        hist = []; pos = -1; pending = null; setNav();
        view.innerHTML = t.frame ? `<iframe title="${esc(t.t)}" src="${t.url}"></iframe>` : t.page ?
          `<a class="br-shot wp wp-${t.k}" href="${t.url}" target="_blank" rel="noopener" aria-label="Open my ${esc(t.t)} page in a new tab"><span class="br-hint">${I.info()}A preview of my ${esc(t.t)} page. Click anywhere to open the real one in a new tab.</span>${webPage(t.k)}</a>` :
          `<div class="br-page"><h2>${I[t.icon]()}${esc(t.t)}</h2><div class="url">${esc(t.url)}</div><p>${esc(t.text)}</p>
           <p>This site doesn't allow itself to be shown inside another page, so it opens in a new tab.</p>
           <p><a class="btn primary" href="${t.url}" target="_blank" rel="noopener">Open ${esc(t.t)}</a></p></div>`;
        rec.setTitle(t.t + ' - Web Browser');
        if (t.frame) { pending = t.url; watch(view.querySelector('iframe')); }
        body.querySelector('.st').textContent = t.frame ? 'Done' : t.page ? 'Preview of ' + t.url + '. Click to open the real page.' : 'Opens in a new tab';
      }
      body.querySelector('[data-a="reload"]').onclick = () => { if (T.find(x => x.k === cur).frame && hist[pos]) { stepping = true; frameTo(hist[pos]); } else show(cur); };
      body.querySelector('[data-a="back"]').onclick = () => { if (pos > 0) { pos--; stepping = true; frameTo(hist[pos]); setNav(); } };
      body.querySelector('[data-a="fwd"]').onclick = () => { if (pos < hist.length - 1) { pos++; stepping = true; frameTo(hist[pos]); setNav(); } };
      body.querySelector('[data-a="home"]').onclick = () => show('home');
      const existing = wins.get('br');
      if (existing) { existing.show(tab); restore('br'); return; }
      const rec = openWin('br', { title: 'Web Browser', icon: 'browser', w: 980, h: 620, body });
      rec.show = show; show(tab);
    },

    /* ----- Command prompt ----- */
    /* Paper Sweeper: Minesweeper where the mines are Reviewer 2 and flags are rebuttals */
    sweeper() {
      const LV = { workshop: ['Workshop', 9, 9, 10, 40, 120], conference: ['Conference', 16, 16, 40, 150, 360], journal: ['Journal', 30, 16, 99, 360, 800] };
      const SAY = ['The authors should cite my work. All of it.',
        'Interesting, but have the authors considered doing a completely different study?',
        'The contribution is incremental. Please make it bigger, but shorter.',
        'I did not read the appendix, but I am confident the answer is in there somewhere.',
        'Figure 3 is unreadable. So is Figure 1.',
        'This has been done before. I cannot remember where.',
        'Please add more experiments, and also cut the paper to fit the page limit.',
        'Strong reject. Confidence: 5/5. Expertise: I skimmed the abstract.',
        'The writing is so clear that the flaws are easy to see.',
        'Have the authors tried machine learning?',
        'The dataset is too small. Also, the dataset is too large to be reproducible.',
        'Why IPv4? Why not IPv6? Why not both? Why at all?'];
      const COL = ['', '#0000ff', '#007b00', '#ff0000', '#00007b', '#7b0000', '#007b7b', '#000', '#7b7b7b'];
      const face = f => `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#ffd93b" stroke="#000" stroke-width="1"/>${
        f === 'dead' ? '<path d="M6.5 7.5l3 3m0-3l-3 3M14.5 7.5l3 3m0-3l-3 3" stroke="#000" stroke-width="1.3"/><path d="M7.5 17.5q4.5-4 9 0" fill="none" stroke="#000" stroke-width="1.3"/>'
        : `<circle cx="8.3" cy="9.5" r="2.4" fill="#fff" stroke="#000" stroke-width="1"/><circle cx="15.7" cy="9.5" r="2.4" fill="#fff" stroke="#000" stroke-width="1"/><path d="M10.7 9.5h2.6" stroke="#000"/><circle cx="8.3" cy="9.6" r=".9"/><circle cx="15.7" cy="9.6" r=".9"/>${
          f === 'oh' ? '<circle cx="12" cy="16.5" r="2" fill="#000"/>' : '<path d="M7.5 15q4.5 4 9 0" fill="none" stroke="#000" stroke-width="1.3"/>'}`}${
        f === 'win' ? '<path d="M3.5 4.6L12 1.4l8.5 3.2L12 7.8z" fill="#222"/><path d="M19 5v4.2" stroke="#d4a017" stroke-width="1.2"/><circle cx="19" cy="9.6" r=".9" fill="#d4a017"/>' : ''}</svg>`;
      const stamp = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.4" fill="#c8321e" stroke="#7f1a0e"/><text x="10" y="13.4" font-family="Tahoma,Arial,sans-serif" font-weight="700" font-size="8.6" fill="#fff" text-anchor="middle">R2</text></svg>';
      const flagSvg = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3v13" stroke="#000" stroke-width="1.6"/><path d="M6.8 3.4l8 3.3-8 3.3z" fill="#e00"/><path d="M3.5 16.5h7" stroke="#000" stroke-width="2"/></svg>';
      const best = { get(k) { try { return +localStorage.getItem('vg-sweep-' + k) || 0; } catch (e) { return 0; } },
        set(k, v) { try { localStorage.setItem('vg-sweep-' + k, v); } catch (e) { /* storage unavailable */ } } };
      const rec = openWin('sweeper', { title: 'Paper Sweeper', icon: 'sweeper', w: 300, h: 420,
        body: `<div class="ms"><div class="ms-bar">${Object.entries(LV).map(([k, v]) => `<button type="button" class="tbtn" data-lv="${k}">${v[0]}</button>`).join('')}
            <label class="ms-mode"><input type="checkbox"> Rebuttal mode</label></div>
          <div class="ms-box"><div class="ms-panel"><span class="ms-led" title="Reviewer 2s left">000</span><button type="button" class="ms-face" aria-label="New submission"></button><span class="ms-led" title="Days under review">000</span></div>
          <div class="ms-scroll"><div class="ms-grid" role="grid" aria-label="Submissions"></div></div></div>
          <p class="ms-msg" aria-live="polite"></p></div>`,
        onClose: r => clearInterval(r.msTimer) });
      if (rec.ms) return;
      rec.ms = true;
      const B = rec.body, grid = B.querySelector('.ms-grid'), [ledLeft, ledTime] = B.querySelectorAll('.ms-led');
      const faceBtn = B.querySelector('.ms-face'), msg = B.querySelector('.ms-msg'), mode = B.querySelector('.ms-mode input');
      let lv = 'workshop', W, H, N, cells, live, over, opened, flags, t0, longPress = null;
      const led = (node, v) => { node.textContent = String(Math.max(-99, Math.min(999, v))).padStart(3, '0'); };
      const setFace = f => { faceBtn.innerHTML = face(f); };
      const around = i => { const x = i % W, y = (i - x) / W, out = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy;
          if ((dx || dy) && nx >= 0 && ny >= 0 && nx < W && ny < H) out.push(ny * W + nx); }
        return out; };
      const say = t => { msg.textContent = t; };
      const days = n => n + (n === 1 ? ' day' : ' days');
      function newGame(k) {
        if (k) lv = k;
        [, W, H, N] = LV[lv];
        clearInterval(rec.msTimer); live = false; over = false; opened = 0; flags = 0;
        cells = Array.from({ length: W * H }, () => ({ m: false, n: 0, open: false, flag: false }));
        grid.style.gridTemplateColumns = `repeat(${W}, var(--cs))`;
        grid.innerHTML = cells.map((_, i) => `<button type="button" class="c" data-i="${i}" aria-label="Paper"></button>`).join('');
        B.querySelectorAll('[data-lv]').forEach(b => b.classList.toggle('on', b.dataset.lv === lv));
        led(ledLeft, N); led(ledTime, 0); setFace('ok');
        const b = best.get(lv);
        say(`${LV[lv][0]}: ${N} Reviewer 2s are hiding among ${W * H} submissions. Click to submit, right-click or long-press to file a rebuttal.${b ? ' Your best: ' + days(b) + '.' : ''}`);
        if (!rec.node.classList.contains('max')) {
          const cs = mobile() ? 26 : 22;
          rec.node.style.width = Math.min(window.innerWidth - 16, Math.max(330, W * cs + 46)) + 'px';
          rec.node.style.height = Math.min(window.innerHeight - 46, H * cs + 196) + 'px';
          const left = parseInt(rec.node.style.left, 10) || 0, wide = rec.node.offsetWidth;
          if (left + wide > window.innerWidth - 8) rec.node.style.left = Math.max(8, window.innerWidth - wide - 8) + 'px';
        }
      }
      function seed(safe) {
        const keepOut = new Set([safe, ...around(safe)]);
        const pool = cells.map((_, i) => i).filter(i => !keepOut.has(i));
        for (let k = 0; k < N; k++) { const j = k + Math.floor(Math.random() * (pool.length - k)); [pool[k], pool[j]] = [pool[j], pool[k]]; cells[pool[k]].m = true; }
        cells.forEach((c, i) => { c.n = around(i).filter(j => cells[j].m).length; });
        live = true; t0 = Date.now();
        rec.msTimer = setInterval(() => led(ledTime, Math.floor((Date.now() - t0) / 1000)), 250);
      }
      const btn = i => grid.children[i];
      function reveal(i) {
        const stack = [i];
        while (stack.length) {
          const j = stack.pop(), c = cells[j];
          if (c.open || c.flag) continue;
          c.open = true; opened++;
          const b = btn(j); b.classList.add('o'); b.setAttribute('aria-label', c.n ? c.n + ' Reviewer 2s nearby' : 'Accepted');
          if (c.n) { b.textContent = c.n; b.style.color = COL[c.n]; } else stack.push(...around(j));
        }
      }
      function lose(i) {
        over = true; live = false; clearInterval(rec.msTimer); setFace('dead');
        cells.forEach((c, j) => {
          const b = btn(j);
          if (c.m && !c.flag) { b.classList.add('o', 'r2'); b.innerHTML = stamp; }
          if (!c.m && c.flag) b.classList.add('bad');
        });
        btn(i).classList.add('boom');
        say('Rejected. Reviewer 2 writes: “' + SAY[Math.floor(Math.random() * SAY.length)] + '” Click the face to resubmit.');
      }
      function win() {
        over = true; live = false; clearInterval(rec.msTimer); setFace('win');
        const t = Math.max(1, Math.round((Date.now() - t0) / 1000)); led(ledTime, t); led(ledLeft, 0);
        cells.forEach((c, j) => { if (c.m && !c.flag) { c.flag = true; btn(j).innerHTML = flagSvg; } });
        const [, , , , fast, slow] = LV[lv];
        const verdict = t <= fast ? 'Accepted! Best paper nominee. Camera-ready is due in a week.'
          : t <= slow ? 'Accepted with minor revisions. Reviewer 2 still wants more citations.'
          : 'Major revision. Accepted after three rounds and a change of editor.';
        const b = best.get(lv), rec_ = !b || t < b;
        if (rec_) best.set(lv, t);
        say(`${verdict} Review time: ${days(t)}.${rec_ ? ' New personal best!' : ' Your best: ' + days(b) + '.'}`);
      }
      function act(i, flagIt) {
        if (over) return;
        const c = cells[i];
        if (flagIt) {
          if (c.open) return;
          c.flag = !c.flag; flags += c.flag ? 1 : -1;
          btn(i).innerHTML = c.flag ? flagSvg : ''; btn(i).setAttribute('aria-label', c.flag ? 'Rebuttal filed' : 'Paper');
          led(ledLeft, N - flags); return;
        }
        if (c.flag) return;
        if (c.open) { // chord: a number with all its rebuttals filed opens the rest of its neighbours
          const nb = around(i);
          if (c.n && nb.filter(j => cells[j].flag).length === c.n) for (const j of nb) { if (!cells[j].flag && !cells[j].open) { if (cells[j].m) return lose(j); reveal(j); } }
        } else {
          if (!live) seed(i);
          if (c.m) return lose(i);
          reveal(i);
        }
        if (opened === W * H - N) win();
      }
      grid.addEventListener('click', e => {
        const b = e.target.closest('.c'); if (!b) return;
        if (longPress === 'done') { longPress = null; return; }
        act(+b.dataset.i, mode.checked);
      });
      grid.addEventListener('contextmenu', e => { const b = e.target.closest('.c'); if (!b) return; e.preventDefault(); act(+b.dataset.i, true); });
      grid.addEventListener('pointerdown', e => {
        const b = e.target.closest('.c'); if (!b || e.button !== 0 || over) return;
        setFace('oh');
        if (e.pointerType !== 'mouse') { clearTimeout(longPress); longPress = setTimeout(() => { longPress = 'done'; act(+b.dataset.i, true); }, 450); }
      });
      const release = () => { if (!over) setFace('ok'); if (typeof longPress === 'number') { clearTimeout(longPress); longPress = null; } };
      grid.addEventListener('pointerup', release); grid.addEventListener('pointercancel', release); grid.addEventListener('pointerleave', release);
      faceBtn.onclick = () => newGame();
      B.querySelectorAll('[data-lv]').forEach(b => { b.onclick = () => newGame(b.dataset.lv); });
      newGame();
    },
    /* Paint: pencil, brush, spray, eraser, fill, colour picker, line, rectangle, ellipse and text, with undo */
    paint() {
      const PAL = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
        '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'];
      const ic = d => `<svg viewBox="0 0 16 16" aria-hidden="true">${d}</svg>`;
      const TOOLS = [
        ['pencil', 'Pencil', ic('<path d="M3 13l1-3 7-7 2 2-7 7z" fill="#f4c20d" stroke="#000" stroke-width=".8"/><path d="M3 13l1-3 2 2z" fill="#f2d7b0" stroke="#000" stroke-width=".8"/>')],
        ['brush', 'Brush', ic('<path d="M13.5 2.5L8 9" stroke="#8a5320" stroke-width="2" stroke-linecap="round"/><path d="M8.4 8.6c-1.6-.4-3 .6-3.3 2.2-.2 1.2-.9 2-2.1 2.4 2.6 1 5.8.2 6.2-2.4.1-1-.3-1.8-.8-2.2z" fill="#2563d6" stroke="#000" stroke-width=".7"/>')],
        ['spray', 'Airbrush', ic('<rect x="4" y="6" width="6" height="8" rx="1" fill="#9aa4b2" stroke="#000" stroke-width=".8"/><rect x="5.5" y="3.5" width="3" height="2.5" fill="#555"/><g fill="#e0342a"><circle cx="11.5" cy="3" r=".7"/><circle cx="13.5" cy="4.5" r=".7"/><circle cx="12" cy="6" r=".7"/><circle cx="14" cy="2" r=".7"/></g>')],
        ['eraser', 'Eraser', ic('<path d="M2 10l6-6 6 6-4 4H6z" fill="#f2a7b8" stroke="#000" stroke-width=".8"/><path d="M5 7l6 6" stroke="#000" stroke-width=".8"/>')],
        ['fill', 'Fill with colour', ic('<path d="M7 2l6 6-5 5-6-6z" fill="#dfe6ef" stroke="#000" stroke-width=".8"/><path d="M12.6 9.5c.9 1.4 1.6 2.4 1.6 3.2a1.4 1.4 0 01-2.8 0c0-.8.5-1.8 1.2-3.2z" fill="#2563d6"/>')],
        ['picker', 'Pick colour', ic('<path d="M10 3l3 3-7 7H3v-3z" fill="#dfe6ef" stroke="#000" stroke-width=".8"/><path d="M10.5 1.5l4 4-1.5 1.5-4-4z" fill="#333"/>')],
        ['line', 'Line', ic('<path d="M2.5 13.5l11-11" stroke="#000" stroke-width="1.6"/>')],
        ['rect', 'Rectangle', ic('<rect x="2.5" y="4" width="11" height="8" fill="none" stroke="#000" stroke-width="1.4"/>')],
        ['ellipse', 'Ellipse', ic('<ellipse cx="8" cy="8" rx="5.8" ry="4.2" fill="none" stroke="#000" stroke-width="1.4"/>')],
        ['text', 'Text', ic('<text x="8" y="13" text-anchor="middle" font-family="Times New Roman,serif" font-weight="700" font-size="13">A</text>')]];
      const MENUS = { File: [['new', 'New'], ['open', 'Open...'], ['save', 'Save to My Pictures'], ['download', 'Download as PNG'], ['-'], ['exit', 'Exit']],
        Edit: [['undo', 'Undo', 'Ctrl+Z'], ['redo', 'Redo', 'Ctrl+Y'], ['-'], ['clear', 'Clear image']],
        Image: [['fliph', 'Flip horizontal'], ['flipv', 'Flip vertical'], ['rotate', 'Rotate 90° right'], ['invert', 'Invert colours']] };
      const rec = openWin('paint', { title: 'untitled - Paint', icon: 'paint', w: 860, h: 620,
        body: `<div class="pt" tabindex="-1"><div class="pt-menus">${Object.entries(MENUS).map(([m, items]) => `<div class="pt-m"><button type="button" class="pt-mb">${m}</button><div class="pt-dd" hidden>${
            items.map(([c, t, k]) => c === '-' ? '<hr>' : `<button type="button" data-cmd="${c}">${t}${k ? `<small>${k}</small>` : ''}</button>`).join('')}</div></div>`).join('')}
            <input type="file" accept="image/*" hidden></div>
          <div class="pt-main"><div class="pt-side"><div class="pt-tools">${TOOLS.map(([k, t, svg]) => `<button type="button" data-t="${k}" title="${t}" aria-label="${t}">${svg}</button>`).join('')}</div><div class="pt-opts"></div></div>
            <div class="pt-ws"><div class="pt-holder"><canvas class="pt-cv"></canvas><canvas class="pt-ov"></canvas><span class="pt-grip" title="Drag to resize the picture"></span><div class="pt-ghost" hidden></div></div></div></div>
          <div class="pt-pal"><div class="pt-cur" title="Left click: primary colour. Right click: secondary colour."><span class="pt-bg"></span><span class="pt-fg"></span></div>
            <div class="pt-sw">${PAL.map(c => `<button type="button" style="background:${c}" data-c="${c}" aria-label="Colour ${c}"></button>`).join('')}</div>
            <label class="pt-custom" title="Custom colour"><input type="color" value="#2563d6">Edit colours</label></div>
          <div class="statusbar"><span class="st">Left click draws in the primary colour, right click in the secondary.</span><span class="pt-xy"></span><span class="pt-sz"></span></div></div>` });
      if (rec.pt) return;
      rec.pt = true;
      const B = rec.body, root = B.querySelector('.pt'), cv = B.querySelector('.pt-cv'), ov = B.querySelector('.pt-ov'), ws = B.querySelector('.pt-ws');
      const ctx = cv.getContext('2d', { willReadFrequently: true }), octx = ov.getContext('2d');
      const st = B.querySelector('.st'), xy = B.querySelector('.pt-xy'), sz = B.querySelector('.pt-sz'), optsBox = B.querySelector('.pt-opts');
      let tool = 'pencil', lastTool = 'pencil', size = 2, fillMode = 0, fg = '#000000', bg = '#ffffff', undo = [], redo = [], drag = null, sprayTimer = null, textBox = null, n = 0;

      /* ---- canvas helpers ---- */
      const setSize = (w, h) => { cv.width = ov.width = w; cv.height = ov.height = h; for (const c of [cv, ov]) { c.style.width = w + 'px'; c.style.height = h + 'px'; } sz.textContent = w + ' × ' + h + 'px'; };
      const snap = () => ({ w: cv.width, h: cv.height, d: ctx.getImageData(0, 0, cv.width, cv.height) });
      const restore = s => { setSize(s.w, s.h); ctx.putImageData(s.d, 0, 0); };
      const push = () => { undo.push(snap()); if (undo.length > 30) undo.shift(); redo = []; };
      function blank(w, h) { setSize(w, h); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
      const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      const pos = e => { const r = ov.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) * ov.width / r.width), Math.floor((e.clientY - r.top) * ov.height / r.height)]; };
      function line(x0, y0, x1, y1, fn) { // Bresenham, so pencil and eraser stay crisp
        const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;
        for (;;) { fn(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
      }
      function flood(x, y, hex) {
        const W = cv.width, H = cv.height, img = ctx.getImageData(0, 0, W, H), d = new Uint32Array(img.data.buffer);
        const [r, g, b] = hexRgb(hex), c = (255 << 24 | b << 16 | g << 8 | r) >>> 0, t = d[y * W + x];
        if (t === c) return;
        const stack = [x, y];
        while (stack.length) {
          const py = stack.pop(); let px = stack.pop(), i = py * W + px;
          while (px > 0 && d[i - 1] === t) { px--; i--; }
          let up = false, down = false;
          for (; px < W && d[i] === t; px++, i++) {
            d[i] = c;
            if (py > 0) { if (d[i - W] === t) { if (!up) { stack.push(px, py - 1); up = true; } } else up = false; }
            if (py < H - 1) { if (d[i + W] === t) { if (!down) { stack.push(px, py + 1); down = true; } } else down = false; }
          }
        }
        ctx.putImageData(img, 0, 0);
      }
      function shape(c, x0, y0, x1, y1, col, alt, constrain) {
        if (constrain) {
          const dx = x1 - x0, dy = y1 - y0;
          if (tool === 'line') { const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4, l = Math.hypot(dx, dy); x1 = Math.round(x0 + l * Math.cos(a)); y1 = Math.round(y0 + l * Math.sin(a)); }
          else { const m = Math.max(Math.abs(dx), Math.abs(dy)); x1 = x0 + Math.sign(dx || 1) * m; y1 = y0 + Math.sign(dy || 1) * m; }
        }
        c.lineWidth = size; c.strokeStyle = col; c.fillStyle = alt; c.lineCap = 'round';
        const o = size % 2 ? .5 : 0;
        c.beginPath();
        if (tool === 'line') { c.moveTo(x0 + o, y0 + o); c.lineTo(x1 + o, y1 + o); c.stroke(); return; }
        const x = Math.min(x0, x1), y = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
        if (tool === 'rect') c.rect(x + o, y + o, w, h); else c.ellipse(x + w / 2 + o, y + h / 2 + o, w / 2, h / 2, 0, 0, Math.PI * 2);
        if (fillMode === 2) { c.fillStyle = col; c.fill(); } else { if (fillMode === 1) c.fill(); c.stroke(); }
      }

      /* ---- tools and colours ---- */
      function showOpts() {
        if (tool === 'rect' || tool === 'ellipse') {
          optsBox.innerHTML = ['Outline', 'Outline and fill', 'Fill'].map((t, i) => `<button type="button" data-f="${i}" class="${i === fillMode ? 'on' : ''}" title="${t}"><svg viewBox="0 0 30 14" aria-hidden="true"><rect x="3" y="2" width="24" height="10" fill="${i === 0 ? 'none' : i === 1 ? '#9aa4b2' : '#000'}" stroke="#000" stroke-width="${i === 2 ? 0 : 1.5}"/></svg></button>`).join('')
            + [1, 2, 4, 6].map(s => `<button type="button" data-s="${s}" class="${s === size ? 'on' : ''}" title="${s}px outline"><i style="height:${s}px"></i></button>`).join('');
        } else if (['brush', 'eraser', 'spray', 'line', 'text'].includes(tool)) {
          optsBox.innerHTML = [1, 2, 4, 6, 10].map(s => `<button type="button" data-s="${s}" class="${s === size ? 'on' : ''}" title="Size ${s}"><i style="height:${Math.min(s, 8)}px"></i></button>`).join('');
        } else optsBox.innerHTML = '';
      }
      function pickTool(k) {
        if (textBox) commitText();
        if (k !== 'picker') lastTool = k;
        tool = k; B.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === k));
        ov.dataset.tool = k; showOpts();
        st.textContent = { pencil: 'Draws a 1px freehand line.', brush: 'Draws with a round brush.', spray: 'Sprays paint. Hold still for more.', eraser: 'Paints in the secondary colour.',
          fill: 'Fills an area with the colour you click with.', picker: 'Picks a colour from the picture.', line: 'Draws a straight line. Shift keeps it at 45° steps.',
          rect: 'Draws a rectangle. Shift makes a square.', ellipse: 'Draws an ellipse. Shift makes a circle.', text: 'Click to type text in the primary colour.' }[k];
      }
      const setColours = () => { B.querySelector('.pt-fg').style.background = fg; B.querySelector('.pt-bg').style.background = bg; };
      B.querySelector('.pt-tools').onclick = e => { const b = e.target.closest('[data-t]'); if (b) pickTool(b.dataset.t); };
      optsBox.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.s) size = +b.dataset.s; if (b.dataset.f) fillMode = +b.dataset.f; showOpts(); };
      const sw = B.querySelector('.pt-sw');
      sw.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { fg = b.dataset.c; setColours(); } });
      sw.addEventListener('contextmenu', e => { const b = e.target.closest('[data-c]'); if (!b) return; e.preventDefault(); bg = b.dataset.c; setColours(); });
      B.querySelector('.pt-custom input').addEventListener('input', e => { fg = e.target.value; setColours(); });

      /* ---- drawing ---- */
      function dab(x, y, col) {
        if (tool === 'pencil') { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
        else if (tool === 'eraser') { const s = size * 3 + 4; ctx.fillStyle = col; ctx.fillRect(x - (s >> 1), y - (s >> 1), s, s); }
      }
      function spray(x, y, col) {
        const r = size * 3 + 6; ctx.fillStyle = col;
        for (let i = 0; i < 18; i++) { const a = Math.random() * Math.PI * 2, d = Math.random() * r; ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d), 1, 1); }
      }
      ov.addEventListener('contextmenu', e => e.preventDefault());
      ov.addEventListener('pointerdown', e => {
        if (e.button !== 0 && e.button !== 2) return;
        e.preventDefault();
        if (textBox) { commitText(); return; }
        if (tool !== 'text') root.focus({ preventScroll: true });
        const [x, y] = pos(e), alt = e.button === 2, col = alt ? bg : fg, other = alt ? fg : bg;
        if (tool === 'picker') { const d = ctx.getImageData(x, y, 1, 1).data, h = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
          if (alt) bg = h; else fg = h; setColours(); pickTool(lastTool); return; }
        if (tool === 'text') { openText(x, y); return; }
        push();
        if (tool === 'fill') { flood(x, y, col); return; }
        drag = { x0: x, y0: y, x, y, col: tool === 'eraser' ? bg : col, other };
        try { ov.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
        if (tool === 'pencil' || tool === 'eraser') dab(x, y, drag.col);
        else if (tool === 'brush') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + .5, y + .5, size / 2 + .5, 0, Math.PI * 2); ctx.fill(); }
        else if (tool === 'spray') { spray(x, y, col); sprayTimer = setInterval(() => drag && spray(drag.x, drag.y, drag.col), 30); }
      });
      ov.addEventListener('pointermove', e => {
        const [x, y] = pos(e);
        xy.textContent = x >= 0 && y >= 0 && x < cv.width && y < cv.height ? x + ', ' + y + 'px' : '';
        if (!drag) return;
        if (tool === 'pencil' || tool === 'eraser') line(drag.x, drag.y, x, y, (a, b) => dab(a, b, drag.col));
        else if (tool === 'brush') { ctx.strokeStyle = drag.col; ctx.lineWidth = size + 1; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(drag.x + .5, drag.y + .5); ctx.lineTo(x + .5, y + .5); ctx.stroke(); }
        else if (['line', 'rect', 'ellipse'].includes(tool)) { octx.clearRect(0, 0, ov.width, ov.height); shape(octx, drag.x0, drag.y0, x, y, drag.col, drag.other, e.shiftKey); }
        drag.x = x; drag.y = y;
      });
      const end = e => {
        if (!drag) return;
        clearInterval(sprayTimer);
        if (['line', 'rect', 'ellipse'].includes(tool)) { octx.clearRect(0, 0, ov.width, ov.height); const [x, y] = pos(e); shape(ctx, drag.x0, drag.y0, x, y, drag.col, drag.other, e.shiftKey); }
        drag = null;
      };
      ov.addEventListener('pointerup', end); ov.addEventListener('pointercancel', end);
      ov.addEventListener('pointerleave', () => { xy.textContent = ''; });

      /* ---- text ---- */
      function openText(x, y) {
        textBox = document.createElement('textarea');
        textBox.className = 'pt-text'; textBox.rows = 1; textBox.dataset.x = x; textBox.dataset.y = y;
        const px = size * 3 + 10;
        Object.assign(textBox.style, { left: x + 'px', top: y + 'px', font: `${px}px Tahoma, Verdana, sans-serif`, color: fg, lineHeight: '1.2' });
        textBox.setAttribute('aria-label', 'Text to add to the picture');
        B.querySelector('.pt-holder').appendChild(textBox);
        textBox.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { textBox.value = ''; commitText(); } else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(); } });
        textBox.addEventListener('input', () => { textBox.style.width = Math.max(40, textBox.scrollWidth + 4) + 'px'; textBox.style.height = textBox.scrollHeight + 'px'; });
        textBox.focus({ preventScroll: true });
      }
      function commitText() {
        const t = textBox; textBox = null;
        if (t.value.trim()) {
          push();
          const px = parseFloat(t.style.fontSize);
          ctx.font = t.style.font; ctx.fillStyle = t.style.color; ctx.textBaseline = 'top';
          t.value.split('\n').forEach((l, i) => ctx.fillText(l, +t.dataset.x + 2, +t.dataset.y + 2 + i * px * 1.2));
        }
        t.remove();
      }

      /* ---- resize the picture from its corner grip ---- */
      const grip = B.querySelector('.pt-grip'), ghost = B.querySelector('.pt-ghost');
      grip.addEventListener('pointerdown', e => {
        e.preventDefault(); grip.setPointerCapture(e.pointerId);
        const sx = e.clientX, sy = e.clientY, w0 = cv.width, h0 = cv.height;
        let w = w0, h = h0; ghost.hidden = false;
        const mv = ev => { w = Math.max(16, Math.min(2000, w0 + Math.round(ev.clientX - sx))); h = Math.max(16, Math.min(2000, h0 + Math.round(ev.clientY - sy)));
          ghost.style.width = w + 'px'; ghost.style.height = h + 'px'; sz.textContent = w + ' × ' + h + 'px'; };
        const up = () => {
          grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); ghost.hidden = true;
          if (w === w0 && h === h0) return;
          push(); const old = ctx.getImageData(0, 0, w0, h0); blank(w, h); ctx.putImageData(old, 0, 0);
        };
        mv(e); grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up);
      });

      /* ---- menus and commands ---- */
      const fileIn = B.querySelector('input[type=file]');
      const closeMenus = () => B.querySelectorAll('.pt-dd').forEach(d => { d.hidden = true; });
      B.querySelector('.pt-menus').addEventListener('click', e => {
        const mb = e.target.closest('.pt-mb');
        if (mb) { const dd = mb.nextElementSibling, was = dd.hidden; closeMenus(); dd.hidden = !was; return; }
        const c = e.target.closest('[data-cmd]'); if (!c) return;
        closeMenus(); run(c.dataset.cmd); root.focus({ preventScroll: true });
      });
      B.querySelector('.pt-menus').addEventListener('pointerover', e => { const mb = e.target.closest('.pt-mb'); if (mb && B.querySelector('.pt-dd:not([hidden])') && mb.nextElementSibling.hidden) { closeMenus(); mb.nextElementSibling.hidden = false; } });
      const outside = e => { if (!e.target.closest || !e.target.closest('.pt-menus')) closeMenus(); };
      document.addEventListener('pointerdown', outside);
      rec.o.onClose = () => { document.removeEventListener('pointerdown', outside); clearInterval(sprayTimer); };
      function transform(w, h, fn) { push(); const tmp = document.createElement('canvas'); tmp.width = cv.width; tmp.height = cv.height; tmp.getContext('2d').drawImage(cv, 0, 0); setSize(w, h); ctx.save(); fn(); ctx.drawImage(tmp, 0, 0); ctx.restore(); }
      function run(c) {
        if (textBox) commitText();
        const W = cv.width, H = cv.height;
        if (c === 'new') { push(); blank(Math.min(640, ws.clientWidth - 24), Math.min(420, ws.clientHeight - 24)); rec.setTitle('untitled - Paint'); }
        else if (c === 'open') fileIn.click();
        else if (c === 'save') { const name = addDrawing(cv.toDataURL('image/png')); st.textContent = name ? 'Saved as ' + name + ' in My Pictures.' : 'This picture is too big to keep in My Pictures. Use Download as PNG.'; if (name) rec.setTitle(name + ' - Paint'); }
        else if (c === 'download') { const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = 'paint-' + (++n) + '.png'; a.click(); }
        else if (c === 'exit') closeWin('paint');
        else if (c === 'undo' && undo.length) { redo.push(snap()); restore(undo.pop()); }
        else if (c === 'redo' && redo.length) { undo.push(snap()); restore(redo.pop()); }
        else if (c === 'clear') { push(); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }
        else if (c === 'fliph') transform(W, H, () => { ctx.translate(W, 0); ctx.scale(-1, 1); });
        else if (c === 'flipv') transform(W, H, () => { ctx.translate(0, H); ctx.scale(1, -1); });
        else if (c === 'rotate') transform(H, W, () => { ctx.translate(H, 0); ctx.rotate(Math.PI / 2); });
        else if (c === 'invert') { push(); const img = ctx.getImageData(0, 0, W, H), d = img.data; for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; } ctx.putImageData(img, 0, 0); }
      }
      fileIn.onchange = () => {
        const f = fileIn.files[0]; if (!f) return;
        const url = URL.createObjectURL(f), im = new Image();
        im.onload = () => { push(); const k = Math.min(1, 2000 / Math.max(im.width, im.height)); blank(Math.round(im.width * k), Math.round(im.height * k)); ctx.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); rec.setTitle(f.name + ' - Paint'); };
        im.src = url; fileIn.value = '';
      };
      root.addEventListener('keydown', e => {
        if (!(e.ctrlKey || e.metaKey)) return;
        const k = e.key.toLowerCase();
        if (k === 'z') { e.preventDefault(); run(e.shiftKey ? 'redo' : 'undo'); } else if (k === 'y') { e.preventDefault(); run('redo'); }
      });

      blank(Math.max(160, Math.min(640, ws.clientWidth - 24)), Math.max(120, Math.min(420, ws.clientHeight - 24)));
      setColours(); pickTool('pencil');
    },
    cmd() {
      if (wins.has('cmd')) { restore('cmd'); $('.cmd input', wins.get('cmd').body).focus(); return; }
      const body = el(`<div class="cmd" role="log" aria-live="polite"><div class="out"></div><div class="line"><span class="ps"></span><input type="text" aria-label="Command" autocomplete="off" autocapitalize="off" spellcheck="false"></div></div>`);
      const out = body.querySelector('.out'), input = body.querySelector('input'), ps = body.querySelector('.ps');
      let cwd = HOME; const hist = []; let hi = 0; let busy = false;
      const prompt = () => { ps.textContent = cwd + '>'; };
      const print = (t = '', cls) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; out.appendChild(d); body.scrollTop = body.scrollHeight; };
      const slow = (lines, ms = 220) => new Promise(res => { busy = true; input.disabled = true; let i = 0; const step = () => { if (i >= lines.length) { busy = false; input.disabled = false; input.focus(); res(); return; } print(lines[i++]); setTimeout(step, ms); }; step(); });
      let pingN = 0;
      /* WHOIS for real resources: the RIPE database first, then RIPEstat, which also covers the other registries */
      async function lookup(q) {
        const asn = /^(as)?(\d{1,10})$/i.exec(q), ip = /^[0-9a-f:.]+(\/\d{1,3})?$/i.test(q) && /[.:]/.test(q);
        if (!asn && !ip) { print(`WHOIS: ${q} is not an AS number, IP address or prefix. Try WHOIS AS207135.`); return; }
        const key = asn ? 'AS' + asn[2] : q.toLowerCase();
        const type = asn ? 'aut-num' : key.includes(':') ? 'inet6num' : 'inetnum';
        const get = async (url, as) => {
          const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
          try { const r = await fetch(url, { signal: ctl.signal, headers: as === 'json' ? { Accept: 'application/json' } : {} }); if (!r.ok) throw new Error(r.status); return as === 'json' ? r.json() : r.text(); }
          finally { clearTimeout(t); }
        };
        busy = true; input.disabled = true;
        print(`% Querying the RIPE database for ${key}...`);
        let lines = null;
        try {
          const txt = await get(`https://rest.db.ripe.net/ripe/${type}/${key}.txt`, 'text');
          lines = txt.replace(/\r/g, '').replace(/\n+$/, '').split('\n');
        } catch (e) {
          try {
            const j = await get('https://stat.ripe.net/data/whois/data.json?resource=' + encodeURIComponent(key) + '&sourceapp=v.giotsas.com', 'json');
            const recs = (j.data && j.data.records) || [];
            if (recs.length) {
              lines = ['% Answer from RIPEstat (' + ((j.data.authorities || []).join(', ') || 'whois') + ')'];
              recs.forEach(r => { lines.push(''); r.forEach(f => lines.push((f.key + ':').padEnd(16) + f.value)); });
            }
          } catch (e2) { /* both sources failed; reported below */ }
        }
        busy = false; input.disabled = false; input.focus();
        if (!lines) { print(`% No answer for ${key}. The registry may be unreachable from this network, or the object may not exist.`); return; }
        await slow(lines, 12);
      }
      const pad = (s, n) => (String(s) + ' '.repeat(n)).slice(0, n);
      const C = {
        help: () => print(['Commands:',
          '  TRACERT vasilis   Trace the route of my career',
          '  PING vasilis      Get a few random facts about me',
          '  WHOIS vasilis     Who I am, in one screen',
          '  WHOIS AS207135    Live RIPE database record of my network',
          '                    (also takes other ASNs, IPs and prefixes)',
          '  IPCONFIG          Network settings of AS207135',
          '  DIR               List what is on this desktop',
          '  START <name>      Open documents, videos, downloads, mail, browser, resume',
          '  CONTACT           Write me an email',
          '  CLS               Clear the screen',
          '  VER, DATE, TIME   The usual',
          '  EXIT              Close this window'].join('\n')),
        tracert: async () => {
          await slow(['', 'Tracing route to vasilis.as207135.net [AS207135]', 'over a maximum of 30 hops:', ''], 160);
          await slow(D.career.map((c, i) => {
            const n = Math.round(c[2]); const y = n + (n === 1 ? ' yr' : ' yrs');
            const last = i === D.career.length - 1;
            return `  ${i + 1}  ${pad(y, 8)} ${pad(y, 8)} ${pad(last ? '*' : y, 8)} ${c[0]} [${c[1]}]${last ? '  (still running)' : ''}`;
          }), 380);
          await slow(['', 'Trace complete.'], 120);
        },
        ping: async () => {
          const f = n => D.facts[n % D.facts.length];
          const rows = [0, 1, 2, 3].map(k => { const x = f(pingN + k); return `Reply from ${x[0]}: ${x[1]}`; });
          pingN += 4;
          await slow(['', 'Pinging vasilis.as207135.net with 32 bytes of data:', ''], 120);
          await slow(rows, 650);
          await slow(['', 'Ping statistics for vasilis.as207135.net:', '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)', 'Run PING again for more.'], 100);
        },
        whois: async a => {
          if (a && !/^vasilis/i.test(a)) return lookup(a);
          print(['', 'Name:          Vasilis Giotsas',
          'Role:          Senior Research Engineer, Cloudflare',
          'Previously:    Senior Lecturer (Associate Professor), Lancaster University',
          '               TU Berlin, CAIDA (UC San Diego)',
          'Education:     Ph.D. and M.Sc., University College London',
          'Interests:     Internet measurement, routing security, machine learning',
          'Network:       AS207135 (IPv6-only, run with my son)',
          'Contact:       ' + D.email, '', 'Try WHOIS AS207135 for the RIPE database record of my network.', ''].join('\n'));
        },
        ipconfig: () => print(['', 'VGOS IP Configuration', '', 'Ethernet adapter AS207135:', '',
          '   Connection-specific DNS Suffix  . : as207135.net',
          '   IPv6 Address. . . . . . . . . . . : yes, plenty',
          '   IPv4 Address. . . . . . . . . . . : none (the free pool ran out)',
          '   Operators . . . . . . . . . . . . : Vasilis and son', ''].join('\n')),
        dir: () => print([' Directory of ' + cwd, '',
          '11/22/2026  09:00 AM    <DIR>          My Documents',
          '11/22/2026  09:00 AM    <DIR>          My Videos',
          '11/22/2026  09:00 AM    <DIR>          My Pictures',
          '11/22/2026  09:00 AM    <DIR>          Downloads',
          '11/22/2026  09:00 AM            60,000 Resume.doc',
          '11/22/2026  09:00 AM             1,024 readme.txt',
          '               2 File(s)         61,024 bytes',
          '               4 Dir(s)   plenty of curiosity free'].join('\n')),
        start: a => {
          const map = { documents: 'documents', papers: 'papers', videos: 'videos', talks: 'videos', pictures: 'pictures', downloads: 'downloads', mail: 'mail', browser: 'browser', internet: 'browser', resume: 'resume', sweeper: 'sweeper', minesweeper: 'sweeper', paint: 'paint', mspaint: 'paint', computer: 'computer', readme: 'readme' };
          const k = map[(a || '').toLowerCase()];
          if (k) { APPS[k](); print('Opening ' + a + '...'); } else print('Usage: START documents | videos | pictures | downloads | mail | browser | resume');
        },
        contact: () => { APPS.compose(); print('Opening a new message...'); },
        cls: () => { out.textContent = ''; },
        ver: () => print('\nVGOS [Version 2026.11]\n'),
        date: () => print('The current date is: ' + new Date().toLocaleDateString()),
        time: () => print('The current time is: ' + new Date().toLocaleTimeString()),
        exit: () => closeWin('cmd'),
        echo: a => print(a || 'ECHO is on.'),
        cd: a => { if (!a || a === '.') print(cwd); else if (a === '..' || a === '\\') { cwd = 'C:\\'; prompt(); } else if (a.toLowerCase() === '~' || a.toLowerCase() === 'home') { cwd = HOME; prompt(); } else print('The system cannot find the path specified.'); },
        sudo: () => print("'sudo' is not recognized as an internal or external command.\nNice try. This is not that kind of operating system."),
        whoami: () => print('visitor\\guest'),
        hello: () => print('Hello! Type CONTACT to say it properly.')
      };
      C.ls = C.dir; C.clear = C.cls; C.traceroute = C.tracert; C.open = C.start;
      async function run(line) {
        print(cwd + '>' + line);
        const [cmd, ...rest] = line.trim().split(/\s+/);
        if (!cmd) return;
        const k = cmd.toLowerCase(), arg = rest.join(' ');
        if ((k === 'ping' || k === 'tracert' || k === 'traceroute') && arg && !/^vasilis/i.test(arg)) { print(`Unknown host ${arg}. Try ${k.toUpperCase()} vasilis.`); return; }
        if (C[k]) await C[k](arg); else print(`'${cmd}' is not recognized as an internal or external command,\noperable program or batch file. Type HELP for a list.`);
      }
      input.addEventListener('keydown', async e => {
        if (e.key === 'Enter' && !busy) { const v = input.value; input.value = ''; if (v.trim()) { hist.push(v); hi = hist.length; } await run(v); print(''); }
        else if (e.key === 'ArrowUp') { if (hi > 0) { hi--; input.value = hist[hi]; } e.preventDefault(); }
        else if (e.key === 'ArrowDown') { if (hi < hist.length) { hi++; input.value = hist[hi] || ''; } e.preventDefault(); }
      });
      body.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });
      openWin('cmd', { title: 'Command Prompt', icon: 'cmd', w: 720, h: 420, body });
      print('VGOS [Version 2026.11]\n(C) Vasilis Giotsas. Type HELP for a list of commands, or try TRACERT vasilis.\n');
      prompt(); input.focus();
    }
  };
  /* Previews of my profiles on other sites, drawn in HTML from my own public details. Each one is a single link to
     the real page, so nothing inside may be a link. No logos: only the site's colours and layout ideas. */
  function webPage(k) {
    const yt = id => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
    const bar = (name, path) => `<div class="wp-bar"><b>${name}</b><span>${path}</span></div>`;
    if (k === 'linkedin') {
      const jobs = D.career.slice().reverse().filter(c => !/B\.Sc|M\.Sc|Ph\.D/.test(c[4]));
      const edu = D.career.slice().reverse().filter(c => /B\.Sc|M\.Sc|Ph\.D/.test(c[4]));
      const row = (c, job) => `<div class="li-row"><span class="li-logo">${esc(c[3][0])}</span><div><b>${esc(job ? c[4].split('. ')[0] : c[4])}</b><div>${esc(c[3])}</div><small>${esc(c[1].replace('-', ' – ').replace('now', 'Present'))}</small></div></div>`;
      return bar('LinkedIn', 'linkedin.com/in/giotsas') + `<div class="li-wrap">
        <section class="li-card li-top"><div class="li-cover"></div><img src="img/vasilis.jpg" alt="">
          <h1>Vasileios Giotsas</h1><p class="li-head">Research Engineer, Lecturer, Data Scientist</p>
          <p class="li-loc">London, England, United Kingdom · <span class="li-link">Contact info</span></p><p class="li-loc"><b>500+</b> connections</p>
          <div class="li-orgs"><span><i>C</i>Cloudflare</span><span><i>U</i>UCL</span></div>
          <span class="li-btn">View full profile</span></section>
        <section class="li-card"><h2>Experience</h2>${jobs.map(c => row(c, true)).join('')}</section>
        <section class="li-card"><h2>Education</h2>${edu.map(c => row(c, false)).join('')}</section></div>`;
    }
    if (k === 'scholar') {
      const P = [['AS Relationships, Customer Cones, and Validation', 'M Luckie, B Huffaker, A Dhamdhere, V Giotsas', 'IMC', 458, 2013],
        ['Inferring complex AS relationships', 'V Giotsas, M Luckie, B Huffaker, KC Claffy', 'Proceedings of the 2014 Conference on Internet Measurement Conference, 23-30', 199, 2014],
        ['BGPStream: a software framework for live and historical BGP data analysis', 'C Orsini, A King, D Giordano, V Giotsas, A Dainotti', 'Proceedings of the 2016 Internet Measurement Conference, 429-444', 197, 2016],
        ['Cloud provider connectivity in the flat internet', 'T Arnold, J He, W Jiang, M Calder, I Cunha, V Giotsas, E Katz-Bassett', 'Proceedings of the ACM Internet Measurement Conference, 230-246', 124, 2020],
        ['Detecting peering infrastructure outages in the wild', 'V Giotsas, C Dietzel, G Smaragdakis, A Feldmann, A Berger, E Aben', 'Proceedings of the ACM SIGCOMM conference', 109, 2017]];
      return bar('Scholar', 'scholar.google.com') + `<div class="gs-wrap"><div class="gs-head"><img src="img/vasilis-london.jpg" alt="">
          <div><h1>Giotsas Vasileios</h1><p class="gs-u">Lancaster University</p><p>Verified email at lancaster.ac.uk - <u>Homepage</u></p>
          <p class="gs-tags"><span>Internet Routing</span><span>Complex Networks</span><span>Distributed Systems</span><span>Sensor Networks</span></p></div>
          <span class="gs-follow">Follow</span></div>
        <div class="gs-table"><div class="gs-th"><span>Title</span><span>Cited by</span><span>Year</span></div>
        ${P.map(p => `<div class="gs-tr"><div><span class="gs-t">${esc(p[0])}</span><small>${esc(p[1])}</small><small>${esc(p[2])}</small></div><span class="gs-c">${p[3]}</span><span>${p[4]}</span></div>`).join('')}
        <div class="gs-more">Show more</div></div></div>`;
    }
    if (k === 'github') {
      const order = ['ipv6-route-optimization', 'CommunitiesParser', 'ip-transfers-observatory', 'IxpRsCollector', 'NTS-KE-Dissector', 'SiblingASesCollector'];
      const repos = order.map(r => D.software.find(x => x.repo === r)).filter(Boolean);
      const dot = { Python: '#3572A5', Java: '#b07219', Lua: '#000080', JavaScript: '#f1e05a' };
      const cells = '0111001010101010101000000'.split('').map(b => `<i class="${b === '1' ? 'on' : ''}"></i>`).join('');
      return bar('GitHub', 'github.com/vgiotsas') + `<div class="gh-wrap"><aside><div class="gh-av">${cells}</div><h1>vgiotsas</h1><span class="gh-btn">Follow</span></aside>
        <div class="gh-main"><div class="gh-tabs"><b>Overview</b><span>Repositories</span><span>Projects</span><span>Stars</span></div>
          <h2>Popular repositories</h2><div class="gh-grid">${repos.map(r => { const l = r.lang.split(',')[0].trim();
            return `<div class="gh-repo"><div><b>${esc(r.repo)}</b><em>Public</em></div><p>${esc(r.desc)}</p><small><i style="background:${dot[l] || '#8b949e'}"></i>${esc(l)}</small></div>`; }).join('')}</div></div></div>`;
    }
    if (k === 'twitter') {
      return bar('X', 'x.com/GVasilis') + `<div class="tw-wrap"><div class="tw-banner"></div><div class="tw-prof"><img src="img/vasilis.jpg" alt=""><span class="tw-btn">Follow</span></div>
        <h1>Vasileios Giotsas</h1><p class="tw-h">@GVasilis</p><p><span class="tw-l">#BSky</span>: <span class="tw-l">@giotsas</span>.com</p>
        <p class="tw-h"><span class="tw-l">giotsas.com</span> · Joined April 2010</p><p><b>596</b> <span class="tw-h">Following</span> &nbsp; <b>357</b> <span class="tw-h">Followers</span></p>
        <div class="tw-tabs"><b>Posts</b><span>Replies</span><span>Media</span></div><p class="tw-note">Open X to read my posts.</p></div>`;
    }
    if (k === 'youtube') {
      return bar('YouTube', 'youtube.com/@giotsas') + `<div class="yt-wrap"><div class="yt-head"><img src="img/vasilis.jpg" alt=""><div><h1>Giotsas</h1>
          <p>@giotsas · 85 videos</p><p>Run by Vasilis and Nikos Giotsas.</p><span class="yt-btn">Subscribe</span></div></div>
        <div class="yt-tabs"><span>Home</span><b>Videos</b><span>Playlists</span></div>
        <div class="yt-grid">${D.talks.map(t => `<div class="yt-v"><img loading="lazy" src="${yt(t[0])}" alt=""><b>${esc(t[2])}</b><small>${esc(t[1])}</small></div>`).join('')}</div></div>`;
    }
    if (k === 'cfblog') {
      const posts = D.articles.filter(a => a[0] === 'Cloudflare Blog');
      return bar('The Cloudflare Blog', 'blog.cloudflare.com/author/vasilis') + `<div class="cf-wrap"><div class="cf-head"><img src="img/vasilis.jpg" alt=""><div><h1>Vasilis Giotsas</h1><p>London, UK</p></div></div>
        ${posts.map(a => `<div class="cf-post"><small>${a[1]}</small><b>${esc(a[2])}</b></div>`).join('')}</div>`;
    }
    return '';
  }
  function linkify(t) { return esc(t).replace(/https?:\/\/[^\s]+/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`); }

  /* ---------------- Desktop icons ---------------- */
  const DESK = [
    ['My Documents', 'documents', APPS.documents], ['My Computer', 'computer', APPS.computer], ['Recycle Bin', 'recycle', APPS.recycle],
    ['Internet', 'browser', () => APPS.browser()], ['Mail', 'mail', APPS.mail], ['My Videos', 'videos', APPS.videos],
    ['Downloads', 'downloads', APPS.downloads], ['Command Prompt', 'cmd', APPS.cmd], ['Paint', 'paint', APPS.paint], ['Resume.doc', 'doc', APPS.resume], ['readme.txt', 'notepad', APPS.readme]
  ];
  const icons = $('#icons');
  DESK.forEach(([name, icon, open]) => {
    const b = el(`<button type="button" class="dicon">${I[icon]()}<span>${esc(name)}</span></button>`);
    b.dataset.k = name;
    dragIcon(b);
    activatable(b, open, () => { $$('.dicon').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); });
    icons.appendChild(b);
  });

  /* Dragging. Icons start in the flowing column layout; the first drag pins every icon where it
     stands. Positions are kept per layout (desktop or phone) in localStorage between visits. */
  const keep = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
  };
  const posKey = () => 'vg-icons-' + (mobile() ? 'phone' : 'desk');
  function place(b, x, y) {
    b.style.left = Math.max(0, Math.min(x, icons.clientWidth - b.offsetWidth)) + 'px';
    b.style.top = Math.max(0, Math.min(y, icons.clientHeight - b.offsetHeight)) + 'px';
  }
  function pinIcons(saved) {
    const box = icons.getBoundingClientRect(), list = $$('.dicon');
    const rects = list.map(b => b.getBoundingClientRect());
    icons.classList.add('free');
    list.forEach((b, i) => {
      const p = (saved && saved[b.dataset.k]) || { x: rects[i].left - box.left, y: rects[i].top - box.top };
      if (rects[i].width) b.style.width = rects[i].width + 'px'; // keep the flowing width once pinned
      place(b, p.x, p.y);
    });
  }
  function unpinIcons() {
    icons.classList.remove('free');
    $$('.dicon').forEach(b => { b.style.left = b.style.top = b.style.width = ''; });
  }
  function saveIcons() {
    const pos = {};
    $$('.dicon').forEach(b => { pos[b.dataset.k] = { x: b.offsetLeft, y: b.offsetTop }; });
    keep.set(posKey(), pos);
  }
  function restoreIcons() {
    unpinIcons();
    const saved = keep.get(posKey());
    if (saved) pinIcons(saved);
  }
  function dragIcon(b) {
    let endedAt = 0;
    // A drag ends with a click (and maybe a dblclick); swallow those so the drop does not open the icon
    b.addEventListener('click', e => { if (Date.now() - endedAt < 400) e.stopImmediatePropagation(); });
    b.addEventListener('dblclick', e => { if (Date.now() - endedAt < 600) e.stopImmediatePropagation(); });
    b.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const sx = e.clientX, sy = e.clientY;
      let from = null;
      const move = ev => {
        if (!from) {
          if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
          if (!icons.classList.contains('free')) pinIcons();
          from = { x: b.offsetLeft, y: b.offsetTop };
          b.classList.add('dragging');
        }
        place(b, from.x + ev.clientX - sx, from.y + ev.clientY - sy);
      };
      const up = () => {
        removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
        if (!from) return;
        b.classList.remove('dragging'); endedAt = Date.now(); saveIcons();
      };
      addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    });
  }
  let wasMobile = mobile();
  addEventListener('resize', () => {
    if (mobile() !== wasMobile) { wasMobile = mobile(); restoreIcons(); }
    else if (icons.classList.contains('free')) $$('.dicon').forEach(b => place(b, b.offsetLeft, b.offsetTop));
  });
  desktop.addEventListener('pointerdown', e => { if (!e.target.closest('.dicon')) $$('.dicon').forEach(x => x.classList.remove('sel')); });

  /* ---------------- Start menu ---------------- */
  const sm = $('#startmenu'), sb = $('#start-btn');
  const smItem = (icon, title, sub, act) => `<button type="button" role="menuitem" class="sm-item" data-act="${act}">${I[icon]()}<div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div></button>`;
  sm.innerHTML = `<div class="sm-head"><img src="img/vasilis.jpg" alt="">Vasilis</div><div class="sm-body">
    <div class="sm-left">${smItem('browser', 'Internet', 'My profiles on the web', 'browser')}${smItem('mail', 'E-mail', 'Write to me', 'mail')}<div class="sm-sep"></div>
      ${smItem('cmd', 'Command Prompt', '', 'cmd')}${smItem('video', 'Media Player', 'Recorded talks', 'player')}${smItem('sweeper', 'Paper Sweeper', 'Get past Reviewer 2', 'sweeper')}${smItem('paint', 'Paint', '', 'paint')}${smItem('notepad', 'readme.txt', '', 'readme')}</div>
    <div class="sm-right">${smItem('documents', 'My Documents', '', 'documents')}${smItem('pictures', 'My Pictures', '', 'pictures')}${smItem('videos', 'My Videos', '', 'videos')}${smItem('downloads', 'Downloads', '', 'downloads')}${smItem('computer', 'My Computer', '', 'computer')}<div class="sm-sep"></div>
      ${smItem('info', 'System Properties', '', 'system')}${smItem('help', 'Help and Support', '', 'readme')}${smItem('run', 'Run...', '', 'cmd')}</div></div>
    <div class="sm-foot"><button type="button" data-act="logoff">${I.logoff()}Log Off</button><button type="button" data-act="turnoff">${I.power()}Turn Off Computer</button></div>`;
  function openStart() { sm.hidden = false; sb.classList.add('on'); sb.setAttribute('aria-expanded', 'true'); const f = sm.querySelector('.sm-item'); if (f) f.focus(); }
  function closeStart() { sm.hidden = true; sb.classList.remove('on'); sb.setAttribute('aria-expanded', 'false'); }
  sb.onclick = e => { e.stopPropagation(); sm.hidden ? openStart() : closeStart(); };
  sm.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act; closeStart();
    if (a === 'logoff') { closeAll(); showLogin(); }
    else if (a === 'turnoff') turnOff();
    else if (a === 'player') APPS.player(0);
    else APPS[a]();
  });
  document.addEventListener('pointerdown', e => {
    if (!sm.hidden && !e.target.closest('#startmenu') && !e.target.closest('#start-btn')) closeStart();
    if (!ctx.hidden && !e.target.closest('#ctx')) ctx.hidden = true;
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeStart(); ctx.hidden = true; } });

  function turnOff() {
    openWin('off', { title: 'Turn off computer', icon: 'power', w: 380, h: 190, body: `<div class="dlg"><div class="dlg-row">${I.power()}<div>What do you want the computer to do?</div></div>
      <div class="acts"><button class="btn" type="button" data-o="restart">Restart</button><button class="btn" type="button" data-o="off">Turn Off</button><button class="btn" type="button" data-o="cancel">Cancel</button></div></div>` });
    const b = wins.get('off').body;
    b.querySelector('[data-o="restart"]').onclick = showBoot;
    b.querySelector('[data-o="off"]').onclick = powerOff;
    b.querySelector('[data-o="cancel"]').onclick = () => closeWin('off');
  }

  /* ---------------- Desktop context menu ---------------- */
  const ctx = $('#ctx');
  desktop.addEventListener('contextmenu', e => {
    if (e.target.closest('.win')) return;
    e.preventDefault();
    ctx.innerHTML = `<button type="button" data-c="arrange">Arrange Icons</button><button type="button" data-c="refresh">Refresh</button><hr><button type="button" data-c="cmd">Open Command Prompt here</button><button type="button" data-c="mail">New Message</button><hr><button type="button" data-c="system">Properties</button>`;
    ctx.style.left = Math.min(e.clientX, innerWidth - 180) + 'px';
    ctx.style.top = Math.min(e.clientY, innerHeight - 140) + 'px';
    ctx.hidden = false;
  });
  ctx.addEventListener('click', e => {
    const c = e.target.closest('[data-c]'); if (!c) return; ctx.hidden = true;
    if (c.dataset.c === 'arrange') { keep.del(posKey()); unpinIcons(); }
    else if (c.dataset.c === 'refresh') { icons.style.opacity = '0'; setTimeout(() => { icons.style.opacity = ''; }, 120); }
    else if (c.dataset.c === 'mail') APPS.compose();
    else APPS[c.dataset.c]();
  });

  /* ---------------- Start up ---------------- */
  window.VGOS = { APPS, openWin, closeWin };
  if (store.get('vg-on') || location.hash) logOn(); else showBoot();
})();
