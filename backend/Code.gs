/**
 * Meter P.W.A 9 — shared database on Google Sheets (Google Apps Script Web App).
 * Deploy: Extensions › Apps Script › paste this file › Deploy › New deployment › Web app
 *         Execute as: Me · Who has access: Anyone  → copy the /exec URL into the app.
 * Passwords are stored as salted SHA-256 hashes; tokens expire after 30 days.
 */

var TOKEN_DAYS = 30;
var SHEETS = {
  Users: ['empId', 'name', 'role', 'branch', 'active', 'salt', 'hash', 'createdAt', 'avatar'],
  Meters: ['id', 'branch', 'place', 'category', 'brand', 'model', 'kind', 'size', 'asset', 'lat', 'lng', 'status', 'factor', 'note', 'updatedAt', 'updatedBy', 'json'],
  Tests: ['id', 'date', 'fiscalYear', 'round', 'branch', 'place', 'meterId', 'U', 'M', 'oldFactor', 'errPct', 'newFactor', 'result', 'opinion', 'createdByName', 'updatedAt', 'json'],
  Settings: ['key', 'value']
};

// ---------- entry points ----------
function doGet() {
  return json_({ ok: true, data: { app: 'meter-pwa9', time: new Date().toISOString() } });
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad request' }); }
  try {
    var data = route_(req.action, req.payload || {}, req.token || '');
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err), code: err.code || '' });
  }
}

function route_(action, p, token) {
  switch (action) {
    case 'status': return status_();
    case 'bootstrap': return bootstrap_(p);
    case 'login': return login_(p.empId, p.password);
  }
  var me = auth_(token);
  var canEdit = me.role === 'admin' || me.role === 'staff';
  var admin = me.role === 'admin';
  var need = function (ok) { if (!ok) throw new Error('ไม่มีสิทธิ์ดำเนินการนี้'); };
  switch (action) {
    case 'logout': PropertiesService.getScriptProperties().deleteProperty('tok_' + token); return true;
    case 'pull': return pull_(admin);
    case 'saveMeter': need(canEdit); return locked_(function () { upsert_('Meters', meterRow_(p.meter)); });
    case 'deleteMeter': need(admin); return locked_(function () { remove_('Meters', p.id); });
    case 'importMeters': need(admin); return locked_(function () { p.meters.forEach(function (m) { upsert_('Meters', meterRow_(m)); }); });
    case 'saveTest': need(canEdit); return locked_(function () { upsert_('Tests', testRow_(p.test)); });
    case 'deleteTest': need(canEdit); return locked_(function () { remove_('Tests', p.id); });
    case 'saveSettings': need(admin); return locked_(function () { saveSettings_(p.settings || {}); });
    case 'listUsers': need(admin); return users_();
    case 'saveUser': need(admin); return locked_(function () { saveUser_(p.user, p.password, me); });
    case 'deleteUser': need(admin); return locked_(function () { if (p.empId === me.empId) throw new Error('ลบบัญชีของตัวเองไม่ได้'); remove_('Users', p.empId); });
    case 'changePassword': return locked_(function () { changePassword_(me.empId, p.oldPw, p.newPw); });
    case 'setAvatar': return locked_(function () { setAvatar_(me.empId, p.avatar); });
    case 'restore': need(admin); return locked_(function () { restore_(p.meters || [], p.tests || []); });
    case 'savePhoto': need(canEdit); return savePhoto_(p.id, p.dataUrl);
  }
  throw new Error('unknown action: ' + action);
}

// ---------- auth ----------
function hash_(salt, pw) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + pw, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function newSalt_() { return 's' + Utilities.getUuid().replace(/-/g, '').slice(0, 16); }

function status_() {
  return { needsBootstrap: rows_('Users').length === 0, users: rows_('Users').length, meters: rows_('Meters').length, tests: rows_('Tests').length };
}

function bootstrap_(p) {
  return locked_(function () {
    if (rows_('Users').length) throw new Error('ระบบมีผู้ดูแลแล้ว');
    if (!/^\d{3,10}$/.test(String(p.empId))) throw new Error('รหัสพนักงานต้องเป็นตัวเลข');
    if (String(p.password || '').length < 8) throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    var salt = newSalt_();
    upsert_('Users', { empId: String(p.empId), name: p.name, role: 'admin', branch: '', active: true, salt: salt, hash: hash_(salt, p.password), createdAt: new Date().toISOString() });
    if (!rows_('Meters').length && p.meters && p.meters.length) {
      p.meters.forEach(function (m) { m.updatedAt = Date.now(); upsert_('Meters', meterRow_(m)); });
    }
    return issue_(p.empId);
  });
}

function login_(empId, pw) {
  empId = String(empId || '').trim();
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('fail_' + empId) || 0);
  if (fails >= 5) throw new Error('ใส่รหัสผิดหลายครั้ง กรุณารอ 10 นาที');
  var u = rows_('Users').filter(function (x) { return String(x.empId) === empId; })[0];
  if (!u || String(u.active) === 'false' || String(u.active) === 'FALSE') { cache.put('fail_' + empId, String(fails + 1), 600); throw new Error('ไม่พบรหัสพนักงานนี้ หรือบัญชีถูกปิดใช้งาน'); }
  if (hash_(u.salt, String(pw || '')) !== u.hash) { cache.put('fail_' + empId, String(fails + 1), 600); throw new Error('รหัสผ่านไม่ถูกต้อง'); }
  cache.remove('fail_' + empId);
  return issue_(empId);
}

function issue_(empId) {
  var u = rows_('Users').filter(function (x) { return String(x.empId) === String(empId); })[0];
  var token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  var exp = Date.now() + TOKEN_DAYS * 864e5;
  var props = PropertiesService.getScriptProperties();
  // drop expired tokens
  var all = props.getProperties();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('tok_') === 0) { try { if (JSON.parse(all[k]).exp < Date.now()) props.deleteProperty(k); } catch (e) { props.deleteProperty(k); } }
  });
  props.setProperty('tok_' + token, JSON.stringify({ empId: String(empId), exp: exp }));
  return { empId: String(u.empId), name: u.name, role: u.role, branch: u.branch || '', avatar: u.avatar || '', token: token, exp: exp };
}

function setAvatar_(empId, avatar) {
  avatar = String(avatar || '');
  if (avatar && !/^data:image\/(jpeg|png|webp);base64,/.test(avatar)) throw new Error('รูปไม่ถูกต้อง');
  if (avatar.length > 45000) throw new Error('รูปใหญ่เกินไป');
  var u = rows_('Users').filter(function (x) { return String(x.empId) === empId; })[0];
  if (!u) throw new Error('ไม่พบผู้ใช้');
  u.avatar = avatar;
  upsert_('Users', u);
}

function auth_(token) {
  var raw = token && PropertiesService.getScriptProperties().getProperty('tok_' + token);
  var err = new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  err.code = 'AUTH';
  if (!raw) throw err;
  var t = JSON.parse(raw);
  if (t.exp < Date.now()) throw err;
  var u = rows_('Users').filter(function (x) { return String(x.empId) === t.empId; })[0];
  if (!u || String(u.active) === 'false' || String(u.active) === 'FALSE') throw err;
  return { empId: String(u.empId), name: u.name, role: u.role };
}

function users_() {
  return rows_('Users').map(function (u) { return { empId: String(u.empId), name: u.name, role: u.role, branch: u.branch || '', active: !(String(u.active) === 'false' || String(u.active) === 'FALSE'), createdAt: u.createdAt, avatar: u.avatar || '' }; });
}

function saveUser_(u, pw, me) {
  if (!/^\d{3,10}$/.test(String(u.empId))) throw new Error('รหัสพนักงานต้องเป็นตัวเลข');
  var old = rows_('Users').filter(function (x) { return String(x.empId) === String(u.empId); })[0];
  if (String(u.empId) === me.empId && u.role !== 'admin') throw new Error('ไม่สามารถลดสิทธิ์ผู้ดูแลของตัวเองได้');
  var rec = { empId: String(u.empId), name: u.name, role: u.role || 'staff', branch: u.branch || '', active: u.active !== false, createdAt: old ? old.createdAt : new Date().toISOString(), avatar: old ? old.avatar : '' };
  if (pw) {
    if (String(pw).length < 8) throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    rec.salt = newSalt_(); rec.hash = hash_(rec.salt, pw);
  } else if (old) { rec.salt = old.salt; rec.hash = old.hash; }
  else throw new Error('ต้องตั้งรหัสผ่าน');
  upsert_('Users', rec);
}

function changePassword_(empId, oldPw, newPw) {
  var u = rows_('Users').filter(function (x) { return String(x.empId) === empId; })[0];
  if (!u || hash_(u.salt, String(oldPw || '')) !== u.hash) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
  if (String(newPw || '').length < 8) throw new Error('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
  u.salt = newSalt_(); u.hash = hash_(u.salt, newPw);
  upsert_('Users', u);
}

// ---------- data ----------
function pull_(admin) {
  var settings = {};
  rows_('Settings').forEach(function (r) { try { settings[r.key] = JSON.parse(r.value); } catch (e) { settings[r.key] = r.value; } });
  var out = {
    meters: rows_('Meters').map(fromJson_),
    tests: rows_('Tests').map(fromJson_),
    settings: settings
  };
  if (admin) out.users = users_();
  return out;
}

function fromJson_(r) {
  try { return JSON.parse(r.json); } catch (e) { delete r.json; return r; }
}

function meterRow_(m) {
  return { id: m.id, branch: m.branch, place: m.place, category: m.category, brand: m.brand, model: m.model, kind: m.kind, size: m.size, asset: m.asset, lat: m.lat, lng: m.lng, status: m.status, factor: m.factor, note: m.note, updatedAt: m.updatedAt, updatedBy: m.updatedBy, json: JSON.stringify(m) };
}
function testRow_(t) {
  return { id: t.id, date: t.date, fiscalYear: t.fiscalYear, round: t.round, branch: t.branch, place: t.place, meterId: t.meterId, U: t.U, M: t.M, oldFactor: t.oldFactor, errPct: t.errPct, newFactor: t.newFactor, result: t.result, opinion: t.opinion, createdByName: t.createdByName, updatedAt: t.updatedAt, json: JSON.stringify(t) };
}

function saveSettings_(s) {
  Object.keys(s).forEach(function (k) { if (k !== 'seeded') upsert_('Settings', { key: k, value: JSON.stringify(s[k]) }); });
}

function restore_(meters, tests) {
  clear_('Meters'); clear_('Tests');
  appendMany_('Meters', meters.map(meterRow_));
  appendMany_('Tests', tests.map(testRow_));
}

function savePhoto_(id, dataUrl) {
  var m = String(dataUrl).match(/^data:(image\/\w+);base64,(.+)$/);
  if (!m) throw new Error('รูปไม่ถูกต้อง');
  var folders = DriveApp.getFoldersByName('MeterPWA9_Photos');
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('MeterPWA9_Photos');
  var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], id + '.jpg'));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1280' };
}

// ---------- sheet helpers ----------
function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]).setFontWeight('bold').setBackground('#E6EEF9');
    sh.setFrozenRows(1);
  } else if (sh.getLastColumn() < SHEETS[name].length) {
    // a newer version added columns: extend the header row in place
    sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]).setFontWeight('bold').setBackground('#E6EEF9');
  }
  return sh;
}

function rows_(name) {
  var sh = sheet_(name);
  var n = sh.getLastRow();
  if (n < 2) return [];
  var head = SHEETS[name];
  return sh.getRange(2, 1, n - 1, head.length).getValues().map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = r[i]; });
    return o;
  });
}

function upsert_(name, obj) {
  var sh = sheet_(name);
  var head = SHEETS[name];
  var key = String(obj[head[0]]);
  var row = head.map(function (h) { var v = obj[h]; return v === undefined || v === null ? '' : v; });
  var n = sh.getLastRow();
  if (n >= 2) {
    var ids = sh.getRange(2, 1, n - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === key) { sh.getRange(i + 2, 1, 1, head.length).setValues([row]); return; }
    }
  }
  sh.appendRow(row);
}

function appendMany_(name, objs) {
  if (!objs.length) return;
  var sh = sheet_(name);
  var head = SHEETS[name];
  var rows = objs.map(function (o) { return head.map(function (h) { var v = o[h]; return v === undefined || v === null ? '' : v; }); });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, head.length).setValues(rows);
}

function remove_(name, key) {
  var sh = sheet_(name);
  var n = sh.getLastRow();
  if (n < 2) return;
  var ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === String(key)) sh.deleteRow(i + 2);
}

function clear_(name) {
  var sh = sheet_(name);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
}

function locked_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { var r = fn(); SpreadsheetApp.flush(); return r === undefined ? true : r; } finally { lock.releaseLock(); }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
