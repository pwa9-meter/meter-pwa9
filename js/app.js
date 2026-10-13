/* Meter P.W.A 9 — app shell: router, layout, model queries, UI helpers */
(function () {
  'use strict';
  const C = window.Core;
  const S = window.Store;
  const { esc } = C;

  // ---------- icons (stroke SVG) ----------
  const ICON_PATHS = {
    home: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
    test: '<path d="M9 3h6l1 3h4v15H4V6h4z"/><path d="M8 13l3 3 5-6"/>',
    meter: '<circle cx="12" cy="12" r="8"/><path d="M12 12l4-3"/><path d="M8 16h8"/>',
    map: '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    report: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h6M9 16h6"/>',
    branch: '<path d="M3 21h18"/><path d="M5 21V8l7-4 7 4v13"/><path d="M9 21v-6h6v6"/>',
    check: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    gps: '<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    nav: '<path d="M3 11l18-8-8 18-2-8z"/>',
    warn: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    x: '<circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/>',
    ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    drop: '<path d="M12 3c3.5 4.2 6 7.6 6 10.5A6 6 0 0 1 6 13.5C6 10.6 8.5 7.2 12 3z"/>',
    battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 11v2M6 10v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
    word: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11l1.5 6L12 13l1.5 4L15 11"/>',
    sync: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
    pin: '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/>'
  };
  function icon(name, size, color) {
    return `<svg width="${size || 18}" height="${size || 18}" viewBox="0 0 24 24" fill="none" stroke="${color || 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
  }

  // ---------- model queries ----------
  const M = {
    limit() { return Number(S.data.settings.limit) || 4; },
    fy() { return C.fiscalYear(); },
    allMeters() { return S.data.meters; },
    meters() {
      const b = App.branch;
      return S.data.meters.filter((m) => !b || m.branch === b);
    },
    meter(id) { return S.data.meters.find((m) => m.id === id); },
    test(id) { return S.data.tests.find((t) => t.id === id); },
    testsFor(meterId) {
      return S.data.tests.filter((t) => t.meterId === meterId).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));
    },
    tests() {
      const b = App.branch;
      return S.data.tests.filter((t) => !b || t.branch === b).sort((a, b2) => (b2.date || '').localeCompare(a.date || '') || (b2.createdAt || 0) - (a.createdAt || 0));
    },
    latest(meterId) { return M.testsFor(meterId)[0] || null; },
    result(t) { return C.resultOf(t, M.limit()); },
    latestResult(meterId) { return M.result(M.latest(meterId)); },
    testedInFY(meterId, fy) { return S.data.tests.some((t) => t.meterId === meterId && Number(t.fiscalYear) === Number(fy)); },
    stats(meterId) {
      const ts = M.testsFor(meterId);
      const factorUses = ts.filter((t) => M.result(t) === 'factor').length;
      const cleans = ts.filter((t) => t.cleaned);
      const last = ts[0] || null;
      const brokenNow = last && last.equipment ? Object.keys(last.equipment).filter((k) => last.equipment[k] === 'bad') : [];
      return { count: ts.length, factorUses, cleanCount: cleans.length, lastClean: cleans[0] ? cleans[0].date : null, last, brokenNow };
    },
    branchSummary(fy) {
      const out = {};
      C.BRANCHES.forEach((b) => { out[b] = { name: b, total: 0, done: 0, factor: 0, broken: 0, gps: 0, raw: 0 }; });
      S.data.meters.forEach((m) => {
        if (!out[m.branch]) out[m.branch] = { name: m.branch, total: 0, done: 0, factor: 0, broken: 0, gps: 0, raw: 0 };
        const o = out[m.branch];
        if (m.status === 'retired') return;
        o.total++;
        if (C.isRaw(m)) o.raw++;
        if (m.lat && m.lng) o.gps++;
        const ts = M.testsFor(m.id).filter((t) => Number(t.fiscalYear) === Number(fy));
        if (ts.length) {
          o.done++;
          const r = M.result(ts[0]);
          if (r === 'factor') o.factor++;
          if (r === 'broken') o.broken++;
        }
      });
      return Object.values(out);
    },
    alerts() {
      const list = [];
      const months = Number(S.data.settings.intervalMonths) || 6;
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      const cut = cutoff.toISOString().slice(0, 10);
      M.meters().forEach((m) => {
        if (m.status === 'retired') return;
        const st = M.stats(m.id);
        if (st.brokenNow.length) list.push({ kind: 'bad', meter: m, text: 'อุปกรณ์ชำรุด: ' + st.brokenNow.join(', ') });
        if (st.last && st.last.batteryLow) list.push({ kind: 'warn', meter: m, text: 'Battery MAG 8000 ต่ำ' + (st.last.batteryPct ? ` (${st.last.batteryPct}%)` : '') });
        if (!st.last) list.push({ kind: 'due', meter: m, text: 'ยังไม่เคยสอบเทียบ' });
        else if ((st.last.date || '') < cut) list.push({ kind: 'due', meter: m, text: `ครบรอบสอบเทียบ (ครั้งล่าสุด ${C.thDate(st.last.date)})` });
        if (!(m.lat && m.lng)) list.push({ kind: 'gps', meter: m, text: 'ยังไม่มีพิกัด' });
      });
      return list;
    }
  };

  // ---------- UI helpers ----------
  const UI = {
    toast(msg, kind) {
      const host = document.getElementById('toasts');
      const el = document.createElement('div');
      el.className = 'toast ' + (kind || '');
      el.setAttribute('role', 'status');
      el.textContent = msg;
      host.appendChild(el);
      setTimeout(() => el.remove(), 3200);
    },
    modal(html, opts) {
      return new Promise((resolve) => {
        const back = document.createElement('div');
        back.className = 'modal-back';
        back.innerHTML = `<div class="modal ${opts && opts.wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
        document.body.appendChild(back);
        const close = (v) => { back.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
        const onKey = (e) => { if (e.key === 'Escape') close(null); };
        document.addEventListener('keydown', onKey);
        back.addEventListener('click', (e) => {
          if (e.target === back) close(null);
          const b = e.target.closest('[data-close]');
          if (b) close(b.getAttribute('data-close') || null);
        });
        const first = back.querySelector('input,select,textarea,button');
        if (first) setTimeout(() => first.focus(), 30);
        if (opts && opts.onOpen) opts.onOpen(back.querySelector('.modal'), close);
      });
    },
    async confirm(title, text, okLabel, danger) {
      const r = await UI.modal(`<h2>${esc(title)}</h2><div>${esc(text)}</div>
        <div class="modal-actions"><button class="btn" data-close="">ยกเลิก</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-close="ok">${esc(okLabel || 'ยืนยัน')}</button></div>`);
      return r === 'ok';
    },
    resultBadge(r) {
      const x = C.RESULT[r] || C.RESULT.none;
      return `<span class="badge" style="color:${x.color};background:${x.bg}">${x.label}</span>`;
    },
    ringColor(r) {
      return { pass: '#2E9E6B', factor: '#F08C2E', broken: '#A3122A', none: '#C3CFD1' }[r] || '#C3CFD1';
    },
    avatar(u, size) {
      const s = size || 36;
      const inner = u && u.avatar ? `<img src="${esc(u.avatar)}" alt="">` : esc(UI.initials(u && u.name));
      return `<span class="avatar" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.39)}px">${inner}</span>`;
    },
    // square-crop + resize to 160px JPEG (fits in one Google Sheets cell)
    async readAvatar(file) {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
        const side = Math.min(img.width, img.height);
        const cv = document.createElement('canvas');
        cv.width = cv.height = 160;
        cv.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 160, 160);
        return cv.toDataURL('image/jpeg', 0.8);
      } finally { URL.revokeObjectURL(url); }
    },
    initials(name) {
      const s = String(name || '').trim();
      if (!s) return '?';
      const parts = s.split(/\s+/);
      return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    },
    isMobile() {
      return (window.matchMedia && matchMedia('(pointer: coarse)').matches) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    },
    saveLink(filename, blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      // mobile browsers read the blob late: keep the URL alive for a minute
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 60000);
    },
    // Phones (especially the installed app) often ignore <a download>: hand the file to the
    // system share sheet instead, where it can be saved to Files/Drive or sent via LINE.
    async download(filename, blob) {
      const file = typeof File === 'function' ? new File([blob], filename, { type: blob.type || 'application/octet-stream' }) : null;
      const canShare = UI.isMobile() && file && navigator.canShare && navigator.canShare({ files: [file] });
      if (!canShare) { UI.saveLink(filename, blob); if (UI.isMobile()) UI.toast('ไฟล์อยู่ในโฟลเดอร์ "ดาวน์โหลด" ของเครื่อง', 'ok'); return; }
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // user closed the sheet
      }
      // the tap that started the export has expired: ask for one more tap
      await UI.modal(`<h2>ไฟล์พร้อมแล้ว</h2><div style="overflow-wrap:anywhere">${esc(filename)}</div>
        <div class="modal-actions" style="justify-content:stretch">
          <button class="btn" id="dl-link" style="flex:1">${icon('download')}ดาวน์โหลด</button>
          <button class="btn btn-primary" id="dl-share" style="flex:1">${icon('upload', 18, '#fff')}บันทึก / แชร์</button>
        </div>`, {
        onOpen: (el, close) => {
          el.querySelector('#dl-share').onclick = async () => { try { await navigator.share({ files: [file], title: filename }); } catch (e) { /* closed */ } close('ok'); };
          el.querySelector('#dl-link').onclick = () => { UI.saveLink(filename, blob); close('ok'); };
        }
      });
    },
    pickFile(accept) {
      return new Promise((resolve) => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = accept;
        inp.onchange = () => resolve(inp.files[0] || null);
        inp.click();
      });
    },
    // Resize a photo to ≤1280px JPEG to keep storage small.
    async readPhoto(file) {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
        const max = 1280;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k);
        cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        return cv.toDataURL('image/jpeg', 0.72);
      } finally { URL.revokeObjectURL(url); }
    },
    getGPS() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('อุปกรณ์นี้ไม่รองรับ GPS'));
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy) }),
          (e) => reject(new Error(e.code === 1 ? 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง' : 'อ่านตำแหน่งไม่ได้ ลองใหม่ในที่โล่ง')),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
      });
    },
    branchOptions(selected, withAll) {
      const names = Array.from(new Set(C.BRANCHES.concat(S.data.meters.map((m) => m.branch)).filter(Boolean)));
      return (withAll ? `<option value="">ทุกสาขา (${names.length})</option>` : '') +
        names.map((b) => `<option value="${esc(b)}" ${b === selected ? 'selected' : ''}>${esc(b)}</option>`).join('');
    },
    navUrl(m) { return `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`; }
  };

  // ---------- app / router ----------
  const NAV = [
    { route: 'dashboard', label: 'ภาพรวม', icon: 'home' },
    { route: 'test/new', label: 'บันทึกสอบเทียบ', icon: 'test', short: 'สอบเทียบ', edit: true },
    { route: 'meters', label: 'ทะเบียนมาตร', icon: 'meter', short: 'มาตร' },
    { route: 'map', label: 'แผนที่พิกัด', icon: 'map', short: 'แผนที่' },
    { route: 'reports', label: 'รายงาน / ส่งออก', icon: 'report', short: 'รายงาน' },
    { route: 'branches', label: 'ความคืบหน้า 27 สาขา', icon: 'branch', desk: true },
    { route: 'equipment', label: 'Check list อุปกรณ์', icon: 'check', desk: true }
  ];

  const App = {
    VERSION: '1.5',
    branch: '',
    cleanup: [],
    M, UI, icon,

    async start() {
      await S.init();
      try { this.branch = localStorage.getItem('mpw9.branch') || ''; } catch (e) { this.branch = ''; }
      if (this.branch === null) this.branch = '';
      window.addEventListener('hashchange', () => this.route());
      S.onChange(() => this.renderSync());
      document.addEventListener('click', (e) => {
        const menu = document.getElementById('user-menu');
        if (menu && !e.target.closest('#user-menu') && !e.target.closest('#user-btn')) menu.remove();
      });
      if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      }
      await this.route();
      if (S.session && S.mode === 'remote') S.pull();
    },

    setBranch(b) {
      this.branch = b;
      try { localStorage.setItem('mpw9.branch', b); } catch (e) { /* ignore */ }
      this.route();
    },

    parse() {
      const h = (location.hash || '#/dashboard').slice(2);
      const [path, qs] = h.split('?');
      const parts = path.split('/').filter(Boolean);
      const query = {};
      new URLSearchParams(qs || '').forEach((v, k) => { query[k] = v; });
      return { parts, query, path };
    },

    async route() {
      this.cleanup.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
      this.cleanup = [];
      const { parts, query } = this.parse();
      const root = document.getElementById('app');

      if (!S.session) {
        const boot = await S.needsBootstrap();
        if (parts[0] === 'server') return window.Views.loginServer(root);
        return boot ? window.Views.setup(root) : window.Views.login(root);
      }
      if (parts[0] === 'login' || parts[0] === 'setup' || parts[0] === 'server') { location.hash = '#/dashboard'; return; }
      if (!this.branch && S.session.branch && !this.branchInit) { this.branch = S.session.branch; }
      this.branchInit = true;

      this.shell(root);
      const view = document.getElementById('view');
      const V = window.Views;
      const p0 = parts[0] || 'dashboard';
      let active = p0;
      try {
        if (p0 === 'dashboard') V.dashboard(view);
        else if (p0 === 'test' && parts[1] === 'new') { active = 'test/new'; V.testForm(view, null, query); }
        else if (p0 === 'test' && parts[1]) { active = 'test/new'; V.testForm(view, parts[1], query); }
        else if (p0 === 'meters') V.meters(view, query);
        else if (p0 === 'meter' && parts[1] === 'new') { active = 'meters'; V.meterEdit(view, null); }
        else if (p0 === 'meter' && parts[2] === 'edit') { active = 'meters'; V.meterEdit(view, parts[1]); }
        else if (p0 === 'meter' && parts[1]) { active = 'meters'; V.meterProfile(view, parts[1]); }
        else if (p0 === 'map') V.map(view, query);
        else if (p0 === 'reports') V.reports(view, query);
        else if (p0 === 'branches') V.branches(view);
        else if (p0 === 'equipment') V.equipment(view);
        else if (p0 === 'users' && S.isAdmin()) V.users(view);
        else if (p0 === 'settings' && S.isAdmin()) V.settings(view);
        else if (p0 === 'account') V.account(view);
        else V.dashboard(view);
      } catch (e) {
        console.error(e);
        view.innerHTML = `<div class="card"><h2>เกิดข้อผิดพลาด</h2><div class="muted">${esc(e.message)}</div><a class="btn" href="#/dashboard">กลับหน้าหลัก</a></div>`;
      }
      document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.getAttribute('data-nav') === active));
      window.scrollTo(0, 0);
    },

    shell(root) {
      if (document.getElementById('view')) { this.renderTop(); return; }
      const sess = S.session;
      const navLinks = NAV.filter((n) => !n.edit || S.canEdit()).map((n) =>
        `<a class="nav-link" data-nav="${n.route}" href="#/${n.route}">${icon(n.icon)}${n.label}</a>`).join('');
      const adminLinks = S.isAdmin() ? `<div class="nav-sep"></div><div class="nav-label">ผู้ดูแลระบบ</div>
        <a class="nav-link" data-nav="users" href="#/users">${icon('users')}จัดการผู้ใช้งาน</a>
        <a class="nav-link" data-nav="settings" href="#/settings">${icon('settings')}ตั้งค่าระบบ</a>` : '';
      const bottom = NAV.filter((n) => !n.desk && (!n.edit || S.canEdit())).map((n) =>
        `<a data-nav="${n.route}" href="#/${n.route}">${icon(n.icon, 22)}<span>${n.short || n.label}</span></a>`).join('');
      root.innerHTML = `
        <header class="topbar">
          <a class="brand" href="#/dashboard" aria-label="Meter P.W.A 9 หน้าหลัก">
            <span class="brand-logo">${icon('drop', 24, 'var(--brand)')}</span>
            <span><span class="brand-name">Meter P.W.A 9</span><span class="brand-sub" style="display:block">ระบบมาตรวัดน้ำหลัก การประปาส่วนภูมิภาคเขต 9</span></span>
          </a>
          <span class="spacer"></span>
          <div class="branch-pick">
            <label for="branch-select">${icon('branch', 16, '#fff')}<span class="sr-only">เลือก</span> สาขา</label>
            <select id="branch-select">${UI.branchOptions(this.branch, true)}</select>
          </div>
          <button class="sync-pill" id="sync-pill" type="button" title="สถานะข้อมูล"></button>
          <button class="user-btn" id="user-btn" type="button" aria-haspopup="menu">
            ${UI.avatar(sess, 36)}
            <span class="user-meta"><b>${esc(sess.name)}</b>${esc(sess.empId)} · ${sess.role === 'admin' ? 'ผู้ดูแลระบบ' : sess.role === 'staff' ? 'เจ้าหน้าที่' : 'ผู้ดูข้อมูล'}</span>
          </button>
        </header>
        <div class="layout">
          <nav class="sidenav" aria-label="เมนูหลัก">${navLinks}${adminLinks}
            <div class="nav-card" id="nav-card"></div>
          </nav>
          <main class="main" id="view" tabindex="-1"></main>
        </div>
        <nav class="bottomnav" aria-label="เมนูหลัก">${bottom}</nav>`;
      document.getElementById('branch-select').addEventListener('change', (e) => this.setBranch(e.target.value));
      document.getElementById('user-btn').addEventListener('click', () => this.userMenu());
      document.getElementById('sync-pill').addEventListener('click', () => { if (S.mode === 'remote') S.pull(); else UI.toast('โหมดเก็บในเครื่อง — ผู้ดูแลตั้งค่าเซิร์ฟเวอร์ได้ที่ "ตั้งค่าระบบ"'); });
      this.renderSync();
    },

    renderTop() {
      const sel = document.getElementById('branch-select');
      if (sel) sel.innerHTML = UI.branchOptions(this.branch, true);
    },

    renderSync() {
      const pill = document.getElementById('sync-pill');
      if (!pill) return;
      let s = S.status, text;
      if (S.mode === 'local') { s = 'idle'; text = 'เก็บในเครื่อง'; }
      else if (!navigator.onLine || s === 'offline') { s = 'offline'; text = S.queue.length ? `รอซิงก์ ${S.queue.length}` : 'ออฟไลน์'; }
      else if (s === 'syncing') text = 'กำลังซิงก์…';
      else if (s === 'error') text = 'ซิงก์ไม่สำเร็จ';
      else text = 'ซิงก์แล้ว';
      pill.setAttribute('data-s', s);
      pill.innerHTML = `<span class="sync-dot"></span><span class="sync-text">${text}</span>`;
      const card = document.getElementById('nav-card');
      if (card) {
        card.innerHTML = S.mode === 'remote'
          ? `<b>ฐานข้อมูลกลาง (Google Sheets)</b><span>บันทึกได้แม้ไม่มีสัญญาณ แล้วซิงก์อัตโนมัติ</span><span style="color:var(--brand);font-weight:600">รอซิงก์ ${S.queue.length} รายการ</span>`
          : `<b>โหมดเก็บในเครื่อง</b><span>ข้อมูลอยู่ในเบราว์เซอร์นี้ ควรสำรองข้อมูลเป็นระยะ</span>${S.isAdmin() ? '<a href="#/settings">เชื่อมฐานข้อมูลกลาง →</a>' : ''}`;
      }
    },

    userMenu() {
      const old = document.getElementById('user-menu');
      if (old) { old.remove(); return; }
      const s = S.session;
      const m = document.createElement('div');
      m.className = 'menu';
      m.id = 'user-menu';
      m.setAttribute('role', 'menu');
      m.innerHTML = `<div class="menu-head" style="display:flex;gap:12px;align-items:center">${UI.avatar(s, 44)}<div><b>${esc(s.name)}</b>รหัสพนักงาน ${esc(s.empId)}</div></div>
        <a href="#/account" role="menuitem">${icon('users')}รูปโปรไฟล์ / เปลี่ยนรหัสผ่าน</a>
        ${S.isAdmin() ? `<a href="#/users" role="menuitem">${icon('users')}จัดการผู้ใช้งาน</a><a href="#/settings" role="menuitem">${icon('settings')}ตั้งค่าระบบ</a>` : ''}
        <a href="#/branches" role="menuitem">${icon('branch')}ความคืบหน้า 27 สาขา</a>
        <a href="#/equipment" role="menuitem">${icon('check')}Check list อุปกรณ์</a>
        <button type="button" role="menuitem" id="logout-btn">${icon('logout')}ออกจากระบบ</button>
        <div class="muted" style="font-size:12px;padding:8px 12px 4px;border-top:1px solid var(--line);margin-top:6px">Meter P.W.A 9 · เวอร์ชัน ${App.VERSION}</div>`;
      document.body.appendChild(m);
      m.addEventListener('click', (e) => { if (e.target.closest('a')) m.remove(); });
      document.getElementById('logout-btn').onclick = () => {
        m.remove();
        S.logout();
        document.getElementById('app').innerHTML = '';
        location.hash = '#/login';
        this.route();
      };
    },

    rebuildShell() {
      const root = document.getElementById('app');
      root.innerHTML = '';
      this.route();
    }
  };

  window.App = App;
})();
