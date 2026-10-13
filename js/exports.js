/* Meter P.W.A 9 — documents: summary table, memo, single test sheet; Excel / Word / PDF(print); Excel import */
(function () {
  'use strict';
  const C = window.Core;
  const S = window.Store;
  const App = window.App;
  const { M, UI } = App;
  const { esc, thaiDigits: th } = C;

  const DOC_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
    body{margin:0;font-family:'Sarabun','TH Sarabun New','TH SarabunPSK',Tahoma,sans-serif;color:#000;background:#fff}
    .paper{background:#fff;font-family:inherit}
    .paper-land{padding:0}
    .paper-port{padding:0 0 0 12mm;font-size:16.5px;line-height:1.8}
    .doc-title{text-align:center;font-weight:700;font-size:18px;margin-bottom:12px}
    table.doc-tbl{width:100%;border-collapse:collapse;font-size:14px}
    .doc-tbl th,.doc-tbl td{border:1px solid #000;padding:5px 7px;vertical-align:top}
    .doc-tbl th{background:#EEF3FA;font-weight:700;text-align:center;vertical-align:middle}
    .doc-tbl td.c{text-align:center}.doc-tbl td.r{text-align:right}
    .doc-tbl tr{break-inside:avoid}
    .memo-title{text-align:center;font-size:29px;font-weight:700;margin-bottom:10px}
    .memo-line{display:flex;gap:8px}.memo-line b{flex:none}
    .memo-rule{border-top:1px solid #000;margin:6px 0 10px}
    .memo-p{text-indent:72px;margin:6px 0;text-align:justify}
    .memo-list{padding-left:110px;margin:2px 0}
    .memo-sign{margin:56px 0 0 auto;width:300px;text-align:center}
    .editable{outline:0}
    .ts-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;font-size:15px}
    .ts-h{font-weight:700;margin:12px 0 4px;font-size:16px}
    .box{border:1px solid #000;padding:8px 12px;margin-top:6px}
  `;

  // Layout of "บันทึกข้อความรายงานสาขา.doc": A4, margins 50.4/56.9/28.1/72 pt, TH SarabunIT๙,
  // title 29pt, labels 20pt bold, body 16pt, table 14pt, seal top-left, PWA banner in the footer.
  const MEMO_CSS = `
    .memo-a4{position:relative;width:210mm;min-height:297mm;box-sizing:border-box;padding:17.8mm 20mm 30mm 25.4mm;margin:0 auto;
      font-family:'Sarabun','TH SarabunPSK',sans-serif;font-size:11pt;line-height:1.55;color:#000;background:#fff;box-shadow:0 2px 14px rgba(14,27,44,.14)}
    .memo-a4 + .memo-a4{margin-top:24px}
    .memo-head{position:relative;height:22mm;display:flex;align-items:flex-end;justify-content:center}
    .memo-seal{position:absolute;left:0;top:-2mm;width:22.5mm;height:21.4mm}
    .memo-h1{font-size:20pt;font-weight:700;line-height:1}
    .mline{display:flex;align-items:baseline;gap:6px;margin-top:3pt}
    .mlab{font-size:13.8pt;font-weight:700;flex:none;line-height:1.2}
    .mfill{flex:1;border-bottom:1px dotted #000;padding:0 6px;min-width:0;line-height:1.2}
    .mto{margin:14pt 0 0}
    .mp{margin:6pt 0 0;text-indent:27.5mm;text-align:justify}
    .mtbl{border-collapse:collapse;margin:4pt auto 0;font-size:9.7pt;line-height:1.25}
    .mtbl th,.mtbl td{border:1px solid #000;padding:0 8px;font-weight:400}
    .mtbl th{text-align:center}
    .mtbl td.k{text-align:center;width:42mm}
    .msign{margin:40pt 0 0 72mm;width:80mm;text-align:center}
    .msign .t{font-size:9.7pt}
    .mboxes{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:30pt;line-height:1.3}
    .mboxes .ind{padding-left:16mm}
    .mboxes .sig{text-align:center;margin-top:22pt}
    .memo-foot{position:absolute;left:50%;bottom:6mm;transform:translateX(-50%);width:100mm}
    .memo-att .att-title{text-align:center;font-weight:700;font-size:11pt;margin-bottom:6pt}
    .memo-att table{width:100%;border-collapse:collapse;font-size:9.5pt;line-height:1.2}
    .memo-att th,.memo-att td{border:1px solid #000;padding:2px 5px;vertical-align:top}
    .memo-att th{font-weight:700;text-align:center;vertical-align:middle}
    .memo-att td.c{text-align:center}
    .memo-att tr{break-inside:avoid}
  `;
  (function injectMemoCss() {
    const st = document.createElement('style');
    st.textContent = MEMO_CSS;
    document.head.appendChild(st);
  })();
  const asset = (p) => new URL(p, document.baseURI).href;

  function roundLabel(o) { return `${o.round || '…'}/${o.fy}`; }
  // factor shown in every table: the proposed factor when one applies, otherwise 1.0000; none for a broken meter
  const kOf = (x) => (x.t.broken ? null : (x.k || 1));

  // ---------- summary table (ตารางสรุปผลการตรวจสอบมาตรหลัก) ----------
  function summaryHTML(rows, o) {
    const showBranch = !o.branch;
    const body = rows.map((x, i) => `<tr>
      <td class="c">${i + 1}</td>${showBranch ? `<td>${esc(x.m.branch)}</td>` : ''}<td>${esc(x.m.place)}</td><td>${esc(x.m.brand)}</td><td>${esc(x.m.model)}</td>
      <td>${esc(x.m.kind)}</td><td class="c">${esc(x.m.size)}</td>
      <td class="c">${x.t.broken ? '-' : C.fmtSigned(x.c.err, 2)}</td>
      <td class="c">${kOf(x) ? C.fmt(kOf(x), 4) : '-'}</td>
      <td>${x.t.broken ? 'มาตรชำรุด' : esc([x.r === 'factor' ? 'เสนอใช้ตัวคูณ' : '', x.t.note || ''].filter(Boolean).join(' · '))}</td></tr>`).join('');
    return `<div class="doc-stage"><div class="paper paper-land print-land">
      <div class="doc-title">ตารางที่ 1 ผลการทดสอบความเที่ยงตรงของมาตรวัดน้ำหลัก กปภ.สาขา${esc(o.branch || '…………')} ครั้งที่ ${esc(roundLabel(o))}</div>
      <table class="doc-tbl"><thead>
        <tr><th rowspan="2">ลำดับที่</th>${showBranch ? '<th rowspan="2">กปภ.สาขา</th>' : ''}<th rowspan="2">สถานที่</th><th rowspan="2">ยี่ห้อ</th><th rowspan="2">รุ่น</th><th rowspan="2">ชนิด</th><th>ขนาด</th><th>ค่าความคลาดเคลื่อน</th><th rowspan="2">ค่าตัวคูณปรับแก้</th><th rowspan="2">หมายเหตุ</th></tr>
        <tr><th>(mm.)</th><th>(%)</th></tr></thead>
        <tbody>${body || `<tr><td colspan="${showBranch ? 10 : 9}" class="c">ไม่มีข้อมูลตามเงื่อนไขที่เลือก</td></tr>`}</tbody></table>
      <div style="margin-top:10px;font-size:13px">หมายเหตุ: เกณฑ์ความคลาดเคลื่อนที่ยอมรับ ±${M.limit()}% · ความคลาดเคลื่อน = ((M × ตัวคูณเดิม − U) / U) × 100 · ตัวคูณปรับแก้ = ((U − M) / M) + 1</div>
    </div></div>`;
  }

  // ---------- memo (บันทึกข้อความรายงานสาขา) ----------
  function memoParts(rows, o) {
    const s = S.data.settings;
    const memo = o.memo || {};
    const dates = rows.map((x) => x.t.date).filter(Boolean).sort();
    const period = th(memo.period || (dates.length ? (dates[0] === dates[dates.length - 1] ? C.thDate(dates[0], true) : `${C.thDate(dates[0], true)} – ${C.thDate(dates[dates.length - 1], true)}`) : '…………………'));
    const factorRows = rows.filter((x) => x.r === 'factor');
    const brokenRows = rows.filter((x) => x.r === 'broken');
    // memo table: same places as the summary table, distribution meters only (no raw-water meters)
    const placeRows = rows.filter((x) => !C.isRaw(x.m)).map((x) => ({ place: x.m.place, k: kOf(x) ? th(C.fmt(kOf(x), 4)) : 'มาตรชำรุด' }));
    const D = Store.DEFAULT_SETTINGS || {};
    const pick = (k) => s[k] || D[k] || '';
    return {
      s, memo, period, factorRows, brokenRows, placeRows,
      unitLine: pick('unitLine'), addressee: memo.addressee || pick('addressee'),
      signer: memo.signer || pick('signerName'), signerTitle: th(pick('signerTitle')),
      endorseTo: th(pick('endorseTo')), endorserName: pick('endorserName'), endorserTitle: pick('endorserTitle'),
      branch: o.branch || '…………',
      no: th(memo.no || '…………………'),
      date: th(memo.dateText || (memo.date ? C.thDate(memo.date, true) : '…………………')),
      effective: th(memo.effective || '…………………'),
      round: th(o.round || '…'), fy: th(o.fy)
    };
  }

  // attachment rows shared by the on-screen page and the .docx
  function attachmentRows(rows) {
    return rows.map((x, i) => [th(i + 1), x.m.branch, x.m.place, x.m.brand, x.m.model, x.m.kind, th(x.m.size || '-'),
      x.t.broken ? '-' : th(C.fmtSigned(x.c.err, 2)), kOf(x) ? th(C.fmt(kOf(x), 4)) : '-', x.t.broken ? 'มาตรชำรุด' : (x.t.note || '')]);
  }
  const ATT_HEAD = ['ลำดับที่', 'กปภ.สาขา', 'สถานที่', 'ยี่ห้อ', 'รุ่น', 'ชนิด', 'ขนาด (มม.)', 'ค่าความคลาดเคลื่อน (%)', 'ค่าตัวคูณปรับแก้', 'หมายเหตุ'];
  const ATT_HEAD_HTML = ['ลำดับที่', 'กปภ.สาขา', 'สถานที่', 'ยี่ห้อ', 'รุ่น', 'ชนิด', 'ขนาด<br>(มม.)', 'ค่าความ<br>คลาดเคลื่อน (%)', 'ค่าตัวคูณ<br>ปรับแก้', 'หมายเหตุ'];

  function memoHTML(rows, o) {
    const p = memoParts(rows, o);
    const ed = (key, val) => o.editable ? `<span class="editable" contenteditable="true" data-memo="${key}" title="แก้ไขได้">${esc(val)}</span>` : esc(val);
    const tableRows = p.placeRows.length
      ? p.placeRows.map((x) => `<tr><td>${esc(x.place)}</td><td class="k">${x.k}</td></tr>`).join('')
      : '<tr><td>– ไม่มีมาตรน้ำจ่ายที่ทดสอบ –</td><td class="k">-</td></tr>';
    const broken = p.brokenRows.length ? `<p class="mp">ทั้งนี้ มีมาตรวัดน้ำหลักชำรุดไม่สามารถทดสอบได้ จำนวน ${th(p.brokenRows.length)} แห่ง ได้แก่ ${p.brokenRows.map((x) => esc(x.m.place)).join(', ')} เห็นควรแจ้งสาขาดำเนินการซ่อมแซมต่อไป</p>` : '';
    const foot = `<img class="memo-foot" src="${asset('img/footer-pwa.png')}" alt="">`;
    const att = attachmentRows(rows);
    return `<div class="doc-stage">
      <div class="paper memo-a4">
        <div class="memo-head"><img class="memo-seal" src="${asset('img/pwa-seal.png')}" alt="ตราการประปาส่วนภูมิภาค"><div class="memo-h1">บันทึกข้อความ</div></div>
        <div class="mline"><span class="mlab">หน่วยงาน</span><span class="mfill" style="white-space:nowrap;font-size:10.4pt;overflow:hidden">${esc(p.unitLine)}</span></div>
        <div class="mline"><span class="mlab">ที่</span><span class="mfill" style="flex:1.15">${ed('no', p.no)}</span><span class="mlab">วันที่</span><span class="mfill">${ed('dateText', p.date)}</span></div>
        <div class="mline"><span class="mlab">เรื่อง</span><span class="mfill">รายงานผลการทดสอบมาตรวัดน้ำหลัก กปภ.สาขา${esc(p.branch)} ครั้งที่ ${p.round} ประจำปีงบประมาณ ${p.fy}</span></div>
        <p class="mto">เรียน  ${esc(p.addressee)}</p>
        <p class="mp">ตามที่งานมาตรวัดน้ำ ได้รับมอบหมายให้ไปดำเนินการตรวจสอบความเที่ยงตรงของมาตรวัดน้ำหลัก ครั้งที่ ${p.round} ตามแผนการปฏิบัติงานงานมาตรวัดน้ำ ประจำปีงบประมาณ ${p.fy} ณ กปภ.สาขา${esc(p.branch)} ระหว่างวันที่ ${ed('period', p.period)} นั้น</p>
        <p class="mp">งานมาตรวัดน้ำ ได้ดำเนินการตรวจสอบความเที่ยงตรงของมาตรวัดน้ำหลัก และได้จัดทำสรุปผลการตรวจสอบตามตาราง (เอกสารแนบท้าย)</p>
        <table class="mtbl"><thead><tr><th style="width:105mm">สถานที่</th><th>ค่าตัวคูณปรับแก้</th></tr></thead><tbody>${tableRows}</tbody></table>
        ${broken}
        <p class="mp" style="margin-top:14pt">จึงเรียนมาเพื่อโปรดทราบ และพิจารณาแจ้ง กปภ.สาขา${esc(p.branch)} ให้ใช้ค่าตัวคูณปรับแก้ ตั้งแต่วันที่ ${ed('effective', p.effective)} เป็นต้นไป จะขอบคุณยิ่ง</p>
        <div class="msign">${p.signer ? `(${ed('signer', p.signer)})` : '&nbsp;'}<div class="t">${esc(p.signerTitle) || '&nbsp;'}</div></div>
        <div class="mboxes">
          <div>เรียน ${esc(p.endorseTo)}<div class="ind">เพื่อโปรดพิจารณาแจ้ง กปภ.สาขา</div>ดำเนินการในส่วนที่เกี่ยวข้องต่อไป จะขอบคุณยิ่ง
            <div class="sig">${p.endorserName ? `(${esc(p.endorserName)})` : '&nbsp;'}<br>${esc(p.endorserTitle) || '&nbsp;'}</div></div>
          <div>- ทราบ<br>- เรียน <u>ผจก.กปภ.สาขา${esc(o.branch || '')}</u><div class="ind">เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป</div></div>
        </div>
        ${foot}
      </div>
      <div class="paper memo-a4 memo-att">
        <div class="att-title">เอกสารแนบท้าย<br>ตารางที่ ๑ ผลการทดสอบความเที่ยงตรงของมาตรวัดน้ำหลัก กปภ.สาขา${esc(p.branch)} ครั้งที่ ${p.round}/${p.fy}</div>
        <table><thead><tr>${ATT_HEAD_HTML.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${att.map((r) => `<tr>${r.map((v, i) => `<td class="${[0, 6, 7, 8].includes(i) ? 'c' : ''}">${esc(v)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="10" class="c">ไม่มีข้อมูล</td></tr>`}</tbody></table>
        <div style="margin-top:6pt;font-size:13pt">หมายเหตุ: เกณฑ์ความคลาดเคลื่อนที่ยอมรับ ±${th(M.limit())}%</div>
        ${foot}
      </div>
    </div>`;
  }

  // ---------- print via hidden iframe (→ "Save as PDF") ----------
  // Phones cannot print from a hidden frame: render the pages to a real PDF file instead.
  let h2pLib = null;
  function loadH2P() {
    if (window.html2pdf) return Promise.resolve(window.html2pdf);
    if (!h2pLib) {
      h2pLib = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        s.onload = () => resolve(window.html2pdf);
        s.onerror = () => { h2pLib = null; reject(new Error('โหลดตัวสร้าง PDF ไม่ได้ (ต้องเชื่อมต่ออินเทอร์เน็ต)')); };
        document.head.appendChild(s);
      });
    }
    return h2pLib;
  }
  async function savePdf(inner, landscape, title, memo) {
    let lib;
    try { lib = await loadH2P(); } catch (e) { return UI.toast(e.message, 'bad'); }
    UI.toast('กำลังสร้างไฟล์ PDF…');
    const pageCss = DOC_CSS.replace(/body\{[^}]*\}/, '') +
      '.pdf-root .memo-a4{box-shadow:none;margin:0;height:294mm;min-height:0;overflow:hidden}.pdf-root .memo-a4+.memo-a4{margin-top:0}' +
      '.pdf-root .memo-att{padding-left:15mm;padding-right:12mm}.pdf-root .memo-att table{font-size:8.3pt}.pdf-root .memo-att th,.pdf-root .memo-att td{white-space:nowrap;padding:2px 4px}' +
      '.pdf-root .paper-port{padding:0 0 0 6mm}.pdf-root .doc-stage{background:none;padding:0}';
    const wrap = document.createElement('div');
    wrap.className = 'pdf-root';
    wrap.style.cssText = `width:${landscape ? 277 : (memo ? 210 : 190)}mm;background:#fff;color:#000;font-family:Sarabun,sans-serif`;
    wrap.innerHTML = `<style>${pageCss}</style>` + inner;
    // the PDF renderer only wraps lines at spaces: mark Thai word boundaries with zero-width spaces
    if (window.Intl && Intl.Segmenter) {
      const seg = new Intl.Segmenter('th', { granularity: 'word' });
      const walk = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walk.nextNode()) if (/[฀-๿]/.test(walk.currentNode.nodeValue) && walk.currentNode.parentNode.nodeName !== 'STYLE') nodes.push(walk.currentNode);
      nodes.forEach((n) => { n.nodeValue = Array.from(seg.segment(n.nodeValue), (x) => x.segment).join('​').replace(/​(\s)|(\s)​/g, '$1$2'); });
    }
    const name = (title || 'Meter P.W.A 9').replace(/[\\/:*?"<>|]/g, '') + '.pdf';
    try {
      const blob = await lib().set({
        margin: memo ? 0 : 8, filename: name, image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' },
        pagebreak: memo ? { mode: ['css'], before: '.memo-att' } : { mode: ['css', 'legacy'], avoid: 'tr' }
      }).from(wrap).outputPdf('blob');
      await UI.download(name, blob);
    } catch (e) { UI.toast('สร้าง PDF ไม่สำเร็จ: ' + e.message, 'bad'); }
  }

  function printHTML(inner, landscape, title, memo) {
    if (UI.isMobile()) return savePdf(inner, landscape, title, memo);
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const doc = f.contentDocument;
    const page = memo
      ? '@page{size:A4 portrait;margin:0}.memo-a4{box-shadow:none;margin:0;height:297mm;overflow:hidden;break-after:page}.memo-a4+.memo-a4{margin-top:0}.memo-a4:last-child{break-after:auto}'
      : `@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:${landscape ? '10mm' : '18mm 18mm 18mm 12mm'}}`;
    doc.open();
    doc.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(title || 'Meter P.W.A 9')}</title>
      <style>${DOC_CSS}${MEMO_CSS}${page}</style></head><body>${inner}</body></html>`);
    doc.close();
    const go = () => {
      f.contentWindow.focus();
      f.contentWindow.print();
      setTimeout(() => f.remove(), 2000);
    };
    (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(() => setTimeout(go, 250));
  }
  function printStage(stage, landscape) {
    const papers = Array.from(stage.querySelectorAll('.paper'));
    if (!papers.length) return UI.toast('ไม่มีเอกสารให้พิมพ์', 'bad');
    const memo = papers.some((p) => p.classList.contains('memo-a4'));
    const html = papers.map((p) => {
      const clone = p.cloneNode(true);
      clone.querySelectorAll('[contenteditable]').forEach((e) => e.removeAttribute('contenteditable'));
      return clone.outerHTML;
    }).join('');
    printHTML(html, landscape && !memo, memo ? 'บันทึกข้อความรายงานสาขา' : 'รายงานผลการตรวจสอบมาตรวัดน้ำหลัก', memo);
    if (!UI.isMobile()) UI.toast('เลือก "บันทึกเป็น PDF" ในหน้าต่างพิมพ์เพื่อได้ไฟล์ PDF');
  }

  // ---------- single test sheet (รายงานผลการทดสอบมาตรวัดน้ำหลัก) ----------
  function printTest(t) {
    if (!t) return;
    const m = M.meter(t.meterId) || { place: t.place, branch: t.branch, category: '', brand: '', model: '', kind: '', size: '' };
    const c = C.calibrate(t, M.limit());
    const r = M.result(t);
    const d = t.device || {};
    const g = t.diag || {};
    const eq = t.equipment || {};
    const row = (a, b) => `<div><b>${a}</b> ${esc(b || '-')}</div>`;
    const op = t.broken ? 'มาตรชำรุด ไม่สามารถทดสอบได้' : (C.OPINIONS[t.opinion] || '') + (t.opinion === 'new' ? ` = ${C.fmt(c.k1, 4)}` : t.opinion === 'old' ? ` = ${C.fmt(c.k0, 4)}` : '');
    const html = `<div class="paper paper-port" style="font-size:15px;line-height:1.6;padding:0">
      <div class="doc-title" style="font-size:20px;margin-bottom:2px">รายงานผลการทดสอบมาตรวัดน้ำหลัก (${esc(m.category ? m.category.replace('มาตร', '') : 'น้ำจ่าย')})</div>
      <div style="text-align:center;margin-bottom:10px">งานมาตรวัดน้ำ กองระบบจำหน่าย การประปาส่วนภูมิภาคเขต 9</div>
      <div class="ts-grid">${row('การประปาส่วนภูมิภาค สาขา', m.branch)}${row('ครั้งที่ / ปีงบประมาณ', `${t.round || '-'}/${t.fiscalYear}`)}${row('สถานที่', m.place)}${row('มาตร', `${m.brand} ${m.model} · ${m.kind} · ${m.size} มม.`)}</div>
      <div class="ts-h">Ultrasonic Flowmeter เขต 9 (U)</div>
      <div class="ts-grid">${row('ยี่ห้อ', d.brand)}${row('รุ่น', d.model)}${row('ขนาดเส้นผ่าศูนย์กลางท่อที่วัด', d.pipeSize)}${row('เบอร์หัวเซนเซอร์ที่ใช้วัด', d.sensor)}${row('ชนิดท่อ', d.pipeType)}${row('เส้นผ่าศูนย์กลางภายนอกท่อ (Pipe O.D.)', d.od)}${row('ความหนาผนังท่อ', d.wall)}${row('ชนิดของวัสดุเคลือบท่อ', d.lining)}${row('ความหนาของวัสดุเคลือบท่อ', d.liningThk)}${row('รูปแบบการติดตั้งหัวเซนเซอร์', d.mount)}${row('ระยะห่างของหัวเซนเซอร์', d.spacing)}${row('ความเร็วน้ำ V (m/s)', t.velocity)}</div>
      <div class="ts-h">ค่า Diagnostic ของเครื่องอัลตร้าโซนิคโฟลว์มิเตอร์</div>
      <div class="ts-grid">${row('Soundspeed', g.soundspeed)}${row('Signal Strength UP / DOWN', `${g.sigUp || '-'} / ${g.sigDown || '-'}`)}${row('Q UP / DOWN', `${g.qUp || '-'} / ${g.qDown || '-'}`)}${row('Amp UP / DOWN', `${g.ampUp || '-'} / ${g.ampDown || '-'}`)}</div>
      <div class="ts-h">ผลการอ่านค่า</div>
      <table class="doc-tbl"><thead><tr><th>มาตรวัดน้ำ</th><th>วันที่เริ่มทดสอบ</th><th>เวลา</th><th>ปริมาณน้ำสะสม (m³)</th><th>วันที่ตัดยอด</th><th>เวลา</th><th>ปริมาณน้ำสะสม (m³)</th><th>ปริมาณน้ำ (m³)</th></tr></thead>
        <tbody>
          <tr><td>Ultrasonic Flowmeter (U)</td><td class="c">${C.thDate(t.date)}</td><td class="c">${esc(t.timeStart || '-')}</td><td class="r">${esc(t.uStart || '-')}</td><td class="c">${C.thDate(t.dateEnd || t.date)}</td><td class="c">${esc(t.timeEnd || '-')}</td><td class="r">${esc(t.uEnd || '-')}</td><td class="r"><b>${C.fmt(c.U, 2)}</b></td></tr>
          <tr><td>Master Meter (M)</td><td class="c">${C.thDate(t.date)}</td><td class="c">${esc(t.timeStart || '-')}</td><td class="r">${esc(t.mStart || '-')}</td><td class="c">${C.thDate(t.dateEnd || t.date)}</td><td class="c">${esc(t.timeEnd || '-')}</td><td class="r">${esc(t.mEnd || '-')}</td><td class="r"><b>${C.fmt(c.M, 2)}</b></td></tr>
        </tbody></table>
      <div class="box">
        <div>ค่าตัวคูณเดิม = <b>${C.fmt(c.k0, 4)}</b></div>
        <div>ปริมาณน้ำรวมของ Master Meter เมื่อคูณค่าตัวคูณเดิมแล้ว (M*) = <b>${C.fmt(c.Ms, 2)}</b></div>
        <div>ความคลาดเคลื่อนของมาตรวัดน้ำหลักในครั้งนี้ = ((M* − U) / U) × 100 = <b>${t.broken ? '-' : C.fmtSigned(c.err, 2) + ' %'}</b></div>
        <div>ตัวคูณของมาตรวัดน้ำหลักครั้งนี้ = ((U − M) / M) + 1 = <b>${t.broken ? '-' : C.fmt(c.k1, 4)}</b></div>
        <div style="margin-top:6px"><b>ความเห็น:</b> ${esc(op)} <span style="margin-left:8px">(${esc(C.RESULT[r].label)} · เกณฑ์ ±${M.limit()}%)</span></div>
      </div>
      <div class="ts-h">Check list อุปกรณ์ · สถานะการทำงาน: ${esc(t.workStatus || '-')}${t.batteryPct ? ` · Battery MAG 8000 ${esc(t.batteryPct)}%` : ''}${t.cleaned ? ' · ล้างมาตรแล้ว' : ''}</div>
      <div class="ts-grid">${C.EQUIPMENT.flatMap((gr) => gr.items).map((i) => row(i, eq[i] ? C.EQUIP_STATE[eq[i]] : '-')).join('')}</div>
      ${t.note ? `<div style="margin-top:8px"><b>หมายเหตุ</b> ${esc(t.note)}</div>` : ''}
      ${t.gps ? `<div><b>พิกัดจุดทดสอบ</b> ${t.gps.lat}, ${t.gps.lng}</div>` : ''}
      <div style="display:flex;justify-content:space-around;margin-top:40px;text-align:center">
        ${(t.testers || []).map((n, i) => `<div>ลงชื่อ ……………………………… ผู้ทดสอบ ${i + 1}<br>(${esc(n || '……………………………')})</div>`).join('')}
      </div></div>`;
    printHTML(html, false, 'รายงานผลการทดสอบ ' + m.place);
  }

  // ---------- Word memo (.docx built to the layout of บันทึกข้อความรายงานสาขา.doc) ----------
  let docxLib = null;
  function loadDocx() {
    if (window.docx) return Promise.resolve(window.docx);
    if (!docxLib) {
      docxLib = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';
        s.onload = () => resolve(window.docx);
        s.onerror = () => { docxLib = null; reject(new Error('โหลดตัวสร้างไฟล์ Word ไม่ได้ (ต้องเชื่อมต่ออินเทอร์เน็ต)')); };
        document.head.appendChild(s);
      });
    }
    return docxLib;
  }
  async function bytes(path) {
    const r = await fetch(asset(path));
    if (!r.ok) throw new Error('โหลดรูป ' + path + ' ไม่ได้');
    return new Uint8Array(await r.arrayBuffer());
  }

  async function memoWord(rows, o) {
    let D;
    try { D = await loadDocx(); } catch (e) { return UI.toast(e.message, 'bad'); }
    UI.toast('กำลังสร้างไฟล์ Word…');
    const p = memoParts(rows, o);
    const [seal, foot] = await Promise.all([bytes('img/pwa-seal.png'), bytes('img/footer-pwa.png')]);
    const FONT = { ascii: 'TH SarabunIT๙', hAnsi: 'TH SarabunIT๙', cs: 'TH SarabunIT๙', eastAsia: 'TH SarabunIT๙' };
    // Thai language on every run so Word applies Thai word breaking (otherwise justified lines letter-space)
    const LANG = { value: 'th-TH', bidirectional: 'th-TH' };
    // Word on many PCs cannot find Thai word boundaries itself: mark them with zero-width spaces
    const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
    const zw = (s) => (seg ? Array.from(seg.segment(s), (x) => x.segment).join('​').replace(/​(\s)|(\s)​/g, '$1$2').replace(/([(\[“"])​/g, '$1').replace(/​([)\]”".,:])/g, '$1') : s);
    const R = (text, pt, opt) => new D.TextRun(Object.assign({
      text, font: FONT, size: (pt || 16) * 2, sizeComplexScript: (pt || 16) * 2, language: LANG,
      bold: !!(opt && opt.bold), boldComplexScript: !!(opt && opt.bold),
      underline: opt && opt.dot ? { type: D.UnderlineType.DOTTED } : opt && opt.u ? { type: D.UnderlineType.SINGLE } : undefined
    }));
    const pt = (n) => n * 20; // points → twips
    const W = 9330; // text width in twips (A4 595.35pt − 72 − 56.9)
    const P = (children, opt) => new D.Paragraph(Object.assign({ children, spacing: { before: 0, after: 0 } }, opt || {}));
    const thaiJustify = D.AlignmentType.THAI_DISTRIBUTE || D.AlignmentType.JUSTIFIED;
    const footer = new D.Footer({ children: [P([new D.ImageRun({ data: foot, transformation: { width: 378, height: 34 } })], { alignment: D.AlignmentType.CENTER })] });
    const none = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
    const line = { style: D.BorderStyle.SINGLE, size: 4, color: '000000' };
    const lineBorders = { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line };
    const cell = (children, width, opt) => new D.TableCell(Object.assign({ children, width: { size: width, type: D.WidthType.DXA }, margins: { left: 100, right: 100 } }, opt || {}));

    const factor = p.placeRows.length ? p.placeRows : [null];
    const memoTable = new D.Table({
      alignment: D.AlignmentType.CENTER, width: { size: 8400, type: D.WidthType.DXA }, columnWidths: [6000, 2400], borders: lineBorders,
      rows: [new D.TableRow({ children: [cell([P([R('สถานที่', 14)], { alignment: D.AlignmentType.CENTER })], 6000), cell([P([R('ค่าตัวคูณปรับแก้', 14)], { alignment: D.AlignmentType.CENTER })], 2400)] })]
        .concat(factor.map((x) => new D.TableRow({ children: [
          cell([P([R(x ? x.place : '– ไม่มีมาตรน้ำจ่ายที่ทดสอบ –', 14)])], 6000),
          cell([P([R(x ? x.k : '-', 14)], { alignment: D.AlignmentType.CENTER })], 2400)
        ] })))
    });

    const boxes = new D.Table({
      width: { size: W, type: D.WidthType.DXA }, columnWidths: [W / 2, W / 2], borders: noBorders,
      rows: [new D.TableRow({ children: [
        cell([
          P([R('เรียน ' + p.endorseTo, 16)]),
          P([R('เพื่อโปรดพิจารณาแจ้ง กปภ.สาขา', 16)], { indent: { left: 900 } }),
          P([R('ดำเนินการในส่วนที่เกี่ยวข้องต่อไป จะขอบคุณยิ่ง', 16)]),
          P([R('', 16)]), P([R('', 16)]),
          P([R(p.endorserName ? '(' + p.endorserName + ')' : '', 16)], { alignment: D.AlignmentType.CENTER }),
          P([R(p.endorserTitle, 16)], { alignment: D.AlignmentType.CENTER })
        ], W / 2, { borders: { top: none, bottom: none, left: none, right: none } }),
        cell([
          P([R('- ทราบ', 16)]),
          P([R('- เรียน ', 16), R('ผจก.กปภ.สาขา' + (o.branch || ''), 16, { u: true })]),
          P([R('เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป', 16)], { indent: { left: 900 } })
        ], W / 2, { borders: { top: none, bottom: none, left: none, right: none } })
      ] })]
    });

    const tabs = [{ type: D.TabStopType.LEFT, position: 4700 }, { type: D.TabStopType.RIGHT, position: W }];
    const memoChildren = [
      P([
        new D.ImageRun({ data: seal, transformation: { width: 85, height: 81 }, floating: {
          horizontalPosition: { relative: D.HorizontalPositionRelativeFrom.MARGIN, offset: 0 },
          verticalPosition: { relative: D.VerticalPositionRelativeFrom.PARAGRAPH, offset: -12700 * 4 },
          wrap: { type: D.TextWrappingType.NONE }, allowOverlap: true
        } }),
        R('บันทึกข้อความ', 29, { bold: true })
      ], { alignment: D.AlignmentType.CENTER, spacing: { before: pt(22), after: pt(6) } }),
      P([R('หน่วยงาน', 20, { bold: true }), R(' ' + p.unitLine, 15.5, { dot: true }), R('\t', 15.5, { dot: true })], { tabStops: [tabs[1]] }),
      P([R('ที่', 20, { bold: true }), R(' ' + p.no, 16, { dot: true }), R('\t', 16, { dot: true }), R('วันที่', 20, { bold: true }), R(' ' + p.date, 16, { dot: true }), R('\t', 16, { dot: true })], { tabStops: tabs }),
      P([R('เรื่อง', 20, { bold: true }), R(' รายงานผลการทดสอบมาตรวัดน้ำหลัก กปภ.สาขา' + p.branch + ' ครั้งที่ ' + p.round + ' ประจำปีงบประมาณ ' + p.fy, 16, { dot: true }), R('\t', 16, { dot: true })], { tabStops: [tabs[1]] }),
      P([R('เรียน  ' + p.addressee, 16)], { spacing: { before: pt(14) } }),
      P([R(zw('ตามที่งานมาตรวัดน้ำ ได้รับมอบหมายให้ไปดำเนินการตรวจสอบความเที่ยงตรงของมาตรวัดน้ำหลัก ครั้งที่ ' + p.round + ' ตามแผนการปฏิบัติงานงานมาตรวัดน้ำ ประจำปีงบประมาณ ' + p.fy + ' ณ กปภ.สาขา' + p.branch + ' ระหว่างวันที่ ' + p.period + ' นั้น'), 16)],
        { alignment: thaiJustify, indent: { firstLine: pt(78) }, spacing: { before: pt(6) } }),
      P([R(zw('งานมาตรวัดน้ำ ได้ดำเนินการตรวจสอบความเที่ยงตรงของมาตรวัดน้ำหลัก และได้จัดทำสรุปผลการตรวจสอบตามตาราง (เอกสารแนบท้าย)'), 16)],
        { alignment: thaiJustify, indent: { firstLine: pt(78) }, spacing: { before: pt(6), after: pt(4) } }),
      memoTable
    ];
    if (p.brokenRows.length) {
      memoChildren.push(P([R(zw('ทั้งนี้ มีมาตรวัดน้ำหลักชำรุดไม่สามารถทดสอบได้ จำนวน ' + th(p.brokenRows.length) + ' แห่ง ได้แก่ ' + p.brokenRows.map((x) => x.m.place).join(', ') + ' เห็นควรแจ้งสาขาดำเนินการซ่อมแซมต่อไป'), 16)],
        { alignment: thaiJustify, indent: { firstLine: pt(78) }, spacing: { before: pt(6) } }));
    }
    memoChildren.push(
      P([R(zw('จึงเรียนมาเพื่อโปรดทราบ และพิจารณาแจ้ง กปภ.สาขา' + p.branch + ' ให้ใช้ค่าตัวคูณปรับแก้ ตั้งแต่วันที่ ' + p.effective + ' เป็นต้นไป จะขอบคุณยิ่ง'), 16)],
        { alignment: thaiJustify, indent: { firstLine: pt(78) }, spacing: { before: pt(14) } }),
      P([R('', 16)]), P([R('', 16)]),
      P([R(p.signer ? '(' + p.signer + ')' : '', 16)], { alignment: D.AlignmentType.CENTER, indent: { left: 4100 } }),
      P([R(p.signerTitle, 14)], { alignment: D.AlignmentType.CENTER, indent: { left: 4100 } }),
      P([R('', 16)]),
      boxes
    );

    // attachment: summary table, landscape
    const att = attachmentRows(rows);
    const LW = 15398;
    const colW = [800, 1500, 4000, 1300, 1500, 1900, 1000, 1300, 1200, 898];
    const attTable = new D.Table({
      width: { size: LW, type: D.WidthType.DXA }, columnWidths: colW, borders: lineBorders,
      rows: [new D.TableRow({ tableHeader: true, children: ATT_HEAD.map((h, i) => cell([P([R(h, 14, { bold: true })], { alignment: D.AlignmentType.CENTER })], colW[i], { verticalAlign: D.VerticalAlign.CENTER })) })]
        .concat((att.length ? att : [['', '', 'ไม่มีข้อมูล', '', '', '', '', '', '', '']]).map((r) => new D.TableRow({ cantSplit: true, children: r.map((v, i) => cell([P([R(String(v), 14)], { alignment: [0, 6, 7, 8].includes(i) ? D.AlignmentType.CENTER : D.AlignmentType.LEFT })], colW[i])) })))
    });

    const doc = new D.Document({
      creator: 'Meter P.W.A 9', title: 'บันทึกข้อความรายงานผลการทดสอบมาตรวัดน้ำหลัก',
      styles: { default: { document: { run: { font: FONT, size: 32, sizeComplexScript: 32, language: LANG } } } },
      sections: [
        { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1008, bottom: 562, left: 1440, right: 1138, header: 720, footer: 200 } } },
          footers: { default: footer }, children: memoChildren },
        { properties: { page: { size: { width: 11906, height: 16838, orientation: D.PageOrientation.LANDSCAPE }, margin: { top: 720, bottom: 720, left: 720, right: 720, footer: 200 } } },
          footers: { default: new D.Footer({ children: [P([new D.ImageRun({ data: foot, transformation: { width: 378, height: 34 } })], { alignment: D.AlignmentType.CENTER })] }) },
          children: [
            P([R('เอกสารแนบท้าย', 16, { bold: true })], { alignment: D.AlignmentType.CENTER }),
            P([R('ตารางที่ ๑ ผลการทดสอบความเที่ยงตรงของมาตรวัดน้ำหลัก กปภ.สาขา' + p.branch + ' ครั้งที่ ' + p.round + '/' + p.fy, 16, { bold: true })], { alignment: D.AlignmentType.CENTER, spacing: { after: pt(6) } }),
            attTable,
            P([R('หมายเหตุ: เกณฑ์ความคลาดเคลื่อนที่ยอมรับ ±' + th(M.limit()) + '%', 14)], { spacing: { before: pt(6) } })
          ] }
      ]
    });
    const blob = await D.Packer.toBlob(doc);
    UI.download(`บันทึกข้อความ_${p.branch.replace(/[\\/:*?"<>|.…]/g, '') || 'สาขา'}_${o.round || 'x'}-${o.fy}.docx`, blob);
    return blob;
  }

  // ---------- Excel ----------
  function needXLSX() {
    if (!window.XLSX) { UI.toast('ต้องเชื่อมต่ออินเทอร์เน็ตครั้งแรกเพื่อโหลดตัวสร้าง Excel', 'bad'); return false; }
    return true;
  }
  function sheet(aoa, widths, merges) {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    if (widths) ws['!cols'] = widths.map((w) => ({ wch: w }));
    if (merges) ws['!merges'] = merges;
    return ws;
  }
  function save(wb, name) {
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array', compression: true });
    UI.download(name, new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  }

  function detailRows(rows) {
    const head = ['วันที่ทดสอบ', 'ปีงบ', 'ครั้งที่', 'กปภ.สาขา', 'สถานที่', 'ประเภท', 'ยี่ห้อ', 'รุ่น', 'ชนิด', 'ขนาด (มม.)', 'U เริ่ม', 'U ตัดยอด', 'M เริ่ม', 'M ตัดยอด', 'U (m³)', 'M (m³)', 'ตัวคูณเดิม', 'M* (m³)', 'คลาดเคลื่อน (%)', 'ตัวคูณครั้งนี้', 'ผล', 'ความเห็น', 'V (m/s)', 'สถานะการทำงาน', 'ล้างมาตร', 'อุปกรณ์ชำรุด', 'Battery MAG8000 (%)', 'หมายเหตุ', 'ผู้ทดสอบ', 'ผู้บันทึก', 'ละติจูด', 'ลองจิจูด'];
    const body = rows.map(({ t, m, c, r }) => [
      t.date, t.fiscalYear, t.round, m.branch, m.place, m.category, m.brand, m.model, m.kind, m.size,
      C.num(t.uStart), C.num(t.uEnd), C.num(t.mStart), C.num(t.mEnd),
      t.broken ? '' : +c.U.toFixed(4), t.broken ? '' : +c.M.toFixed(4), +c.k0.toFixed(4), t.broken ? '' : +c.Ms.toFixed(4),
      t.broken ? '' : +c.err.toFixed(2), t.broken ? '' : +c.k1.toFixed(4), C.RESULT[r].label, t.broken ? 'มาตรชำรุด' : (C.OPINIONS[t.opinion] || ''),
      t.velocity || '', t.workStatus || '', t.cleaned ? 'ล้างแล้ว' : '', Object.keys(t.equipment || {}).filter((k) => t.equipment[k] === 'bad').join(', '),
      t.batteryPct || '', t.note || '', (t.testers || []).filter(Boolean).join(', '), t.createdByName || t.createdBy || '',
      t.gps ? t.gps.lat : '', t.gps ? t.gps.lng : ''
    ].map((v) => (typeof v === 'number' && !isFinite(v) ? '' : v)));
    return [head].concat(body);
  }

  function summaryExcel(rows, o) {
    if (!needXLSX()) return;
    const showBranch = !o.branch;
    const title = `ตารางที่ 1 ผลการทดสอบความเที่ยงตรงของมาตรวัดน้ำหลัก กปภ.สาขา${o.branch || '…………'} ครั้งที่ ${roundLabel(o)}`;
    const h1 = ['ลำดับที่'].concat(showBranch ? ['กปภ.สาขา'] : [], ['สถานที่', 'ยี่ห้อ', 'รุ่น', 'ชนิด', 'ขนาด', 'ค่าความคลาดเคลื่อน', 'ค่าตัวคูณปรับแก้', 'หมายเหตุ']);
    const h2 = [''].concat(showBranch ? [''] : [], ['', '', '', '', '(mm.)', '(%)', '', '']);
    const body = rows.map((x, i) => [i + 1].concat(showBranch ? [x.m.branch] : [], [x.m.place, x.m.brand, x.m.model, x.m.kind, x.m.size,
      x.t.broken ? '-' : +x.c.err.toFixed(2), kOf(x) ? C.fmt(kOf(x), 4) : '-', x.t.broken ? 'มาตรชำรุด' : (x.t.note || '')]));
    const n = h1.length;
    const aoa = [[title], [], h1, h2].concat(body);
    const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: n - 1 } }];
    h1.forEach((h, i) => { if (h2[i] === '') merges.push({ s: { r: 2, c: i }, e: { r: 3, c: i } }); });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet(aoa, [8].concat(showBranch ? [14] : [], [44, 14, 16, 22, 9, 18, 16, 24]), merges), 'สรุปตารางทดสอบมาตรวัดน้ำหลัก');
    XLSX.utils.book_append_sheet(wb, sheet(detailRows(rows), null), 'ข้อมูลการคำนวณ');
    save(wb, `ตารางสรุปผลการตรวจสอบมาตรหลัก_${o.branch || 'ทุกสาขา'}_${o.round || 'ทุกครั้ง'}-${o.fy}.xlsx`);
  }

  function metersExcel(list) {
    if (!needXLSX()) return;
    const head = ['กปภ.สาขา', 'สถานที่', 'ประเภทมาตร', 'ยี่ห้อ', 'รุ่น', 'ชนิด', 'ขนาด (มม.)', 'รหัสทรัพย์สิน', 'พิกัด/ตำแหน่ง', 'สถานะ', 'ตัวคูณปัจจุบัน', 'สอบเทียบ (ครั้ง)', 'เคยใช้ตัวคูณ (ครั้ง)', 'ล้างมาตร (ครั้ง)', 'สอบเทียบล่าสุด', 'ผลล่าสุด', 'คลาดเคลื่อนล่าสุด (%)', 'อุปกรณ์ชำรุด', 'หมายเหตุ'];
    const rows = list.map((m) => {
      const s = M.stats(m.id);
      const r = M.result(s.last);
      const c = s.last ? C.calibrate(s.last, M.limit()) : null;
      return [m.branch, m.place, m.category, m.brand, m.model, m.kind, m.size, m.asset, m.lat && m.lng ? `${m.lat}, ${m.lng}` : '', C.METER_STATUS[m.status] || m.status,
        Number(m.factor) || 1, s.count, s.factorUses, s.cleanCount, s.last ? s.last.date : '', C.RESULT[r].label, c && c.valid ? +c.err.toFixed(2) : '', s.brokenNow.join(', '), m.note || ''];
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet([['รายการมาตรวัดน้ำหลัก (น้ำจ่าย/น้ำดิบ) กปภ.ข.9'], head].concat(rows), [14, 44, 13, 14, 16, 22, 10, 16, 26, 14, 10, 10, 10, 10, 13, 14, 12, 26, 24]), 'รายชื่อมาตรวัดน้ำหลัก');
    save(wb, `รายชื่อมาตรวัดน้ำหลัก_${App.branch || 'กปภ.ข9'}_${C.todayISO()}.xlsx`);
  }

  function equipmentExcel(meters, items) {
    if (!needXLSX()) return;
    const head = ['ลำดับ', 'กปภ.สาขา', 'รายการมาตรวัดน้ำหลัก', 'สถานะการทำงาน'].concat(items, ['ตรวจล่าสุด']);
    const rows = meters.map((m, i) => {
      const t = M.latest(m.id);
      const eq = (t && t.equipment) || {};
      return [i + 1, m.branch, m.place, (t && t.workStatus) || C.METER_STATUS[m.status]].concat(items.map((k) => (eq[k] ? C.EQUIP_STATE[eq[k]] : '')), [t ? t.date : '']);
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet([['รายการตรวจสอบอุปกรณ์มาตรวัดน้ำหลัก'], head].concat(rows), [6, 14, 44, 16].concat(items.map(() => 12), [12])), 'Check list');
    save(wb, `Check list มาตรวัดน้ำหลัก_${App.branch || 'กปภ.ข9'}_${C.todayISO()}.xlsx`);
  }

  function fullExcel() {
    if (!needXLSX()) return;
    const all = S.data.tests.map((t) => {
      const m = M.meter(t.meterId) || { place: t.place, branch: t.branch, brand: '', model: '', kind: '', size: '', category: '' };
      return { t, m, c: C.calibrate(t, M.limit()), r: M.result(t) };
    }).sort((a, b) => (a.t.date || '').localeCompare(b.t.date || ''));
    const wb = XLSX.utils.book_new();
    const mHead = ['id', 'branch', 'place', 'category', 'brand', 'model', 'kind', 'size', 'asset', 'lat', 'lng', 'status', 'factor', 'note'];
    XLSX.utils.book_append_sheet(wb, sheet([mHead].concat(S.data.meters.map((m) => mHead.map((k) => (m[k] === null || m[k] === undefined ? '' : m[k]))))), 'Meters');
    XLSX.utils.book_append_sheet(wb, sheet(detailRows(all)), 'Tests');
    save(wb, `meter-pwa9-ข้อมูลทั้งหมด-${C.todayISO()}.xlsx`);
  }

  // ---------- Excel import (same layout as the branch meter list workbook) ----------
  async function importMetersDialog() {
    if (!needXLSX()) return;
    const f = await UI.pickFile('.xlsx,.xls,.csv');
    if (!f) return;
    let parsed;
    try {
      const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
      parsed = parseMeterRows(rows);
    } catch (e) { return UI.toast('อ่านไฟล์ไม่ได้: ' + e.message, 'bad'); }
    if (!parsed.length) return UI.toast('ไม่พบรายการมาตร — ต้องมีหัวตาราง "กปภ.สาขา" และ "สถานที่"', 'bad');
    const key = (m) => `${m.branch}|${m.place}`.replace(/\s+/g, '').toLowerCase();
    const existing = new Map(S.data.meters.map((m) => [key(m), m]));
    let added = 0, updated = 0;
    const merged = parsed.map((p) => {
      const old = existing.get(key(p));
      if (old) {
        updated++;
        const keep = Object.assign({}, old);
        Object.keys(p).forEach((k) => { if (p[k] !== '' && p[k] !== null && p[k] !== undefined) keep[k] = p[k]; });
        return keep;
      }
      added++;
      return Object.assign({ id: C.uid('m'), status: 'active', factor: 1, maint: [] }, p);
    });
    const ok = await UI.confirm('นำเข้ารายชื่อมาตร?', `พบ ${parsed.length} รายการ — เพิ่มใหม่ ${added} · อัปเดตข้อมูลเดิม ${updated} (ช่องว่างในไฟล์จะไม่ทับข้อมูลเดิม)`, 'นำเข้า');
    if (!ok) return;
    await S.importMeters(merged);
    UI.toast(`นำเข้าแล้ว ${parsed.length} รายการ`, 'ok');
    App.route();
  }

  function parseMeterRows(rows) {
    const hi = rows.findIndex((r) => r.some((c) => String(c).includes('สถานที่')));
    if (hi < 0) return [];
    const h = rows[hi].map((c) => String(c).trim());
    const col = (...names) => h.findIndex((c) => names.some((n) => c.includes(n)));
    const ix = {
      branch: col('กปภ.สาขา', 'สาขา'), place: col('สถานที่', 'รายการมาตร'), category: col('ประเภท'), brand: col('ยี่ห้อ'),
      model: col('รุ่น'), kind: col('ชนิด'), size: col('ขนาด'), asset: col('รหัสทรัพย์สิน'), coord: col('พิกัด'), note: col('หมายเหตุ')
    };
    const get = (r, k) => (ix[k] >= 0 ? String(r[ix[k]] === undefined ? '' : r[ix[k]]).trim() : '');
    let branch = '';
    const out = [];
    rows.slice(hi + 1).forEach((r) => {
      const b = get(r, 'branch').replace(/^กปภ\.?\s*สาขา/, '').trim();
      if (b) branch = b;
      const place = get(r, 'place');
      if (!place || !branch) return;
      const ll = C.parseLatLng(get(r, 'coord'));
      const rec = { branch, place, category: get(r, 'category') || (place.includes('ดิบ') ? 'มาตรน้ำดิบ' : 'มาตรน้ำจ่าย'), brand: get(r, 'brand'), model: get(r, 'model'), kind: get(r, 'kind'), size: parseInt(get(r, 'size').replace(/[^\d]/g, ''), 10) || '', asset: get(r, 'asset'), note: get(r, 'note') };
      if (ll) { rec.lat = ll.lat; rec.lng = ll.lng; }
      out.push(rec);
    });
    return out;
  }

  window.Exports = { summaryHTML, memoHTML, printStage, printTest, memoWord, summaryExcel, metersExcel, equipmentExcel, fullExcel, importMetersDialog };
})();
