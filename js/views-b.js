/* Meter P.W.A 9 — views: calibration form, reports, users, settings, account */
(function () {
  'use strict';
  const C = window.Core;
  const S = window.Store;
  const App = window.App;
  const { M, UI, icon } = App;
  const { esc } = C;
  const V = window.Views;

  const DEVICE_KEY = 'mpw9.device';
  function lastDevice() {
    try { return JSON.parse(localStorage.getItem(DEVICE_KEY) || 'null'); } catch (e) { return null; }
  }

  // ---------- calibration form ----------
  V.testForm = function (view, id, query) {
    const existing = id ? M.test(id) : null;
    if (id && !existing) { view.innerHTML = '<div class="card empty">ไม่พบผลสอบเทียบนี้</div>'; return; }
    const readOnly = !S.canEdit();
    const draftKey = 'mpw9.draft.' + (id || 'new');
    let draft = null;
    if (!id) { try { draft = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch (e) { draft = null; } }
    if (draft && query.meter && draft.meterId !== query.meter) draft = null;

    const preMeter = M.meter((existing && existing.meterId) || (draft && draft.meterId) || query.meter || '');
    const eqDefault = {};
    C.EQUIPMENT.forEach((g) => g.items.forEach((i) => { eqDefault[i] = ''; }));
    const t = existing ? JSON.parse(JSON.stringify(existing)) : (draft || {
      meterId: preMeter ? preMeter.id : '',
      branch: preMeter ? preMeter.branch : (App.branch || ''),
      fiscalYear: M.fy(), round: '1', date: C.todayISO(), timeStart: C.nowTime(), dateEnd: C.todayISO(), timeEnd: '',
      device: lastDevice() || { brand: 'Panametrics', model: 'PT 878', sensor: '', pipeType: '', od: '', wall: '', lining: '', liningThk: '', mount: 'V', spacing: '' },
      diag: {}, velocity: '', uStart: '', uEnd: '', mStart: '', mEnd: '', oldFactor: preMeter ? (preMeter.factor || 1) : 1,
      broken: false, opinion: '', workStatus: 'ใช้งานปกติ', equipment: eqDefault, batteryPct: '', batteryLow: false,
      cleaned: false, note: '', testers: [S.session.name, ''], photos: [], gps: null
    });
    t.equipment = Object.assign({}, eqDefault, t.equipment || {});
    t.device = t.device || {};
    t.diag = t.diag || {};
    t.photos = t.photos || [];
    t.testers = t.testers || ['', ''];
    const lim = M.limit();

    const v = (x) => esc(x === null || x === undefined ? '' : x);
    const meterOpts = () => {
      const list = S.data.meters.filter((m) => m.branch === t.branch && m.status !== 'retired');
      return '<option value="">เลือกมาตรวัดน้ำ</option>' + list.map((m) => `<option value="${m.id}" ${m.id === t.meterId ? 'selected' : ''}>${esc(m.place)} (${esc(m.size || '–')} มม.)</option>`).join('');
    };
    const dis = readOnly ? 'disabled' : '';

    view.innerHTML = `<div class="page">
      <div class="crumb"><a href="#/dashboard">ภาพรวม</a> / ${existing ? 'ผลสอบเทียบ' : 'บันทึกสอบเทียบใหม่'}</div>
      <div class="page-head">
        <div><h1>${existing ? 'ผลการทดสอบมาตรวัดน้ำหลัก' : 'บันทึกสอบเทียบมาตรวัดน้ำหลัก'}</h1>
          <div class="muted" style="font-size:13.5px">${existing ? `บันทึกโดย ${esc(existing.createdByName || existing.createdBy || '')} · แก้ไขล่าสุด ${C.thDate(new Date(existing.updatedAt || existing.createdAt).toISOString())}` : 'บันทึกร่างอัตโนมัติในเครื่อง — ใช้งานได้แม้ไม่มีสัญญาณ'}</div></div>
        <div class="head-actions">
          ${existing ? `<button class="btn" id="tf-print">${icon('print')}พิมพ์ใบรายงาน</button>` : ''}
          ${existing && S.canEdit() ? `<button class="btn btn-danger" id="tf-del">${icon('trash')}ลบ</button>` : ''}
        </div>
      </div>

      <div class="test-layout">
        <div class="test-main">
          <section class="card">
            <h2><span class="step">1</span>มาตรวัดน้ำหลักที่ทดสอบ</h2>
            <div class="form-grid">
              <label class="field"><span>กปภ.สาขา</span><select id="tf-branch" ${dis}><option value="">เลือกสาขา</option>${UI.branchOptions(t.branch, false)}</select></label>
              <label class="field" style="grid-column:span 2"><span>มาตรวัดน้ำ</span><select id="tf-meter" ${dis}>${meterOpts()}</select></label>
              <label class="field"><span>ปีงบประมาณ</span><input id="tf-fy" inputmode="numeric" value="${v(t.fiscalYear)}" ${dis}></label>
              <label class="field"><span>ครั้งที่</span><select id="tf-round" ${dis}>${['1', '2', '3', '4'].map((r) => `<option ${String(t.round) === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
            </div>
            <div id="tf-meter-card"></div>
          </section>

          <section class="card">
            <h2><span class="step">2</span>Ultrasonic Flowmeter เขตฯ (U)</h2>
            <div class="form-grid">
              <label class="field"><span>ยี่ห้อ</span><input data-d="brand" value="${v(t.device.brand)}" ${dis}></label>
              <label class="field"><span>รุ่น / เครื่องที่</span><input data-d="model" value="${v(t.device.model)}" ${dis}></label>
              <label class="field"><span>เบอร์หัวเซนเซอร์</span><input data-d="sensor" value="${v(t.device.sensor)}" ${dis} placeholder="#402"></label>
              <label class="field"><span>ขนาดท่อที่วัด (มม.)</span><input data-d="pipeSize" inputmode="decimal" value="${v(t.device.pipeSize)}" ${dis}></label>
              <label class="field"><span>ชนิดท่อ</span><input data-d="pipeType" list="pipe-types" value="${v(t.device.pipeType)}" ${dis}></label>
              <label class="field"><span>Pipe O.D. (มม.)</span><input data-d="od" inputmode="decimal" value="${v(t.device.od)}" ${dis}></label>
              <label class="field"><span>ความหนาผนังท่อ (มม.)</span><input data-d="wall" inputmode="decimal" value="${v(t.device.wall)}" ${dis}></label>
              <label class="field"><span>วัสดุเคลือบท่อ</span><input data-d="lining" value="${v(t.device.lining)}" ${dis} placeholder="-"></label>
              <label class="field"><span>ความหนาวัสดุเคลือบ (มม.)</span><input data-d="liningThk" inputmode="decimal" value="${v(t.device.liningThk)}" ${dis} placeholder="-"></label>
              <label class="field"><span>รูปแบบติดตั้งหัวเซนเซอร์</span><select data-d="mount" ${dis}>${['V', 'Z', 'W', 'N'].map((x) => `<option ${t.device.mount === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
              <label class="field"><span>ระยะห่างหัวเซนเซอร์ (มม.)</span><input data-d="spacing" inputmode="decimal" value="${v(t.device.spacing)}" ${dis}></label>
              <label class="field"><span>ความเร็วน้ำ V (m/s)</span><input id="tf-vel" inputmode="decimal" value="${v(t.velocity)}" ${dis}></label>
            </div>
            <datalist id="pipe-types"><option value="GS"><option value="DI"><option value="CI"><option value="Steel"><option value="PVC"><option value="HDPE"><option value="AC"></datalist>
            <details class="more"><summary>ค่า Diagnostic ของเครื่องอัลตร้าโซนิคโฟลว์มิเตอร์</summary>
              <div class="form-grid" style="padding-top:8px">
                ${[['soundspeed', 'Soundspeed'], ['sigUp', 'Signal Strength UP'], ['sigDown', 'Signal Strength DOWN'], ['qUp', 'Q UP'], ['qDown', 'Q DOWN'], ['ampUp', 'Amp UP'], ['ampDown', 'Amp DOWN']]
                  .map(([k, l]) => `<label class="field"><span>${l}</span><input data-g="${k}" inputmode="decimal" value="${v(t.diag[k])}" ${dis}></label>`).join('')}
              </div>
            </details>
          </section>

          <section class="card">
            <h2><span class="step">3</span>อ่านค่าปริมาณน้ำสะสม (m³)</h2>
            <label class="check"><input type="checkbox" id="tf-broken" ${t.broken ? 'checked' : ''} ${dis}>มาตรชำรุด / ทดสอบไม่ได้ (บันทึกเป็น "มาตรชำรุด" ในรายงาน)</label>
            <div id="tf-readings" class="${t.broken ? 'hidden' : ''}" style="display:flex;flex-direction:column;gap:14px">
              <div class="form-grid">
                <label class="field"><span>วันที่เริ่มทดสอบ</span><input type="date" id="tf-date" value="${v(t.date)}" ${dis}></label>
                <label class="field"><span>เวลาเริ่ม</span><input type="time" id="tf-ts" value="${v(t.timeStart)}" ${dis}></label>
                <label class="field"><span>วันที่ตัดยอด</span><input type="date" id="tf-date2" value="${v(t.dateEnd)}" ${dis}></label>
                <label class="field"><span>เวลาตัดยอด</span><div style="display:flex;gap:6px"><input type="time" id="tf-te" value="${v(t.timeEnd)}" ${dis} class="input"><button type="button" class="btn btn-sm" id="tf-now" ${dis}>ตอนนี้</button></div></label>
              </div>
              <div class="reading-grid">
                <span></span><span class="rh">ค่าเริ่มต้น</span><span class="rh">ค่าตัดยอด</span>
                <span class="rl">U<small>Ultrasonic</small></span>
                <input class="input big-input" data-r="uStart" inputmode="decimal" aria-label="U ค่าเริ่มต้น" value="${v(t.uStart)}" ${dis}>
                <input class="input big-input" data-r="uEnd" inputmode="decimal" aria-label="U ค่าตัดยอด" value="${v(t.uEnd)}" ${dis}>
                <span class="rl">M<small>Master Meter</small></span>
                <input class="input big-input" data-r="mStart" inputmode="decimal" aria-label="M ค่าเริ่มต้น" value="${v(t.mStart)}" ${dis}>
                <input class="input big-input" data-r="mEnd" inputmode="decimal" aria-label="M ค่าตัดยอด" value="${v(t.mEnd)}" ${dis}>
              </div>
              <label class="field" style="max-width:260px"><span>ค่าตัวคูณเดิม</span><input class="input big-input" data-r="oldFactor" inputmode="decimal" value="${v(t.oldFactor)}" ${dis}></label>
            </div>
          </section>

          <section class="card">
            <h2><span class="step">4</span>Check list อุปกรณ์</h2>
            <div class="form-grid">
              <label class="field"><span>สถานะการทำงาน</span><select id="tf-ws" ${dis}>${Object.values(C.METER_STATUS).map((x) => `<option ${t.workStatus === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
              <label class="field"><span>Battery MAG 8000 (%)</span><input id="tf-bat" inputmode="numeric" value="${v(t.batteryPct)}" ${dis} placeholder="เฉพาะ MAG 8000"></label>
            </div>
            <div>${C.EQUIPMENT.map((g) => `<div class="equip-group">${esc(g.group)}</div>` + g.items.map((i) => `
              <div class="equip-row"><span>${esc(i)}</span>
                <div class="seg" role="group" aria-label="${esc(i)}">${Object.keys(C.EQUIP_STATE).map((k) => `<button type="button" data-eq="${esc(i)}" data-v="${k}" class="${t.equipment[i] === k ? 'on-' + k : ''}" ${dis}>${C.EQUIP_STATE[k]}</button>`).join('')}</div>
              </div>`).join('')).join('')}</div>
            <label class="check" style="border-top:1px solid var(--line-2)"><input type="checkbox" id="tf-clean" ${t.cleaned ? 'checked' : ''} ${dis}>ล้างมาตร / ทำความสะอาดเซนเซอร์ในครั้งนี้</label>
            <label class="field"><span>หมายเหตุ</span><textarea id="tf-note" ${dis} placeholder="เช่น แบตเตอรี่เหลือน้อย, ท่อรั่วซึมบริเวณหน้าแปลน">${v(t.note)}</textarea></label>
          </section>

          <section class="card">
            <h2><span class="step">5</span>รูปถ่าย พิกัด และผู้ทดสอบ</h2>
            <div class="photos" id="tf-photos"></div>
            <div class="form-grid">
              <div class="field"><span>พิกัดจุดทดสอบ</span>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button type="button" class="btn" id="tf-gps" ${dis}>${icon('gps')}บันทึกพิกัดจาก GPS</button><span class="num" id="tf-gps-txt" style="color:var(--ink)">${t.gps ? `${t.gps.lat}, ${t.gps.lng}` : ''}</span></div></div>
              <label class="field"><span>ผู้ทดสอบ 1</span><input data-tt="0" value="${v(t.testers[0])}" ${dis}></label>
              <label class="field"><span>ผู้ทดสอบ 2</span><input data-tt="1" value="${v(t.testers[1])}" ${dis}></label>
            </div>
          </section>
        </div>

        <aside class="test-side">
          <section class="result-card" id="tf-result" aria-live="polite"></section>
          <section class="card" id="tf-opinion-card">
            <h2>ความเห็น</h2>
            <div id="tf-opinions"></div>
            <div id="tf-apply"></div>
          </section>
          ${readOnly ? '' : `<div class="sticky-actions"><button type="button" class="btn" id="tf-draft">บันทึกร่าง</button><button type="button" class="btn btn-primary btn-lg" style="flex:1" id="tf-save">${icon('ok', 20, '#fff')}บันทึกผล</button></div>`}
        </aside>
      </div></div>`;

    const $ = (s) => view.querySelector(s);

    const meterCard = () => {
      const m = M.meter(t.meterId);
      if (!m) { $('#tf-meter-card').innerHTML = ''; return; }
      const st = M.stats(m.id);
      $('#tf-meter-card').innerHTML = `<div style="display:flex;gap:14px;align-items:center;padding:12px;border-radius:10px;background:var(--bg)">
        ${C.symbol(m, { size: 40, badge: true })}
        <div style="flex:1;min-width:0"><b>${esc(m.place)}</b><div class="muted" style="font-size:13px">${esc(m.category)} · ${esc(m.brand)} ${esc(m.model)} · ${esc(m.kind)} · ${esc(m.size)} มม.</div>
        <div class="muted" style="font-size:13px">สอบเทียบมาแล้ว ${st.count} ครั้ง · ตัวคูณปัจจุบัน ${C.fmt(Number(m.factor) || 1, 4)}${st.last ? ' · ล่าสุด ' + C.thDate(st.last.date) : ''}</div></div>
        <a class="btn btn-sm" href="#/meter/${m.id}">ประวัติ</a></div>`;
    };

    const autoOpinion = () => {
      const c = C.calibrate(t, lim);
      return !c.valid ? '' : c.over ? 'new' : 'none';
    };

    const renderResult = () => {
      const c = C.calibrate(t, lim);
      const r = t.broken ? 'broken' : C.resultOf(Object.assign({}, t, { opinion: t.opinion || autoOpinion() }), lim);
      const box = $('#tf-result');
      box.setAttribute('data-r', r);
      if (t.broken) {
        box.innerHTML = `<h2 style="margin:0;font-size:18px">ผลการทดสอบ</h2><div class="result-big" style="color:var(--bad)">มาตรชำรุด</div><div class="verdict" style="color:var(--bad)">ทดสอบไม่ได้ — จะแสดงเป็น "มาตรชำรุด" ในตารางสรุป</div>`;
      } else {
        const color = !c.valid ? 'var(--muted)' : c.over ? 'var(--warn)' : 'var(--ok)';
        box.innerHTML = `<h2 style="margin:0;font-size:18px">ผลคำนวณอัตโนมัติ</h2>
          <div class="vol-grid"><div>U (m³)<b>${C.fmt(c.U, 2)}</b></div><div>M (m³)<b>${C.fmt(c.M, 2)}</b></div><div>M* = M × ${C.fmt(c.k0, 4)}<b>${C.fmt(c.Ms, 2)}</b></div></div>
          <div class="result-row" style="border-top:1px solid rgba(0,0,0,.08);padding-top:12px"><span>ความคลาดเคลื่อนครั้งนี้<br><span class="muted">((M* − U) / U) × 100</span></span><span class="result-big" style="color:${color}">${c.valid ? C.fmtSigned(c.err, 2) + '%' : '–'}</span></div>
          ${c.valid && c.k0 !== 1 ? `<div class="result-row"><span class="muted">คลาดเคลื่อนก่อนคูณตัวคูณเดิม</span><b class="num">${C.fmtSigned(c.errRaw, 2)}%</b></div>` : ''}
          <div class="result-row"><span>ตัวคูณครั้งนี้<br><span class="muted">((U − M) / M) + 1</span></span><b class="num" style="font-size:24px">${C.fmt(c.k1, 4)}</b></div>
          <div class="verdict" style="color:${color}">${!c.valid ? 'กรอกค่าเริ่มต้นและค่าตัดยอดของ U และ M' : c.over ? `เกินเกณฑ์ ±${lim}% · เสนอให้ใช้ตัวคูณ` : `อยู่ในเกณฑ์ ±${lim}% · ใช้งานได้ตามปกติ`}</div>`;
      }
      renderOpinions();
    };

    const renderOpinions = () => {
      const c = C.calibrate(t, lim);
      const card = $('#tf-opinion-card');
      card.classList.toggle('hidden', !!t.broken);
      const op = t.opinion || autoOpinion();
      const labels = { none: C.OPINIONS.none, new: `${C.OPINIONS.new} (${C.fmt(c.k1, 4)})`, old: `${C.OPINIONS.old} (${C.fmt(c.k0, 4)})` };
      $('#tf-opinions').innerHTML = Object.keys(labels).map((k) => `<label class="check"><input type="radio" name="op" value="${k}" ${op === k ? 'checked' : ''} ${dis}>${esc(labels[k])}</label>`).join('') +
        (!t.opinion && op ? '<div class="muted" style="font-size:12.5px">เลือกให้อัตโนมัติตามเกณฑ์ — เปลี่ยนได้</div>' : '');
      $('#tf-opinions').querySelectorAll('input[name=op]').forEach((r) => { r.onchange = () => { t.opinion = r.value; saveDraft(); renderResult(); }; });
      const m = M.meter(t.meterId);
      const apply = $('#tf-apply');
      if (readOnly || !m) { apply.innerHTML = ''; return; }
      apply.innerHTML = `${op === 'new' && c.valid ? `<label class="check"><input type="checkbox" id="tf-apply-k">ปรับค่าตัวคูณปัจจุบันของมาตรเป็น ${C.fmt(c.k1, 4)}</label>` : ''}
        ${t.gps && !(m.lat && m.lng) ? `<label class="check"><input type="checkbox" id="tf-apply-ll" checked>บันทึกพิกัดนี้เป็นตำแหน่งของมาตร</label>` : ''}`;
    };

    const renderPhotos = async () => {
      const box = $('#tf-photos');
      const items = await Promise.all(t.photos.map(async (p, i) => `<div class="photo"><img alt="${esc(p.label || 'รูปถ่าย')}" src="${esc(await S.photoSrc(p))}">${readOnly ? '' : `<button type="button" data-rm="${i}" aria-label="ลบรูป">×</button>`}</div>`));
      box.innerHTML = items.join('') + (readOnly ? '' : `<button type="button" class="photo-add" id="tf-add-photo">${icon('camera', 24)}<span>ถ่ายรูป / เลือกรูป</span></button>`);
      box.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { t.photos.splice(+b.getAttribute('data-rm'), 1); saveDraft(); renderPhotos(); }; });
      const add = $('#tf-add-photo');
      if (add) add.onclick = async () => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
        inp.setAttribute('capture', 'environment');
        inp.onchange = async () => {
          const f = inp.files[0];
          if (!f) return;
          try {
            const data = await UI.readPhoto(f);
            const p = await S.savePhoto(data);
            t.photos.push(Object.assign(p, { label: 'หน้าปัดมาตร' }));
            saveDraft();
            renderPhotos();
          } catch (e) { UI.toast('อ่านรูปไม่ได้', 'bad'); }
        };
        inp.click();
      };
    };

    let draftTimer = null;
    const saveDraft = () => {
      if (existing || readOnly) return;
      clearTimeout(draftTimer);
      draftTimer = setTimeout(() => { try { localStorage.setItem(draftKey, JSON.stringify(t)); } catch (e) { /* storage full */ } }, 300);
    };

    // ---- wiring ----
    meterCard();
    renderResult();
    renderPhotos();
    if (readOnly) return;

    $('#tf-branch').onchange = (e) => { t.branch = e.target.value; t.meterId = ''; $('#tf-meter').innerHTML = meterOpts(); meterCard(); saveDraft(); };
    $('#tf-meter').onchange = (e) => {
      t.meterId = e.target.value;
      const m = M.meter(t.meterId);
      if (m) { t.oldFactor = m.factor || 1; view.querySelector('[data-r=oldFactor]').value = t.oldFactor; }
      meterCard(); renderResult(); saveDraft();
    };
    $('#tf-fy').oninput = (e) => { t.fiscalYear = e.target.value; saveDraft(); };
    $('#tf-round').onchange = (e) => { t.round = e.target.value; saveDraft(); };
    $('#tf-date').oninput = (e) => { t.date = e.target.value; t.fiscalYear = C.fiscalYear(e.target.value); $('#tf-fy').value = t.fiscalYear; saveDraft(); };
    $('#tf-ts').oninput = (e) => { t.timeStart = e.target.value; saveDraft(); };
    $('#tf-date2').oninput = (e) => { t.dateEnd = e.target.value; saveDraft(); };
    $('#tf-te').oninput = (e) => { t.timeEnd = e.target.value; saveDraft(); };
    $('#tf-now').onclick = () => { t.timeEnd = C.nowTime(); t.dateEnd = C.todayISO(); $('#tf-te').value = t.timeEnd; $('#tf-date2').value = t.dateEnd; saveDraft(); };
    $('#tf-vel').oninput = (e) => { t.velocity = e.target.value; saveDraft(); };
    view.querySelectorAll('[data-d]').forEach((i) => { i.oninput = i.onchange = () => { t.device[i.getAttribute('data-d')] = i.value; saveDraft(); }; });
    view.querySelectorAll('[data-g]').forEach((i) => { i.oninput = () => { t.diag[i.getAttribute('data-g')] = i.value; saveDraft(); }; });
    view.querySelectorAll('[data-r]').forEach((i) => {
      i.oninput = () => {
        t[i.getAttribute('data-r')] = i.value;
        if (t.opinion && t.opinion === 'none' && C.calibrate(t, lim).over) t.opinion = '';
        renderResult(); saveDraft();
      };
    });
    view.querySelectorAll('[data-tt]').forEach((i) => { i.oninput = () => { t.testers[+i.getAttribute('data-tt')] = i.value; saveDraft(); }; });
    $('#tf-broken').onchange = (e) => { t.broken = e.target.checked; $('#tf-readings').classList.toggle('hidden', t.broken); renderResult(); saveDraft(); };
    $('#tf-ws').onchange = (e) => { t.workStatus = e.target.value; saveDraft(); };
    $('#tf-bat').oninput = (e) => { t.batteryPct = e.target.value; t.batteryLow = e.target.value !== '' && Number(e.target.value) <= 30; saveDraft(); };
    $('#tf-clean').onchange = (e) => { t.cleaned = e.target.checked; saveDraft(); };
    $('#tf-note').oninput = (e) => { t.note = e.target.value; saveDraft(); };
    view.querySelectorAll('[data-eq]').forEach((b) => {
      b.onclick = () => {
        const item = b.getAttribute('data-eq');
        const val = b.getAttribute('data-v');
        t.equipment[item] = t.equipment[item] === val ? '' : val;
        b.parentElement.querySelectorAll('button').forEach((x) => { x.className = t.equipment[item] === x.getAttribute('data-v') ? 'on-' + x.getAttribute('data-v') : ''; });
        saveDraft();
      };
    });
    $('#tf-gps').onclick = async () => {
      const b = $('#tf-gps');
      b.disabled = true;
      try {
        const ll = await UI.getGPS();
        t.gps = { lat: ll.lat, lng: ll.lng };
        $('#tf-gps-txt').textContent = `${ll.lat}, ${ll.lng} (±${ll.acc} ม.)`;
        renderOpinions(); saveDraft();
      } catch (e) { UI.toast(e.message, 'bad'); }
      b.disabled = false;
    };

    $('#tf-draft').onclick = () => { try { localStorage.setItem(draftKey, JSON.stringify(t)); UI.toast('บันทึกร่างไว้ในเครื่องแล้ว', 'ok'); } catch (e) { UI.toast('บันทึกร่างไม่ได้', 'bad'); } };
    $('#tf-save').onclick = async () => {
      const m = M.meter(t.meterId);
      if (!m) return UI.toast('กรุณาเลือกมาตรวัดน้ำ', 'bad');
      const c = C.calibrate(t, lim);
      if (!t.broken && !c.valid) return UI.toast('ค่าปริมาณน้ำไม่ครบหรือไม่ถูกต้อง (ค่าตัดยอดต้องมากกว่าค่าเริ่มต้น)', 'bad');
      if (!t.date) return UI.toast('กรุณาระบุวันที่ทดสอบ', 'bad');
      t.opinion = t.broken ? '' : (t.opinion || autoOpinion());
      t.place = m.place; t.branch = m.branch;
      // keep the computed results on the record so Sheets/Excel readers see them directly
      Object.assign(t, t.broken ? { U: '', M: '', errPct: '', newFactor: '' } : { U: +c.U.toFixed(4), M: +c.M.toFixed(4), errPct: +c.err.toFixed(2), newFactor: +c.k1.toFixed(4) });
      t.result = C.resultOf(t, lim);
      const applyK = view.querySelector('#tf-apply-k');
      const applyLL = view.querySelector('#tf-apply-ll');
      try {
        await S.saveTest(t);
        let changed = false;
        if (applyK && applyK.checked) { m.factor = +c.k1.toFixed(4); changed = true; }
        if (applyLL && applyLL.checked && t.gps) { m.lat = t.gps.lat; m.lng = t.gps.lng; changed = true; }
        if (t.cleaned && !existing) { m.maint = (m.maint || []).concat([{ date: t.date, text: 'ล้างมาตร / ทำความสะอาดเซนเซอร์ (ระหว่างสอบเทียบ)', by: S.session.name }]); changed = true; }
        if (t.workStatus && t.workStatus !== C.METER_STATUS[m.status]) {
          const k = Object.keys(C.METER_STATUS).find((x) => C.METER_STATUS[x] === t.workStatus);
          if (k) { m.status = k; changed = true; }
        }
        if (changed) await S.saveMeter(m);
        try { localStorage.setItem(DEVICE_KEY, JSON.stringify(t.device)); localStorage.removeItem(draftKey); } catch (e) { /* ignore */ }
        UI.toast(S.mode === 'remote' && !navigator.onLine ? 'บันทึกในเครื่องแล้ว จะซิงก์เมื่อมีสัญญาณ' : 'บันทึกผลสอบเทียบเรียบร้อย', 'ok');
        location.hash = '#/test/' + t.id;
        if (existing) App.route();
      } catch (e) { UI.toast(e.message, 'bad'); }
    };
    const del = $('#tf-del');
    if (del) del.onclick = async () => {
      if (!(await UI.confirm('ลบผลสอบเทียบนี้?', 'ผลการทดสอบครั้งนี้จะถูกลบถาวร', 'ลบ', true))) return;
      await S.deleteTest(existing.id);
      UI.toast('ลบแล้ว');
      location.hash = '#/meter/' + existing.meterId;
    };
    const pr = $('#tf-print');
    if (pr) pr.onclick = () => window.Exports.printTest(existing);
  };
  // print button for read-only viewers too
  const origTestForm = V.testForm;
  V.testForm = function (view, id, query) {
    origTestForm(view, id, query);
    const pr = view.querySelector('#tf-print');
    if (pr && !pr.onclick) pr.onclick = () => window.Exports.printTest(M.test(id));
  };

  // ---------- reports ----------
  V.reports = function (view, query) {
    const st = App.reportFilter = Object.assign({ fy: String(M.fy()), round: '', status: '', cat: '', tab: 'table' }, App.reportFilter || {}, query.status ? { status: query.status } : {});
    const memo = App.memo = App.memo || { no: '', date: C.todayISO(), period: '', effective: '' };
    const years = Array.from(new Set([M.fy(), M.fy() - 1, M.fy() - 2].concat(S.data.tests.map((t) => Number(t.fiscalYear))).filter(Boolean))).sort((a, b) => b - a);

    const rowsFor = () => {
      // latest test per meter inside the chosen fiscal year / round
      const byMeter = new Map();
      M.tests().filter((t) => String(t.fiscalYear) === String(st.fy) && (!st.round || String(t.round) === st.round)).forEach((t) => {
        if (!byMeter.has(t.meterId)) byMeter.set(t.meterId, t);
      });
      return Array.from(byMeter.values()).map((t) => {
        const m = M.meter(t.meterId) || { place: t.place, branch: t.branch, brand: '', model: '', kind: '', size: '', category: '' };
        const c = C.calibrate(t, M.limit());
        const r = M.result(t);
        const k = r === 'factor' ? (t.opinion === 'old' ? c.k0 : c.k1) : null;
        return { t, m, c, r, k };
      }).filter((x) => (!st.status || x.r === st.status) && (!st.cat || x.m.category === st.cat))
        .sort((a, b) => a.m.branch.localeCompare(b.m.branch, 'th') || a.m.place.localeCompare(b.m.place, 'th'));
    };

    const draw = () => {
      const rows = rowsFor();
      App.reportRows = rows;
      const branchName = App.branch || '';
      const counts = { pass: 0, factor: 0, broken: 0 };
      rows.forEach((x) => { counts[x.r] = (counts[x.r] || 0) + 1; });
      view.querySelector('#rp-sum').innerHTML = `พบ <b>${rows.length}</b> รายการ · ผ่าน ${counts.pass} · ตัวคูณ ${counts.factor} · ชำรุด ${counts.broken}`;
      view.querySelectorAll('.doc-tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === st.tab)));
      const stage = view.querySelector('#rp-stage');
      if (st.tab === 'table') stage.innerHTML = window.Exports.summaryHTML(rows, { fy: st.fy, round: st.round, branch: branchName });
      else if (st.tab === 'memo') {
        stage.innerHTML = window.Exports.memoHTML(rows, { fy: st.fy, round: st.round, branch: branchName, memo, editable: true });
        stage.querySelectorAll('[data-memo]').forEach((el) => { el.oninput = () => { memo[el.getAttribute('data-memo')] = el.textContent; }; });
      } else {
        stage.innerHTML = `<div class="card" style="max-width:none"><div class="table-wrap"><table class="tbl" style="min-width:1000px">
          <thead><tr><th>วันที่</th><th>สาขา</th><th>มาตร</th><th class="r">U (m³)</th><th class="r">M (m³)</th><th class="r">ตัวคูณเดิม</th><th class="r">คลาดเคลื่อน</th><th class="r">ตัวคูณครั้งนี้</th><th>ผล</th><th>ผู้บันทึก</th></tr></thead>
          <tbody>${rows.map((x) => `<tr class="clickable" data-href="#/test/${x.t.id}"><td>${C.thDate(x.t.date)}</td><td>${esc(x.m.branch)}</td><td>${esc(x.m.place)}</td>
            <td class="r num">${x.t.broken ? '–' : C.fmt(x.c.U, 2)}</td><td class="r num">${x.t.broken ? '–' : C.fmt(x.c.M, 2)}</td><td class="r num">${C.fmt(x.c.k0, 4)}</td>
            <td class="r num" style="font-weight:700;color:${C.RESULT[x.r].color}">${x.t.broken ? '–' : C.fmtSigned(x.c.err, 2) + '%'}</td><td class="r num">${x.t.broken ? '–' : C.fmt(x.c.k1, 4)}</td>
            <td>${UI.resultBadge(x.r)}</td><td>${esc(x.t.createdByName || '')}</td></tr>`).join('') || '<tr><td colspan="10" class="empty">ไม่มีข้อมูลตามเงื่อนไข</td></tr>'}</tbody></table></div></div>`;
        stage.querySelectorAll('tr[data-href]').forEach((tr) => { tr.onclick = () => { location.hash = tr.getAttribute('data-href'); }; });
      }
    };

    const chip = (key, val, label) => `<button type="button" class="chip ${st[key] === val ? 'on' : ''}" data-k="${key}" data-v="${val}">${label}</button>`;
    view.innerHTML = `<div class="page">
      <div class="page-head">
        <div><div class="crumb"><a href="#/dashboard">ภาพรวม</a> / รายงาน</div><h1>รายงานผลการตรวจสอบมาตรวัดน้ำหลัก</h1></div>
        <div class="head-actions">
          <button class="btn btn-excel" id="rp-xlsx">${icon('download')}Excel</button>
          <button class="btn btn-pdf" id="rp-pdf">${icon('print')}PDF / พิมพ์</button>
          <button class="btn btn-primary" id="rp-word">${icon('word', 18, '#fff')}Word บันทึกข้อความ</button>
        </div>
      </div>
      <section class="card filters">
        <div class="form-grid">
          <label class="field"><span>กปภ.สาขา</span><select id="rp-branch">${UI.branchOptions(App.branch, true)}</select></label>
          <label class="field"><span>ปีงบประมาณ</span><select id="rp-fy">${years.map((y) => `<option ${String(y) === st.fy ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
          <label class="field"><span>ครั้งที่</span><select id="rp-round"><option value="">ทุกครั้ง</option>${['1', '2', '3', '4'].map((r) => `<option ${st.round === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
        </div>
        <div class="chips">${chip('status', '', 'ทุกผล')}${chip('status', 'pass', 'ผ่านเกณฑ์')}${chip('status', 'factor', 'เสนอตัวคูณ')}${chip('status', 'broken', 'มาตรชำรุด')}
          <span style="width:1px;background:var(--line);margin:0 4px"></span>${chip('cat', '', 'ทุกประเภท')}${chip('cat', 'มาตรน้ำจ่าย', 'น้ำจ่าย')}${chip('cat', 'มาตรน้ำดิบ', 'น้ำดิบ')}</div>
        <div class="muted" id="rp-sum" style="font-size:14px"></div>
      </section>
      <div class="doc-tabs" role="tablist">
        <button type="button" role="tab" data-tab="table">ตารางสรุปผลการตรวจสอบ</button>
        <button type="button" role="tab" data-tab="memo">บันทึกข้อความรายงานสาขา</button>
        <button type="button" role="tab" data-tab="data">ข้อมูลการคำนวณ</button>
      </div>
      <div id="rp-stage"></div>
    </div>`;
    view.querySelector('#rp-branch').onchange = (e) => { App.branch = e.target.value; try { localStorage.setItem('mpw9.branch', App.branch); } catch (x) { /* ignore */ } App.renderTop(); draw(); };
    view.querySelector('#rp-fy').onchange = (e) => { st.fy = e.target.value; draw(); };
    view.querySelector('#rp-round').onchange = (e) => { st.round = e.target.value; draw(); };
    view.querySelectorAll('.chip[data-k]').forEach((b) => {
      b.onclick = () => {
        st[b.getAttribute('data-k')] = b.getAttribute('data-v');
        view.querySelectorAll(`.chip[data-k="${b.getAttribute('data-k')}"]`).forEach((x) => x.classList.toggle('on', x === b));
        draw();
      };
    });
    view.querySelectorAll('.doc-tabs button').forEach((b) => { b.onclick = () => { st.tab = b.getAttribute('data-tab'); draw(); }; });
    const opts = () => ({ fy: st.fy, round: st.round, branch: App.branch || '', memo });
    view.querySelector('#rp-xlsx').onclick = () => window.Exports.summaryExcel(App.reportRows, opts());
    view.querySelector('#rp-pdf').onclick = () => {
      if (st.tab === 'data') { st.tab = 'table'; draw(); }
      window.Exports.printStage(view.querySelector('#rp-stage'), st.tab === 'table');
    };
    view.querySelector('#rp-word').onclick = () => window.Exports.memoWord(App.reportRows, opts());
    draw();
  };

  // ---------- users (admin) ----------
  V.users = function (view) {
    const roles = { admin: 'ผู้ดูแลระบบ', staff: 'เจ้าหน้าที่ (บันทึก/แก้ไข)', viewer: 'ผู้ดูข้อมูล' };
    const draw = () => {
      const list = S.data.users.slice().sort((a, b) => String(a.empId).localeCompare(String(b.empId)));
      view.innerHTML = `<div class="page" style="max-width:1000px">
        <div class="page-head"><div><div class="crumb">ผู้ดูแลระบบ</div><h1>จัดการผู้ใช้งาน</h1></div>
          <div class="head-actions">${S.mode === 'remote' ? `<button class="btn" id="u-refresh">${icon('sync')}โหลดใหม่</button>` : ''}<button class="btn btn-primary" id="u-add">${icon('plus', 18, '#fff')}เพิ่มผู้ใช้งาน</button></div></div>
        ${S.mode === 'local' ? `<div class="alert alert-warn">${icon('warn', 20, 'var(--warn)')}<div><b>โหมดเก็บในเครื่อง</b><br>บัญชีผู้ใช้ใช้ได้เฉพาะในเบราว์เซอร์นี้ หากต้องการให้ทุกคนเข้าจากมือถือของตัวเอง ให้เชื่อมฐานข้อมูลกลางที่ <a href="#/settings">ตั้งค่าระบบ</a></div></div>` : ''}
        <section class="card"><div class="table-wrap"><table class="tbl" style="min-width:720px">
          <thead><tr><th>รหัสพนักงาน</th><th>ชื่อ-สกุล</th><th>สิทธิ์</th><th>สาขาเริ่มต้น</th><th>สถานะ</th><th class="r">จัดการ</th></tr></thead>
          <tbody>${list.map((u) => `<tr><td class="num"><b>${esc(u.empId)}</b></td><td>${esc(u.name)}</td><td>${esc(roles[u.role] || u.role)}</td><td>${esc(u.branch || 'ทุกสาขา')}</td>
            <td>${u.active === false || u.active === 'FALSE' ? '<span class="badge" style="background:var(--bad-bg);color:var(--bad)">ปิดใช้งาน</span>' : '<span class="badge" style="background:var(--ok-bg);color:var(--ok)">ใช้งาน</span>'}</td>
            <td class="r"><button class="btn btn-sm" data-edit="${esc(u.empId)}">${icon('edit', 16)}แก้ไข</button> ${u.empId !== S.session.empId ? `<button class="btn btn-sm btn-danger" data-del="${esc(u.empId)}" aria-label="ลบ ${esc(u.name)}">${icon('trash', 16)}</button>` : ''}</td></tr>`).join('')}</tbody>
        </table></div></section>
        <div class="muted" style="font-size:13.5px">ผู้ใช้เข้าสู่ระบบด้วยรหัสพนักงานและรหัสผ่านอย่างน้อย 8 ตัวอักษร ผู้ใช้เปลี่ยนรหัสผ่านเองได้ที่เมนูบัญชีผู้ใช้</div>
      </div>`;
      view.querySelector('#u-add').onclick = () => edit(null);
      const rf = view.querySelector('#u-refresh');
      if (rf) rf.onclick = async () => { await S.pullUsers(); draw(); };
      view.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => edit(S.data.users.find((u) => u.empId === b.getAttribute('data-edit'))); });
      view.querySelectorAll('[data-del]').forEach((b) => {
        b.onclick = async () => {
          const u = S.data.users.find((x) => x.empId === b.getAttribute('data-del'));
          if (!(await UI.confirm('ลบผู้ใช้งาน?', `${u.name} (${u.empId}) จะเข้าสู่ระบบไม่ได้อีก`, 'ลบผู้ใช้', true))) return;
          try { await S.deleteUser(u.empId); UI.toast('ลบผู้ใช้แล้ว'); draw(); } catch (e) { UI.toast(e.message, 'bad'); }
        };
      });
    };
    const edit = async (u) => {
      const isNew = !u;
      u = u || { empId: '', name: '', role: 'staff', branch: '', active: true };
      const f = Object.assign({}, u, { password: '' });
      const res = await UI.modal(`<h2>${isNew ? 'เพิ่มผู้ใช้งาน' : 'แก้ไขผู้ใช้งาน'}</h2>
        <div id="ue-err" class="form-error hidden"></div>
        <div class="form-grid-2">
          <label class="field"><span>รหัสพนักงาน</span><input id="ue-emp" class="input" inputmode="numeric" value="${esc(f.empId)}" ${isNew ? '' : 'readonly'}></label>
          <label class="field"><span>ชื่อ-สกุล</span><input id="ue-name" class="input" value="${esc(f.name)}"></label>
          <label class="field"><span>สิทธิ์</span><select id="ue-role" class="input">${Object.keys(roles).map((k) => `<option value="${k}" ${f.role === k ? 'selected' : ''}>${roles[k]}</option>`).join('')}</select></label>
          <label class="field"><span>สาขาเริ่มต้น</span><select id="ue-branch" class="input">${UI.branchOptions(f.branch, true)}</select></label>
          <label class="field span-all"><span>${isNew ? 'รหัสผ่าน (อย่างน้อย 8 ตัว)' : 'ตั้งรหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)'}</span><input id="ue-pw" class="input" type="text" autocomplete="off" placeholder="${isNew ? '' : '••••••••'}"></label>
          ${isNew ? '' : `<label class="check span-all"><input type="checkbox" id="ue-active" ${f.active === false || f.active === 'FALSE' ? '' : 'checked'}>เปิดใช้งานบัญชี</label>`}
        </div>
        <div class="modal-actions"><button class="btn" data-close="">ยกเลิก</button><button class="btn btn-primary" id="ue-save">บันทึก</button></div>`, {
        onOpen: (el, close) => {
          el.querySelector('#ue-save').onclick = async () => {
            const err = el.querySelector('#ue-err');
            const rec = {
              empId: el.querySelector('#ue-emp').value.trim(), name: el.querySelector('#ue-name').value.trim(),
              role: el.querySelector('#ue-role').value, branch: el.querySelector('#ue-branch').value,
              active: isNew ? true : el.querySelector('#ue-active').checked
            };
            const pw = el.querySelector('#ue-pw').value;
            const fail = (m) => { err.textContent = m; err.classList.remove('hidden'); };
            if (!/^\d{3,10}$/.test(rec.empId)) return fail('รหัสพนักงานต้องเป็นตัวเลข');
            if (isNew && S.data.users.some((x) => x.empId === rec.empId)) return fail('มีรหัสพนักงานนี้แล้ว');
            if (!rec.name) return fail('กรุณากรอกชื่อ-สกุล');
            if ((isNew || pw) && pw.length < 8) return fail('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
            if (rec.empId === S.session.empId && rec.role !== 'admin') return fail('ไม่สามารถลดสิทธิ์ผู้ดูแลของตัวเองได้');
            try { await S.saveUser(rec, pw || null); close('ok'); } catch (e) { fail(e.message); }
          };
        }
      });
      if (res === 'ok') { UI.toast('บันทึกผู้ใช้งานแล้ว', 'ok'); draw(); }
    };
    draw();
    if (S.mode === 'remote') S.pullUsers().then(draw).catch(() => {});
  };

  // ---------- settings (admin) ----------
  V.settings = function (view) {
    const s = S.data.settings;
    view.innerHTML = `<div class="page" style="max-width:960px">
      <div class="page-head"><div><div class="crumb">ผู้ดูแลระบบ</div><h1>ตั้งค่าระบบ</h1></div></div>

      <section class="card">
        <h2>เกณฑ์และการแจ้งเตือน</h2>
        <div class="form-grid">
          <label class="field"><span>เกณฑ์ความคลาดเคลื่อนที่ยอมรับ (± %)</span><input id="st-limit" class="input" inputmode="decimal" value="${esc(s.limit)}"><span class="hint">เกินเกณฑ์นี้ระบบจะเสนอให้ใช้ตัวคูณ</span></label>
          <label class="field"><span>แจ้งเตือนเมื่อไม่ได้สอบเทียบเกิน (เดือน)</span><input id="st-int" class="input" inputmode="numeric" value="${esc(s.intervalMonths)}"></label>
        </div>
      </section>

      <section class="card">
        <h2>ข้อมูลบันทึกข้อความ</h2>
        <div class="form-grid">
          <label class="field span-all"><span>ส่วนราชการ</span><input id="st-unit" class="input" value="${esc(s.unitLine)}"></label>
          <label class="field"><span>เรียน</span><input id="st-to" class="input" value="${esc(s.addressee)}"></label>
          <label class="field"><span>ชื่อผู้ลงนาม</span><input id="st-sn" class="input" value="${esc(s.signerName)}" placeholder="(ชื่อ-สกุล)"></label>
          <label class="field"><span>ตำแหน่งผู้ลงนาม</span><input id="st-st" class="input" value="${esc(s.signerTitle)}"></label>
        </div>
        <div><button class="btn btn-primary" id="st-save">บันทึกการตั้งค่า</button></div>
      </section>

      <section class="card">
        <div class="card-head"><h2>ฐานข้อมูลกลาง (Google Sheets)</h2><span class="badge" style="background:${S.mode === 'remote' ? 'var(--ok-bg)' : 'var(--line-2)'};color:${S.mode === 'remote' ? 'var(--ok)' : 'var(--ink-2)'}">${S.mode === 'remote' ? 'เชื่อมต่อแล้ว' : 'เก็บในเครื่อง'}</span></div>
        <div class="muted" style="font-size:14px">ติดตั้งสคริปต์ <b>backend/Code.gs</b> ใน Google Apps Script ตามคู่มือ <b>คู่มือติดตั้ง.md</b> แล้ววางลิงก์ Web App ที่นี่ ทุกคนในทีมจะเห็นข้อมูลชุดเดียวกัน</div>
        <label class="field"><span>ลิงก์ Web App</span><input id="st-api" class="input" value="${esc(S.apiUrl)}" placeholder="https://script.google.com/macros/s/…/exec"></label>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="st-test">ทดสอบการเชื่อมต่อ</button><button class="btn btn-primary" id="st-api-save">บันทึกและเชื่อมต่อ</button></div>
        <div id="st-api-msg"></div>
      </section>

      <section class="card">
        <h2>สำรอง / กู้คืนข้อมูล</h2>
        <div class="muted" style="font-size:14px">สำรองมาตรและผลสอบเทียบทั้งหมดเป็นไฟล์ — แนะนำให้สำรองทุกเดือน โดยเฉพาะโหมดเก็บในเครื่อง</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn" id="st-bk">${icon('download')}ดาวน์โหลดไฟล์สำรอง (.json)</button>
          <button class="btn btn-excel" id="st-bkx">${icon('download')}ส่งออกข้อมูลทั้งหมด (.xlsx)</button>
          <button class="btn" id="st-rs">${icon('upload')}กู้คืนจากไฟล์สำรอง</button>
        </div>
      </section>
    </div>`;
    const $ = (q) => view.querySelector(q);
    $('#st-save').onclick = async () => {
      const limit = C.num($('#st-limit').value);
      if (!(limit > 0 && limit < 50)) return UI.toast('เกณฑ์ต้องอยู่ระหว่าง 0–50%', 'bad');
      await S.saveSettings({ limit, intervalMonths: parseInt($('#st-int').value, 10) || 6, unitLine: $('#st-unit').value, addressee: $('#st-to').value, signerName: $('#st-sn').value, signerTitle: $('#st-st').value });
      UI.toast('บันทึกการตั้งค่าแล้ว', 'ok');
    };
    const msg = (html, cls) => { $('#st-api-msg').className = cls || ''; $('#st-api-msg').innerHTML = html; };
    $('#st-test').onclick = async () => {
      const url = $('#st-api').value.trim();
      if (!url) return msg('กรุณาวางลิงก์ Web App', 'form-error');
      try { const r = await S.testConnection(url); msg(`<div class="alert alert-ok">${icon('ok', 20, 'var(--ok)')}<div><b>เชื่อมต่อสำเร็จ</b><br>${r.needsBootstrap ? 'ฐานข้อมูลยังว่าง — เมื่อบันทึก ระบบจะอัปโหลดข้อมูลในเครื่องนี้ขึ้นไปเป็นข้อมูลตั้งต้น' : `มีผู้ใช้ ${r.users} คน · มาตร ${r.meters} · ผลสอบเทียบ ${r.tests}`}</div></div>`); } catch (e) { msg('เชื่อมต่อไม่ได้: ' + esc(e.message), 'form-error'); }
    };
    $('#st-api-save').onclick = async () => {
      const url = $('#st-api').value.trim();
      if (!url) {
        if (!(await UI.confirm('เลิกใช้ฐานข้อมูลกลาง?', 'ระบบจะกลับไปใช้ข้อมูลที่เก็บในเครื่องนี้ และต้องเข้าสู่ระบบใหม่', 'ยืนยัน'))) return;
        S.setApiUrl(''); S.logout(); App.rebuildShell(); return;
      }
      let st;
      try { st = await S.testConnection(url); } catch (e) { return msg('เชื่อมต่อไม่ได้: ' + esc(e.message), 'form-error'); }
      if (st.needsBootstrap) {
        if (!(await UI.confirm('อัปโหลดข้อมูลตั้งต้น?', `ฐานข้อมูลกลางยังว่าง ระบบจะสร้างบัญชีผู้ดูแล (${S.session.empId}) และอัปโหลดมาตร ${S.data.meters.length} รายการ กับผลสอบเทียบ ${S.data.tests.length} รายการจากเครื่องนี้ขึ้นไป — ต้องยืนยันรหัสผ่านของคุณ`, 'ดำเนินการ'))) return;
        let pw = '';
        const ok = await UI.modal(`<h2>ยืนยันรหัสผ่าน</h2><label class="field"><span>รหัสผ่านของ ${esc(S.session.empId)} (จะใช้เป็นรหัสผ่านบนฐานข้อมูลกลาง)</span><input id="cpw" type="password" class="input"></label>
          <div class="modal-actions"><button class="btn" data-close="">ยกเลิก</button><button class="btn btn-primary" data-close="ok">ยืนยัน</button></div>`, { onOpen: (el) => { el.querySelector('#cpw').oninput = (e) => { pw = e.target.value; }; } });
        if (ok !== 'ok') return;
        if (pw.length < 8) return UI.toast('รหัสผ่านต้องมีอย่างน้อย 8 ตัว', 'bad');
        const local = { meters: S.data.meters, tests: S.data.tests, settings: S.data.settings, users: S.data.users };
        const me = S.session;
        S.setApiUrl(url);
        try {
          await S.bootstrap(me.empId, me.name, pw);
          await S.restoreBackup(JSON.stringify({ app: 'meter-pwa9', meters: local.meters, tests: local.tests }));
          await S.saveSettings({ limit: local.settings.limit, intervalMonths: local.settings.intervalMonths, unitLine: local.settings.unitLine, addressee: local.settings.addressee, signerName: local.settings.signerName, signerTitle: local.settings.signerTitle });
          UI.toast('เชื่อมฐานข้อมูลกลางและอัปโหลดข้อมูลเรียบร้อย', 'ok');
          App.rebuildShell();
        } catch (e) { S.setApiUrl(''); msg('ไม่สำเร็จ: ' + esc(e.message), 'form-error'); }
        return;
      }
      S.setApiUrl(url);
      S.logout();
      UI.toast('เชื่อมต่อแล้ว กรุณาเข้าสู่ระบบด้วยบัญชีบนฐานข้อมูลกลาง', 'ok');
      App.rebuildShell();
    };
    $('#st-bk').onclick = () => UI.download(`meter-pwa9-backup-${C.todayISO()}.json`, new Blob([S.exportBackup()], { type: 'application/json' }));
    $('#st-bkx').onclick = () => window.Exports.fullExcel();
    $('#st-rs').onclick = async () => {
      const f = await UI.pickFile('.json,application/json');
      if (!f) return;
      if (!(await UI.confirm('กู้คืนข้อมูล?', 'ข้อมูลมาตรและผลสอบเทียบปัจจุบันจะถูกแทนที่ด้วยข้อมูลในไฟล์', 'กู้คืน', true))) return;
      try { await S.restoreBackup(await f.text()); UI.toast('กู้คืนข้อมูลแล้ว', 'ok'); } catch (e) { UI.toast(e.message, 'bad'); }
    };
  };

  // ---------- account ----------
  V.account = function (view) {
    view.innerHTML = `<div class="page" style="max-width:520px">
      <div class="page-head"><h1>เปลี่ยนรหัสผ่าน</h1></div>
      <form class="card" id="ac-form">
        <div class="muted">${esc(S.session.name)} · รหัสพนักงาน ${esc(S.session.empId)}</div>
        <div id="ac-err" class="form-error hidden"></div>
        <label class="field"><span>รหัสผ่านเดิม</span><input id="ac-old" type="password" class="input" autocomplete="current-password"></label>
        <label class="field"><span>รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</span><input id="ac-new" type="password" class="input" autocomplete="new-password"></label>
        <label class="field"><span>ยืนยันรหัสผ่านใหม่</span><input id="ac-new2" type="password" class="input" autocomplete="new-password"></label>
        <button class="btn btn-primary" type="submit">เปลี่ยนรหัสผ่าน</button>
      </form></div>`;
    view.querySelector('#ac-form').onsubmit = async (e) => {
      e.preventDefault();
      const err = view.querySelector('#ac-err');
      const o = view.querySelector('#ac-old').value, n = view.querySelector('#ac-new').value, n2 = view.querySelector('#ac-new2').value;
      const fail = (m) => { err.textContent = m; err.classList.remove('hidden'); };
      if (n.length < 8) return fail('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
      if (n !== n2) return fail('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
      try { await S.changePassword(o, n); UI.toast('เปลี่ยนรหัสผ่านแล้ว', 'ok'); location.hash = '#/dashboard'; } catch (ex) { fail(ex.message); }
    };
  };
})();
