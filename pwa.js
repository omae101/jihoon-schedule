// 한번에 PWA: 서비스워커 등록 + 홈화면 설치 버튼
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  // 홈화면 추가 (Android/Chrome)
  let deferredPrompt = null;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  function btn() { return document.getElementById('pwaInstallBtn'); }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    const b = btn();
    if (b && !isStandalone) b.style.display = '';
  });

  document.addEventListener('click', function (e) {
    const b = btn();
    if (!b || e.target !== b) return;
    if (!deferredPrompt) {
      // iOS 등 자동 설치 미지원: 안내
      alert('홈화면에 추가하려면\n\niPhone: 공유 버튼(⬆️) → "홈 화면에 추가"\nAndroid: 메뉴(⋮) → "홈 화면에 추가/앱 설치"');
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(function () {
      deferredPrompt = null;
      if (b) b.style.display = 'none';
    });
  });

  window.addEventListener('appinstalled', function () {
    const b = btn();
    if (b) b.style.display = 'none';
  });

  // 이미 설치돼 실행 중이면 버튼 숨김
  window.addEventListener('DOMContentLoaded', function () {
    const b = btn();
    if (b && isStandalone) b.style.display = 'none';
  });
})();
