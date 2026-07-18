// 아이담다 — 오랜만에 돌아온 사용자 반겨주기 (리텐션)
// 하루 이상 앱을 '건너뛰고' 다시 오면, 메인에서 살짝 인사 + 오늘 할 일/수행평가 요약.
// 매일 쓰는 사람은 안 귀찮게(하루 건너뛴 경우만). __last_seen(기기 전역)로 판단 → 동기화엔 안 섞임.
(function () {
  var K = '__last_seen';
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function toDate(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function gapDays(a, b) { return Math.round((toDate(a) - toDate(b)) / 86400000); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  function run() {
    var today = todayStr(), last = null;
    try { last = localStorage.getItem(K); } catch (e) {}
    try { localStorage.setItem(K, today); } catch (e) {}
    if (!last) return;                 // 첫 방문 → 인사 안 함
    var gap = gapDays(today, last);
    if (gap < 2) return;               // 하루라도 '건너뛴' 경우만(매일 쓰는 사람 안 귀찮게)

    var todos = 0;
    try { var raw = localStorage.getItem('todo_' + today); if (raw) { var arr = JSON.parse(raw); if (arr && arr.length) todos = arr.filter(function (t) { return t && !t.done; }).length; } } catch (e) {}
    var up = [];
    try { up = (window.Assessments && Assessments.getUpcoming) ? Assessments.getUpcoming() : []; } catch (e) {}

    var when = gap >= 7 ? ('오랜만이에요! ' + gap + '일 만이네요') : (gap === 2 ? '이틀 만이에요' : gap + '일 만이에요');
    var lines = [];
    if (todos > 0) lines.push('오늘 할 일 ' + todos + '개');
    if (up.length) { var f = up[0]; lines.push('수행평가 ' + (f.dday === 0 ? 'D-DAY' : 'D-' + f.dday)); }
    var sub = lines.length ? lines.join(' · ') : '오늘도 차근차근 해봐요 🙂';

    show(when, sub);
  }

  function show(title, sub) {
    if (document.getElementById('wbToast')) return;
    var wrap = document.createElement('div');
    wrap.id = 'wbToast';
    wrap.setAttribute('role', 'status');
    wrap.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%) translateY(-14px);z-index:9999;'
      + 'max-width:min(420px,92vw);width:max-content;background:#0D9488;color:#fff;'
      + 'border-radius:14px;padding:12px 14px;box-shadow:0 8px 24px rgba(13,148,136,.35);'
      + 'font-family:inherit;opacity:0;transition:opacity .25s,transform .25s;display:flex;align-items:center;gap:10px;';
    wrap.innerHTML = '<span style="font-size:20px;line-height:1;">👋</span>'
      + '<div style="flex:1;min-width:0;"><div style="font-weight:800;font-size:15px;">' + esc(title) + '</div>'
      + '<div style="font-size:13px;opacity:.95;margin-top:2px;">' + esc(sub) + '</div></div>'
      + '<button type="button" aria-label="닫기" style="background:rgba(255,255,255,.2);border:none;color:#fff;width:24px;height:24px;border-radius:50%;font-size:15px;line-height:1;cursor:pointer;flex:none;">×</button>';
    document.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.style.opacity = '1'; wrap.style.transform = 'translateX(-50%) translateY(0)'; });
    var close = function () { wrap.style.opacity = '0'; wrap.style.transform = 'translateX(-50%) translateY(-14px)'; setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 260); };
    wrap.querySelector('button').addEventListener('click', close);
    setTimeout(close, 7000);
  }

  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
})();
