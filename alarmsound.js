// 한번에 — 알람 소리 엔진 (파일 없이 Web Audio로 멜로디 생성)
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
  function play(name) {
    var c = ensure(); if (!c) return;
    var t = TUNES[name] || TUNES.ding;
    var beat = 0.34, now = c.currentTime, cur = 0;
    t.notes.forEach(function (n) {
      var f = N[n[0]], dur = n[1] * beat;
      if (f > 0) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = t.type || 'sine'; o.frequency.value = f;
        var st = now + cur;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.35, st + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, st + dur * 0.92);
        o.connect(g); g.connect(c.destination);
        o.start(st); o.stop(st + dur);
      }
      cur += dur;
    });
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  }
  function list() { return Object.keys(TUNES).map(function (k) { return { key: k, label: TUNES[k].label }; }); }
  return { play: play, ensure: ensure, list: list };
})();
