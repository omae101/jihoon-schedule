// 아이담다 포인트/보상 엔진 (로컬 저장, 자녀별 — profiles.js가 localStorage를 자녀별로 가상화)
// 계정/백엔드 없이 동작. '앱 열기=출석', '할 일 완료=적립'. 현금화 없음(=규제 없음).
(function () {
  var K = {
    pts:    '__points',          // 현재 보유 포인트(쓰면 차감)
    life:   '__points_life',     // 누적 획득(뱃지/등급용, 안 줄어듦)
    attend: '__points_attend',   // 마지막 출석일(YYYY-MM-DD)
    streak: '__points_streak',   // 연속 출석일수
    badges: '__points_badges',   // 획득 뱃지 id 배열(JSON)
    dayBonus: '__points_daybonus'// '오늘 할 일 전부 완료' 보너스 받은 날짜
  };

  function gi(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function si(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function num(k) { var v = parseInt(gi(k) || '0', 10); return isNaN(v) ? 0 : v; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  var BADGES = [
    { id: 'b100',  need: 100,  icon: '🌱', name: '새싹' },
    { id: 'b500',  need: 500,  icon: '🔥', name: '열정' },
    { id: 'b1000', need: 1000, icon: '⭐', name: '스타' },
    { id: 'b3000', need: 3000, icon: '🏆', name: '챔피언' },
    { id: 'b10000',need: 10000,icon: '👑', name: '마스터' }
  ];

  function getBadges() { try { var v = JSON.parse(gi(K.badges) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function checkBadges() {
    var life = num(K.life), have = getBadges(), changed = false;
    BADGES.forEach(function (b) {
      if (life >= b.need && have.indexOf(b.id) === -1) { have.push(b.id); changed = true; toast(b.icon + ' 뱃지 획득 · ' + b.name + '!'); }
    });
    if (changed) si(K.badges, JSON.stringify(have));
  }

  function add(n, reason) {
    n = Math.max(0, parseInt(n, 10) || 0); if (!n) return num(K.pts);
    si(K.pts, num(K.pts) + n); si(K.life, num(K.life) + n);
    toast('+' + n + 'P' + (reason ? ' · ' + reason : ''));
    checkBadges(); fireChange();
    return num(K.pts);
  }
  function spend(n) { n = parseInt(n, 10) || 0; if (num(K.pts) < n) return false; si(K.pts, num(K.pts) - n); fireChange(); return true; }

  function markAttendance() {
    var t = today(), last = gi(K.attend);
    if (last === t) return;               // 오늘 이미 출석 처리됨
    var streak = num(K.streak);
    if (last) {
      var diff = Math.round((new Date(t) - new Date(last)) / 86400000);
      streak = (diff === 1) ? streak + 1 : 1;
    } else streak = 1;
    si(K.attend, t); si(K.streak, streak);
    var bonus = 5 + Math.min(streak, 7) * 2;   // 연속일수 보너스(최대 +14)
    add(bonus, streak > 1 ? ('출석 ' + streak + '일 연속') : '출석');
  }

  function dayAllDoneBonus() {
    var t = today(); if (gi(K.dayBonus) === t) return false; si(K.dayBonus, t); add(50, '오늘 할 일 완료!'); return true;
  }

  function toast(msg) {
    try {
      var el = document.getElementById('__pts_toast');
      if (!el) {
        el = document.createElement('div'); el.id = '__pts_toast';
        el.style.cssText = 'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:#0D9488;color:#fff;padding:10px 18px;border-radius:22px;font-size:14px;font-weight:800;z-index:99999;box-shadow:0 8px 24px rgba(13,148,136,.35);opacity:0;transition:opacity .25s,transform .25s;font-family:inherit;pointer-events:none;white-space:nowrap;';
        document.body.appendChild(el);
      }
      el.textContent = msg; el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(-8px)';
      clearTimeout(el._t); el._t = setTimeout(function () { el.style.opacity = '0'; el.style.transform = 'translateX(-50%)'; }, 1900);
    } catch (e) {}
  }
  function fireChange() { try { window.dispatchEvent(new CustomEvent('hbo-points-change', { detail: { points: num(K.pts) } })); } catch (e) {} }

  window.HBOPoints = {
    get: function () { return num(K.pts); },
    lifetime: function () { return num(K.life); },
    streak: function () { return num(K.streak); },
    add: add, spend: spend, markAttendance: markAttendance, dayAllDoneBonus: dayAllDoneBonus,
    getBadges: getBadges, badgeDefs: BADGES, toast: toast
  };

  // 앱 열기 = 출석 (하루 1번만 적립)
  if (document.readyState !== 'loading') markAttendance();
  else document.addEventListener('DOMContentLoaded', markAttendance);
})();
