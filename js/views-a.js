/* Meter P.W.A 9 — views: login, dashboard, meter registry, profile, map, branches, equipment */
(function () {
  'use strict';
  const C = window.Core;
  const S = window.Store;
  const App = window.App;
  const { M, UI, icon } = App;
  const { esc } = C;
  const V = window.Views = window.Views || {};

  const LOGIN_ART = `
    <div class="login-art">
      <svg class="login-waves" width="520" height="520" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width=".6" aria-hidden="true"><path d="M12 3c3.5 4.2 6 7.6 6 10.5A6 6 0 0 1 6 13.5C6 10.6 8.5 7.2 12 3z"/></svg>
      <div style="display:flex;align-items:center;gap:12px">
        <span class="brand-logo">${icon('drop', 24, 'var(--brand)')}</span>
        <div><div style="font-weight:700;font-size:18px">Meter P.W.A 9</div><div style="font-size:13px;opacity:.85">การประปาส่วนภูมิภาคเขต 9</div></div>
      </div>
      <div>
        <h1>ระบบมาตรวัดน้ำหลัก<br>การประปาส่วนภูมิภาคเขต 9</h1>
        <p>บันทึกค่าสอบเทียบมาตรวัดน้ำหลักจากหน้างาน คำนวณความคลาดเคลื่อนและค่าตัวคูณทันที แล้วออกรายงานได้โดยไม่ต้องกลับไปคำนวณในคอม</p>
      </div>
      <div class="login-feats">
        <div>${icon('test', 20, '#fff')}<span>คำนวณตามแบบฟอร์มทดสอบมาตรวัดน้ำของงานมาตรวัดน้ำ</span></div>
        <div>${icon('map', 20, '#fff')}<span>ทะเบียนและพิกัดมาตรวัดน้ำหลัก 27 สาขา</span></div>
        <div>${icon('report', 20, '#fff')}<span>ตารางสรุปผลและบันทึกข้อความ ส่งออก Excel / PDF / Word</span></div>
        <div>${icon('sync', 20, '#fff')}<span>ใช้งานได้แม้ไม่มีสัญญาณ แล้วซิงก์อัตโนมัติ</span></div>
      </div>
    </div>`;

  function pwField(id, label, autocomplete) {
    return `<label class="field"><span>${label}</span>
      <div class="pw-wrap"><input id="${id}" type="password" minlength="8" required autocomplete="${autocomplete}" class="input">
      <button type="button" data-toggle="${id}" aria-label="แสดงรหัสผ่าน">${icon('eye')}</button></div></label>`;
  }
  function wirePw(root) {
    root.querySelectorAll('[data-toggle]').forEach((b) => {
      b.onclick = () => {
        const i = root.querySelector('#' + b.getAttribute('data-toggle'));
        i.type = i.type === 'password' ? 'text' : 'password';
      };
    });
  }

  // ---------- login ----------
  V.login = function (root) {
    root.innerHTML = `<div class="login-wrap">${LOGIN_ART}
      <div class="login-form-wrap"><form class="login-form" id="login-form" novalidate>
        <div><h2>เข้าสู่ระบบ</h2><div class="muted">ใช้รหัสพนักงานและรหัสผ่านที่ผู้ดูแลระบบตั้งให้</div></div>
        <div id="login-err" class="form-error hidden" role="alert"></div>
        <label class="field"><span>รหัสพนักงาน</span><input id="emp" class="input" inputmode="numeric" autocomplete="username" required placeholder="เช่น 18532"></label>
        ${pwField('pw', 'รหัสผ่าน', 'current-password')}
        <button class="btn btn-primary btn-lg btn-block" type="submit">เข้าสู่ระบบ</button>
        <div class="muted" style="font-size:13px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <span>ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ</span>
          <a href="#/server">${S.mode === 'remote' ? 'เซิร์ฟเวอร์: เชื่อมต่อแล้ว' : 'ตั้งค่าเซิร์ฟเวอร์'}</a>
        </div>
      </form></div></div>`;
    wirePw(root);
    const form = root.querySelector('#login-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const err = root.querySelector('#login-err');
      const btn = form.querySelector('button[type=submit]');
      err.classList.add('hidden');
      btn.disabled = true;
      btn.textContent = 'กำลังตรวจสอบ…';
      try {
        await S.login(root.querySelector('#emp').value, root.querySelector('#pw').value);
        root.innerHTML = '';
        location.hash = '#/dashboard';
        App.route();
      } catch (ex) {
        err.textContent = ex.message;
        err.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'เข้าสู่ระบบ';
      }
    };
  };

  // ---------- first run: create admin ----------
  V.setup = function (root) {
    root.innerHTML = `<div class="login-wrap">${LOGIN_ART}
      <div class="login-form-wrap"><form class="login-form" id="setup-form" novalidate>
        <div><h2>ตั้งค่าผู้ดูแลระบบ</h2><div class="muted">เริ่มใช้งานครั้งแรก — สร้างบัญชีผู้ดูแลระบบ ผู้ดูแลเพิ่มผู้ใช้งานคนอื่นได้ภายหลัง</div></div>
        <div id="setup-err" class="form-error hidden" role="alert"></div>
        <label class="field"><span>รหัสพนักงาน</span><input id="emp" class="input" inputmode="numeric" autocomplete="username" required value="18532"></label>
        <label class="field"><span>ชื่อ-สกุล</span><input id="name" class="input" required placeholder="ชื่อที่จะแสดงในระบบและรายงาน"></label>
        ${pwField('pw', 'รหัสผ่าน (อย่างน้อย 8 ตัว)', 'new-password')}
        ${pwField('pw2', 'ยืนยันรหัสผ่าน', 'new-password')}
        <button class="btn btn-primary btn-lg btn-block" type="submit">สร้างบัญชีและเข้าสู่ระบบ</button>
        <a href="#/server" class="muted" style="font-size:13px">มีเซิร์ฟเวอร์ Google Sheets แล้ว? ตั้งค่าเซิร์ฟเวอร์ก่อน</a>
      </form></div></div>`;
    wirePw(root);
    root.querySelector('#setup-form').onsubmit = async (e) => {
      e.preventDefault();
      const err = root.querySelector('#setup-err');
      const emp = root.querySelector('#emp').value.trim();
      const name = root.querySelector('#name').value.trim();
      const pw = root.querySelector('#pw').value, pw2 = root.querySelector('#pw2').value;
      const fail = (m) => { err.textContent = m; err.classList.remove('hidden'); };
      if (!/^\d{3,10}$/.test(emp)) return fail('รหัสพนักงานต้องเป็นตัวเลข');
      if (!name) return fail('กรุณากรอกชื่อ-สกุล');
      if (pw.length < 8) return fail('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      if (pw !== pw2) return fail('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      try {
        await S.bootstrap(emp, name, pw);
        root.innerHTML = '';
        location.hash = '#/dashboard';
        App.route();
        UI.toast('สร้างบัญชีผู้ดูแลระบบเรียบร้อย', 'ok');
      } catch (ex) { fail(ex.message); }
    };
  };

  // ---------- server address (for new devices) ----------
  V.loginServer = function (root) {
    root.innerHTML = `<div class="login-wrap">${LOGIN_ART}
      <div class="login-form-wrap"><form class="login-form" id="srv-form" novalidate>
        <div><h2>ตั้งค่าเซิร์ฟเวอร์</h2><div class="muted">วางลิงก์ Web App ของ Google Apps Script ที่ผู้ดูแลระบบให้มา หรือเว้นว่างเพื่อเก็บข้อมูลในเครื่องนี้</div></div>
        <div id="srv-msg" class="hidden" role="status"></div>
        <label class="field"><span>ลิงก์ Web App</span><input id="url" class="input" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(S.apiUrl)}"></label>
        <button class="btn btn-primary btn-lg btn-block" type="submit">บันทึกและทดสอบ</button>
        <a class="btn btn-block" href="#/login">กลับไปหน้าเข้าสู่ระบบ</a>
      </form></div></div>`;
    root.querySelector('#srv-form').onsubmit = async (e) => {
      e.preventDefault();
      const url = root.querySelector('#url').value.trim();
      const msg = root.querySelector('#srv-msg');
      if (url) {
        try {
          await S.testConnection(url);
        } catch (ex) {
          msg.className = 'form-error';
          msg.textContent = 'เชื่อมต่อไม่ได้: ' + ex.message;
          return;
        }
      }
      S.setApiUrl(url);
      UI.toast(url ? 'เชื่อมต่อเซิร์ฟเวอร์สำเร็จ' : 'ใช้โหมดเก็บในเครื่อง', 'ok');
      location.hash = '#/login';
    };
  };

  // ---------- dashboard ----------
  V.dashboard = function (view) {
    const fy = Number(App.dashFY || M.fy());
    const meters = M.meters().filter((m) => m.status !== 'retired');
    const sum = M.branchSummary(fy).filter((b) => !App.branch || b.name === App.branch);
    const total = meters.length;
    const done = sum.reduce((a, b) => a + b.done, 0);
    const factor = sum.reduce((a, b) => a + b.factor, 0);
    const broken = sum.reduce((a, b) => a + b.broken, 0);
    const gps = meters.filter((m) => m.lat && m.lng).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const alerts = M.alerts();
    const equipBad = alerts.filter((a) => a.kind === 'bad').length;
    const recent = M.tests().slice(0, 6);
    const years = Array.from(new Set([M.fy(), M.fy() - 1, M.fy() - 2].concat(S.data.tests.map((t) => Number(t.fiscalYear))).filter(Boolean))).sort((a, b) => b - a);
    const scope = App.branch ? 'กปภ.สาขา' + App.branch : 'กปภ.เขต 9 · 27 สาขา';

    const branchRows = App.branch
      ? meters.map((m) => {
        const t = M.testsFor(m.id).find((x) => Number(x.fiscalYear) === fy);
        const r = M.result(t);
        const c = t ? C.calibrate(t, M.limit()) : null;
        return `<tr class="clickable" data-href="#/meter/${m.id}">
          <td style="width:44px">${C.symbol(m, { size: 28, ring: UI.ringColor(r) })}</td>
          <td><b style="font-weight:500">${esc(m.place)}</b><div class="muted" style="font-size:12.5px">${esc(m.brand)} ${esc(m.model)} · ${esc(m.size)} มม.</div></td>
          <td class="r num" style="color:${C.RESULT[r].color};font-weight:700">${t && !t.broken ? C.fmtSigned(c.err, 2) + '%' : '–'}</td>
          <td>${UI.resultBadge(r)}</td></tr>`;
      }).join('')
      : sum.filter((b) => b.total).map((b) => {
        const p = b.total ? Math.round(b.done / b.total * 100) : 0;
        return `<tr class="clickable" data-branch="${esc(b.name)}">
          <td style="font-weight:500">${esc(b.name)}</td>
          <td class="r num">${b.total}</td>
          <td><div class="progress"><div class="bar"><div class="${p === 100 ? 'full' : ''}" style="width:${p}%"></div></div><span>${b.done}/${b.total}</span></div></td>
          <td class="r" style="color:var(--warn);font-weight:600">${b.factor || '–'}</td>
          <td class="r" style="color:var(--bad);font-weight:600">${b.broken || '–'}</td></tr>`;
      }).join('');

    const alertHtml = alerts.filter((a) => a.kind !== 'gps').slice(0, 5).map((a) => {
      const cls = a.kind === 'bad' ? 'alert-bad' : a.kind === 'warn' ? 'alert-warn' : 'alert-info';
      const ic = a.kind === 'bad' ? icon('x', 20, 'var(--bad)') : a.kind === 'warn' ? icon('battery', 20, 'var(--warn)') : icon('clock', 20, 'var(--brand)');
      return `<a class="alert ${cls}" href="#/meter/${a.meter.id}">${ic}<div><b>${esc(a.text)}</b><br>${esc(a.meter.branch)} · ${esc(a.meter.place)}</div></a>`;
    }).join('');
    const noGps = total - gps;

    view.innerHTML = `<div class="page">
      <div class="page-head">
        <div><div class="crumb">ปีงบประมาณ ${fy} · ${esc(scope)}</div><h1>ภาพรวมการสอบเทียบมาตรวัดน้ำหลัก</h1></div>
        <div class="head-actions">
          <label class="field"><span>ปีงบประมาณ</span><select id="fy-sel" class="input" style="width:130px">${years.map((y) => `<option ${y === fy ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
          ${S.canEdit() ? `<a class="btn btn-primary" href="#/test/new">${icon('plus', 18, '#fff')}เริ่มสอบเทียบ</a>` : ''}
        </div>
      </div>

      <div class="grid-kpi">
        <a class="kpi" href="#/meters"><span class="kpi-label">มาตรวัดน้ำหลักทั้งหมด</span><span class="kpi-value">${total}<small>มาตร</small></span><span class="kpi-sub">มีพิกัดแล้ว ${gps} · น้ำดิบ ${meters.filter(C.isRaw).length}</span></a>
        <a class="kpi" href="#/reports"><span class="kpi-label">สอบเทียบแล้ว ปี ${fy}</span><span class="kpi-value" style="color:var(--brand)">${done}<small>มาตร</small></span><span class="kpi-sub">${pct}% ของมาตรทั้งหมด</span><div class="kpi-bar"><div style="width:${pct}%"></div></div></a>
        <a class="kpi" href="#/reports?status=factor"><span class="kpi-label">เสนอให้ใช้ตัวคูณ</span><span class="kpi-value" style="color:var(--warn)">${factor}<small>มาตร</small></span><span class="kpi-sub">คลาดเคลื่อนเกินเกณฑ์ ±${M.limit()}%</span></a>
        <a class="kpi" href="#/equipment"><span class="kpi-label">มาตร / อุปกรณ์ชำรุด</span><span class="kpi-value" style="color:var(--bad)">${broken + equipBad}<small>จุด</small></span><span class="kpi-sub">มาตรชำรุด ${broken} · อุปกรณ์ชำรุด ${equipBad}</span></a>
      </div>

      <div class="row">
        <section class="card col-3">
          <div class="card-head">
            <h2>${App.branch ? 'มาตรของ กปภ.สาขา' + esc(App.branch) : 'ความคืบหน้ารายสาขา'}</h2>
            ${App.branch ? `<button class="btn btn-sm" id="all-branches">ดูทุกสาขา</button>` : `<div class="legend"><span><i class="dot" style="background:var(--brand);border-radius:2px"></i>สอบเทียบแล้ว</span><span><i class="dot" style="background:#D7DFEA;border-radius:2px"></i>คงเหลือ</span></div>`}
          </div>
          <div class="table-wrap"><table class="tbl" style="min-width:520px">
            <thead>${App.branch
              ? '<tr><th></th><th>มาตรวัดน้ำ</th><th class="r">คลาดเคลื่อน</th><th>ผล</th></tr>'
              : '<tr><th>กปภ.สาขา</th><th class="r">มาตร</th><th style="width:40%">ความคืบหน้า</th><th class="r">ใช้ตัวคูณ</th><th class="r">ชำรุด</th></tr>'}</thead>
            <tbody>${branchRows || '<tr><td colspan="5" class="empty">ยังไม่มีมาตรในสาขานี้</td></tr>'}</tbody>
          </table></div>
        </section>

        <div class="col-2 stack">
          <section class="card">
            <div class="card-head"><h2>ผลสอบเทียบล่าสุด</h2><a href="#/reports" style="font-size:14px">ทั้งหมด →</a></div>
            <div>${recent.length ? recent.map((t) => {
              const m = M.meter(t.meterId) || { place: t.place, branch: t.branch, category: '' };
              const r = M.result(t);
              const c = C.calibrate(t, M.limit());
              return `<a class="list-item" href="#/test/${t.id}">${C.symbol(m, { size: 30 })}
                <span class="list-main"><span class="list-title">${esc(m.place)}</span><span class="list-sub">${esc(t.branch)} · ${C.thDate(t.date)} · ${esc(t.createdByName || '')}</span></span>
                <span class="list-end"><b style="color:${C.RESULT[r].color}">${t.broken ? 'ชำรุด' : C.fmtSigned(c.err, 2) + '%'}</b><span>${r === 'factor' ? 'ตัวคูณ ' + C.fmt(t.opinion === 'old' ? c.k0 : c.k1, 4) : C.RESULT[r].label}</span></span></a>`;
            }).join('') : `<div class="empty">ยังไม่มีผลสอบเทียบ${S.canEdit() ? '<br><a href="#/test/new">เริ่มบันทึกครั้งแรก →</a>' : ''}</div>`}</div>
          </section>

          <section class="card">
            <div class="card-head"><h2>ต้องติดตาม</h2><span class="muted" style="font-size:13px">${alerts.filter((a) => a.kind !== 'gps').length} รายการ</span></div>
            ${alertHtml || '<div class="alert alert-ok">' + icon('ok', 20, 'var(--ok)') + '<div><b>ไม่มีรายการค้าง</b></div></div>'}
            ${noGps ? `<a class="alert alert-info" href="#/meters?gps=no">${icon('pin', 20, 'var(--brand)')}<div><b>ยังไม่มีพิกัด ${noGps} มาตร</b><br>เพิ่มพิกัดจากหน้างานด้วย GPS มือถือ</div></a>` : ''}
          </section>
        </div>
      </div>
    </div>`;

    view.querySelector('#fy-sel').onchange = (e) => { App.dashFY = e.target.value; V.dashboard(view); };
    const all = view.querySelector('#all-branches');
    if (all) all.onclick = () => App.setBranch('');
    view.querySelectorAll('tr[data-branch]').forEach((tr) => { tr.onclick = () => App.setBranch(tr.getAttribute('data-branch')); });
    view.querySelectorAll('tr[data-href]').forEach((tr) => { tr.onclick = () => { location.hash = tr.getAttribute('data-href'); }; });
  };

  // ---------- meter registry ----------
  V.meters = function (view, query) {
    const st = App.meterFilter = Object.assign({ q: '', cat: '', kind: '', res: '', gps: query.gps || '' }, App.meterFilter || {}, query.gps ? { gps: query.gps } : {});
    const draw = () => {
      const q = st.q.trim().toLowerCase();
      const list = M.meters().filter((m) => {
        if (q && !(`${m.place} ${m.branch} ${m.brand} ${m.model} ${m.asset} ${m.size}`.toLowerCase().includes(q))) return false;
        if (st.cat && m.category !== st.cat) return false;
        if (st.kind && C.kindCode(m.kind) !== st.kind) return false;
        if (st.gps === 'no' && m.lat && m.lng) return false;
        if (st.gps === 'yes' && !(m.lat && m.lng)) return false;
        if (st.res && M.latestResult(m.id) !== st.res) return false;
        return true;
      });
      view.querySelector('#m-count').textContent = `${list.length} มาตร`;
      view.querySelector('#m-body').innerHTML = list.map((m) => {
        const s = M.stats(m.id);
        const r = M.result(s.last);
        return `<tr class="clickable" data-id="${m.id}">
          <td style="width:48px">${C.symbol(m, { size: 30, ring: UI.ringColor(r), badge: true })}</td>
          <td><b style="font-weight:600">${esc(m.place)}</b><div class="muted" style="font-size:12.5px">${esc(m.category)}${m.status !== 'active' ? ' · <span style="color:var(--bad)">' + esc(C.METER_STATUS[m.status] || m.status) + '</span>' : ''}</div></td>
          <td>${esc(m.branch)}</td>
          <td>${esc(m.brand)}<div class="muted" style="font-size:12.5px">${esc(m.model)}</div></td>
          <td>${esc(m.kind)}</td>
          <td class="r num">${esc(m.size || '–')}</td>
          <td class="c">${m.lat && m.lng ? icon('pin', 18, 'var(--ok)') : '<span class="muted">–</span>'}</td>
          <td class="c num">${s.count}</td>
          <td>${s.last ? C.thDate(s.last.date) : '<span class="muted">–</span>'}</td>
          <td>${UI.resultBadge(r)}</td></tr>`;
      }).join('') || '<tr><td colspan="10" class="empty">ไม่พบมาตรตามเงื่อนไข</td></tr>';
      view.querySelectorAll('#m-body tr[data-id]').forEach((tr) => { tr.onclick = () => { location.hash = '#/meter/' + tr.getAttribute('data-id'); }; });
    };

    const chip = (key, val, label) => `<button type="button" class="chip ${st[key] === val ? 'on' : ''}" data-k="${key}" data-v="${val}">${label}</button>`;
    view.innerHTML = `<div class="page">
      <div class="page-head">
        <div><div class="crumb">${App.branch ? 'กปภ.สาขา' + esc(App.branch) : 'ทุกสาขา'}</div><h1>ทะเบียนมาตรวัดน้ำหลัก</h1></div>
        <div class="head-actions">
          <button class="btn btn-excel" id="m-export">${icon('download')}ส่งออก Excel</button>
          ${S.isAdmin() ? `<button class="btn" id="m-import">${icon('upload')}นำเข้าจาก Excel</button>` : ''}
          ${S.canEdit() ? `<a class="btn btn-primary" href="#/meter/new">${icon('plus', 18, '#fff')}เพิ่มมาตร</a>` : ''}
        </div>
      </div>
      <section class="card filters">
        <label class="field"><span class="sr-only">ค้นหา</span>
          <div style="position:relative"><input id="m-q" class="input" placeholder="ค้นหาชื่อสถานที่ / ยี่ห้อ / รุ่น / รหัสทรัพย์สิน" value="${esc(st.q)}" style="padding-left:40px"><span style="position:absolute;left:12px;top:12px;color:var(--muted)">${icon('search')}</span></div></label>
        <div class="chips">
          ${chip('cat', '', 'ทุกประเภท')}${chip('cat', 'มาตรน้ำจ่าย', 'น้ำจ่าย')}${chip('cat', 'มาตรน้ำดิบ', 'น้ำดิบ')}
          <span style="width:1px;background:var(--line);margin:0 4px"></span>
          ${chip('kind', '', 'ทุกชนิด')}${chip('kind', 'EM', 'Electromagnetic')}${chip('kind', 'US', 'Ultrasonic')}${chip('kind', 'IN', 'Insert')}${chip('kind', 'MC', 'ใบพัด')}
        </div>
        <div class="chips">
          ${chip('res', '', 'ทุกผล')}${chip('res', 'pass', 'ผ่านเกณฑ์')}${chip('res', 'factor', 'ใช้ตัวคูณ')}${chip('res', 'broken', 'ชำรุด')}${chip('res', 'none', 'ยังไม่สอบเทียบ')}
          <span style="width:1px;background:var(--line);margin:0 4px"></span>
          ${chip('gps', '', 'พิกัดทั้งหมด')}${chip('gps', 'yes', 'มีพิกัด')}${chip('gps', 'no', 'ยังไม่มีพิกัด')}
        </div>
      </section>
      <section class="card">
        <div class="card-head"><h2 id="m-count"></h2><div class="legend"><span>${C.symbol({ category: 'มาตรน้ำจ่าย' }, { size: 18 })}น้ำจ่าย</span><span>${C.symbol({ category: 'มาตรน้ำดิบ' }, { size: 18 })}น้ำดิบ</span><span><i class="dot" style="background:#2E9E6B"></i>ผ่าน</span><span><i class="dot" style="background:#F08C2E"></i>ตัวคูณ</span><span><i class="dot" style="background:#A3122A"></i>ชำรุด</span></div></div>
        <div class="table-wrap"><table class="tbl" style="min-width:980px">
          <thead><tr><th></th><th>สถานที่</th><th>สาขา</th><th>ยี่ห้อ / รุ่น</th><th>ชนิด</th><th class="r">ขนาด (มม.)</th><th class="c">พิกัด</th><th class="c">สอบเทียบ (ครั้ง)</th><th>ล่าสุด</th><th>ผลล่าสุด</th></tr></thead>
          <tbody id="m-body"></tbody></table></div>
      </section></div>`;
    view.querySelector('#m-q').oninput = (e) => { st.q = e.target.value; draw(); };
    view.querySelectorAll('.chip[data-k]').forEach((b) => {
      b.onclick = () => {
        st[b.getAttribute('data-k')] = b.getAttribute('data-v');
        view.querySelectorAll(`.chip[data-k="${b.getAttribute('data-k')}"]`).forEach((x) => x.classList.toggle('on', x === b));
        draw();
      };
    });
    view.querySelector('#m-export').onclick = () => window.Exports.metersExcel(M.meters());
    const imp = view.querySelector('#m-import');
    if (imp) imp.onclick = () => window.Exports.importMetersDialog();
    draw();
  };

  // ---------- meter profile ----------
  V.meterProfile = function (view, id) {
    const m = M.meter(id);
    if (!m) { view.innerHTML = '<div class="card empty">ไม่พบมาตรนี้ <a href="#/meters">กลับทะเบียนมาตร</a></div>'; return; }
    const s = M.stats(id);
    const ts = M.testsFor(id);
    const lim = M.limit();
    const r = M.result(s.last);
    const factorNow = Number(m.factor) || 1;

    // error history chart (oldest → newest), dashed band = ±limit
    const pts = ts.filter((t) => !t.broken).slice(0, 10).reverse().map((t) => ({ t, c: C.calibrate(t, lim) })).filter((p) => p.c.valid);
    const W = 640, H = 170, pad = 30;
    const maxAbs = Math.max(lim * 1.6, ...pts.map((p) => Math.abs(p.c.err))) || lim * 2;
    const y = (v) => H / 2 - (v / maxAbs) * (H / 2 - 16);
    const x = (i) => pts.length > 1 ? pad + i * ((W - pad * 2) / (pts.length - 1)) : W / 2;
    const chart = pts.length ? `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟค่าความคลาดเคลื่อน ${pts.length} ครั้งล่าสุด">
      <rect x="0" y="${y(lim)}" width="${W}" height="${y(-lim) - y(lim)}" fill="#E3F3EC"/>
      <line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" stroke="#C9D3E1"/>
      <line x1="0" x2="${W}" y1="${y(lim)}" y2="${y(lim)}" stroke="#2E9E6B" stroke-dasharray="5 5"/>
      <line x1="0" x2="${W}" y1="${y(-lim)}" y2="${y(-lim)}" stroke="#2E9E6B" stroke-dasharray="5 5"/>
      <text x="4" y="${y(lim) - 4}" font-size="11" fill="#0B6E4F">+${lim}%</text><text x="4" y="${y(-lim) + 13}" font-size="11" fill="#0B6E4F">−${lim}%</text>
      <polyline fill="none" stroke="#0B4DA2" stroke-width="2" points="${pts.map((p, i) => `${x(i)},${y(p.c.err)}`).join(' ')}"/>
      ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.c.err)}" r="6" fill="${Math.abs(p.c.err) > lim ? '#F08C2E' : '#2E9E6B'}" stroke="#fff" stroke-width="2"/><text x="${x(i)}" y="${y(p.c.err) + (p.c.err >= 0 ? -11 : 20)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#0E1B2C">${C.fmtSigned(p.c.err, 2)}</text>`).join('')}
    </svg>` : '<div class="empty">ยังไม่มีข้อมูลสำหรับกราฟ</div>';

    const maint = (m.maint || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    view.innerHTML = `<div class="page">
      <div class="crumb"><a href="#/dashboard">ภาพรวม</a> / <a href="#/meters">ทะเบียนมาตร</a> / กปภ.สาขา${esc(m.branch)}</div>
      <div class="page-head">
        <div class="profile-head">${C.symbol(m, { size: 56, ring: UI.ringColor(r), badge: true })}
          <div><h1>${esc(m.place)}</h1><div class="muted">กปภ.สาขา${esc(m.branch)} · ${esc(m.category)} · รหัสทรัพย์สิน ${esc(m.asset || '–')}</div></div></div>
        <div class="head-actions">
          ${m.lat && m.lng ? `<a class="btn" href="${UI.navUrl(m)}" target="_blank" rel="noopener">${icon('nav')}นำทาง</a>` : ''}
          ${S.canEdit() ? `<a class="btn" href="#/meter/${m.id}/edit">${icon('edit')}แก้ไขข้อมูล</a><a class="btn btn-primary" href="#/test/new?meter=${m.id}">${icon('test', 18, '#fff')}สอบเทียบครั้งใหม่</a>` : ''}
        </div>
      </div>

      <div class="grid-kpi">
        <div class="kpi"><span class="kpi-label">สอบเทียบมาแล้ว</span><span class="kpi-value">${s.count}<small>ครั้ง</small></span><span class="kpi-sub">ล่าสุด ${s.last ? C.thDate(s.last.date) : '–'}</span></div>
        <div class="kpi"><span class="kpi-label">เคยใช้ตัวคูณ</span><span class="kpi-value" style="color:var(--warn)">${s.factorUses}<small>ครั้ง</small></span><span class="kpi-sub">ตัวคูณปัจจุบัน ${C.fmt(factorNow, 4)}</span></div>
        <div class="kpi"><span class="kpi-label">ล้างมาตร</span><span class="kpi-value">${s.cleanCount}<small>ครั้ง</small></span><span class="kpi-sub">ล่าสุด ${s.lastClean ? C.thDate(s.lastClean) : '–'}</span></div>
        <div class="kpi"><span class="kpi-label">อุปกรณ์ชำรุดตอนนี้</span><span class="kpi-value" style="color:var(--bad)">${s.brokenNow.length}<small>รายการ</small></span><span class="kpi-sub">${esc(s.brokenNow.join(', ') || 'ไม่มี')}</span></div>
      </div>

      <div class="row">
        <section class="card col-1">
          <h2>ข้อมูลมาตร</h2>
          <dl class="facts">
            <dt>ประเภท</dt><dd>${esc(m.category)}</dd>
            <dt>ยี่ห้อ / รุ่น</dt><dd>${esc(m.brand)} · ${esc(m.model || '–')}</dd>
            <dt>ชนิด</dt><dd>${esc(m.kind)}</dd>
            <dt>ขนาด</dt><dd>${esc(m.size || '–')} มม.</dd>
            <dt>Correction Factor</dt><dd class="num">${C.fmt(factorNow, 4)}</dd>
            <dt>สถานะ</dt><dd><span class="badge" style="background:${m.status === 'active' ? 'var(--ok-bg)' : 'var(--bad-bg)'};color:${m.status === 'active' ? 'var(--ok)' : 'var(--bad)'}">${esc(C.METER_STATUS[m.status] || m.status)}</span></dd>
            <dt>หมายเหตุ</dt><dd>${esc(m.note || '–')}</dd>
          </dl>
          <div style="border-top:1px solid var(--line-2);padding-top:14px;display:flex;flex-direction:column;gap:10px">
            <div class="card-head"><h3>พิกัด</h3><span class="num muted" style="font-size:13px">${m.lat && m.lng ? `${m.lat}, ${m.lng}` : 'ยังไม่มีพิกัด'}</span></div>
            <div id="p-map" class="map map-sm"></div>
            ${S.canEdit() ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm" id="p-gps">${icon('gps')}ใช้ตำแหน่งปัจจุบัน</button><button class="btn btn-sm" id="p-paste">${icon('pin')}วางลิงก์ Google Maps</button></div>` : ''}
          </div>
        </section>

        <section class="card col-3">
          <div class="card-head"><h2>ประวัติการสอบเทียบ</h2><span class="muted" style="font-size:13px">ค่าคลาดเคลื่อน (%) · แถบเขียว = เกณฑ์ ±${lim}%</span></div>
          ${chart}
          <div class="table-wrap"><table class="tbl" style="min-width:680px">
            <thead><tr><th>ครั้งที่ / ปีงบ</th><th>วันที่</th><th class="r">คลาดเคลื่อน</th><th class="r">ตัวคูณ</th><th>ผล</th><th>ล้างมาตร</th><th>อุปกรณ์ชำรุด</th></tr></thead>
            <tbody>${ts.map((t) => {
              const c = C.calibrate(t, lim);
              const rr = M.result(t);
              const bad = t.equipment ? Object.keys(t.equipment).filter((k) => t.equipment[k] === 'bad') : [];
              return `<tr class="clickable" data-href="#/test/${t.id}">
                <td>${esc(t.round || '–')}/${esc(t.fiscalYear)}</td><td>${C.thDate(t.date)}</td>
                <td class="r num" style="font-weight:700;color:${C.RESULT[rr].color}">${t.broken ? '–' : C.fmtSigned(c.err, 2)}</td>
                <td class="r num">${rr === 'factor' ? C.fmt(t.opinion === 'old' ? c.k0 : c.k1, 4) : '–'}</td>
                <td>${UI.resultBadge(rr)}</td><td>${t.cleaned ? 'ล้างแล้ว' : '–'}</td><td>${esc(bad.join(', ') || '–')}</td></tr>`;
            }).join('') || '<tr><td colspan="7" class="empty">ยังไม่เคยสอบเทียบ</td></tr>'}</tbody></table></div>

          <div style="border-top:1px solid var(--line-2);padding-top:14px;display:flex;flex-direction:column;gap:10px">
            <div class="card-head"><h3>บันทึกการซ่อม / ล้างมาตร / เปลี่ยนอุปกรณ์</h3>${S.canEdit() ? `<button class="btn btn-sm" id="p-maint">${icon('plus')}เพิ่มบันทึก</button>` : ''}</div>
            <div class="timeline">${maint.map((x) => `<div><time>${C.thDate(x.date)}</time><span>${esc(x.text)}${x.by ? ` <span class="muted">· ${esc(x.by)}</span>` : ''}</span></div>`).join('') || '<span class="muted">ยังไม่มีบันทึก</span>'}</div>
          </div>
        </section>
      </div>
      <section class="card" id="p-site"></section>
      </div>`;
    V.sitePhotos(view.querySelector('#p-site'), m, { editable: S.canEdit(), onChange: () => V.meterProfile(view, id) });

    view.querySelectorAll('tr[data-href]').forEach((tr) => { tr.onclick = () => { location.hash = tr.getAttribute('data-href'); }; });
    V.miniMap(view.querySelector('#p-map'), m);

    const saveCoords = async (ll) => {
      m.lat = ll.lat; m.lng = ll.lng;
      await S.saveMeter(m);
      UI.toast('บันทึกพิกัดแล้ว', 'ok');
      V.meterProfile(view, id);
    };
    const g = view.querySelector('#p-gps');
    if (g) g.onclick = async () => {
      g.disabled = true; g.textContent = 'กำลังอ่าน GPS…';
      try {
        const ll = await UI.getGPS();
        if (await UI.confirm('บันทึกพิกัดนี้?', `${ll.lat}, ${ll.lng} (ความแม่นยำ ±${ll.acc} ม.)`, 'บันทึกพิกัด')) await saveCoords(ll);
      } catch (e) { UI.toast(e.message, 'bad'); }
      g.disabled = false; g.innerHTML = icon('gps') + 'ใช้ตำแหน่งปัจจุบัน';
    };
    const p = view.querySelector('#p-paste');
    if (p) p.onclick = async () => {
      let val = '';
      const ok = await UI.modal(`<h2>วางลิงก์หรือพิกัด</h2>
        <label class="field"><span>ลิงก์ Google Maps หรือ "ละติจูด, ลองจิจูด"</span><input id="ll" class="input" placeholder="18.7883, 98.9853"></label>
        <div class="modal-actions"><button class="btn" data-close="">ยกเลิก</button><button class="btn btn-primary" data-close="ok">บันทึก</button></div>`,
      { onOpen: (el) => { el.querySelector('#ll').oninput = (e) => { val = e.target.value; }; } });
      if (ok !== 'ok') return;
      const ll = C.parseLatLng(val);
      if (!ll) return UI.toast('อ่านพิกัดไม่ได้ ลองวางในรูปแบบ 18.7883, 98.9853', 'bad');
      await saveCoords(ll);
    };
    const mt = view.querySelector('#p-maint');
    if (mt) mt.onclick = async () => {
      const f = { date: C.todayISO(), text: '' };
      const ok = await UI.modal(`<h2>เพิ่มบันทึก</h2>
        <label class="field"><span>วันที่</span><input id="md" type="date" class="input" value="${f.date}"></label>
        <label class="field"><span>รายละเอียด</span><textarea id="mx" placeholder="เช่น ล้างมาตรและทำความสะอาดอิเล็กโทรด / เปลี่ยน Pressure gauge"></textarea></label>
        <div class="modal-actions"><button class="btn" data-close="">ยกเลิก</button><button class="btn btn-primary" data-close="ok">บันทึก</button></div>`,
      { onOpen: (el) => { el.querySelector('#md').oninput = (e) => { f.date = e.target.value; }; el.querySelector('#mx').oninput = (e) => { f.text = e.target.value; }; } });
      if (ok !== 'ok' || !f.text.trim()) return;
      m.maint = (m.maint || []).concat([{ date: f.date, text: f.text.trim(), by: S.session.name }]);
      await S.saveMeter(m);
      V.meterProfile(view, id);
    };
  };

  V.miniMap = function (el, m) {
    if (!el) return;
    if (!window.L) { el.innerHTML = '<div class="empty">แผนที่ต้องใช้อินเทอร์เน็ตในการโหลดครั้งแรก</div>'; return; }
    const has = m.lat && m.lng;
    const map = L.map(el, { zoomControl: false, attributionControl: false, dragging: !L.Browser.mobile, scrollWheelZoom: false }).setView(has ? [m.lat, m.lng] : [18.79, 99.0], has ? 15 : 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    if (has) L.marker([m.lat, m.lng], { icon: L.divIcon({ className: 'pin', html: C.symbol(m, { size: 30 }), iconSize: [30, 30], iconAnchor: [15, 15] }) }).addTo(map);
    const ro = new ResizeObserver(() => { if (el.clientWidth) { map.invalidateSize(); if (has) map.setView([m.lat, m.lng], 15); } });
    ro.observe(el);
    App.cleanup.push(() => { ro.disconnect(); map.remove(); });
  };

  // ---------- meter create / edit ----------
  V.meterEdit = function (view, id) {
    if (!S.canEdit()) { location.hash = '#/meters'; return; }
    const m = id ? Object.assign({}, M.meter(id)) : { branch: App.branch || '', category: 'มาตรน้ำจ่าย', kind: 'Electromagnetic', status: 'active', factor: 1, maint: [] };
    if (id && !m.id) { view.innerHTML = '<div class="card empty">ไม่พบมาตรนี้</div>'; return; }
    const opt = (list, val) => list.map((x) => `<option ${x === val ? 'selected' : ''}>${esc(x)}</option>`).join('');
    view.innerHTML = `<div class="page" style="max-width:900px">
      <div class="crumb"><a href="#/meters">ทะเบียนมาตร</a> / ${id ? 'แก้ไข' : 'เพิ่มมาตรใหม่'}</div>
      <div class="page-head"><h1>${id ? 'แก้ไขข้อมูลมาตร' : 'เพิ่มมาตรวัดน้ำหลัก'}</h1></div>
      <form class="card" id="me-form" novalidate>
        <div class="form-grid">
          <label class="field"><span>กปภ.สาขา *</span><select name="branch" required><option value="">เลือกสาขา</option>${UI.branchOptions(m.branch, false)}</select></label>
          <label class="field span-all"><span>ชื่อสถานที่ / รหัสมาตร *</span><input name="place" required value="${esc(m.place || '')}" placeholder="เช่น MM-01-โซนต่ำ 200 มม. (DMA-01)"></label>
          <label class="field"><span>ประเภทมาตร</span><select name="category">${opt(C.CATEGORIES, m.category)}</select></label>
          <label class="field"><span>ยี่ห้อ</span><input name="brand" list="brands" value="${esc(m.brand || '')}"></label>
          <label class="field"><span>รุ่น</span><input name="model" value="${esc(m.model || '')}" placeholder="เช่น MAG 5100W"></label>
          <label class="field"><span>ชนิด</span><select name="kind">${opt(Array.from(new Set(C.KINDS.concat([m.kind]).filter(Boolean))), m.kind)}</select></label>
          <label class="field"><span>ขนาด (มม.)</span><input name="size" inputmode="numeric" value="${esc(m.size || '')}"></label>
          <label class="field"><span>รหัสทรัพย์สิน</span><input name="asset" value="${esc(m.asset || '')}"></label>
          <label class="field"><span>สถานะการทำงาน</span><select name="status">${Object.keys(C.METER_STATUS).map((k) => `<option value="${k}" ${k === m.status ? 'selected' : ''}>${C.METER_STATUS[k]}</option>`).join('')}</select></label>
          <label class="field"><span>ค่าตัวคูณปัจจุบัน</span><input name="factor" inputmode="decimal" value="${esc(m.factor || 1)}"></label>
          <label class="field"><span>ละติจูด</span><input name="lat" inputmode="decimal" value="${esc(m.lat || '')}" placeholder="18.xxxxxx"></label>
          <label class="field"><span>ลองจิจูด</span><input name="lng" inputmode="decimal" value="${esc(m.lng || '')}" placeholder="98.xxxxxx"></label>
          <div class="field" style="justify-content:flex-end"><button type="button" class="btn" id="me-gps">${icon('gps')}ใช้ตำแหน่งปัจจุบัน</button></div>
          <label class="field span-all"><span>หรือวางลิงก์ Google Maps</span><input id="me-link" placeholder="https://maps.google.com/…"><span class="hint">ระบบจะแยกละติจูด/ลองจิจูดให้อัตโนมัติ</span></label>
          <label class="field span-all"><span>หมายเหตุ</span><textarea name="note">${esc(m.note || '')}</textarea></label>
        </div>
        <datalist id="brands">${C.BRANDS.map((b) => `<option value="${esc(b)}">`).join('')}</datalist>
        <div id="me-err" class="form-error hidden" role="alert"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between">
          <div>${id && S.isAdmin() ? `<button type="button" class="btn btn-danger" id="me-del">${icon('trash')}ลบมาตร</button>` : ''}</div>
          <div style="display:flex;gap:10px"><a class="btn" href="${id ? '#/meter/' + id : '#/meters'}">ยกเลิก</a><button class="btn btn-primary" type="submit">บันทึก</button></div>
        </div>
      </form></div>`;
    const form = view.querySelector('#me-form');
    view.querySelector('#me-link').oninput = (e) => {
      const ll = C.parseLatLng(e.target.value);
      if (ll) { form.lat.value = ll.lat; form.lng.value = ll.lng; UI.toast('อ่านพิกัดจากลิงก์แล้ว', 'ok'); }
    };
    view.querySelector('#me-gps').onclick = async () => {
      try { const ll = await UI.getGPS(); form.lat.value = ll.lat; form.lng.value = ll.lng; UI.toast(`ได้พิกัด ±${ll.acc} ม.`, 'ok'); } catch (e) { UI.toast(e.message, 'bad'); }
    };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const err = view.querySelector('#me-err');
      const rec = Object.assign(m, {
        branch: fd.get('branch'), place: String(fd.get('place')).trim(), category: fd.get('category'), brand: String(fd.get('brand')).trim(),
        model: String(fd.get('model')).trim(), kind: fd.get('kind'), size: parseInt(fd.get('size'), 10) || '', asset: String(fd.get('asset')).trim(),
        status: fd.get('status'), factor: C.num(fd.get('factor')) || 1, note: String(fd.get('note')).trim(),
        lat: C.num(fd.get('lat')) || null, lng: C.num(fd.get('lng')) || null
      });
      if (!rec.branch || !rec.place) { err.textContent = 'กรุณาเลือกสาขาและกรอกชื่อสถานที่'; err.classList.remove('hidden'); return; }
      await S.saveMeter(rec);
      UI.toast('บันทึกข้อมูลมาตรแล้ว', 'ok');
      location.hash = '#/meter/' + rec.id;
    };
    const del = view.querySelector('#me-del');
    if (del) del.onclick = async () => {
      const n = M.testsFor(id).length;
      if (!(await UI.confirm('ลบมาตรนี้?', `${m.place} จะถูกลบออกจากทะเบียน${n ? ` (ผลสอบเทียบ ${n} ครั้งยังเก็บไว้ในรายงาน)` : ''} — แนะนำให้เปลี่ยนสถานะเป็น "ยกเลิกใช้งาน" แทนถ้าต้องการเก็บประวัติ`, 'ลบมาตร', true))) return;
      await S.deleteMeter(id);
      UI.toast('ลบมาตรแล้ว');
      location.hash = '#/meters';
    };
  };

  // ---------- map ----------
  V.map = function (view) {
    const st = App.mapFilter = App.mapFilter || { cat: '', res: '' };
    view.innerHTML = `<div class="page">
      <div class="page-head"><div><div class="crumb">${App.branch ? 'กปภ.สาขา' + esc(App.branch) : 'ทุกสาขา'}</div><h1>แผนที่มาตรวัดน้ำหลัก</h1></div>
        <div class="head-actions"><button class="btn" id="mp-me">${icon('gps')}ตำแหน่งของฉัน</button></div></div>
      <div class="chips filters">
        ${[['', 'ทั้งหมด'], ['มาตรน้ำจ่าย', 'น้ำจ่าย'], ['มาตรน้ำดิบ', 'น้ำดิบ']].map(([v, l]) => `<button class="chip ${st.cat === v ? 'on' : ''}" data-k="cat" data-v="${v}">${v ? C.symbol({ category: v }, { size: 16 }) : ''}${l}</button>`).join('')}
        <span style="width:1px;background:var(--line);margin:0 4px"></span>
        ${[['', 'ทุกผล'], ['pass', 'ผ่าน'], ['factor', 'ตัวคูณ'], ['broken', 'ชำรุด'], ['none', 'ยังไม่สอบเทียบ']].map(([v, l]) => `<button class="chip ${st.res === v ? 'on' : ''}" data-k="res" data-v="${v}">${l}</button>`).join('')}
      </div>
      <div class="row">
        <div class="col-3"><div id="big-map" class="map"></div><div class="muted" id="mp-note" style="font-size:13px;margin-top:8px"></div></div>
        <aside class="card col-1" id="mp-side"><div class="empty">แตะสัญลักษณ์บนแผนที่เพื่อดูรายละเอียดมาตร</div></aside>
      </div></div>`;
    if (!window.L) { view.querySelector('#big-map').innerHTML = '<div class="empty">แผนที่ต้องใช้อินเทอร์เน็ตในการโหลดครั้งแรก</div>'; return; }
    const map = L.map('big-map').setView([18.9, 99.6], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    App.cleanup.push(() => map.remove());
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = () => {
      const d = L.DomUtil.create('div', 'map-legend');
      d.innerHTML = `<b>วงรอบ = ผลสอบเทียบล่าสุด</b><span><i class="dot" style="background:#2E9E6B"></i>ผ่านเกณฑ์</span><span><i class="dot" style="background:#F08C2E"></i>เสนอตัวคูณ</span><span><i class="dot" style="background:#A3122A"></i>ชำรุด</span><span><i class="dot" style="background:#C3CFD1"></i>ยังไม่สอบเทียบ</span>`;
      return d;
    };
    legend.addTo(map);
    const layer = L.layerGroup().addTo(map);
    const side = view.querySelector('#mp-side');
    let fit = () => {};
    const labels = () => map.getContainer().classList.toggle('hide-labels', map.getZoom() < 12);
    map.on('zoomend', labels);
    labels();

    const select = (m) => {
      const s = M.stats(m.id);
      const r = M.result(s.last);
      const c = s.last ? C.calibrate(s.last, M.limit()) : null;
      const near = M.allMeters().filter((x) => x.id !== m.id && x.lat && x.lng).map((x) => ({ x, d: C.distanceKm(m, x) })).sort((a, b) => a.d - b.d).slice(0, 3);
      side.innerHTML = `<div style="display:flex;gap:12px;align-items:center">${C.symbol(m, { size: 44, ring: UI.ringColor(r), badge: true })}
        <div style="min-width:0"><h2 style="font-size:18px">${esc(m.place)}</h2><div class="muted" style="font-size:13.5px">กปภ.สาขา${esc(m.branch)} · ${esc(m.category)}</div></div></div>
        <div class="form-grid-2" style="font-size:14px">
          <div style="background:var(--bg);border-radius:10px;padding:10px"><div class="muted" style="font-size:12px">ยี่ห้อ / รุ่น</div><b>${esc(m.brand)} ${esc(m.model)}</b></div>
          <div style="background:var(--bg);border-radius:10px;padding:10px"><div class="muted" style="font-size:12px">ชนิด · ขนาด</div><b>${esc(C.kindCode(m.kind))} · ${esc(m.size)} มม.</b></div>
          <div style="background:var(--bg);border-radius:10px;padding:10px"><div class="muted" style="font-size:12px">สอบเทียบล่าสุด</div><b>${s.last ? C.thDate(s.last.date) : '–'}</b></div>
          <div style="background:${C.RESULT[r].bg};border-radius:10px;padding:10px"><div class="muted" style="font-size:12px">ความคลาดเคลื่อน</div><b style="color:${C.RESULT[r].color}">${c && c.valid ? C.fmtSigned(c.err, 2) + '%' : C.RESULT[r].label}</b></div>
        </div>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span class="muted">สอบเทียบมาแล้ว</span><span>${s.count} ครั้ง</span></div>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span class="muted">พิกัด</span><span class="num">${m.lat}, ${m.lng}</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${S.canEdit() ? `<a class="btn btn-primary" style="flex:1" href="#/test/new?meter=${m.id}">สอบเทียบ</a>` : ''}
          <a class="btn" style="flex:1" href="#/meter/${m.id}">ประวัติมาตร</a>
          <a class="btn btn-block" href="${UI.navUrl(m)}" target="_blank" rel="noopener">${icon('nav')}นำทางด้วย Google Maps</a>
        </div>
        <div id="mp-site" style="border-top:1px solid var(--line-2);padding-top:12px"></div>
        ${near.length ? `<div style="border-top:1px solid var(--line-2);padding-top:12px"><h3 style="margin-bottom:6px">มาตรใกล้เคียง</h3>${near.map((n) => `<a class="list-item" href="#/meter/${n.x.id}">${C.symbol(n.x, { size: 22 })}<span class="list-main"><span class="list-title">${esc(n.x.place)}</span></span><span class="muted" style="font-size:13px">${n.d < 1 ? Math.round(n.d * 1000) + ' ม.' : C.fmt(n.d, 1) + ' กม.'}</span></a>`).join('')}</div>` : ''}`;
      V.sitePhotos(side.querySelector('#mp-site'), m, { compact: true, editable: S.canEdit(), onChange: () => select(M.meter(m.id)) });
    };

    const draw = () => {
      layer.clearLayers();
      const all = M.meters().filter((m) => (!st.cat || m.category === st.cat) && (!st.res || M.latestResult(m.id) === st.res));
      const withLL = all.filter((m) => m.lat && m.lng);
      withLL.forEach((m) => {
        const r = M.latestResult(m.id);
        const label = m.place.length > 22 ? m.place.slice(0, 21) + '…' : m.place;
        const mk = L.marker([m.lat, m.lng], {
          title: m.place,
          icon: L.divIcon({ className: 'pin', html: `<div style="position:relative">${C.symbol(m, { size: 30, ring: UI.ringColor(r) })}<span class="pin-label">${esc(label)}</span></div>`, iconSize: [30, 30], iconAnchor: [15, 15] })
        });
        mk.on('click', () => select(m));
        mk.addTo(layer);
      });
      fit = () => { if (withLL.length) map.fitBounds(L.latLngBounds(withLL.map((m) => [m.lat, m.lng])).pad(0.2), { maxZoom: 15 }); };
      fit();
      view.querySelector('#mp-note').innerHTML = `แสดง ${withLL.length} จาก ${all.length} มาตร${all.length - withLL.length ? ` · <a href="#/meters?gps=no">ยังไม่มีพิกัด ${all.length - withLL.length} มาตร →</a>` : ''}`;
    };
    view.querySelectorAll('.chip[data-k]').forEach((b) => {
      b.onclick = () => {
        st[b.getAttribute('data-k')] = b.getAttribute('data-v');
        view.querySelectorAll(`.chip[data-k="${b.getAttribute('data-k')}"]`).forEach((x) => x.classList.toggle('on', x === b));
        draw();
      };
    });
    view.querySelector('#mp-me').onclick = async () => {
      try {
        const ll = await UI.getGPS();
        L.circleMarker([ll.lat, ll.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#0B4DA2', fillOpacity: 1 }).addTo(layer);
        map.setView([ll.lat, ll.lng], 14);
      } catch (e) { UI.toast(e.message, 'bad'); }
    };
    draw();
    // the container may still be 0×0 on a cold start; refit once it has a real size
    let lastW = 0;
    const ro = new ResizeObserver(() => {
      const w = map.getContainer().clientWidth;
      if (w && w !== lastW) { lastW = w; map.invalidateSize(); fit(); }
    });
    ro.observe(map.getContainer());
    App.cleanup.push(() => ro.disconnect());
  };

  // ---------- site photos: where the control cabinet and the meter sensor are ----------
  const SITE_KINDS = [
    { k: 'cabinet', label: 'รูปถ่ายบริเวณตู้ควบคุม', hint: 'เช่น ตู้อยู่หลังป้อมยาม ห่างจากมาตร 20 ม.' },
    { k: 'sensor', label: 'รูปถ่ายบริเวณหัวเซนเซอร์มาตรวัดน้ำ', hint: 'เช่น บ่อพักริมถนน ฝาเหล็กสีเขียว' }
  ];
  V.sitePhotos = function (el, m, opt) {
    if (!el) return;
    const o = opt || {};
    const photos = m.sitePhotos || [];
    const tile = (p) => `<button type="button" class="site-tile" data-pid="${esc(p.id)}" aria-label="ดูรูป ${esc(p.caption || '')}">
        <img alt="" data-src-id="${esc(p.id)}">${p.caption && !o.compact ? `<span class="site-cap">${esc(p.caption)}</span>` : ''}${!p.url && S.mode === 'remote' ? '<span class="site-wait" title="ยังไม่ได้อัปโหลด">รออัปโหลด</span>' : ''}</button>`;
    el.innerHTML = `${o.compact ? '<h3 style="margin-bottom:8px">รูปถ่ายตำแหน่งมาตร</h3>' : '<div class="card-head"><h2>รูปถ่ายตำแหน่งมาตร</h2><span class="muted" style="font-size:13px">ช่วยให้คนที่มาทีหลังหาตู้ควบคุมและหัวเซนเซอร์เจอ</span></div>'}
      ${SITE_KINDS.map((s) => {
        const list = photos.filter((p) => p.kind === s.k);
        const shown = o.compact ? list.slice(0, 3) : list;
        return `<div class="site-group"><div class="site-title">${esc(s.label)} <span class="muted">(${list.length})</span></div>
          <div class="site-grid ${o.compact ? 'compact' : ''}">${shown.map(tile).join('')}
            ${o.editable ? `<button type="button" class="site-add" data-add="${s.k}">${icon('camera', 22)}<span>เพิ่มรูป</span></button>` : ''}
            ${!list.length && !o.editable ? '<span class="muted" style="font-size:13px">ยังไม่มีรูป</span>' : ''}</div></div>`;
      }).join('')}`;
    el.querySelectorAll('img[data-src-id]').forEach(async (img) => {
      const p = photos.find((x) => x.id === img.getAttribute('data-src-id'));
      const src = p && (await S.photoSrc(p));
      if (src) img.src = src; else img.replaceWith(Object.assign(document.createElement('span'), { className: 'site-missing', textContent: 'รูปอยู่ในเครื่องอื่น' }));
    });
    el.querySelectorAll('[data-pid]').forEach((b) => {
      b.onclick = async () => {
        const p = photos.find((x) => x.id === b.getAttribute('data-pid'));
        if (!p) return;
        const kind = SITE_KINDS.find((s) => s.k === p.kind) || SITE_KINDS[0];
        const src = await S.photoSrc(p);
        const r = await UI.modal(`<h2 style="font-size:17px">${esc(kind.label)}</h2>
          ${src ? `<img src="${esc(src)}" alt="" style="width:100%;border-radius:10px;display:block;max-height:70vh;object-fit:contain;background:#000">` : '<div class="empty">ไม่พบไฟล์รูป</div>'}
          ${p.caption ? `<div style="font-size:15px">${esc(p.caption)}</div>` : ''}
          <div class="muted" style="font-size:13px">${esc(m.place)} · ${C.thDate(p.date)}${p.by ? ' · ' + esc(p.by) : ''}</div>
          <div class="modal-actions">${o.editable ? '<button class="btn btn-danger" data-close="del">ลบรูป</button>' : ''}<button class="btn btn-primary" data-close="">ปิด</button></div>`, { wide: true });
        if (r !== 'del') return;
        if (!(await UI.confirm('ลบรูปนี้?', 'รูปจะถูกลบออกจากมาตรนี้', 'ลบรูป', true))) return;
        m.sitePhotos = (m.sitePhotos || []).filter((x) => x.id !== p.id);
        await S.saveMeter(m);
        UI.toast('ลบรูปแล้ว');
        if (o.onChange) o.onChange();
      };
    });
    el.querySelectorAll('[data-add]').forEach((b) => {
      b.onclick = async () => {
        const kind = SITE_KINDS.find((s) => s.k === b.getAttribute('data-add'));
        const f = await UI.pickFile('image/*');
        if (!f) return;
        let data;
        try { data = await UI.readPhoto(f); } catch (e) { return UI.toast('อ่านรูปไม่ได้', 'bad'); }
        let caption = '';
        const ok = await UI.modal(`<h2 style="font-size:17px">${esc(kind.label)}</h2>
          <img src="${data}" alt="" style="width:100%;border-radius:10px;display:block;max-height:45vh;object-fit:contain;background:#000">
          <label class="field"><span>คำอธิบาย (ไม่บังคับ)</span><input id="sp-cap" class="input" placeholder="${esc(kind.hint)}"></label>
          <div class="modal-actions"><button class="btn" data-close="">ยกเลิก</button><button class="btn btn-primary" data-close="ok">บันทึกรูป</button></div>`,
        { onOpen: (dlg) => { dlg.querySelector('#sp-cap').oninput = (e) => { caption = e.target.value; }; } });
        if (ok !== 'ok') return;
        b.disabled = true;
        UI.toast('กำลังบันทึกรูป…');
        try {
          const saved = await S.savePhoto(data);
          m.sitePhotos = (m.sitePhotos || []).concat([{ id: saved.id, url: saved.url, kind: kind.k, caption: caption.trim(), date: C.todayISO(), by: S.session.name }]);
          await S.saveMeter(m);
          UI.toast(S.mode === 'remote' && !saved.url ? 'บันทึกรูปในเครื่องแล้ว จะอัปโหลดให้ทีมเห็นเมื่อมีสัญญาณ' : 'บันทึกรูปแล้ว', 'ok');
          if (o.onChange) o.onChange();
        } catch (e) { UI.toast(e.message, 'bad'); b.disabled = false; }
      };
    });
  };

  // ---------- 27 branches ----------
  V.branches = function (view) {
    const fy = M.fy();
    const sum = M.branchSummary(fy).filter((b) => b.total);
    view.innerHTML = `<div class="page">
      <div class="page-head"><div><div class="crumb">ปีงบประมาณ ${fy}</div><h1>ความคืบหน้ารายสาขา</h1></div>
      <div class="muted" style="font-size:14px">แตะการ์ดเพื่อเลือกสาขานั้นทั้งระบบ</div></div>
      <div class="branch-grid">${sum.map((b) => {
        const p = b.total ? Math.round(b.done / b.total * 100) : 0;
        return `<button type="button" class="branch-card" data-b="${esc(b.name)}">
          <span class="bc-top"><span>${esc(b.name)}</span><span class="num" style="color:${p === 100 ? 'var(--ok)' : 'var(--ink)'}">${p}%</span></span>
          <span class="progress" style="min-width:0"><span class="bar"><div class="${p === 100 ? 'full' : ''}" style="width:${p}%"></div></span></span>
          <span class="bc-meta"><span>มาตร <b>${b.total}</b></span><span>สอบแล้ว <b>${b.done}</b></span><span>น้ำดิบ <b>${b.raw}</b></span><span>พิกัด <b>${b.gps}</b></span></span>
          <span class="chips" style="gap:6px;min-height:22px">${b.factor ? `<span class="badge" style="background:var(--warn-bg);color:var(--warn)">ตัวคูณ ${b.factor}</span>` : ''}${b.broken ? `<span class="badge" style="background:var(--bad-bg);color:var(--bad)">ชำรุด ${b.broken}</span>` : ''}</span>
        </button>`;
      }).join('')}</div></div>`;
    view.querySelectorAll('[data-b]').forEach((b) => { b.onclick = () => { App.setBranch(b.getAttribute('data-b')); location.hash = '#/dashboard'; }; });
  };

  // ---------- equipment check list matrix ----------
  V.equipment = function (view) {
    const items = C.EQUIPMENT.flatMap((g) => g.items);
    const meters = M.meters().filter((m) => m.status !== 'retired');
    const mark = { ok: '<span style="color:var(--ok);font-weight:700">✓</span>', bad: '<span style="color:var(--bad);font-weight:700">✗</span>', na: '<span class="muted">–</span>' };
    view.innerHTML = `<div class="page">
      <div class="page-head"><div><div class="crumb">${App.branch ? 'กปภ.สาขา' + esc(App.branch) : 'ทุกสาขา'} · จากผลสอบเทียบครั้งล่าสุดของแต่ละมาตร</div><h1>Check list อุปกรณ์มาตรวัดน้ำหลัก</h1></div>
        <div class="head-actions"><button class="btn btn-excel" id="eq-x">${icon('download')}ส่งออก Excel</button></div></div>
      <section class="card">
        <div class="legend"><span>${mark.ok} ปกติ</span><span>${mark.bad} ชำรุด</span><span>${mark.na} ไม่มี / ไม่ได้ตรวจ</span></div>
        <div class="table-wrap"><table class="tbl" style="min-width:1200px;font-size:13.5px">
          <thead><tr><th>สาขา</th><th>มาตรวัดน้ำหลัก</th><th>สถานะ</th>${items.map((i) => `<th class="c" style="white-space:normal;min-width:72px">${esc(i)}</th>`).join('')}<th>ตรวจล่าสุด</th></tr></thead>
          <tbody>${meters.map((m) => {
            const t = M.latest(m.id);
            const eq = (t && t.equipment) || {};
            return `<tr class="clickable" data-href="#/meter/${m.id}"><td>${esc(m.branch)}</td><td>${esc(m.place)}</td><td>${esc((t && t.workStatus) || C.METER_STATUS[m.status])}</td>
              ${items.map((i) => `<td class="c">${eq[i] ? mark[eq[i]] : '<span class="muted">·</span>'}</td>`).join('')}<td>${t ? C.thDate(t.date) : '–'}</td></tr>`;
          }).join('')}</tbody></table></div>
      </section></div>`;
    view.querySelectorAll('tr[data-href]').forEach((tr) => { tr.onclick = () => { location.hash = tr.getAttribute('data-href'); }; });
    view.querySelector('#eq-x').onclick = () => window.Exports.equipmentExcel(meters, items);
  };
})();
