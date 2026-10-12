/* Meter P.W.A 9 — shared helpers: formulas, dates, formatting, symbols */
(function () {
  'use strict';

  const BRANCHES = [
    'เชียงใหม่', 'ฮอด', 'สันกำแพง', 'แม่ริม', 'แม่แตง', 'ฝาง', 'จอมทอง', 'แม่ฮ่องสอน', 'แม่สะเรียง',
    'ลำพูน', 'บ้านโฮ่ง', 'ลำปาง', 'เกาะคา', 'เถิน', 'แพร่', 'เด่นชัย', 'ร้องกวาง', 'น่าน', 'ท่าวังผา',
    'พะเยา', 'จุน', 'เชียงราย', 'พาน', 'เทิง', 'เวียงเชียงของ', 'แม่สาย', 'แม่ขะจาน'
  ];

  const METER_STATUS = { active: 'ใช้งานปกติ', paused: 'ไม่ใช้งานชั่วคราว', retired: 'ยกเลิกใช้งาน' };
  const CATEGORIES = ['มาตรน้ำจ่าย', 'มาตรน้ำดิบ'];
  const KINDS = ['Electromagnetic', 'Ultrasonic', 'Ultrasonic (Insert Type)', 'Ultrasonic (Clamp on)', 'Ultrasonic (Full Bore)', 'ใบพัด'];
  const BRANDS = ['SIEMENS', 'ABB', 'YOKOGAWA', 'TOSHIBA', 'KROHNE', 'Endress+Hauser', 'EUROMAG', 'KENT', 'ITRON', 'KOBOLD', 'ARAD', 'Panametrics'];

  // Equipment rows of the "Check list มาตรวัดน้ำหลัก" workbook, grouped as in the sheet.
  const EQUIPMENT = [
    { group: 'แหล่งพลังงาน / อุปกรณ์ป้องกัน', items: ['เครื่องสำรองไฟ (UPS)', 'Switching', 'แผง Solar Cell', 'Solar Charger', 'Power Battery'] },
    { group: 'Flow Meter', items: ['Transmitter', 'Sensor', 'Sensorprom', 'Battery (MAG 8000)'] },
    { group: 'อุปกรณ์วัดค่าแรงดันน้ำ', items: ['Pressure gauge', 'Pressure Transmitter'] },
    { group: 'ระบบสื่อสาร', items: ['Data Logger Realtime'] }
  ];
  const EQUIP_STATE = { ok: 'ปกติ', bad: 'ชำรุด', na: 'ไม่มี' };

  const RESULT = {
    pass: { label: 'ผ่านเกณฑ์', color: 'var(--ok)', bg: 'var(--ok-bg)' },
    factor: { label: 'เสนอตัวคูณ', color: 'var(--warn)', bg: 'var(--warn-bg)' },
    broken: { label: 'มาตรชำรุด', color: 'var(--bad)', bg: 'var(--bad-bg)' },
    none: { label: 'ยังไม่สอบเทียบ', color: 'var(--muted)', bg: 'var(--line-2)' }
  };

  const OPINIONS = {
    none: 'ใช้งานได้ตามปกติ โดยไม่มีค่าตัวคูณ',
    new: 'เห็นควรใช้ค่าตัวคูณของมาตรวัดน้ำหลักครั้งนี้',
    old: 'เห็นควรใช้ค่าตัวคูณเดิม'
  };

  function num(v) {
    if (v === null || v === undefined || v === '') return NaN;
    return parseFloat(String(v).replace(/,/g, ''));
  }

  /* Formulas from "แบบฟอมต์ทดสอบมาตรวัดน้ำ.xls":
     U  = volume through the region's ultrasonic flowmeter
     M  = volume through the master meter
     M* = M × old factor
     error % = ((M* − U) / U) × 100
     factor this time = ((U − M) / M) + 1 */
  function calibrate(t, limit) {
    const U = num(t.uEnd) - num(t.uStart);
    const M = num(t.mEnd) - num(t.mStart);
    const k0 = isFinite(num(t.oldFactor)) && num(t.oldFactor) > 0 ? num(t.oldFactor) : 1;
    const Ms = M * k0;
    const valid = isFinite(U) && isFinite(M) && U > 0 && M > 0;
    const err = valid ? ((Ms - U) / U) * 100 : NaN;
    const errRaw = valid ? ((M - U) / U) * 100 : NaN;
    const k1 = valid ? ((U - M) / M) + 1 : NaN;
    const over = valid && Math.abs(err) > limit;
    return { U, M, k0, Ms, valid, err, errRaw, k1, over };
  }

  function resultOf(test, limit) {
    if (!test) return 'none';
    if (test.broken) return 'broken';
    const c = calibrate(test, limit);
    if (!c.valid) return 'none';
    if (test.opinion === 'new') return 'factor';
    if (test.opinion === 'old') return c.k0 !== 1 ? 'factor' : 'pass';
    if (test.opinion === 'none') return 'pass';
    return c.over ? 'factor' : 'pass';
  }

  // Thai fiscal year: starts 1 October. Oct 2026 (BE 2569) is FY 2570.
  function fiscalYear(d) {
    const dt = d ? new Date(d) : new Date();
    const be = dt.getFullYear() + 543;
    return dt.getMonth() >= 9 ? be + 1 : be;
  }

  const TH_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
  function thaiDigits(s) { return String(s).replace(/[0-9]/g, (d) => TH_DIGITS[d]); }

  function fmt(x, d) {
    if (!isFinite(x)) return '–';
    return Number(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function fmtSigned(x, d) { return isFinite(x) ? (x > 0 ? '+' : '') + fmt(x, d) : '–'; }

  const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const TH_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  function thDate(iso, full) {
    if (!iso) return '–';
    const d = new Date(iso);
    if (isNaN(d)) return '–';
    const y = d.getFullYear() + 543;
    return full ? `${d.getDate()} ${TH_MONTHS_FULL[d.getMonth()]} ${y}` : `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${String(y).slice(-2)}`;
  }
  function todayISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function nowTime() { return new Date().toTimeString().slice(0, 5); }

  function uid(prefix) {
    const r = crypto.getRandomValues(new Uint32Array(2));
    return (prefix || '') + Date.now().toString(36) + r[0].toString(36) + r[1].toString(36).slice(0, 4);
  }

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function kindCode(kind) {
    const k = String(kind || '').toLowerCase();
    if (k.includes('insert')) return 'IN';
    if (k.includes('clamp')) return 'CL';
    if (k.includes('ultra')) return 'US';
    if (k.includes('ใบพัด') || k.includes('mech')) return 'MC';
    if (k.includes('electro') || k.includes('mag')) return 'EM';
    return '–';
  }
  const KIND_NAMES = { EM: 'Electromagnetic', US: 'Ultrasonic', IN: 'Ultrasonic Insert', CL: 'Ultrasonic Clamp on', MC: 'ใบพัด (Mechanical)' };

  function isRaw(m) { return String(m && m.category || '').includes('ดิบ'); }

  // Symbol from "สัญลักษณ์รูปมาตรวัดน้ำ.docx": raw water = grey disc, black M;
  // distribution = white disc, blue ring, blue M. Ring colour = latest result.
  function symbol(m, opts) {
    const o = Object.assign({ size: 32, ring: null, badge: false }, opts);
    const raw = isRaw(m);
    const s = o.size;
    const cls = 'sym ' + (raw ? 'sym-raw' : 'sym-dist');
    const ring = o.ring ? `box-shadow:0 0 0 ${Math.max(3, s / 10)}px ${o.ring};` : '';
    const badge = o.badge ? `<span class="sym-badge">${esc(kindCode(m.kind))}</span>` : '';
    return `<span class="${cls}" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.46)}px;${ring}" title="${raw ? 'มาตรวัดน้ำดิบ' : 'มาตรวัดน้ำจ่าย'}">M${badge}</span>`;
  }

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function parseLatLng(text) {
    if (!text) return null;
    const s = decodeURIComponent(String(text));
    const at = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || s.match(/[?&](?:q|query|destination|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || s.match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{2,3}\.\d{3,})/);
    if (!at) return null;
    const lat = parseFloat(at[1]), lng = parseFloat(at[2]);
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return { lat, lng };
  }

  function distanceKm(a, b) {
    const R = 6371, toR = Math.PI / 180;
    const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  window.Core = {
    BRANCHES, METER_STATUS, CATEGORIES, KINDS, BRANDS, EQUIPMENT, EQUIP_STATE, RESULT, OPINIONS, KIND_NAMES,
    num, calibrate, resultOf, fiscalYear, thaiDigits, fmt, fmtSigned, thDate, todayISO, nowTime, uid, esc,
    kindCode, isRaw, symbol, sha256, parseLatLng, distanceKm, TH_MONTHS_FULL
  };
})();
