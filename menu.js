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
    + '.hbo-overlay{position:fixed;inset:0;background:rgba(30,30,40,.45);opacity:0;visibility:hidden;transition:opacity .25s;z-index:1000;}'
    + '.hbo-overlay.on{opacity:1;visibility:visible;}'
    + '.hbo-drawer{position:fixed;top:0;left:0;bottom:0;width:270px;max-width:80vw;background:#fff;box-shadow:4px 0 24px rgba(0,0,0,.18);transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);z-index:1001;padding:14px 12px;overflow-y:auto;-webkit-overflow-scrolling:touch;}'
    + '.hbo-drawer.on{transform:translateX(0);}'
    + '.hbo-head{display:flex;align-items:center;justify-content:space-between;padding:6px 8px 14px;border-bottom:1px solid #E2E4E9;margin-bottom:8px;}'
    + '.hbo-dbrand{font-size:18px;font-weight:800;color:#0D9488;}'
    + '.hbo-close{background:none;border:none;font-size:26px;line-height:1;color:#9CA1AB;cursor:pointer;padding:0 4px;}'
    + '.hbo-item{display:flex;align-items:center;gap:12px;width:100%;padding:13px 12px;border:none;background:none;border-radius:10px;font-family:inherit;font-size:15px;font-weight:600;color:#17181C;text-align:left;text-decoration:none;cursor:pointer;}'
    + '.hbo-item:hover,.hbo-item:active{background:#CCFBF1;color:#0B7A70;}'
    + '.hbo-ic{font-size:19px;width:24px;text-align:center;flex:none;}'
    + '.hbo-divider{height:1px;background:#E2E4E9;margin:8px 6px;}'
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
    +   '<a class="hbo-item" href="app.html"><span class="hbo-ic">🗂️</span><span>연간 계획</span></a>'
    +   '<a class="hbo-item" href="month.html?year=' + YEAR_NOW + '&month=' + MONTH_NOW + '"><span class="hbo-ic">🗓️</span><span>이번 달 달력</span></a>'
    +   '<a class="hbo-item" href="day.html?date=' + TODAY_STR + '"><span class="hbo-ic">☀️</span><span>오늘 일정</span></a>'
    +   '<a class="hbo-item" href="grade.html"><span class="hbo-ic">📊</span><span>성적 분석</span></a>'
    +   '<div class="hbo-divider"></div>'
    +   '<a class="hbo-item" href="app.html?open=school"><span class="hbo-ic">🏫</span><span>학교 시간표</span></a>'
    +   '<a class="hbo-item" href="app.html?open=academy"><span class="hbo-ic">🎒</span><span>학원 시간표</span></a>'
    +   '<div class="hbo-divider"></div>'
    +   '<button class="hbo-item" id="hboHelpBtn"><span class="hbo-ic">❓</span><span>사용법</span></button>'
    + '</nav>'
    + '<div class="hbo-help" id="hboHelp"><div class="hbo-help-box">'
    +   '<div class="hbo-help-head"><b>❓ 사용법</b><button class="hbo-close" id="hboHelpClose" aria-label="닫기">×</button></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">🗂️</span><div><b>3단계 구조</b><p>연간 계획 → 월간 달력 → 일별 스케줄 순서로 계획해요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">✍️</span><div><b>수행평가·시험</b><p>월간 달력에서 날짜를 눌러 입력하면, 3일 전부터 D-day 알림이 자동으로 떠요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">🏫</span><div><b>시간표 자동 연동</b><p>학교·학원 시간표에 요일과 함께 입력하면(예: 월,수,금), 일일계획표에 그 요일에 자동으로 떠요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">📊</span><div><b>성적·성향 분석</b><p>성적표와 사주·MBTI를 바탕으로 우리 아이 공부 성향을 분석해요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">📲</span><div><b>홈화면 추가 / 알림</b><p>"홈화면 추가"로 앱처럼 쓰고, 알림을 켜면 다가온 수행평가를 알려줘요.</p></div></div>'
    +   '<div class="hbo-hrow"><span class="hbo-hic">💾</span><div><b>백업 / 복원</b><p>데이터는 이 기기에만 저장돼요. 폰↔컴퓨터로 옮길 땐 연간 계획 화면에서 백업/복원하세요.</p></div></div>'
    +   '<button class="hbo-help-done" id="hboHelpDone">확인</button>'
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
  document.getElementById('hboHelpBtn').addEventListener('click', function () { close(); help.classList.add('on'); });
  document.getElementById('hboHelpClose').addEventListener('click', function () { help.classList.remove('on'); });
  document.getElementById('hboHelpDone').addEventListener('click', function () { help.classList.remove('on'); });
  help.addEventListener('click', function (e) { if (e.target === help) help.classList.remove('on'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); help.classList.remove('on'); } });
})();
