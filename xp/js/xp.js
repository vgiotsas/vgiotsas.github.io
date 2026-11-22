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
    hideAllScreens(); desktop.hidden = false; taskbar.hidden = false; store.set('vg-on', '1');
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
          { name: 'london-at-night.jpg', icon: 'image', info: 'Tower Bridge and the City, from the Thames.', open: () => APPS.picture('img/vasilis-london.jpg', 'london-at-night.jpg') },
          { name: 'profile.jpg', icon: 'image', open: () => APPS.picture('img/vasilis.jpg', 'profile.jpg') }
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
  const OTHER = [['My Documents', 'documents'], ['My Pictures', 'pictures'], ['My Videos', 'videos'], ['Downloads', 'downloads'], ['My Computer', 'computer']];

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

    picture(src, name) {
      openWin('pic-' + name, { title: name + ' - Picture Viewer', icon: 'image', w: 760, h: 480,
        body: `<div class="pv"><img src="${src}" alt="Vasilis Giotsas by the Thames at night, with Tower Bridge and the City of London behind him"></div>` });
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
      const tabs = {
        g: `<div class="sysprops"><div class="logo"><img src="img/vasilis.jpg" alt="">${I.mark().replace('<svg', '<svg style="width:40px;height:40px;background:#3a9b38;border-radius:6px"')}</div><div>
          <p><b>System:</b><br>VGOS Professional<br>Version 2026</p>
          <p><b>Registered to:</b><br>Vasilis Giotsas<br>Cloudflare Research</p>
          <p><b>Computer:</b><br>Senior Research Engineer<br>60 peer-reviewed papers<br>134,000+ dataset downloads<br>13 years uptime measuring the Internet</p></div></div>`,
        n: `<div class="dlg-row">${I.network()}<div><p style="margin:0 0 8px"><b>AS207135</b></p>
          <p style="margin:0 0 8px">An IPv6-only autonomous system that I run with <a href="${D.links.son}" target="_blank" rel="noopener">my son</a>.</p>
          <p style="margin:0">IPv4 address: none. The free pool ran out a while ago.</p></div></div>`
      };
      const show = k => { pane.innerHTML = tabs[k]; body.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === k)); };
      body.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => show(b.dataset.tab); });
      show('g');
      openWin('sys', { title: 'System Properties', icon: 'computer', w: 460, h: 420, body });
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
        { k: 'home', t: 'v.giotsas.com', url: D.links.home, icon: 'home', frame: true },
        { k: 'linkedin', t: 'LinkedIn', url: D.links.linkedin, icon: 'user', shot: 'img/shots/linkedin.jpg', alt: 'My LinkedIn profile: Vasileios Giotsas, Research Engineer, Lecturer, Data Scientist, with Cloudflare and UCL.' },
        { k: 'scholar', t: 'Google Scholar', url: D.links.scholar, icon: 'search', shot: 'img/shots/scholar.jpg', alt: 'My Google Scholar profile, listing papers by citation count.' },
        { k: 'github', t: 'GitHub', url: D.links.github, icon: 'zip', shot: 'img/shots/github.jpg', alt: 'My GitHub profile, vgiotsas, with popular repositories.' },
        { k: 'twitter', t: 'Twitter / X', url: D.links.twitter, icon: 'send', shot: 'img/shots/twitter.jpg', alt: 'My X profile, @GVasilis.' },
        { k: 'youtube', t: 'YouTube', url: 'https://www.youtube.com/@giotsas', icon: 'video', shot: 'img/shots/youtube.jpg', alt: 'The Giotsas YouTube channel, run by Vasilis and Nikos Giotsas.' },
        { k: 'cfblog', t: 'Cloudflare Blog', url: D.links.cfblog, icon: 'articles', text: 'My posts on the Cloudflare Blog about CGNAT detection, route leaks, RPKI and Internet resilience.' }
      ];
      const body = el(`<div style="display:flex;flex-direction:column;flex:1;min-height:0">
        <div class="menubar"><span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span></div>
        <div class="toolbar"><button class="tbtn" type="button" disabled>${I.back()}Back</button><button class="tbtn" type="button" disabled aria-label="Forward">${I.forward()}</button><button class="tbtn" type="button" data-a="reload">${I.refresh()}</button><button class="tbtn" type="button" data-a="home">${I.home()}Home</button></div>
        <div class="addr">Address<div class="field"></div><a class="btn" data-a="go" target="_blank" rel="noopener" style="min-width:0;padding:2px 10px">Go</a></div>
        <div class="br-tabs" role="tablist"></div><div class="br-view"></div><div class="statusbar"><span class="st">Done</span></div></div>`);
      let cur = tab;
      function show(k) {
        cur = k; const t = T.find(x => x.k === k) || T[0];
        body.querySelector('.br-tabs').innerHTML = T.map(x => `<button type="button" role="tab" aria-selected="${x.k === k}" class="${x.k === k ? 'on' : ''}" data-k="${x.k}">${I[x.icon]()}<span>${esc(x.t)}</span></button>`).join('');
        body.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => show(b.dataset.k); });
        body.querySelector('.field').innerHTML = I.browser() + esc(t.url);
        body.querySelector('[data-a="go"]').href = t.url;
        const view = body.querySelector('.br-view');
        view.scrollTop = 0;
        view.innerHTML = t.frame ? `<iframe title="v.giotsas.com" src="${t.url}"></iframe>` : t.shot ?
          `<a class="br-shot" href="${t.url}" target="_blank" rel="noopener" aria-label="Open my ${esc(t.t)} page in a new tab"><span class="br-hint">${I.info()}This is a picture of my ${esc(t.t)} page. Click anywhere to open the real one in a new tab.</span><img src="${t.shot}" alt="${esc(t.alt)}"></a>` :
          `<div class="br-page"><h2>${I[t.icon]()}${esc(t.t)}</h2><div class="url">${esc(t.url)}</div><p>${esc(t.text)}</p>
           <p>This site doesn't allow itself to be shown inside another page, so it opens in a new tab.</p>
           <p><a class="btn primary" href="${t.url}" target="_blank" rel="noopener">Open ${esc(t.t)}</a></p></div>`;
        rec.setTitle(t.t + ' - Web Browser');
        body.querySelector('.st').textContent = t.frame ? 'Done' : t.shot ? 'Picture of ' + t.url + '. Click to open the real page.' : 'Opens in a new tab';
      }
      body.querySelector('[data-a="reload"]').onclick = () => show(cur);
      body.querySelector('[data-a="home"]').onclick = () => show('home');
      const existing = wins.get('br');
      if (existing) { existing.show(tab); restore('br'); return; }
      const rec = openWin('br', { title: 'Web Browser', icon: 'browser', w: 980, h: 620, body });
      rec.show = show; show(tab);
    },

    /* ----- Command prompt ----- */
    cmd() {
      if (wins.has('cmd')) { restore('cmd'); $('.cmd input', wins.get('cmd').body).focus(); return; }
      const body = el(`<div class="cmd" role="log" aria-live="polite"><div class="out"></div><div class="line"><span class="ps"></span><input type="text" aria-label="Command" autocomplete="off" autocapitalize="off" spellcheck="false"></div></div>`);
      const out = body.querySelector('.out'), input = body.querySelector('input'), ps = body.querySelector('.ps');
      let cwd = HOME; const hist = []; let hi = 0; let busy = false;
      const prompt = () => { ps.textContent = cwd + '>'; };
      const print = (t = '', cls) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; out.appendChild(d); body.scrollTop = body.scrollHeight; };
      const slow = (lines, ms = 220) => new Promise(res => { busy = true; input.disabled = true; let i = 0; const step = () => { if (i >= lines.length) { busy = false; input.disabled = false; input.focus(); res(); return; } print(lines[i++]); setTimeout(step, ms); }; step(); });
      let pingN = 0;
      const pad = (s, n) => (String(s) + ' '.repeat(n)).slice(0, n);
      const C = {
        help: () => print(['Commands:',
          '  TRACERT vasilis   Trace the route of my career',
          '  PING vasilis      Get a few random facts about me',
          '  WHOIS vasilis     Who I am, in one screen',
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
        whois: () => print(['', 'Name:          Vasilis Giotsas',
          'Role:          Senior Research Engineer, Cloudflare',
          'Previously:    Senior Lecturer (Associate Professor), Lancaster University',
          '               TU Berlin, CAIDA (UC San Diego)',
          'Education:     Ph.D. and M.Sc., University College London',
          'Interests:     Internet measurement, routing security, machine learning',
          'Network:       AS207135 (IPv6-only, run with my son)',
          'Contact:       ' + D.email, ''].join('\n')),
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
          const map = { documents: 'documents', papers: 'papers', videos: 'videos', talks: 'videos', pictures: 'pictures', downloads: 'downloads', mail: 'mail', browser: 'browser', internet: 'browser', resume: 'resume', computer: 'computer', readme: 'readme' };
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
        if ((k === 'ping' || k === 'tracert' || k === 'traceroute' || k === 'whois') && arg && !/^vasilis/i.test(arg)) { print(`Unknown host ${arg}. Try ${k.toUpperCase()} vasilis.`); return; }
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
  function linkify(t) { return esc(t).replace(/https?:\/\/[^\s]+/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`); }

  /* ---------------- Desktop icons ---------------- */
  const DESK = [
    ['My Documents', 'documents', APPS.documents], ['My Computer', 'computer', APPS.computer], ['Recycle Bin', 'recycle', APPS.recycle],
    ['Internet', 'browser', () => APPS.browser()], ['Mail', 'mail', APPS.mail], ['My Videos', 'videos', APPS.videos],
    ['Downloads', 'downloads', APPS.downloads], ['Command Prompt', 'cmd', APPS.cmd], ['Resume.doc', 'doc', APPS.resume], ['readme.txt', 'notepad', APPS.readme]
  ];
  const icons = $('#icons');
  DESK.forEach(([name, icon, open]) => {
    const b = el(`<button type="button" class="dicon">${I[icon]()}<span>${esc(name)}</span></button>`);
    activatable(b, open, () => { $$('.dicon').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); });
    icons.appendChild(b);
  });
  desktop.addEventListener('pointerdown', e => { if (!e.target.closest('.dicon')) $$('.dicon').forEach(x => x.classList.remove('sel')); });

  /* ---------------- Start menu ---------------- */
  const sm = $('#startmenu'), sb = $('#start-btn');
  const smItem = (icon, title, sub, act) => `<button type="button" role="menuitem" class="sm-item" data-act="${act}">${I[icon]()}<div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div></button>`;
  sm.innerHTML = `<div class="sm-head"><img src="img/vasilis.jpg" alt="">Vasilis</div><div class="sm-body">
    <div class="sm-left">${smItem('browser', 'Internet', 'My profiles on the web', 'browser')}${smItem('mail', 'E-mail', 'Write to me', 'mail')}<div class="sm-sep"></div>
      ${smItem('doc', 'Resume', '', 'resume')}${smItem('cmd', 'Command Prompt', '', 'cmd')}${smItem('video', 'Media Player', 'Recorded talks', 'player')}${smItem('pdf', 'Papers', '', 'papers')}${smItem('notepad', 'readme.txt', '', 'readme')}</div>
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
    ctx.innerHTML = `<button type="button" data-c="refresh">Refresh</button><hr><button type="button" data-c="cmd">Open Command Prompt here</button><button type="button" data-c="mail">New Message</button><hr><button type="button" data-c="system">Properties</button>`;
    ctx.style.left = Math.min(e.clientX, innerWidth - 180) + 'px';
    ctx.style.top = Math.min(e.clientY, innerHeight - 140) + 'px';
    ctx.hidden = false;
  });
  ctx.addEventListener('click', e => {
    const c = e.target.closest('[data-c]'); if (!c) return; ctx.hidden = true;
    if (c.dataset.c === 'refresh') { icons.style.opacity = '0'; setTimeout(() => { icons.style.opacity = ''; }, 120); }
    else if (c.dataset.c === 'mail') APPS.compose();
    else APPS[c.dataset.c]();
  });

  /* ---------------- Start up ---------------- */
  window.VGOS = { APPS, openWin, closeWin };
  if (store.get('vg-on') || location.hash) logOn(); else showBoot();
})();
