/* Meter P.W.A 9 — data store.
   Two modes:
   - local:  everything lives in this browser's IndexedDB (works with no server, one device).
   - remote: Google Apps Script + Google Sheets is the shared database; this browser keeps a
             cache plus a queue of offline writes that is pushed when the network returns. */
(function () {
  'use strict';
  const { uid, sha256 } = window.Core;

  const DB_NAME = 'meter-pwa9';
  const SESSION_KEY = 'mpw9.session';
  const API_KEY = 'mpw9.apiUrl';

  const DEFAULT_SETTINGS = {
    limit: 4,                 // acceptance band ±%
    intervalMonths: 6,        // remind when last test is older than this
    unitLine: 'การประปาส่วนภูมิภาคเขต ๙ กองระบบจำหน่าย งานมาตรวัดน้ำ โทร. ๐-๕๓๓๔-๓๘๐๐ ต่อ ๕๒๐๒',
    addressee: 'หัวหน้างานมาตรวัดน้ำ',
    signerName: 'นางชุลีพร  พรมอุทัย',
    signerTitle: 'หัวหน้างาน ๘ งานมาตรวัดน้ำ',
    endorseTo: 'ผช.กปภ.ข.๙ (ว.)',
    endorserName: 'นายครรชิต  พูนพรพัฒนากุล',
    endorserTitle: 'ผู้อำนวยการกองระบบจำหน่าย',
    seeded: false
  };

  // ---------- IndexedDB (one key/value store + one photo store) ----------
  let dbp = null;
  function idb() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('kv');
        req.result.createObjectStore('photos');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }
  async function kvGet(key, store) {
    const db = await idb();
    return new Promise((res, rej) => {
      const r = db.transaction(store || 'kv').objectStore(store || 'kv').get(key);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function kvSet(key, val, store) {
    const db = await idb();
    return new Promise((res, rej) => {
      const tx = db.transaction(store || 'kv', 'readwrite');
      tx.objectStore(store || 'kv').put(val, key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }
  async function kvDel(key, store) {
    const db = await idb();
    return new Promise((res, rej) => {
      const tx = db.transaction(store || 'kv', 'readwrite');
      tx.objectStore(store || 'kv').delete(key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode */ } }

  // ---------- remote API ----------
  async function api(action, payload, token) {
    const url = Store.apiUrl;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: token || (Store.session && Store.session.token), payload: payload || {} })
    });
    if (!res.ok) throw new Error('เซิร์ฟเวอร์ตอบกลับ ' + res.status);
    const out = await res.json();
    if (!out.ok) {
      const e = new Error(out.error || 'เกิดข้อผิดพลาด');
      e.code = out.code;
      throw e;
    }
    return out.data;
  }

  const Store = {
    DEFAULT_SETTINGS,
    apiUrl: '',
    get mode() { return this.apiUrl ? 'remote' : 'local'; },
    data: { meters: [], tests: [], users: [], settings: Object.assign({}, DEFAULT_SETTINGS) },
    session: null,
    queue: [],
    listeners: new Set(),

    onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    emit() { this.listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); },

    async init() {
      const cfg = (window.APP_CONFIG && window.APP_CONFIG.apiUrl) || '';
      this.apiUrl = lsGet(API_KEY) || cfg || '';
      try { this.session = JSON.parse(lsGet(SESSION_KEY) || 'null'); } catch (e) { this.session = null; }
      if (this.session && this.session.exp && this.session.exp < Date.now()) this.session = null;
      this.data.meters = (await kvGet('meters')) || [];
      this.data.tests = (await kvGet('tests')) || [];
      this.data.users = (await kvGet('users')) || [];
      this.data.settings = Object.assign({}, DEFAULT_SETTINGS, (await kvGet('settings')) || {});
      // earlier versions cached placeholder memo values; replace them with the form's real defaults
      if (this.data.settings.signerTitle === 'หัวหน้างาน งานมาตรวัดน้ำ') this.data.settings.signerTitle = DEFAULT_SETTINGS.signerTitle;
      if (!this.data.settings.signerName) this.data.settings.signerName = DEFAULT_SETTINGS.signerName;
      this.queue = (await kvGet('queue')) || [];
      if (this.mode === 'local' && !this.data.settings.seeded && this.data.meters.length === 0) {
        this.data.meters = (window.SEED_METERS || []).map((m) => Object.assign({ updatedAt: Date.now(), maint: [] }, m));
        this.data.settings.seeded = true;
        await this.persist();
      }
      window.addEventListener('online', () => this.flush());
    },

    async persist() {
      await kvSet('meters', this.data.meters);
      await kvSet('tests', this.data.tests);
      await kvSet('users', this.data.users);
      await kvSet('settings', this.data.settings);
      await kvSet('queue', this.queue);
    },

    setApiUrl(url) {
      this.apiUrl = (url || '').trim();
      lsSet(API_KEY, this.apiUrl || null);
    },

    // ---------- auth ----------
    isAdmin() { return !!(this.session && this.session.role === 'admin'); },
    canEdit() { return !!(this.session && (this.session.role === 'admin' || this.session.role === 'staff')); },

    async needsBootstrap() {
      if (this.mode === 'local') return this.data.users.length === 0;
      try { return !!(await api('status')).needsBootstrap; } catch (e) { return false; }
    },

    async bootstrap(empId, name, password) {
      if (this.mode === 'remote') {
        const s = await api('bootstrap', { empId, name, password, meters: window.SEED_METERS || [] });
        return this.setSession(s);
      }
      if (this.data.users.length) throw new Error('มีผู้ดูแลระบบแล้ว');
      await this.saveUserLocal({ empId, name, role: 'admin', branch: '', active: true }, password);
      return this.login(empId, password);
    },

    async login(empId, password) {
      empId = String(empId).trim();
      if (this.mode === 'remote') {
        const s = await api('login', { empId, password }, '');
        this.setSession(s);
        await this.pull();
        return this.session;
      }
      const u = this.data.users.find((x) => x.empId === empId);
      if (!u || !u.active) throw new Error('ไม่พบรหัสพนักงานนี้ หรือบัญชีถูกปิดใช้งาน');
      const h = await sha256(u.salt + password);
      if (h !== u.hash) throw new Error('รหัสผ่านไม่ถูกต้อง');
      return this.setSession({ empId: u.empId, name: u.name, role: u.role, branch: u.branch || '', avatar: u.avatar || '', token: 'local', exp: Date.now() + 7 * 864e5 });
    },

    setSession(s) {
      this.session = s;
      lsSet(SESSION_KEY, JSON.stringify(s));
      return s;
    },

    logout() {
      if (this.mode === 'remote' && this.session) api('logout').catch(() => {});
      this.session = null;
      lsSet(SESSION_KEY, null);
    },

    async changePassword(oldPw, newPw) {
      if (this.mode === 'remote') return api('changePassword', { oldPw, newPw });
      const u = this.data.users.find((x) => x.empId === this.session.empId);
      if (!u || (await sha256(u.salt + oldPw)) !== u.hash) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
      await this.saveUserLocal(u, newPw);
    },

    async setAvatar(dataUrl) {
      if (this.mode === 'remote') {
        try { await api('setAvatar', { avatar: dataUrl }); } catch (e) {
          if (/unknown action/.test(e.message)) throw new Error('เซิร์ฟเวอร์ยังเป็นเวอร์ชันเก่า — ผู้ดูแลต้องอัปเดต Code.gs และ Deploy เวอร์ชันใหม่ก่อน');
          throw e;
        }
      } else {
        const u = this.data.users.find((x) => x.empId === this.session.empId);
        if (u) u.avatar = dataUrl;
      }
      const u2 = this.data.users.find((x) => x.empId === this.session.empId);
      if (u2) u2.avatar = dataUrl;
      this.setSession(Object.assign({}, this.session, { avatar: dataUrl }));
      await this.persist();
      this.emit();
    },

    async saveUserLocal(u, password) {
      const list = this.data.users;
      const i = list.findIndex((x) => x.empId === u.empId);
      const rec = Object.assign({}, i >= 0 ? list[i] : { createdAt: Date.now() }, u);
      if (password) {
        rec.salt = uid('s');
        rec.hash = await sha256(rec.salt + password);
      }
      if (!rec.hash) throw new Error('ต้องตั้งรหัสผ่าน');
      if (i >= 0) list[i] = rec; else list.push(rec);
      await this.persist();
      this.emit();
    },

    async saveUser(u, password) {
      if (!this.isAdmin()) throw new Error('เฉพาะผู้ดูแลระบบ');
      if (this.mode === 'remote') {
        await api('saveUser', { user: u, password });
        await this.pullUsers();
        return;
      }
      await this.saveUserLocal(u, password);
    },

    async deleteUser(empId) {
      if (!this.isAdmin()) throw new Error('เฉพาะผู้ดูแลระบบ');
      if (empId === this.session.empId) throw new Error('ลบบัญชีของตัวเองไม่ได้');
      if (this.mode === 'remote') { await api('deleteUser', { empId }); await this.pullUsers(); return; }
      this.data.users = this.data.users.filter((x) => x.empId !== empId);
      await this.persist();
      this.emit();
    },

    async pullUsers() {
      if (this.mode !== 'remote' || !this.isAdmin()) return;
      this.data.users = await api('listUsers');
      await this.persist();
      this.emit();
    },

    // ---------- sync ----------
    status: 'idle', // idle | syncing | offline | error
    lastSync: null,

    async pull() {
      if (this.mode !== 'remote' || !this.session) return;
      this.status = 'syncing'; this.emit();
      try {
        await this.flush(true);
        const d = await api('pull');
        this.data.meters = d.meters || [];
        this.data.tests = d.tests || [];
        this.data.settings = Object.assign({}, DEFAULT_SETTINGS, this.data.settings, d.settings || {});
        if (this.isAdmin()) this.data.users = d.users || [];
        // re-apply writes still waiting in the queue so they are not lost from view
        this.queue.forEach((q) => this.applyLocal(q));
        await this.persist();
        this.lastSync = Date.now();
        this.status = this.queue.length ? 'offline' : 'idle';
      } catch (e) {
        if (e.code === 'AUTH') { this.logout(); location.hash = '#/login'; }
        this.status = navigator.onLine ? 'error' : 'offline';
        this.lastError = e.message;
      }
      this.emit();
    },

    async flush(silent) {
      if (this.mode !== 'remote' || !this.session || !this.queue.length || this.flushing) return;
      if (!navigator.onLine) { this.status = 'offline'; this.emit(); return; }
      this.flushing = true;
      try {
        while (this.queue.length) {
          const q = this.queue[0];
          await api(q.op, q.payload);
          this.queue.shift();
          await kvSet('queue', this.queue);
        }
        this.status = 'idle';
      } catch (e) {
        this.status = navigator.onLine ? 'error' : 'offline';
        this.lastError = e.message;
        if (!silent) console.warn('sync failed', e);
      } finally {
        this.flushing = false;
        this.emit();
      }
    },

    applyLocal(q) {
      const p = q.payload;
      const upsert = (list, rec) => {
        const i = list.findIndex((x) => x.id === rec.id);
        if (i >= 0) list[i] = rec; else list.push(rec);
      };
      if (q.op === 'saveMeter') upsert(this.data.meters, p.meter);
      if (q.op === 'deleteMeter') this.data.meters = this.data.meters.filter((x) => x.id !== p.id);
      if (q.op === 'saveTest') upsert(this.data.tests, p.test);
      if (q.op === 'deleteTest') this.data.tests = this.data.tests.filter((x) => x.id !== p.id);
      if (q.op === 'saveSettings') Object.assign(this.data.settings, p.settings);
      if (q.op === 'importMeters') p.meters.forEach((m) => upsert(this.data.meters, m));
    },

    async write(op, payload) {
      const q = { op, payload, at: Date.now() };
      this.applyLocal(q);
      if (this.mode === 'remote') this.queue.push(q);
      await this.persist();
      this.emit();
      if (this.mode === 'remote') this.flush();
    },

    // ---------- records ----------
    stamp(rec) {
      rec.updatedAt = Date.now();
      rec.updatedBy = this.session ? this.session.empId : '';
      return rec;
    },

    async saveMeter(m) {
      if (!this.canEdit()) throw new Error('ไม่มีสิทธิ์แก้ไข');
      if (!m.id) m.id = uid('m');
      await this.write('saveMeter', { meter: this.stamp(m) });
      return m;
    },
    async deleteMeter(id) {
      if (!this.isAdmin()) throw new Error('เฉพาะผู้ดูแลระบบ');
      await this.write('deleteMeter', { id });
    },
    async importMeters(list) {
      if (!this.isAdmin()) throw new Error('เฉพาะผู้ดูแลระบบ');
      list.forEach((m) => this.stamp(m));
      await this.write('importMeters', { meters: list });
    },

    async saveTest(t) {
      if (!this.canEdit()) throw new Error('ไม่มีสิทธิ์บันทึก');
      if (!t.id) { t.id = uid('t'); t.createdAt = Date.now(); t.createdBy = this.session.empId; t.createdByName = this.session.name; }
      await this.write('saveTest', { test: this.stamp(t) });
      return t;
    },
    async deleteTest(id) {
      if (!this.canEdit()) throw new Error('ไม่มีสิทธิ์ลบ');
      await this.write('deleteTest', { id });
    },

    async saveSettings(s) {
      if (!this.isAdmin()) throw new Error('เฉพาะผู้ดูแลระบบ');
      await this.write('saveSettings', { settings: s });
    },

    // ---------- photos ----------
    async savePhoto(dataUrl) {
      const id = uid('p');
      await kvSet(id, dataUrl, 'photos');
      if (this.mode === 'remote' && navigator.onLine) {
        try {
          const r = await api('savePhoto', { id, dataUrl });
          return { id, url: r.url };
        } catch (e) { /* keep local copy; URL filled when re-saved online */ }
      }
      return { id, url: '' };
    },
    async photoSrc(p) {
      const local = await kvGet(p.id, 'photos');
      return local || p.url || '';
    },
    async deletePhoto(id) { await kvDel(id, 'photos'); },

    // ---------- backup ----------
    exportBackup() {
      return JSON.stringify({ app: 'meter-pwa9', version: 1, exportedAt: new Date().toISOString(), meters: this.data.meters, tests: this.data.tests, settings: this.data.settings }, null, 1);
    },
    async restoreBackup(json) {
      if (!this.isAdmin()) throw new Error('เฉพาะผู้ดูแลระบบ');
      const d = JSON.parse(json);
      if (d.app !== 'meter-pwa9') throw new Error('ไม่ใช่ไฟล์สำรองของระบบนี้');
      if (this.mode === 'remote') {
        await api('restore', { meters: d.meters || [], tests: d.tests || [] });
        await this.pull();
        return;
      }
      this.data.meters = d.meters || [];
      this.data.tests = d.tests || [];
      Object.assign(this.data.settings, d.settings || {});
      await this.persist();
      this.emit();
    },

    async testConnection(url) {
      const prev = this.apiUrl;
      this.apiUrl = url;
      try { return await api('status'); } finally { this.apiUrl = prev; }
    }
  };

  window.Store = Store;
})();
