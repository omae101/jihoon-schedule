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
    var css =
      ':root{' +
      '--bg:' + bg + ' !important;--surface-soft:' + mix(bg, '#FFFFFF', 0.5) + ' !important;' +
      '--text-main:' + text + ' !important;--text:' + text + ' !important;--ink:' + text + ' !important;' +
      '--accent:' + accent + ' !important;--accent-dark:' + dark + ' !important;--accent-soft:' + soft + ' !important;' +
      '}' +
      'body{font-family:' + font + ' !important;}';
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
      + '.__st-btn.pri{background:#0D9488;border-color:#0D9488;color:#fff;}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

    var box = document.createElement('div');
    box.className = '__st-ov';
    box.id = '__stModal';
    box.innerHTML =
      '<div class="__st-box">' +
        '<div class="__st-head"><b>⚙️ 화면 설정</b><button class="__st-x" id="__stX">×</button></div>' +
        '<div class="__st-row"><label>글씨 색</label><input type="color" id="__stText"></div>' +
        '<div class="__st-row"><label>바탕 색</label><input type="color" id="__stBg"></div>' +
        '<div class="__st-row"><label>제목·포인트 색</label><input type="color" id="__stAccent"></div>' +
        '<div class="__st-row"><label>글씨 모양</label><select id="__stFont"></select></div>' +
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

    var tEl = document.getElementById('__stText');
    var bEl = document.getElementById('__stBg');
    var aEl = document.getElementById('__stAccent');
    var fEl = document.getElementById('__stFont');
    FONT_ORDER.forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = FONTS[k].label;
      fEl.appendChild(o);
    });
    var lEl = document.getElementById('__stLang');

    function fill() {
      tEl.value = get('text', DEF.text);
      bEl.value = get('bg', DEF.bg);
      aEl.value = get('accent', DEF.accent);
      fEl.value = get('font', DEF.font);
      lEl.value = 'ko';
    }
    fill();

    tEl.addEventListener('input', function () { set('text', tEl.value); apply(); });
    bEl.addEventListener('input', function () { set('bg', bEl.value); apply(); });
    aEl.addEventListener('input', function () { set('accent', aEl.value); apply(); });
    fEl.addEventListener('change', function () { set('font', fEl.value); apply(); });
    lEl.addEventListener('change', function () {
      if (lEl.value === 'en') { alert('영어 버전은 준비 중이에요. 곧 추가할게요!'); lEl.value = 'ko'; }
    });

    document.getElementById('__stReset').addEventListener('click', function () {
      set('text', DEF.text); set('bg', DEF.bg); set('accent', DEF.accent); set('font', DEF.font);
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
