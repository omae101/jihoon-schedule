// 수행평가 D-day 알림 헬퍼
// localStorage 키 형식: jihoon-assessment-YYYY-MM-DD = "수행평가 내용"

(function (global) {
  const DAYS_AHEAD = 3;
  const ASSESSMENT_PREFIX = 'jihoon-assessment-';
  const NOTIFIED_PREFIX = 'jihoon-notified-';

  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseDateKey(key) {
    const m = key.match(/^jihoon-assessment-(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function diffDays(target, base) {
    const ms = target.getTime() - base.getTime();
    return Math.round(ms / 86400000);
  }

  function getUpcoming(maxDays, baseDate) {
    if (maxDays == null) maxDays = DAYS_AHEAD;
    let today;
    if (baseDate instanceof Date) {
      today = new Date(baseDate.getTime());
      today.setHours(0, 0, 0, 0);
    } else if (typeof baseDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(baseDate)) {
      const p = baseDate.split('-');
      today = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
      today.setHours(0, 0, 0, 0);
    } else {
      today = startOfToday();
    }
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(ASSESSMENT_PREFIX)) continue;
      const text = (localStorage.getItem(key) || '').trim();
      if (!text) continue;
      const date = parseDateKey(key);
      if (!date) continue;
      const dday = diffDays(date, today);
      if (dday < 0 || dday > maxDays) continue;
      list.push({
        date: date,
        dateStr: key.slice(ASSESSMENT_PREFIX.length),
        text: text,
        dday: dday
      });
    }
    list.sort((a, b) => a.date - b.date);
    return list;
  }

  function ddayLabel(dday) {
    if (dday === 0) return 'D-DAY';
    return 'D-' + dday;
  }

  function ddayColor(dday) {
    if (dday === 0) return '#C62828';
    if (dday === 1) return '#E53935';
    if (dday === 2) return '#F57C00';
    return '#FB8C00';
  }

  function buildBadge(dday) {
    const span = document.createElement('span');
    span.textContent = ddayLabel(dday);
    span.style.cssText =
      'display:inline-block;padding:2px 8px;border-radius:10px;' +
      'background:' + ddayColor(dday) + ';color:#fff;font-size:11px;' +
      'font-weight:700;letter-spacing:0.3px;';
    return span;
  }

  function todayStamp() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
      '-' + String(d.getDate()).padStart(2, '0');
  }

  function permissionState() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  function requestPermission() {
    if (!('Notification' in window)) return Promise.resolve('unsupported');
    if (Notification.permission === 'granted') return Promise.resolve('granted');
    if (Notification.permission === 'denied') return Promise.resolve('denied');
    return Notification.requestPermission();
  }

  function notifyUpcoming(opts) {
    opts = opts || {};
    if (permissionState() !== 'granted') return 0;
    const items = getUpcoming(opts.maxDays);
    if (!items.length) return 0;
    const stamp = todayStamp();
    let shown = 0;
    items.forEach((it) => {
      const notifKey = NOTIFIED_PREFIX + it.dateStr + '-' + stamp;
      if (localStorage.getItem(notifKey)) return;
      try {
        new Notification('수행평가 ' + ddayLabel(it.dday), {
          body: it.text + '\n(' + it.dateStr + ')',
          tag: 'assessment-' + it.dateStr,
          requireInteraction: it.dday <= 1
        });
        localStorage.setItem(notifKey, '1');
        shown++;
      } catch (e) {
        // ignore notification errors
      }
    });
    return shown;
  }

  global.Assessments = {
    getUpcoming: getUpcoming,
    ddayLabel: ddayLabel,
    ddayColor: ddayColor,
    buildBadge: buildBadge,
    permissionState: permissionState,
    requestPermission: requestPermission,
    notifyUpcoming: notifyUpcoming,
    DAYS_AHEAD: DAYS_AHEAD
  };
})(window);
