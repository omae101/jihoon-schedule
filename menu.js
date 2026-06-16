// 한번에 — 공용 사이드 메뉴(햄버거). 모든 화면 상단에 ☰ 표시.
(function () {
  if (document.getElementById('hboDrawer')) return; // 중복 주입 방지

  // 오늘 / 이번 달 링크용 날짜
  var d = new Date();
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var YEAR_NOW = d.getFullYear();
  var MONTH_NOW = d.getMonth() + 1;
  var TODAY_STR = YEAR_NOW + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  var css = ''
    + '.hbo-topbar{display:flex;align-items:center;gap:10px;padding:10px 16px;background:#fff;border-bottom:1px solid #E2E4E9;position:relative;z-index:10;}'
    + '.hbo-menubtn{background:#fff;border:1px solid #C9CDD4;border-radius:10px;width:40px;height:40px;font-size:19px;line-height:1;cursor:pointer;color:#17181C;flex:none;}'
    + '.hbo-menubtn:hover{border-color:#0D9488;color:#0D9488;}'
    + '.hbo-brand{font-size:16px;font-weight:700;color:#0D9488;letter-spacing:-.3px;}'
    + '.hbo-topbar,.hbo-drawer,.hbo-help,.hbo-help *{font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif !important;}'
    + '.hbo-item{line-height:1.2;}'
    + '.hbo-rem-count{margin-left:auto;background:#E06C6C;color:#fff;font-size:11px;font-weight:700;border-radius:10px;padding:0 7px;min-width:18px;text-align:center;display:none;}'
    + '.hbo-rem-on{width:100%;padding:11px;border:none;border-radius:9px;background:#0D9488;color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:12px;font-family:inherit;}'
    + '.hbo-rem-item{display:flex;align-items:center;gap:9px;padding:9px 2px;border-bottom:1px solid #EEE;text-decoration:none;color:#17181C;}'
    + '.hbo-rem-dd{font-size:11px;font-weight:800;color:#fff;border-radius:8px;padding:2px 8px;flex:none;}'
    + '.hbo-rem-txt{font-size:13.5px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.hbo-rem-date{font-size:11px;color:#9CA1AB;flex:none;}'
    + '.hbo-rem-empty{color:#9CA1AB;font-size:13px;padding:16px 4px;text-align:center;line-height:1.6;}'
    + '.hbo-overlay{position:fixed;inset:0;background:rgba(30,30,40,.45);opacity:0;visibility:hidden;transition:opacity .25s;z-index:1000;}'
    + '.hbo-overlay.on{opacity:1;visibility:visible;}'
    + '.hbo-drawer{position:fixed;top:0;left:0;bottom:0;width:270px;max-width:80vw;background:#fff;box-shadow:4px 0 24px rgba(0,0,0,.18);transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);z-index:1001;padding:14px 12px;overflow-y:auto;-webkit-overflow-scrolling:touch;}'
    + '.hbo-drawer.on{transform:translateX(0);}'
    + '.hbo-head{display:flex;align-items:center;justify-content:space-between;padding:6px 8px 14px;border-bottom:1px solid #E2E4E9;margin-bottom:8px;}'
    + '.hbo-dbrand{font-size:18px;font-weight:800;color:#0D9488;}'
    + '.hbo-close{background:none;border:none;font-size:26px;line-height:1;color:#9CA1AB;cursor:pointer;padding:0 4px;}'
    + '.hbo-item{display:flex;align-items:center;gap:11px;width:100%;padding:12px 12px;border:none;background:none;border-radius:10px;font-family:inherit;font-size:14px;font-weight:600;color:#17181C;text-align:left;text-decoration:none;cursor:pointer;}'
    + '.hbo-item:hover,.hbo-item:active{background:#CCFBF1;color:#0B7A70;}'
    + '.hbo-ic{font-size:19px;width:24px;text-align:center;flex:none;}'
    + '.hbo-divider{height:1px;background:#E2E4E9;margin:8px 6px;}'
    + '.hbo-profiles{padding:2px 4px 10px;border-bottom:1px solid #E2E4E9;margin-bottom:6px;}'
    + '.hbo-plabel{font-size:11px;font-weight:700;color:#9CA1AB;padding:2px 8px;}'
    + '.hbo-pchips{display:flex;flex-wrap:wrap;gap:6px;padding:6px 8px 0;}'
    + '.hbo-chip{display:inline-flex;align-items:center;border:1px solid #C9CDD4;background:#fff;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600;color:#17181C;cursor:pointer;font-family:inherit;}'
    + '.hbo-chip.on{background:#0D9488;border-color:#0D9488;color:#fff;}'
    + '.hbo-addchild{margin:8px 8px 0;font-size:12.5px;color:#0D9488;background:none;border:1px dashed #0D9488;border-radius:8px;padding:7px 10px;cursor:pointer;font-family:inherit;width:calc(100% - 16px);}'
    + '.hbo-delchild{margin:6px 8px 0;font-size:12px;color:#C62828;background:none;border:none;cursor:pointer;font-family:inherit;width:calc(100% - 16px);text-align:left;padding:4px 2px;}'
    + '.hbo-reset span{color:#C62828;}'
    + '.hbo-help{display:none;position:fixed;inset:0;background:rgba(30,30,40,.5);z-index:1002;justify-content:center;align-items:center;padding:20px;}'
    + '.hbo-help.on{display:flex;}'
    + '.hbo-help-box{background:#fff;border-radius:14px;padding:22px 18px;max-width:460px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.25);font-family:inherit;}'
    + '.hbo-help-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}'
    + '.hbo-help-head b{font-size:17px;color:#17181C;}'
    + '.hbo-hrow{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;}'
    + '.hbo-hic{font-size:21px;flex:none;width:26px;text-align:center;}'
    + '.hbo-hrow b{font-size:14px;color:#17181C;}'
    + '.hbo-hrow p{margin:3px 0 0;font-size:12.5px;color:#4A4E57;line-height:1.55;}'
    + '.hbo-help-done{width:100%;padding:11px;border:none;border-radius:9px;background:#0D9488;color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;font-family:inherit;}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // 상단바 (페이지 맨 위)
  var topbar = document.createElement('div');
  topbar.className = 'hbo-topbar';
  topbar.innerHTML = '<button class="hbo-menubtn" id="hboMenuBtn" aria-label="메뉴">☰</button><span class="hbo-brand">한번에</span>';
  document.body.insertBefore(topbar, document.body.firstChild);

  // 오버레이 + 드로어 + 사용법
  var holder = document.createElement('div');
  holder.innerHTML = ''
    + '<div class="hbo-overlay" id="hboOverlay"></div>'
    + '<nav class="hbo-drawer" id="hboDrawer" aria-label="메뉴">'
    +   '<div class="hbo-head"><span class="hbo-dbrand">📅 한번에</span><button class="hbo-close" id="hboClose" aria-label="닫기">×</button></div>'
    +   '<div class="hbo-profiles"><div class="hbo-plabel">자녀 (이름을 누르면 전환)</div><div class="hbo-pchips" id="hboPChips"></div><button class="hbo-addchild" id="hboAddChild">+ 자녀 추가</button><button class="hbo-delchild" id="hboDelChild" style="display:none;">🗑 현재 자녀 삭제</button></div>'
    +   '<a class="hbo-item" href="app.html"><span class="hbo-ic">🗂️</span><span>연간 계획</span></a>'
    +   '<a class="hbo-item" href="month.html?year=' + YEAR_NOW + '&month=' + MONTH_NOW + '"><span class="hbo-ic">🗓️</span><span>이번 달 달력</span></a>'
    +   '<a class="hbo-item" href="day.html?date=' + TODAY_STR + '"><span class="hbo-ic">☀️</span><span>오늘 일정</span></a>'
    +   '<a class="hbo-item" href="grade.html"><span class="hbo-ic">📊</span><span>성적 분석 <small style="color:#9CA1AB;font-weight:600;">(사주·MBTI)</small></span></a>'
    +   '<button class="hbo-item" id="hboRemBtn"><span class="hbo-ic">🔔</span><span>리마인더</span><span class="hbo-rem-count" id="hboRemCount"></span></button>'
    +   '<div class="hbo-divider"></div>'
    +   '<a class="hbo-item" href="app.html?open=school"><span class="hbo-ic">🏫</span><span>학교 시간표</span></a>'
    +   '<a class="hbo-item" href="app.html?open=academy"><span class="hbo-ic">🎒</span><span>학원 시간표</span></a>'
    +   '<button class="hbo-item" id="hboAevBtn"><span class="hbo-ic">📋</span><span>설명회·등록일</span></button>'
    +   '<div class="hbo-divider"></div>'
    +   '<button class="hbo-item" id="hboSettingsBtn"><span class="hbo-ic">⚙️</span><span>화면 설정</span></button>'
    +   '<button class="hbo-item" id="hboHelpBtn"><span class="hbo-ic">❓</span><span>사용법</span></button>'
    +   '<button class="hbo-item" id="hboShareBtn" style="color:#0B7A70;font-weight:700;"><span class="hbo-ic">💌</span><span>친구에게 공유하기</span></button>'
    +   '<div class="hbo-divider"></div>'
    +   '<button class="hbo-item hbo-reset" id="hboReset"><span class="hbo-ic">🧹</span><span>이 자녀 데이터 초기화</span></button>'
    + '</nav>'
    + '<div class="hbo-help" id="hboHelp"><div class="hbo-help-box">'
    +   '<div class="hbo-help-head"><b>❓ 사용법</b><button class="hbo-close" id="hboHelpClose" aria-label="닫기">×</button></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">🗂️</span><div><b>3단계 구조</b><p>연간 계획 → 월간 달력 → 일별 스케줄 순서로 계획해요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">✍️</span><div><b>수행평가·시험</b><p>월간 달력에서 날짜를 눌러 입력하면, 3일 전부터 D-day 알림이 자동으로 떠요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">🔔</span><div><b>리마인더</b><p>수행평가·시험·보강·특강·설명회·학원 등록일을 입력해 두면, 메뉴의 🔔 리마인더와 홈 화면 "다가오는 일정"에 <b>D-day로 모아서</b> 떠요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">🏫</span><div><b>시간표 자동 연동</b><p>학교·학원 시간표에 요일과 함께 입력하면(예: 월,수,금), 일일계획표에 그 요일에 자동으로 떠요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">📊</span><div><b>성적·성향 분석</b><p>성적표와 사주·MBTI를 바탕으로 우리 아이 공부 성향을 분석해요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">📷</span><div><b>성적표 사진 AI 정밀분석 (유료)</b><p>성적분석 화면에서 성적표·생활기록부 사진을 끌어다 놓으면, 추가 요금으로 AI가 과목별 강·약점과 학습 경향까지 훨씬 자세하게 읽어서 분석해 줘요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">📲</span><div><b>홈화면 추가 / 알림</b><p>"홈화면 추가"로 앱처럼 쓰고, 알림을 켜면 다가온 수행평가를 알려줘요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">💾</span><div><b>백업 / 복원</b><p>데이터는 이 기기에만 저장돼요. 폰↔컴퓨터로 옮길 땐 연간 계획 화면에서 백업/복원하세요.</p></div></div>'
    +   '<button class="hbo-help-done" id="hboHelpDone">확인</button>'
    + '</div></div>'
    + '<div class="hbo-help" id="hboRem"><div class="hbo-help-box">'
    +   '<div class="hbo-help-head"><b>🔔 리마인더</b><button class="hbo-close" id="hboRemClose" aria-label="닫기">×</button></div>'
    +   '<div id="hboRemBody"></div>'
    +   '<button class="hbo-help-done" id="hboRemDone">확인</button>'
    + '</div></div>';
  while (holder.firstChild) document.body.appendChild(holder.firstChild);

  var drawer = document.getElementById('hboDrawer');
  var overlay = document.getElementById('hboOverlay');
  var help = document.getElementById('hboHelp');
  var open = function () { drawer.classList.add('on'); overlay.classList.add('on'); };
  var close = function () { drawer.classList.remove('on'); overlay.classList.remove('on'); };
  document.getElementById('hboMenuBtn').addEventListener('click', open);
  document.getElementById('hboClose').addEventListener('click', close);
  overlay.addEventListener('click', close);
  var setBtn = document.getElementById('hboSettingsBtn');
  if (setBtn) setBtn.addEventListener('click', function () { close(); if (window.Settings) window.Settings.open(); });
  var aevBtn = document.getElementById('hboAevBtn');
  if (aevBtn) aevBtn.addEventListener('click', function () { close(); if (window.AcademyEvents) window.AcademyEvents.open(); });
  document.getElementById('hboHelpBtn').addEventListener('click', function () { close(); help.classList.add('on'); });
  // 친구에게 공유 (웹 공유 API → 안 되면 링크 복사)
  function hboShare() {
    var url = (location.origin && location.origin.indexOf('http') === 0) ? location.origin : 'https://schedule-app-zeta-six.vercel.app';
    var msg = "우리 아이 학교·학원 일정, 성적, 공부 성향까지 한 곳에서 관리하는 무료 앱 '한번에' 같이 써봐요 😊";
    if (navigator.share) {
      navigator.share({ title: '한번에 — 학교·학원 일정을 한 번에', text: msg, url: url }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg + '\n' + url).then(function () { alert('공유 링크를 복사했어요!\n카카오톡 등에 붙여넣어 친구에게 알려주세요. 😊'); }).catch(function () { window.prompt('아래 링크를 복사해 공유하세요', url); });
    } else {
      window.prompt('아래 링크를 복사해 공유하세요', url);
    }
  }
  var shareBtn = document.getElementById('hboShareBtn');
  if (shareBtn) shareBtn.addEventListener('click', function () { close(); hboShare(); });
  document.getElementById('hboHelpClose').addEventListener('click', function () { help.classList.remove('on'); });
  document.getElementById('hboHelpDone').addEventListener('click', function () { help.classList.remove('on'); });
  help.addEventListener('click', function (e) { if (e.target === help) help.classList.remove('on'); });
  // 리마인더 (다가오는 수행평가·일정)
  var rem = document.getElementById('hboRem');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]; }); }
  function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function ddColor(d) { return d === 0 ? '#C62828' : d === 1 ? '#E53935' : d === 2 ? '#F57C00' : d <= 3 ? '#FB8C00' : '#0D9488'; }
  function scanDated(prefix, maxDays, icon) {
    var today = startOfToday(), out = [];
    var re = new RegExp('^' + prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '(\\d{4})-(\\d{2})-(\\d{2})$');
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      var m = k && k.match(re);
      if (!m) continue;
      var txt = (localStorage.getItem(k) || '').trim();
      if (!txt) continue;
      var d = new Date(+m[1], +m[2] - 1, +m[3]); d.setHours(0, 0, 0, 0);
      var diff = Math.round((d - today) / 86400000);
      if (diff < 0 || diff > maxDays) continue;
      txt.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (line) {
        out.push({ date: d, dateStr: m[1] + '-' + m[2] + '-' + m[3], diff: diff, text: line, icon: icon });
      });
    }
    return out;
  }
  function renderReminders() {
    var items = scanDated('jihoon-assessment-', 14, '✍️').concat(scanDated('extra_', 14, '📚'));
    if (window.AcademyEvents) {
      window.AcademyEvents.getUpcoming(14).forEach(function (e) {
        items.push({ date: e.date, dateStr: e.dateStr, diff: e.diff, text: e.text, icon: '📋' });
      });
    }
    items.sort(function (a, b) { return a.date - b.date; });
    var cnt = document.getElementById('hboRemCount');
    if (cnt) {
      var near = items.filter(function (it) { return it.diff <= 3; }).length;
      if (near > 0) { cnt.textContent = near; cnt.style.display = ''; } else cnt.style.display = 'none';
    }
    var body = document.getElementById('hboRemBody');
    if (!body) return;
    var html = '';
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      html += '<button class="hbo-rem-on" id="hboRemOn">🔔 브라우저 알림 켜기</button>';
    }
    if (!items.length) {
      html += '<div class="hbo-rem-empty">2주 안에 예정된 수행평가·일정이 없어요.<br>월간 달력에서 날짜를 눌러 입력해 보세요.</div>';
    } else {
      items.forEach(function (it) {
        var dd = it.diff === 0 ? 'D-DAY' : 'D-' + it.diff;
        var md = it.dateStr.split('-');
        html += '<a class="hbo-rem-item" href="day.html?date=' + it.dateStr + '">'
          + '<span class="hbo-rem-dd" style="background:' + ddColor(it.diff) + '">' + dd + '</span>'
          + '<span class="hbo-rem-txt">' + (it.icon ? it.icon + ' ' : '') + esc(it.text) + '</span>'
          + '<span class="hbo-rem-date">' + parseInt(md[1]) + '.' + parseInt(md[2]) + '</span></a>';
      });
    }
    body.innerHTML = html;
    var onBtn = document.getElementById('hboRemOn');
    if (onBtn) onBtn.addEventListener('click', function () {
      if ('Notification' in window) Notification.requestPermission().then(function () { renderReminders(); });
    });
  }
  document.getElementById('hboRemBtn').addEventListener('click', function () { close(); renderReminders(); rem.classList.add('on'); });
  document.getElementById('hboRemClose').addEventListener('click', function () { rem.classList.remove('on'); });
  document.getElementById('hboRemDone').addEventListener('click', function () { rem.classList.remove('on'); });
  rem.addEventListener('click', function (e) { if (e.target === rem) rem.classList.remove('on'); });
  renderReminders(); // 메뉴 배지 갱신

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); help.classList.remove('on'); rem.classList.remove('on'); } });

  // 자녀 프로필 + 초기화
  if (window.Profiles) {
    var chips = document.getElementById('hboPChips');
    var delBtn = document.getElementById('hboDelChild');
    function renderChips() {
      if (!chips) return;
      chips.innerHTML = '';
      var cur = Profiles.currentId();
      var list = Profiles.list();
      list.forEach(function (p) {
        var b = document.createElement('button');
        b.className = 'hbo-chip' + (p.id === cur ? ' on' : '');
        b.textContent = p.name;
        b.addEventListener('click', function () {
          if (p.id === cur) {
            var nn = prompt('자녀 이름 변경', p.name);
            if (nn !== null && nn.trim()) { Profiles.rename(p.id, nn); renderChips(); }
          } else { Profiles.switchTo(p.id); }
        });
        chips.appendChild(b);
      });
      if (delBtn) delBtn.style.display = list.length > 1 ? '' : 'none';
    }
    renderChips();
    var addc = document.getElementById('hboAddChild');
    if (addc) addc.addEventListener('click', function () { var n = prompt('추가할 자녀 이름'); if (n && n.trim()) Profiles.add(n); });
    if (delBtn) delBtn.addEventListener('click', function () {
      var c = Profiles.current();
      if (c && confirm('"' + c.name + '" 자녀를 삭제할까요?\n이 자녀의 모든 데이터가 지워지고 되돌릴 수 없어요.')) Profiles.remove(c.id);
    });
  }
  var reset = document.getElementById('hboReset');
  if (reset) reset.addEventListener('click', function () {
    if (window.Profiles && confirm('현재 자녀의 모든 데이터(일정·할 일·성적 등)를 지울까요?\n되돌릴 수 없어요.')) Profiles.resetCurrent();
  });
})();
