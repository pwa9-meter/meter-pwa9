/* Meter P.W.A 9 — colour themes. Loaded in <head> so the saved theme applies before the first paint.
   Each theme sets the CSS variables used across app.css; "dark" themes also swap the page surfaces. */
(function () {
  'use strict';
  const LIGHT = {
    bg: '#F3F6FA', surface: '#FFFFFF', line: '#DDE4EE', line2: '#EEF2F7', field: '#C9D3E1',
    ink: '#0E1B2C', ink2: '#33415C', muted: '#5A6B85', hover: '#F7FAFE', track: '#D7DFEA',
    ok: '#0B6E4F', okBg: '#E3F3EC', warn: '#A04A00', warnBg: '#FDF1E6', bad: '#A3122A', badBg: '#FBE8EB'
  };
  const DARK = {
    bg: '#0D1117', surface: '#161B22', line: '#2A323D', line2: '#1F262F', field: '#3A4552',
    ink: '#E6EDF3', ink2: '#B6C2CF', muted: '#8B98A6', hover: '#1C232C', track: '#2A323D',
    ok: '#4ADE80', okBg: '#11301E', warn: '#FBBF24', warnBg: '#33270B', bad: '#F87171', badBg: '#3A1517'
  };
  const THEMES = [
    { id: 'blue', name: 'น้ำเงิน กปภ.', brand: '#0B4DA2', brandInk: '#08306B', soft: '#E6EEF9', accent: '#5CC8F0' },
    { id: 'teal', name: 'เขียว-น้ำเงิน', brand: '#0B6E79', brandInk: '#07505A', soft: '#E0F2F1', accent: '#4DD0C4' },
    { id: 'green', name: 'เขียวมรกต', brand: '#1E7B4F', brandInk: '#145C3A', soft: '#E4F3EA', accent: '#7ED3A1' },
    { id: 'ocean', name: 'ฟ้าน้ำทะเล', brand: '#0277BD', brandInk: '#01579B', soft: '#E1F1FB', accent: '#4FC3F7' },
    { id: 'navy', name: 'กรมท่า-ทอง', brand: '#0A1F44', brandInk: '#06142D', soft: '#E7EBF3', accent: '#D4AF37' },
    { id: 'purple', name: 'ม่วงคราม', brand: '#5B3FA8', brandInk: '#432E80', soft: '#EEE9F8', accent: '#B39DDB' },
    { id: 'brick', name: 'ส้มอิฐ', brand: '#B5481C', brandInk: '#8A3513', soft: '#FBECE5', accent: '#F4A261' },
    { id: 'graphite', name: 'เทากราไฟต์', brand: '#37474F', brandInk: '#263238', soft: '#ECEFF1', accent: '#90A4AE' },
    { id: 'green-dark', name: 'เขียว-ดำ', dark: true, brand: '#15803D', brandInk: '#166534', soft: '#12301F', accent: '#4ADE80' },
    { id: 'teal-dark', name: 'เขียวน้ำเงิน-ดำ', dark: true, brand: '#0E7C86', brandInk: '#0B5F67', soft: '#0F2C30', accent: '#5EEAD4' },
    { id: 'blue-dark', name: 'น้ำเงิน-ดำ', dark: true, brand: '#2563EB', brandInk: '#1D4ED8', soft: '#13213F', accent: '#60A5FA' },
    { id: 'gold-dark', name: 'ดำ-ทอง', dark: true, brand: '#A16207', brandInk: '#854D0E', soft: '#2D2410', accent: '#FACC15' }
  ];

  function apply(id) {
    const t = THEMES.find((x) => x.id === id) || THEMES[0];
    const b = t.dark ? DARK : LIGHT;
    const v = {
      '--brand': t.brand, '--brand-ink': t.brandInk, '--brand-soft': t.soft, '--accent': t.accent,
      '--bg': b.bg, '--surface': b.surface, '--line': b.line, '--line-2': b.line2, '--field': b.field,
      '--ink': b.ink, '--ink-2': b.ink2, '--muted': b.muted, '--hover': b.hover, '--track': b.track,
      '--ok': b.ok, '--ok-bg': b.okBg, '--warn': b.warn, '--warn-bg': b.warnBg, '--bad': b.bad, '--bad-bg': b.badBg
    };
    const root = document.documentElement;
    Object.keys(v).forEach((k) => root.style.setProperty(k, v[k]));
    root.style.colorScheme = t.dark ? 'dark' : 'light';
    root.setAttribute('data-theme', t.id);
    root.toggleAttribute('data-dark', !!t.dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.brand);
    return t;
  }

  function saved() { try { return localStorage.getItem('mpw9.theme') || 'blue'; } catch (e) { return 'blue'; } }
  function set(id) {
    try { localStorage.setItem('mpw9.theme', id); } catch (e) { /* private mode */ }
    return apply(id);
  }

  window.Theme = { THEMES, apply, set, current: saved };
  apply(saved());
})();
