// 한국 공휴일 (달력 표시용). window.Holidays.get('YYYY-MM-DD') -> 이름 | null
(function (global) {
  // 매년 같은 양력 고정 공휴일
  var FIXED = {
    '01-01': '신정',
    '03-01': '삼일절',
    '05-05': '어린이날',
    '06-06': '현충일',
    '08-15': '광복절',
    '10-03': '개천절',
    '10-09': '한글날',
    '12-25': '성탄절'
  };
  // 음력 기반·대체공휴일 등 연도별 (양력 날짜로). 새해마다 추가해 주세요.
  var BYYEAR = {
    '2026': {
      '02-16': '설날 연휴',
      '02-17': '설날',
      '02-18': '설날 연휴',
      '03-02': '대체공휴일',
      '05-24': '부처님오신날',
      '05-25': '대체공휴일',
      '08-17': '대체공휴일',
      '09-24': '추석 연휴',
      '09-25': '추석',
      '09-26': '추석 연휴',
      '09-28': '대체공휴일',
      '10-05': '대체공휴일'
    }
  };
  function get(dateStr) {
    if (!dateStr) return null;
    var p = String(dateStr).split('-');
    if (p.length < 3) return null;
    var y = p[0], md = p[1] + '-' + p[2];
    if (BYYEAR[y] && BYYEAR[y][md]) return BYYEAR[y][md];
    if (FIXED[md]) return FIXED[md];
    return null;
  }
  global.Holidays = { get: get, is: function (d) { return !!get(d); } };
})(window);
