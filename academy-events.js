// 한번에 — 학원 설명회·등록(결제)일 관리. 입력하면 리마인더에 D-day로 표시.
// window.AcademyEvents.open() 으로 입력창, getUpcoming(maxDays)로 다가오는 일정.
(function () {
  var LS = window.localStorage;
  var KEY = 'jihoon-academy-events';

  function read() { try { var v = JSON.parse(LS.getItem(KEY) || 'null'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function write(a) { LS.setItem(KEY, JSON.stringify(a)); }
  function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m]; }); }

  function getUpcoming(maxDays) {
    var today = startOfToday(), out = [];
    read().forEach(function (e) {
      if (!e.date || !e.text) return;
      var p = e.date.split('-'); if (p.length < 3) return;
      var d = new Date(+p[0], +p[1] - 1, +p[2]); d.setHours(0, 0, 0, 0);
      var diff = Math.round((d - today) / 86400000);
      if (diff < 0 || diff > maxDays) return;
      out.push({ date: d, dateStr: e.date, diff: diff, text: e.text });
    });
    out.sort(function (a, b) { return a.date - b.date; });
    return out;
  }

  function buildModal() {
    if (document.getElementById('aevModal')) return;
    var css = ''
      + '.aev-ov,.aev-ov *{font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif !important;}'
      + '.aev-ov{display:none;position:fixed;inset:0;background:rgba(30,30,40,.5);z-index:1004;justify-content:center;align-items:center;padding:20px;}'
      + '.aev-ov.on{display:flex;}'
      + '.aev-box{background:#fff;border-radius:14px;padding:18px;max-width:430px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.25);}'
      + '.aev-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}'
      + '.aev-head b{font-size:17px;color:#17181C;}'
      + '.aev-x{background:none;border:none;font-size:26px;color:#9CA1AB;cursor:pointer;}'
      + '.aev-desc{font-size:12.5px;color:#6b6f78;margin-bottom:14px;line-height:1.55;}'
      + '.aev-list{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}'
      + '.aev-row{display:flex;align-items:center;gap:8px;border:1px solid #E2E4E9;border-radius:9px;padding:8px 10px;}'
      + '.aev-row .d{font-size:12px;font-weight:700;color:#0D9488;white-space:nowrap;}'
      + '.aev-row .t{flex:1;font-size:13.5px;color:#17181C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
      + '.aev-row .dd{font-size:10px;font-weight:700;color:#fff;background:#FB8C00;border-radius:8px;padding:1px 6px;white-space:nowrap;}'
      + '.aev-del{background:none;border:none;color:#C62828;font-size:18px;cursor:pointer;line-height:1;padding:0 2px;}'
      + '.aev-empty{color:#9CA1AB;font-size:13px;text-align:center;padding:14px 6px;line-height:1.5;}'
      + '.aev-add{display:flex;flex-wrap:wrap;gap:6px;}'
      + '.aev-add input{border:1px solid #C9CDD4;border-radius:8px;padding:9px 10px;font-size:13px;font-family:inherit;}'
      + '.aev-add input[type=date]{flex:none;}'
      + '.aev-add input.t{flex:1;min-width:120px;}'
      + '.aev-addbtn{flex:none;background:#0D9488;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer;font-family:inherit;}'
      + '.aev-done{width:100%;margin-top:14px;padding:11px;border:none;border-radius:9px;background:#0D9488;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

    var box = document.createElement('div');
    box.className = 'aev-ov'; box.id = 'aevModal';
    box.innerHTML =
      '<div class="aev-box">' +
        '<div class="aev-head"><b>📋 설명회·등록일</b><button class="aev-x" id="aevX">×</button></div>' +
        '<div class="aev-desc">학원 설명회, 등록·결제 마감일 등을 적어두면 🔔 리마인더에서 <b>D-day</b>로 알려드려요.</div>' +
        '<div class="aev-list" id="aevList"></div>' +
        '<div class="aev-add">' +
          '<input type="date" id="aevDate">' +
          '<input type="text" class="t" id="aevText" placeholder="예: ○○수학 설명회 / 등록 마감">' +
          '<button class="aev-addbtn" id="aevAdd">추가</button>' +
        '</div>' +
        '<button class="aev-done" id="aevDone">확인</button>' +
      '</div>';
    document.body.appendChild(box);

    document.getElementById('aevX').addEventListener('click', close);
    document.getElementById('aevDone').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.getElementById('aevAdd').addEventListener('click', add);
    document.getElementById('aevText').addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
  }

  function render() {
    var list = document.getElementById('aevList'); if (!list) return;
    var arr = read();
    var items = arr.map(function (e, i) { return { e: e, i: i }; });
    items.sort(function (a, b) { return (a.e.date || '').localeCompare(b.e.date || ''); });
    list.innerHTML = '';
    if (!items.length) { list.innerHTML = '<div class="aev-empty">아직 등록한 설명회·등록일이 없어요.<br>아래에서 날짜와 내용을 추가해 보세요.</div>'; return; }
    var today = startOfToday();
    items.forEach(function (o) {
      var e = o.e;
      var diff = null, dlabel = '-';
      if (e.date) {
        var p = e.date.split('-');
        var d = new Date(+p[0], +p[1] - 1, +p[2]); d.setHours(0, 0, 0, 0);
        diff = Math.round((d - today) / 86400000);
        dlabel = parseInt(p[1]) + '.' + parseInt(p[2]);
      }
      var dd = (diff !== null && diff >= 0 && diff <= 14) ? '<span class="dd">' + (diff === 0 ? 'D-DAY' : 'D-' + diff) + '</span>' : '';
      var row = document.createElement('div'); row.className = 'aev-row';
      row.innerHTML = '<span class="d">' + dlabel + '</span><span class="t">' + esc(e.text) + '</span>' + dd + '<button class="aev-del" data-i="' + o.i + '">×</button>';
      list.appendChild(row);
    });
    list.querySelectorAll('.aev-del').forEach(function (b) {
      b.addEventListener('click', function () { var a = read(); a.splice(+b.dataset.i, 1); write(a); render(); });
    });
  }

  function add() {
    var date = document.getElementById('aevDate').value;
    var text = document.getElementById('aevText').value.trim();
    if (!date || !text) { alert('날짜와 내용을 모두 입력해 주세요.'); return; }
    var a = read(); a.push({ date: date, text: text }); write(a);
    document.getElementById('aevText').value = '';
    document.getElementById('aevDate').value = '';
    render();
  }

  function close() { var m = document.getElementById('aevModal'); if (m) m.classList.remove('on'); }
  function open() { buildModal(); render(); document.getElementById('aevModal').classList.add('on'); }

  window.AcademyEvents = { open: open, list: read, getUpcoming: getUpcoming };
})();
