// 아이담다 — 자녀 연동(엄마폰↔자녀폰 실시간 동기화) v1 (beta)
// Supabase 스냅샷 방식: 현재 자녀의 전체 데이터를 한 덩어리로 서버 kv에 저장/불러오기.
// 안전장치: '연동한 그 자녀'가 선택돼 있을 때만 작동(다른 자녀 데이터 안 섞임).
(function () {
  var SB_URL = 'https://czbrvzsdlmasfgaxurjp.supabase.co';
  var SB_KEY = 'sb_publishable_FrgDPsUo1dj8EkUPkXT6_A_pNoylzG4';
  var K_SPACE = '__sync_space';   // 연결된 space_id (전역)
  var K_CHILD = '__sync_child';   // 연동한 자녀 프로필 id (전역)
  var K_TS    = '__sync_ts';      // 마지막 적용 스냅샷 시각 (전역)

  var sb = null, ready = false, applying = false, pushTimer = null, channel = null;
  function space() { try { return localStorage.getItem(K_SPACE); } catch (e) { return null; } }
  function child() { try { return localStorage.getItem(K_CHILD); } catch (e) { return null; } }
  function curChild() { try { return window.Profiles ? Profiles.currentId() : 'c1'; } catch (e) { return 'c1'; } }
  function active() { return !!space() && child() === curChild(); }  // 연동 자녀가 지금 선택됨?

  // 인증 세션은 기기 전역(__)에 저장 → 자녀 전환해도 유지
  var authStore = {
    getItem: function (k) { try { return localStorage.getItem('__sbauth_' + k); } catch (e) { return null; } },
    setItem: function (k, v) { try { localStorage.setItem('__sbauth_' + k, v); } catch (e) {} },
    removeItem: function (k) { try { localStorage.removeItem('__sbauth_' + k); } catch (e) {} }
  };

  function loadSDK(cb) {
    if (window.supabase && window.supabase.createClient) return cb();
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = function () { cb(); };
    s.onerror = function () { cb(new Error('SDK 로드 실패')); };
    document.head.appendChild(s);
  }

  function init(cb) {
    if (ready) return cb();
    loadSDK(function (err) {
      if (err) return cb(err);
      try {
        sb = window.supabase.createClient(SB_URL, SB_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, storageKey: '__sbsession', storage: authStore }
        });
      } catch (e) { return cb(e); }
      sb.auth.getSession().then(function (r) {
        if (r.data && r.data.session) { ready = true; return cb(); }
        sb.auth.signInAnonymously().then(function (r2) {
          if (r2.error) return cb(r2.error);
          ready = true; cb();
        });
      });
    });
  }

  // ---- 현재 자녀 데이터 스냅샷 (전역 __키는 제외됨: shim의 length/key가 자녀 키만 반환) ----
  function snapshot() { var d = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k != null) d[k] = localStorage.getItem(k); } return d; }
  function applySnapshot(d) {
    applying = true;
    try {
      var cur = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k != null) cur.push(k); }
      cur.forEach(function (k) { if (!(k in d)) localStorage.removeItem(k); });
      Object.keys(d).forEach(function (k) { localStorage.setItem(k, d[k]); });
    } catch (e) {}
    applying = false;
  }

  function pull(cb) {
    if (!active() || !ready) return cb && cb();
    sb.from('kv').select('v').eq('space_id', space()).eq('slot', 'main').eq('k', '__snapshot').maybeSingle()
      .then(function (r) {
        if (r.data && r.data.v) {
          var snap = r.data.v; // jsonb → 객체
          var localTs = parseInt(localStorage.getItem(K_TS) || '0', 10);
          if (snap.t && snap.t > localTs) {
            applySnapshot(snap.d || {});
            localStorage.setItem(K_TS, String(snap.t));
            cb && cb(true); // 변경 적용됨 → 새로고침 권장
            return;
          }
        }
        cb && cb(false);
      }, function () { cb && cb(false); });
  }

  function push() {
    if (!active() || !ready) return;
    var t = Date.now();
    var snap = { t: t, d: snapshot() };
    sb.from('kv').upsert({ space_id: space(), slot: 'main', k: '__snapshot', v: snap }, { onConflict: 'space_id,slot,k' })
      .then(function (r) { if (!r.error) localStorage.setItem(K_TS, String(t)); }, function () {});
  }
  function schedulePush() { if (!active()) return; clearTimeout(pushTimer); pushTimer = setTimeout(push, 1500); }

  // localStorage 변경 감지 → 자동 푸시 (shim의 setItem 래핑)
  function hookWrites() {
    if (!window.localStorage || window.localStorage.__synced) return;
    var origSet = window.localStorage.setItem.bind(window.localStorage);
    var origRem = window.localStorage.removeItem.bind(window.localStorage);
    window.localStorage.setItem = function (k, v) { origSet(k, v); if (!applying && k && k.indexOf('__') !== 0) schedulePush(); };
    window.localStorage.removeItem = function (k) { origRem(k); if (!applying && k && k.indexOf('__') !== 0) schedulePush(); };
    window.localStorage.__synced = true;
  }

  function subscribe() {
    if (!active() || !ready || channel) return;
    channel = sb.channel('kv-' + space())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kv', filter: 'space_id=eq.' + space() }, function () {
        pull(function (changed) { if (changed) location.reload(); });
      }).subscribe();
  }

  // ---- 시작: 이미 연동돼 있으면 인증→풀→구독→자동푸시 ----
  function start() {
    if (!space()) { hookWrites(); return; }
    init(function (err) {
      if (err) return;
      hookWrites();
      pull(function (changed) { if (changed) { location.reload(); return; } subscribe(); });
    });
  }

  // ================= 공개 API (페어링 UI에서 호출) =================
  window.HBOSync = {
    isPaired: function () { return !!space(); },
    pairedChild: function () { return child(); },
    active: active,
    // 자녀폰: 연결 코드 만들기
    createCode: function (cb) {
      init(function (err) {
        if (err) return cb(err);
        sb.rpc('create_space_with_code').then(function (r) {
          if (r.error) return cb(r.error);
          var d = r.data; // {space_id, code}
          localStorage.setItem(K_SPACE, d.space_id);
          localStorage.setItem(K_CHILD, curChild());
          localStorage.setItem(K_TS, '0');
          hookWrites();
          push();       // 이 자녀 현재 데이터 서버로 올림
          subscribe();
          cb(null, d.code);
        }, function (e) { cb(e); });
      });
    },
    // 엄마폰: 코드 입력해서 참여
    joinCode: function (code, cb) {
      init(function (err) {
        if (err) return cb(err);
        sb.rpc('join_space', { p_code: code }).then(function (r) {
          if (r.error) return cb(r.error);
          var d = r.data; // {space_id}
          localStorage.setItem(K_SPACE, d.space_id);
          localStorage.setItem(K_CHILD, curChild());
          localStorage.setItem(K_TS, '0');
          hookWrites();
          pull(function () { cb(null); });  // 서버(자녀폰) 데이터 받아오기
          subscribe();
        }, function (e) { cb(e); });
      });
    },
    syncNow: function (cb) { init(function (err) { if (err) return cb && cb(err); push(); pull(function (c) { cb && cb(null, c); if (c) location.reload(); }); }); },
    unpair: function () { try { localStorage.removeItem(K_SPACE); localStorage.removeItem(K_CHILD); localStorage.removeItem(K_TS); } catch (e) {} if (channel) { try { sb.removeChannel(channel); } catch (e) {} channel = null; } }
  };

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
