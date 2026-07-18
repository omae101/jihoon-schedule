// 아이담다 — 알람 소리 엔진 (파일 없이 Web Audio로 멜로디 생성)
// 사용: HanAlarm.play('folk'), HanAlarm.list(), HanAlarm.ensure()
// ※ 저작권 곡(겨울왕국·골든 등)은 넣지 않음. 전래(닐리리야)·자작 멜로디만.
window.HanAlarm = (function () {
  var ctx = null;
  function ensure() {
    try {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); }
      if (ctx && ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
    return ctx;
  }
  var N = { C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,
    C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880,B5:987.77,C6:1046.5, R:0 };
  // 각 곡: type(음색), notes=[음, 길이(박)]
  var TUNES = {
    ding:   { label: '딩동 (기본)',     type: 'sine',     notes: [['G5',1.2],['C5',1.6]] },
    alarm:  { label: '알람 (삐삐삐)',    type: 'square',   notes: [['A5',.4],['R',.2],['A5',.4],['R',.2],['A5',.4],['R',.2],['A5',.7]] },
    folk:   { label: '국악풍 (닐리리야)', type: 'triangle', notes: [['G4',.5],['A4',.5],['C5',.6],['A4',.4],['G4',.5],['E4',.5],['G4',.4],['A4',.9]] },
    bell:   { label: '밝은 종소리',      type: 'triangle', notes: [['E5',.4],['G5',.4],['C6',.4],['G5',.4],['C6',.9]] },
    xylo:   { label: '실로폰 멜로디',     type: 'sine',     notes: [['C5',.45],['E5',.45],['G5',.45],['C6',.5],['G5',.4],['C6',.9]] }
  };
  var PEAK = 0.7;   // 소리 크기(0~1). 0.35→0.7로 키움. 순차 재생이라 왜곡 없음.
  function playOnce(c, t, startAt) {
    var beat = 0.34, cur = 0, master = c.createGain();
    master.gain.value = 1; master.connect(c.destination);
    t.notes.forEach(function (n) {
      var f = N[n[0]], dur = n[1] * beat;
      if (f > 0) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = t.type || 'sine'; o.frequency.value = f;
        var st = startAt + cur;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(PEAK, st + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, st + dur * 0.96);
        o.connect(g); g.connect(master);
        o.start(st); o.stop(st + dur);
      }
      cur += dur;
    });
    return cur; // 이 곡의 총 길이(초)
  }
  function play(name, opts) {
    var c = ensure(); if (!c) return;
    var t = TUNES[name] || TUNES.ding;
    var reps = (opts && opts.repeat) || 2;   // 알람은 기본 2번 반복(더 잘 들리게)
    var at = c.currentTime, gap = 0.12;
    for (var i = 0; i < reps; i++) { var len = playOnce(c, t, at); at += len + gap; }
    try { if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 400]); } catch (e) {}
  }
  function list() { return Object.keys(TUNES).map(function (k) { return { key: k, label: TUNES[k].label }; }); }
  return { play: play, ensure: ensure, list: list };
})();
