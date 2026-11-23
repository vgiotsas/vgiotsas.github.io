/* Original icon set for v.giotsas.com/xp (hand-drawn SVG, 48x48 grid) */
(function () {
  const g = (id, stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  let n = 0;
  const uid = p => p + (++n);
  const svg = (inner, defs = '') => `<svg viewBox="0 0 48 48" aria-hidden="true"><defs>${defs}</defs>${inner}</svg>`;

  function folder(badge = '') {
    const a = uid('fa'), b = uid('fb');
    return svg(`<path d="M4 12a3 3 0 0 1 3-3h12l4 4h18a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="url(#${a})" stroke="#b88a16" stroke-width="1"/>
      <path d="M4 18h40v20a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="url(#${b})" stroke="#c99a1c" stroke-width="1"/>${badge}`,
      g(a, [[0, '#f7d978'], [1, '#e3b33c']]) + g(b, [[0, '#ffe9a3'], [1, '#f4c94d']]));
  }
  const I = {
    folder: () => folder(),
    documents: () => svg('<image href="img/documents.png" x="0" y="0" width="48" height="48"/>'),
    videos: () => folder(`<rect x="15" y="23" width="18" height="13" rx="2" fill="#2e3b63"/><path d="M22 26.5v6l5-3z" fill="#fff"/>`),
    pictures: () => folder(`<rect x="15" y="22" width="18" height="14" rx="1" fill="#fff" stroke="#7a8aa8"/><path d="M16 35l5-6 4 4 3-3 4 5z" fill="#4c9a3f"/><circle cx="28" cy="26" r="2" fill="#f2b53a"/>`),
    downloads: () => folder(`<circle cx="24" cy="29" r="8" fill="#2f8a2c"/><path d="M24 24v9M20 29.5l4 4 4-4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`),
    articles: () => folder(`<circle cx="24" cy="29" r="8" fill="#2c6fd6"/><path d="M16 29h16M24 21c3 3 3 13 0 16M24 21c-3 3-3 13 0 16" stroke="#fff" stroke-width="1.3" fill="none"/>`),
    computer: () => svg('<image href="img/computer.png" x="0" y="0" width="48" height="48"/>'),
    recycle: () => svg('<image href="img/recycle.png" x="0" y="0" width="48" height="48"/>'),
    mail: () => { const a = uid('ma'); return svg(`<rect x="5" y="12" width="38" height="26" rx="2" fill="url(#${a})" stroke="#8a7a4a"/><path d="M6 13l18 14 18-14" fill="none" stroke="#8a7a4a" stroke-width="1.5"/><circle cx="37" cy="13" r="7" fill="#2c6fd6"/><path d="M34 13h6M37 10v6" stroke="#fff" stroke-width="1.6"/>`, g(a, [[0, '#fff8df'], [1, '#ecd99c']])); },
    browser: () => svg('<image href="img/browser.png" x="0" y="0" width="48" height="48"/>'),
    cmd: () => svg(`<rect x="5" y="8" width="38" height="32" rx="2" fill="#000" stroke="#7a7a7a"/><rect x="5" y="8" width="38" height="5" fill="#2c5fd0"/><path d="M10 20l5 4-5 4" stroke="#c0c0c0" stroke-width="2" fill="none"/><path d="M17 29h8" stroke="#c0c0c0" stroke-width="2"/>`),
    notepad: () => svg(`<rect x="10" y="6" width="28" height="36" rx="1" fill="#fff" stroke="#6d7891"/><rect x="10" y="6" width="28" height="6" fill="#7aa7e9"/><path d="M15 18h18M15 23h18M15 28h18M15 33h12" stroke="#9aa6bd" stroke-width="1.4"/>`),
    doc: () => svg(`<path d="M11 5h19l8 8v30H11z" fill="#fff" stroke="#6d7891"/><path d="M30 5v8h8" fill="#e5ebf5" stroke="#6d7891"/><rect x="11" y="18" width="20" height="10" fill="#2c5fd0"/><text x="21" y="26" font-family="Arial" font-weight="700" font-size="8" fill="#fff" text-anchor="middle">CV</text><path d="M15 32h19M15 36h19" stroke="#9aa6bd" stroke-width="1.4"/>`),
    pdf: () => svg(`<path d="M11 5h19l8 8v30H11z" fill="#fff" stroke="#6d7891"/><path d="M30 5v8h8" fill="#f5e5e5" stroke="#6d7891"/><rect x="8" y="24" width="24" height="11" rx="1" fill="#c8321e"/><text x="20" y="32.5" font-family="Arial" font-weight="700" font-size="8" fill="#fff" text-anchor="middle">PDF</text><path d="M15 16h15M15 20h15" stroke="#9aa6bd" stroke-width="1.4"/>`),
    video: () => svg(`<rect x="6" y="10" width="36" height="28" rx="2" fill="#2e3b63" stroke="#1a2340"/><path d="M6 15h36M6 33h36" stroke="#556aa6" stroke-dasharray="3 3"/><path d="M20 18v12l10-6z" fill="#fff"/>`),
    image: () => svg(`<rect x="6" y="9" width="36" height="30" rx="1" fill="#fff" stroke="#6d7891"/><rect x="9" y="12" width="30" height="22" fill="#1b2a52"/><path d="M9 34l9-10 6 6 5-5 10 9z" fill="#4c9a3f"/><circle cx="32" cy="17" r="2.5" fill="#f2d03a"/>`),
    zip: () => svg(`<path d="M11 5h19l8 8v30H11z" fill="#f7e7a6" stroke="#8a7a4a"/><path d="M30 5v8h8" fill="#efdc8c" stroke="#8a7a4a"/><path d="M22 6v4h-3v4h3v4h-3v4h3" stroke="#555" stroke-width="2" fill="none"/><rect x="18" y="24" width="8" height="9" rx="1" fill="#555"/><rect x="20" y="28" width="4" height="3" fill="#ddd"/>`),
    link: () => svg(`<path d="M11 5h19l8 8v30H11z" fill="#fff" stroke="#6d7891"/><path d="M30 5v8h8" fill="#e5ebf5" stroke="#6d7891"/><circle cx="24" cy="27" r="9" fill="#2c6fd6"/><path d="M15 27h18M24 18c3 3 3 15 0 18M24 18c-3 3-3 15 0 18" stroke="#fff" stroke-width="1.2" fill="none"/><path d="M10 40l7-7v4h5v6h-5v4z" fill="#fff" stroke="#333" stroke-width=".8" transform="translate(0 -6) scale(.9)"/>`),
    drive: () => svg(`<rect x="6" y="18" width="36" height="14" rx="2" fill="#d9dde6" stroke="#6d7891"/><rect x="9" y="25" width="20" height="3" rx="1" fill="#9ba4b7"/><circle cx="36" cy="26" r="2" fill="#3ad13a"/>`),
    netdrive: () => svg(`<rect x="6" y="12" width="36" height="14" rx="2" fill="#d9dde6" stroke="#6d7891"/><rect x="9" y="18" width="20" height="3" rx="1" fill="#9ba4b7"/><circle cx="36" cy="19" r="2" fill="#3ad13a"/><path d="M24 26v8M12 38h24" stroke="#4a5670" stroke-width="2"/><circle cx="24" cy="38" r="3" fill="#2c6fd6"/>`),
    info: () => svg(`<circle cx="24" cy="24" r="17" fill="#2c6fd6" stroke="#1b4fb0"/><circle cx="24" cy="15" r="2.6" fill="#fff"/><rect x="21.5" y="20" width="5" height="15" rx="1.5" fill="#fff"/>`),
    warn: () => svg(`<path d="M24 6l20 36H4z" fill="#f2c230" stroke="#9a7a10"/><rect x="22" y="17" width="4" height="13" rx="1" fill="#000"/><circle cx="24" cy="35" r="2.2" fill="#000"/>`),
    help: () => svg(`<circle cx="24" cy="24" r="17" fill="#2c6fd6"/><text x="24" y="31" font-family="Georgia" font-weight="700" font-size="22" fill="#fff" text-anchor="middle">?</text>`),
    user: () => svg(`<circle cx="24" cy="17" r="8" fill="#e8b98f"/><path d="M8 42c2-10 9-14 16-14s14 4 16 14z" fill="#2c6fd6"/>`),
    network: () => svg(`<rect x="10" y="8" width="20" height="16" rx="2" fill="#d9dde6" stroke="#6d7891"/><rect x="13" y="11" width="14" height="10" fill="#2c6fd6"/><rect x="20" y="22" width="20" height="16" rx="2" fill="#d9dde6" stroke="#6d7891"/><rect x="23" y="25" width="14" height="10" fill="#2c6fd6"/>`),
    logoff: () => svg(`<rect x="8" y="8" width="32" height="32" rx="6" fill="#f2b53a" stroke="#a87414"/><path d="M18 24h16M28 18l6 6-6 6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`),
    power: () => svg(`<rect x="8" y="8" width="32" height="32" rx="6" fill="#d9472b" stroke="#8c2712"/><path d="M24 14v10" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M17 19a10 10 0 1 0 14 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`),
    run: () => svg(`<rect x="6" y="12" width="36" height="24" rx="3" fill="#d9dde6" stroke="#6d7891"/><path d="M14 24h14M24 18l6 6-6 6" stroke="#2c6fd6" stroke-width="3" fill="none"/>`),
    search: () => svg(`<circle cx="20" cy="20" r="10" fill="#cfe4ff" stroke="#2c6fd6" stroke-width="3"/><path d="M28 28l11 11" stroke="#7a5a2a" stroke-width="5" stroke-linecap="round"/>`),
    back: () => svg(`<circle cx="24" cy="24" r="17" fill="#3a9b38"/><path d="M28 14l-10 10 10 10" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`),
    forward: () => svg(`<circle cx="24" cy="24" r="17" fill="#3a9b38"/><path d="M20 14l10 10-10 10" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`),
    up: () => folder(`<path d="M24 22v13M18 28l6-6 6 6" stroke="#2f8a2c" stroke-width="3" fill="none" stroke-linecap="round"/>`),
    views: () => svg(`<rect x="8" y="10" width="12" height="12" fill="#2c6fd6"/><rect x="28" y="10" width="12" height="12" fill="#2c6fd6"/><rect x="8" y="28" width="12" height="12" fill="#2c6fd6"/><rect x="28" y="28" width="12" height="12" fill="#2c6fd6"/>`),
    refresh: () => svg(`<path d="M36 24a12 12 0 1 1-4-9" stroke="#3a9b38" stroke-width="4" fill="none"/><path d="M34 8v9h-9" stroke="#3a9b38" stroke-width="4" fill="none"/>`),
    home: () => svg(`<path d="M8 24L24 10l16 14" stroke="#7a4a2a" stroke-width="3" fill="none"/><path d="M13 22v16h22V22" fill="#f2e3c0" stroke="#7a4a2a"/><rect x="21" y="28" width="6" height="10" fill="#7a4a2a"/>`),
    send: () => svg(`<path d="M6 24l36-14-10 30-8-10z" fill="#2c6fd6"/><path d="M24 30l18-20" stroke="#fff" stroke-width="1.5"/>`),
    write: () => svg(`<rect x="6" y="12" width="30" height="22" rx="2" fill="#fff8df" stroke="#8a7a4a"/><path d="M7 13l14 11 14-11" fill="none" stroke="#8a7a4a"/><path d="M30 34l12-16 4 3-12 16-5 2z" fill="#f2b53a" stroke="#8a5a14"/>`),
    inbox: () => svg(`<path d="M6 26l6-14h24l6 14v12H6z" fill="#e6eef9" stroke="#4a5670"/><path d="M6 26h11l2 4h10l2-4h11" fill="none" stroke="#4a5670"/>`),
    sent: () => svg(`<path d="M6 24l36-14-10 30-8-10z" fill="#9ab3dd"/>`),
    drafts: () => svg(`<rect x="10" y="6" width="28" height="36" fill="#fff" stroke="#6d7891"/><path d="M15 16h18M15 22h18M15 28h10" stroke="#9aa6bd" stroke-width="1.4"/>`),
    speaker: () => svg(`<path d="M8 19h8l10-8v26l-10-8H8z" fill="#fff"/><path d="M32 17c3 4 3 10 0 14M36 13c5 6 5 16 0 22" stroke="#fff" stroke-width="2.5" fill="none"/>`),
    tray_net: () => svg(`<rect x="4" y="6" width="22" height="16" rx="1" fill="#fff"/><rect x="7" y="9" width="16" height="10" fill="#2c6fd6"/><rect x="22" y="22" width="22" height="16" rx="1" fill="#fff"/><rect x="25" y="25" width="16" height="10" fill="#2c6fd6"/><path d="M14 22v8h12" stroke="#fff" stroke-width="2" fill="none"/>`),
    mark: () => svg(`<circle cx="12" cy="14" r="5" fill="#fff"/><circle cx="36" cy="12" r="5" fill="#fff"/><circle cx="24" cy="34" r="6" fill="#ffd34d"/><circle cx="10" cy="36" r="4" fill="#fff"/><path d="M12 14L36 12M12 14l12 20M36 12L24 34M10 36l14-2" stroke="#fff" stroke-width="2.4"/>`),
    min: () => `<svg viewBox="0 0 11 11" aria-hidden="true"><path d="M2 8.5h5" stroke="#fff" stroke-width="2"/></svg>`,
    maxi: () => `<svg viewBox="0 0 11 11" aria-hidden="true"><rect x="1.5" y="1.5" width="8" height="8" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M1.5 2.5h8" stroke="#fff" stroke-width="2"/></svg>`,
    restore: () => `<svg viewBox="0 0 11 11" aria-hidden="true"><rect x="3.5" y="0.8" width="6.5" height="6.5" fill="none" stroke="#fff" stroke-width="1.3"/><rect x="0.8" y="3.5" width="6.5" height="6.5" fill="#1a5ae8" stroke="#fff" stroke-width="1.3"/></svg>`,
    x: () => `<svg viewBox="0 0 11 11" aria-hidden="true"><path d="M2 2l7 7M9 2l-7 7" stroke="#fff" stroke-width="2"/></svg>`
  };
  window.ICON = I;
})();
