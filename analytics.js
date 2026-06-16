// 한번에 — Vercel 웹 애널리틱스 + 설치(홈화면 추가) 이벤트 추적
// Vercel 대시보드에서 Web Analytics를 "Enable" 하면 방문자/페이지뷰가 집계됩니다.
(function () {
  // Vercel insights 이벤트 큐 셋업
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

  // Vercel 웹 애널리틱스 스크립트 로드 (Analytics 미활성 시엔 조용히 무시됨)
  var s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);

  // PWA 설치(홈화면 추가)가 "완료"되면 install 이벤트 기록 → 진짜 다운로드 수
  window.addEventListener('appinstalled', function () {
    try { window.va('event', { name: 'install' }); } catch (e) {}
  });

  // 설치 안내창이 "뜬" 순간도 기록(관심도 파악용)
  window.addEventListener('beforeinstallprompt', function () {
    try { window.va('event', { name: 'install_prompt' }); } catch (e) {}
  });
})();
