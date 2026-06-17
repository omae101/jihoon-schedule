// 한번에 — 테마(설정) 엔진. 글씨색·바탕색·제목색·글씨모양을 앱 전체에 적용.
// 설정값은 '__theme_*' 키(profiles.js에서 자녀와 무관한 공용 키)로 저장.
(function () {
  var LS = window.localStorage;
  // 파스텔 기본 톤
  var DEF = { text: '#3A3B42', bg: '#F5F3EF', accent: '#3E9D90', font: 'pretendard' };
  var FONTS = {
    pretendard: { label: '기본 (깔끔)', stack: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',-apple-system,BlinkMacSystemFont,sans-serif" },
    gothic: { label: '고딕', stack: "'Apple SD Gothic Neo','Malgun Gothic',sans-serif" },
    gowun: { label: '고운돋움 (모던)', stack: "'Gowun Dodum','Apple SD Gothic Neo',sans-serif", href: 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap' },
    jua: { label: '주아 (동글동글) 🧒', stack: "'Jua','Apple SD Gothic Neo',sans-serif", href: 'https://fonts.googleapis.com/css2?family=Jua&display=swap' },
    dohyeon: { label: '도현 (시원·굵게)', stack: "'Do Hyeon','Apple SD Gothic Neo',sans-serif", href: 'https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap' },
    blackhan: { label: '검은고딕 (임팩트)', stack: "'Black Han Sans','Apple SD Gothic Neo',sans-serif", href: 'https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap' },
    nanumpen: { label: '손글씨 (펜)', stack: "'Nanum Pen Script','Apple SD Gothic Neo',cursive", href: 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap' },
    serif: { label: '명조 (붓글씨 느낌)', stack: "'Nanum Myeongjo','Apple SD Gothic Neo',serif", href: 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo&display=swap' }
  };
  var FONT_ORDER = ['pretendard', 'gothic', 'gowun', 'jua', 'dohyeon', 'blackhan', 'nanumpen', 'serif'];
  function ensureFont(href) {
    if (!href) return;
    if (document.querySelector('link[data-fonthref="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-fonthref', href);
    (document.head || document.documentElement).appendChild(l);
  }

  function get(k, d) { try { return LS.getItem('__theme_' + k) || d; } catch (e) { return d; } }
  function set(k, v) { try { LS.setItem('__theme_' + k, v); } catch (e) {} }

  // 중요표시 마크(이모지 X · 단색 벡터). 24x24 viewBox path/shape.
  var MARKS = {
    star: '<path d="M12 3.2 l2.45 4.97 5.48 .8 -3.97 3.87 .94 5.46 -4.9 -2.58 -4.9 2.58 .94 -5.46 -3.97 -3.87 5.48 -.8 z"/>',
    heart: '<path d="M12 20.5 C 5 15.5 3.5 11.2 3.5 8.3 A 4.3 4.3 0 0 1 12 6.4 A 4.3 4.3 0 0 1 20.5 8.3 C 20.5 11.2 19 15.5 12 20.5 Z"/>',
    dot: '<circle cx="12" cy="12" r="6.2"/>',
    sparkle: '<path d="M12 2.5 C 12.6 7.8 16.2 11.4 21.5 12 C 16.2 12.6 12.6 16.2 12 21.5 C 11.4 16.2 7.8 12.6 2.5 12 C 7.8 11.4 11.4 7.8 12 2.5 Z"/>',
    diamond: '<path d="M12 3.2 a2 2 0 0 1 1.5 .6 l6.7 6.7 a2 2 0 0 1 0 2.9 l-6.7 6.7 a2 2 0 0 1 -2.9 0 l-6.7 -6.7 a2 2 0 0 1 0 -2.9 l6.7 -6.7 a2 2 0 0 1 1.4 -.6 z"/>',
    bookmark: '<path d="M7 3.5 h10 a1.5 1.5 0 0 1 1.5 1.5 v15.2 a0.8 0.8 0 0 1 -1.25 .66 L12 17.2 l-5.25 3.66 A0.8 0.8 0 0 1 5.5 20.2 V5 A1.5 1.5 0 0 1 7 3.5 Z"/>'
  };
  var MARK_ORDER = ['star', 'heart', 'dot', 'sparkle', 'diamond', 'bookmark'];
  var MARK_COLORS = ['#0D9488', '#E8A13A', '#E06B7E', '#3A3B42'];
  var DEF_MARK = 'star', DEF_MARKCOLOR = '#E8A13A';
  // 화면설정 색 팔레트 (폰 기본 색창 대신 탭으로 고르기 — 이상한 숫자 안 뜸)
  var TEXT_COLORS = ['#2E2F36', '#3A3B42', '#4A4A4A', '#2C3E50', '#5C4033', '#1F4E48', '#6B4E71'];
  var BG_COLORS = ['#F5F3EF', '#FFFFFF', '#FFF9F0', '#F0F7F4', '#FDEFF2', '#EEF2FB', '#EAF4F0'];
  var ACCENT_COLORS = ['#0D9488', '#3E9D90', '#E8A13A', '#E06B7E', '#4F46E5', '#2563EB', '#DB2777', '#16A34A', '#EA580C', '#0EA5E9'];
  // 마스크용 data-URI (alpha 마스크 — 색은 background-color로 입힘)
  function markUri(key) {
    var inner = MARKS[key] || MARKS.star;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000">' + inner + '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  // 색 계산 헬퍼
  function hx(c) { c = String(c).replace('#', ''); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function toHex(r) { return '#' + r.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return ('0' + v.toString(16)).slice(-2); }).join(''); }
  function shade(hex, pct) { var c = hx(hex), f = pct / 100; return toHex(c.map(function (v) { return v + (pct < 0 ? v * f : (255 - v) * f); })); }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return toHex([0, 1, 2].map(function (i) { return x[i] * (1 - t) + y[i] * t; })); }

  function apply() {
    var text = get('text', DEF.text);
    var bg = get('bg', DEF.bg);
    var accent = get('accent', DEF.accent);
    var fdef = FONTS[get('font', DEF.font)] || FONTS.pretendard;
    ensureFont(fdef.href);
    var font = fdef.stack;
    var dark = shade(accent, -18);
    var soft = mix(accent, bg, 0.82); // 아주 연한 파스텔 배경용
    var zoom = get('zoom', '1');
    var markcolor = get('markcolor', DEF_MARKCOLOR);
    var mk = markUri(get('markshape', DEF_MARK));
    var css =
      'html{zoom:' + zoom + ';}' +
      ':root{' +
      '--bg:' + bg + ' !important;--surface-soft:' + mix(bg, '#FFFFFF', 0.5) + ' !important;' +
      '--text-main:' + text + ' !important;--text:' + text + ' !important;--ink:' + text + ' !important;' +
      '--accent:' + accent + ' !important;--accent-dark:' + dark + ' !important;--accent-soft:' + soft + ' !important;' +
      '--mark-color:' + markcolor + ' !important;' +
      '}' +
      'body{font-family:' + font + ' !important;}' +
      // 달력·숫자·제목·표·입력칸 등 '구조'는 어떤 글씨체를 골라도 항상 깔끔한 기본 글씨로 (레이아웃 깨짐 방지)
      'table,th,td,.mini-month,.mini-h,.mini-wd,.mini-d,.day-number,.day-top,.nav-arrow,.month-switch,h1,h2,h3,input,select,.year-nav,.day-chip{font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif !important;}' +
      // 중요표시(★) → 사용자가 고른 벡터 마크/색으로 렌더 (마스크 기법)
      '.star{box-sizing:border-box !important;width:24px !important;height:24px !important;padding:2px !important;font-size:0 !important;color:transparent !important;background-color:#D2D7DD !important;-webkit-mask:' + mk + ' center/contain no-repeat;mask:' + mk + ' center/contain no-repeat;}' +
      '.star.on{background-color:var(--mark-color) !important;}' +
      '.todo.important{box-shadow:inset 3px 0 0 var(--mark-color) !important;}';
    var el = document.getElementById('__theme_css');
    if (!el) {
      el = document.createElement('style');
      el.id = '__theme_css';
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = css;
  }
  apply();

  // ---------- 설정 창 ----------
  function buildModal() {
    if (document.getElementById('__stModal')) return;
    var css = ''
      + '.__st-ov,.__st-ov *{font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif !important;}'
      + '.__st-ov{display:none;position:fixed;inset:0;background:rgba(30,30,40,.5);z-index:1003;justify-content:center;align-items:center;padding:20px;}'
      + '.__st-ov.on{display:flex;}'
      + '.__st-box{background:#fff;border-radius:14px;padding:20px 18px;max-width:380px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.25);font-family:inherit;}'
      + '.__st-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}'
      + '.__st-head b{font-size:17px;color:#17181C;}'
      + '.__st-x{background:none;border:none;font-size:26px;color:#9CA1AB;cursor:pointer;}'
      + '.__st-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 2px;border-bottom:1px solid #EEE;}'
      + '.__st-row label{font-size:14px;font-weight:600;color:#17181C;}'
      + '.__st-row input[type=color]{width:46px;height:30px;border:1px solid #C9CDD4;border-radius:6px;background:#fff;cursor:pointer;padding:2px;}'
      + '.__st-row select{font-family:inherit;font-size:14px;padding:7px 10px;border:1px solid #C9CDD4;border-radius:8px;background:#fff;}'
      + '.__st-actions{display:flex;gap:8px;margin-top:16px;}'
      + '.__st-btn{flex:1;padding:11px;border-radius:9px;border:1px solid #C9CDD4;background:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;color:#17181C;}'
      + '.__st-btn.pri{background:#0D9488;border-color:#0D9488;color:#fff;}'
      + '.__st-marks{display:flex;gap:8px;flex-wrap:wrap;}'
      + '.__st-m{width:38px;height:38px;border-radius:10px;border:2px solid #E5E8EC;background:#F6F7F8;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;}'
      + '.__st-m i{width:22px;height:22px;display:block;background-color:#8A9099;}'
      + '.__st-m.on{border-color:#0D9488;background:#E9F6F4;}'
      + '.__st-m.on i{background-color:#0D9488;}'
      + '.__st-c{width:32px;height:32px;border-radius:999px;border:3px solid transparent;cursor:pointer;padding:0;}'
      + '.__st-c.on{border-color:#17181C;}'
      + '.__st-row.col{display:block;}'
      + '.__st-row.col > label{display:block;margin-bottom:8px;}'
      + '.__st-sw{width:30px;height:30px;border-radius:999px;border:2px solid #E5E8EC;cursor:pointer;padding:0;box-shadow:inset 0 0 0 1px rgba(0,0,0,.05);}'
      + '.__st-sw.on{border-color:#17181C;}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

    var box = document.createElement('div');
    box.className = '__st-ov';
    box.id = '__stModal';
    box.innerHTML =
      '<div class="__st-box">' +
        '<div class="__st-head"><b>⚙️ 화면 설정</b><button class="__st-x" id="__stX">×</button></div>' +
        '<div class="__st-row col"><label>글씨 색</label><div class="__st-marks" id="__stTextC"></div></div>' +
        '<div class="__st-row col"><label>바탕 색</label><div class="__st-marks" id="__stBgC"></div></div>' +
        '<div class="__st-row col"><label>제목·포인트 색</label><div class="__st-marks" id="__stAccentC"></div></div>' +
        '<div class="__st-row"><label>글씨 모양</label><select id="__stFont"></select></div>' +
        '<div class="__st-row"><label>중요표시 모양</label><div class="__st-marks" id="__stMarkShape"></div></div>' +
        '<div class="__st-row"><label>중요표시 색</label><div class="__st-marks" id="__stMarkColor"></div></div>' +
        '<div class="__st-row"><label>글자 크기</label><select id="__stZoom">' +
          '<option value="0.85">아주 작게</option>' +
          '<option value="0.95">작게</option>' +
          '<option value="1">보통</option>' +
          '<option value="1.1">크게</option>' +
          '<option value="1.25">아주 크게</option>' +
        '</select></div>' +
        '<div class="__st-row"><label>언어 / Language</label><select id="__stLang">' +
          '<option value="ko">한국어</option>' +
          '<option value="en">English (준비 중)</option>' +
        '</select></div>' +
        '<div class="__st-actions">' +
          '<button class="__st-btn" id="__stReset">기본값으로</button>' +
          '<button class="__st-btn pri" id="__stDone">완료</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);

    var fEl = document.getElementById('__stFont');
    function selSw(wrap, key, def) {
      var cur = get(key, def).toLowerCase();
      [].forEach.call(wrap.children, function (b) { b.className = '__st-sw' + (b.getAttribute('data-c').toLowerCase() === cur ? ' on' : ''); });
    }
    function buildSwatches(wrapId, key, palette, def) {
      var wrap = document.getElementById(wrapId);
      palette.forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.className = '__st-sw'; b.setAttribute('data-c', c); b.style.background = c;
        b.addEventListener('click', function () { set(key, c); apply(); selSw(wrap, key, def); });
        wrap.appendChild(b);
      });
      return wrap;
    }
    var textWrap = buildSwatches('__stTextC', 'text', TEXT_COLORS, DEF.text);
    var bgWrap = buildSwatches('__stBgC', 'bg', BG_COLORS, DEF.bg);
    var accentWrap = buildSwatches('__stAccentC', 'accent', ACCENT_COLORS, DEF.accent);
    FONT_ORDER.forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = FONTS[k].label;
      fEl.appendChild(o);
    });
    var zEl = document.getElementById('__stZoom');
    var lEl = document.getElementById('__stLang');

    // 중요표시 모양/색 선택 버튼 만들기
    var shapeWrap = document.getElementById('__stMarkShape');
    var colorWrap = document.getElementById('__stMarkColor');
    MARK_ORDER.forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = '__st-m'; b.setAttribute('data-k', k);
      var i = document.createElement('i');
      i.style.setProperty('-webkit-mask', markUri(k) + ' center/contain no-repeat');
      i.style.setProperty('mask', markUri(k) + ' center/contain no-repeat');
      b.appendChild(i);
      b.addEventListener('click', function () { set('markshape', k); apply(); markSel(); });
      shapeWrap.appendChild(b);
    });
    MARK_COLORS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = '__st-c'; b.setAttribute('data-c', c); b.style.background = c;
      b.addEventListener('click', function () { set('markcolor', c); apply(); markSel(); });
      colorWrap.appendChild(b);
    });
    function markSel() {
      var sh = get('markshape', DEF_MARK), co = get('markcolor', DEF_MARKCOLOR).toLowerCase();
      [].forEach.call(shapeWrap.children, function (b) { b.className = '__st-m' + (b.getAttribute('data-k') === sh ? ' on' : ''); });
      [].forEach.call(colorWrap.children, function (b) { b.className = '__st-c' + (b.getAttribute('data-c').toLowerCase() === co ? ' on' : ''); });
    }

    function fill() {
      fEl.value = get('font', DEF.font);
      zEl.value = get('zoom', '1');
      lEl.value = 'ko';
      selSw(textWrap, 'text', DEF.text);
      selSw(bgWrap, 'bg', DEF.bg);
      selSw(accentWrap, 'accent', DEF.accent);
      markSel();
    }
    fill();

    zEl.addEventListener('change', function () { set('zoom', zEl.value); apply(); });
    fEl.addEventListener('change', function () { set('font', fEl.value); apply(); });
    lEl.addEventListener('change', function () {
      if (lEl.value === 'en') { alert('영어 버전은 준비 중이에요. 곧 추가할게요!'); lEl.value = 'ko'; }
    });

    document.getElementById('__stReset').addEventListener('click', function () {
      set('text', DEF.text); set('bg', DEF.bg); set('accent', DEF.accent); set('font', DEF.font); set('zoom', '1');
      set('markshape', DEF_MARK); set('markcolor', DEF_MARKCOLOR);
      apply(); fill();
    });
    var close = function () { box.classList.remove('on'); };
    document.getElementById('__stX').addEventListener('click', close);
    document.getElementById('__stDone').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
  }

  function openSettings() {
    buildModal();
    document.getElementById('__stModal').classList.add('on');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildModal);
  } else {
    buildModal();
  }

  window.Settings = { open: openSettings, apply: apply };
})();
