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

  function roundLabel(o) { return `${o.round || '…'}/${o.fy}`; }

  // ---------- summary table (ตารางสรุปผลการตรวจสอบมาตรหลัก) ----------
  function summaryHTML(rows, o) {
    const showBranch = !o.branch;
    const body = rows.map((x, i) => `<tr>
      <td class="c">${i + 1}</td>${showBranch ? `<td>${esc(x.m.branch)}</td>` : ''}<td>${esc(x.m.place)}</td><td>${esc(x.m.brand)}</td><td>${esc(x.m.model)}</td>
      <td>${esc(x.m.kind)}</td><td class="c">${esc(x.m.size)}</td>
      <td class="c">${x.t.broken ? '-' : C.fmtSigned(x.c.err, 2)}</td>
      <td class="c">${x.k ? C.fmt(x.k, 4) : '-'}</td>
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
    return {
      s, memo, period, factorRows, brokenRows,
      branch: o.branch || '…………',
      no: th(memo.no || '…………………'),
      date: th(memo.dateText || (memo.date ? C.thDate(memo.date, true) : '…………………')),
      effective: th(memo.effective || '…………………'),
      round: th(o.round || '…'), fy: th(o.fy)
    };
  }

  function memoHTML(rows, o) {
    const p = memoParts(rows, o);
    const ed = (key, val) => o.editable ? `<span class="editable" contenteditable="true" data-memo="${key}" title="แก้ไขได้">${esc(val)}</span>` : esc(val);
    const factorList = p.factorRows.length
      ? p.factorRows.map((x, i) => `<div class="memo-list">${th(i + 1)}. ${esc(x.m.place)} ค่าตัวคูณปรับแก้ ${th(C.fmt(x.k, 4))}</div>`).join('')
      : '<div class="memo-list">– ไม่มีมาตรที่ต้องใช้ค่าตัวคูณปรับแก้</div>';
    const broken = p.brokenRows.length ? `<p class="memo-p">ทั้งนี้ มีมาตรวัดน้ำหลักชำรุดไม่สามารถทดสอบได้ จำนวน ${th(p.brokenRows.length)} แห่ง ได้แก่ ${p.brokenRows.map((x) => esc(x.m.place)).join(', ')} เห็นควรแจ้งสาขาดำเนินการซ่อมแซมต่อไป</p>` : '';
    return `<div class="doc-stage"><div class="paper paper-port">
      <div class="memo-title">บันทึกข้อความ</div>
      <div class="memo-line"><b>ส่วนราชการ</b><span>${esc(p.s.unitLine)}</span></div>
      <div class="memo-line" style="gap:80px"><span><b>ที่</b> ${ed('no', p.no)}</span><span><b>วันที่</b> ${ed('dateText', p.date)}</span></div>
      <div class="memo-line"><b>เรื่อง</b><span>รายงานผลการทดสอบมาตรวัดน้ำหลัก กปภ.สาขา${esc(p.branch)} ครั้งที่ ${p.round} ประจำปีงบประมาณ ${p.fy}</span></div>
      <div class="memo-rule"></div>
      <div class="memo-line"><b>เรียน</b><span>${esc(p.s.addressee)}</span></div>
      <p class="memo-p">ตามที่งานมาตรวัดน้ำ ได้รับมอบหมายให้ไปดำเนินการตรวจสอบความเที่ยงตรงของมาตรวัดน้ำหลัก ครั้งที่ ${p.round} ตามแผนการปฏิบัติงานงานมาตรวัดน้ำ ประจำปีงบประมาณ ${p.fy} ณ กปภ.สาขา${esc(p.branch)} ระหว่างวันที่ ${ed('period', p.period)} นั้น</p>
      <p class="memo-p">งานมาตรวัดน้ำ ได้ดำเนินการตรวจสอบความเที่ยงตรงของมาตรวัดน้ำหลัก จำนวน ${th(rows.length)} แห่ง และได้จัดทำสรุปผลการตรวจสอบตามตาราง (เอกสารแนบท้าย) โดยมีสถานที่ที่ต้องใช้ค่าตัวคูณปรับแก้ ดังนี้</p>
      ${factorList}
      ${broken}
      <p class="memo-p">จึงเรียนมาเพื่อโปรดทราบ และพิจารณาแจ้ง กปภ.สาขา${esc(p.branch)} ให้ใช้ค่าตัวคูณปรับแก้ ตั้งแต่วันที่ ${ed('effective', p.effective)} เป็นต้นไป จะขอบคุณยิ่ง</p>
      <div class="memo-sign">(${ed('signer', p.memo.signer || p.s.signerName || '……………………………')})<br>${esc(p.s.signerTitle)}</div>
    </div></div>`;
  }

  // ---------- print via hidden iframe (→ "Save as PDF") ----------
  function printHTML(inner, landscape, title) {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const doc = f.contentDocument;
    doc.open();
    doc.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(title || 'Meter P.W.A 9')}</title>
      <style>${DOC_CSS}@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:${landscape ? '10mm' : '18mm 18mm 18mm 12mm'}}</style></head><body>${inner}</body></html>`);
    doc.close();
    const go = () => {
      f.contentWindow.focus();
      f.contentWindow.print();
      setTimeout(() => f.remove(), 2000);
    };
    (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(() => setTimeout(go, 250));
  }
  function printStage(stage, landscape) {
    const paper = stage.querySelector('.paper');
    if (!paper) return UI.toast('ไม่มีเอกสารให้พิมพ์', 'bad');
    const clone = paper.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach((e) => e.removeAttribute('contenteditable'));
    printHTML(clone.outerHTML, landscape, 'รายงานผลการตรวจสอบมาตรวัดน้ำหลัก');
    UI.toast('เลือก "บันทึกเป็น PDF" ในหน้าต่างพิมพ์เพื่อได้ไฟล์ PDF');
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
      <div class="ts-h">Ultrasonic Flowmeter เขตฯ (U)</div>
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

  // ---------- Word memo (.doc, HTML that Word opens natively) ----------
  function memoWord(rows, o) {
    const p = memoParts(rows, o);
    const factorList = p.factorRows.length
      ? p.factorRows.map((x, i) => `<p style="margin:0 0 0 1.9in">${th(i + 1)}. ${esc(x.m.place)} ค่าตัวคูณปรับแก้ ${th(C.fmt(x.k, 4))}</p>`).join('')
      : '<p style="margin:0 0 0 1.9in">– ไม่มีมาตรที่ต้องใช้ค่าตัวคูณปรับแก้</p>';
    const broken = p.brokenRows.length ? `<p style="text-indent:1in;margin:0">ทั้งนี้ มีมาตรวัดน้ำหลักชำรุดไม่สามารถทดสอบได้ จำนวน ${th(p.brokenRows.length)} แห่ง ได้แก่ ${p.brokenRows.map((x) => esc(x.m.place)).join(', ')} เห็นควรแจ้งสาขาดำเนินการซ่อมแซมต่อไป</p>` : '';
    const table = summaryHTML(rows, o).replace(/class="doc-tbl"/, 'border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;width:100%;font-size:14pt"');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>บันทึกข้อความ</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page Section1{size:595.3pt 841.9pt;margin:72pt 72pt 72pt 85pt}
@page Section2{size:841.9pt 595.3pt;mso-page-orientation:landscape;margin:36pt}
div.Section1{page:Section1} div.Section2{page:Section2}
body,p,td,th,div{font-family:'TH SarabunPSK','TH Sarabun New',Sarabun;font-size:16pt}
th{background:#EEF3FA}
.doc-title{text-align:center;font-weight:bold}
</style></head><body>
<div class="Section1">
<p style="text-align:center;font-size:29pt;font-weight:bold;margin:0">บันทึกข้อความ</p>
<p style="margin:0"><b>ส่วนราชการ</b> ${esc(p.s.unitLine)}</p>
<p style="margin:0"><b>ที่</b> ${esc(p.no)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>วันที่</b> ${esc(p.date)}</p>
<p style="margin:0;border-bottom:1px solid #000"><b>เรื่อง</b> รายงานผลการทดสอบมาตรวัดน้ำหลัก กปภ.สาขา${esc(p.branch)} ครั้งที่ ${p.round} ประจำปีงบประมาณ ${p.fy}</p>
<p style="margin:6pt 0 0"><b>เรียน</b> ${esc(p.s.addressee)}</p>
<p style="text-indent:1in;margin:0">ตามที่งานมาตรวัดน้ำ ได้รับมอบหมายให้ไปดำเนินการตรวจสอบความเที่ยงตรงของมาตรวัดน้ำหลัก ครั้งที่ ${p.round} ตามแผนการปฏิบัติงานงานมาตรวัดน้ำ ประจำปีงบประมาณ ${p.fy} ณ กปภ.สาขา${esc(p.branch)} ระหว่างวันที่ ${esc(p.period)} นั้น</p>
<p style="text-indent:1in;margin:0">งานมาตรวัดน้ำ ได้ดำเนินการตรวจสอบความเที่ยงตรงของมาตรวัดน้ำหลัก จำนวน ${th(rows.length)} แห่ง และได้จัดทำสรุปผลการตรวจสอบตามตาราง (เอกสารแนบท้าย) โดยมีสถานที่ที่ต้องใช้ค่าตัวคูณปรับแก้ ดังนี้</p>
${factorList}${broken}
<p style="text-indent:1in;margin:0">จึงเรียนมาเพื่อโปรดทราบ และพิจารณาแจ้ง กปภ.สาขา${esc(p.branch)} ให้ใช้ค่าตัวคูณปรับแก้ ตั้งแต่วันที่ ${esc(p.effective)} เป็นต้นไป จะขอบคุณยิ่ง</p>
<p>&nbsp;</p><p>&nbsp;</p>
<p style="margin:0 0 0 3in;text-align:center">(${esc(p.memo.signer || p.s.signerName || '……………………………')})<br>${esc(p.s.signerTitle)}</p>
</div>
<br clear="all" style="page-break-before:always;mso-break-type:section-break">
<div class="Section2">${table.replace(/<div class="doc-stage">|<\/div><\/div>$/g, '')}</div>
</body></html>`;
    UI.download(`บันทึกข้อความ_${p.branch.replace(/[\\/:*?"<>|.…]/g, '') || 'สาขา'}_${o.round || 'x'}-${o.fy}.doc`, new Blob(['﻿', html], { type: 'application/msword' }));
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
  function save(wb, name) { XLSX.writeFile(wb, name, { compression: true }); }

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
      x.t.broken ? '-' : +x.c.err.toFixed(2), x.k ? +x.k.toFixed(4) : '-', x.t.broken ? 'มาตรชำรุด' : (x.t.note || '')]));
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
