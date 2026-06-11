// 한번에 — 다자녀 프로필 엔진
// 모든 데이터(localStorage)를 자녀별 공간으로 자동 분리한다.
// 이 스크립트는 다른 어떤 스크립트보다 먼저(=defer 없이, head 최상단) 로드돼야 한다.
(function () {
  var real = window.localStorage;
  if (!real) return;

  var LIST = '__profiles';   // 자녀 목록 (전역, 분리 안 함)
  var CUR = '__cur_profile'; // 현재 자녀 id (전역)
  var SEP = '::';

  // 프로필 관리 키(LIST/CUR)와 '__'로 시작하는 키(테마 등 앱 전체 설정)는 자녀별로 분리하지 않음
  function isGlobal(k) { return k === LIST || k === CUR || k.indexOf('__') === 0; }

  function readList() {
    try { var v = JSON.parse(real.getItem(LIST) || 'null'); return Array.isArray(v) ? v : null; }
    catch (e) { return null; }
  }
  function writeList(arr) { real.setItem(LIST, JSON.stringify(arr)); }

  // ---------- 최초 1회: 기존(분리 안 된) 데이터를 "첫째"로 이전 ----------
  if (!readList()) {
    var firstId = 'c' + 1;
    var firstName = real.getItem('jihoon-owner-name') || '첫째';
    var migrate = [];
    for (var i = 0; i < real.length; i++) {
      var k = real.key(i);
      if (!k || isGlobal(k) || k.indexOf(SEP) !== -1) continue;
      migrate.push(k);
    }
    migrate.forEach(function (k) {
      var v = real.getItem(k);
      real.setItem(firstId + SEP + k, v);
      real.removeItem(k);
    });
    writeList([{ id: firstId, name: firstName }]);
    real.setItem(CUR, firstId);
  }

  function curId() {
    var id = real.getItem(CUR);
    var list = readList() || [];
    if (!id || !list.some(function (p) { return p.id === id; })) {
      id = list.length ? list[0].id : 'c1';
      real.setItem(CUR, id);
    }
    return id;
  }
  function prefix() { return curId() + SEP; }

  function curKeys() {
    var p = prefix(), out = [];
    for (var i = 0; i < real.length; i++) {
      var k = real.key(i);
      if (k && k.indexOf(p) === 0) out.push(k.slice(p.length));
    }
    return out;
  }

  // ---------- localStorage를 자녀 공간으로 가상화 ----------
  var shim = {
    getItem: function (k) { return isGlobal(k) ? real.getItem(k) : real.getItem(prefix() + k); },
    setItem: function (k, v) { isGlobal(k) ? real.setItem(k, v) : real.setItem(prefix() + k, v); },
    removeItem: function (k) { isGlobal(k) ? real.removeItem(k) : real.removeItem(prefix() + k); },
    key: function (i) { var ks = curKeys(); return i >= 0 && i < ks.length ? ks[i] : null; },
    clear: function () { curKeys().forEach(function (k) { real.removeItem(prefix() + k); }); },
    get length() { return curKeys().length; }
  };

  try {
    Object.defineProperty(window, 'localStorage', { value: shim, configurable: true });
  } catch (e) {
    // 덮어쓰기 실패 시: 분리 없이 기존 방식으로 동작 (앱은 깨지지 않음)
  }

  // ---------- 공개 API ----------
  function newId() {
    var list = readList() || [], n = 1;
    while (list.some(function (p) { return p.id === 'c' + n; })) n++;
    return 'c' + n;
  }

  window.Profiles = {
    list: function () { return readList() || []; },
    currentId: curId,
    current: function () {
      var id = curId();
      return (readList() || []).find(function (p) { return p.id === id; }) || null;
    },
    switchTo: function (id) {
      if ((readList() || []).some(function (p) { return p.id === id; })) {
        real.setItem(CUR, id);
        location.reload();
      }
    },
    add: function (name) {
      var list = readList() || [];
      var id = newId();
      list.push({ id: id, name: (name || '').trim() || ('자녀 ' + (list.length + 1)) });
      writeList(list);
      real.setItem(CUR, id);
      location.reload();
    },
    rename: function (id, name) {
      var list = readList() || [];
      var p = list.find(function (x) { return x.id === id; });
      if (p) { p.name = (name || '').trim() || p.name; writeList(list); }
    },
    remove: function (id) {
      var list = readList() || [];
      if (list.length <= 1) return false; // 마지막 하나는 삭제 불가
      // 해당 자녀 데이터 삭제
      var pfx = id + SEP, del = [];
      for (var i = 0; i < real.length; i++) { var k = real.key(i); if (k && k.indexOf(pfx) === 0) del.push(k); }
      del.forEach(function (k) { real.removeItem(k); });
      list = list.filter(function (p) { return p.id !== id; });
      writeList(list);
      if (real.getItem(CUR) === id) real.setItem(CUR, list[0].id);
      location.reload();
      return true;
    },
    resetCurrent: function () {
      var ks = curKeys();
      ks.forEach(function (k) { real.removeItem(prefix() + k); });
      location.reload();
    }
  };
})();
