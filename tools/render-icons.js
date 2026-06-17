// 한번에 앱 아이콘 렌더러 — 확정 로고 심볼(흩어진 3줄 → 체크)로 PNG 생성
// 실행: node tools/render-icons.js [--preview]
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// 풀블리드 그라데이션 + 안전영역(중앙 80%) 안에 균형있게 배치한 심볼.
// 좌측에 흩어진 3줄(일정/할일/성적), 우측에 체크(✓)로 모임.
function masterSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#14B8A6"/><stop offset="1" stop-color="#0D9488"/>
  </linearGradient></defs>
  <rect x="0" y="0" width="120" height="120" fill="url(#g)"/>
  <rect x="36" y="43" width="22" height="9" rx="4.5" fill="#fff" opacity="0.45"/>
  <rect x="36" y="57" width="32" height="9" rx="4.5" fill="#fff" opacity="0.72"/>
  <rect x="36" y="71" width="17" height="9" rx="4.5" fill="#fff" opacity="0.38"/>
  <path d="M62 70 L75 83 L97 50" fill="none" stroke="#fff" stroke-width="11"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// 둥근 모서리 버전(svg 파비콘/표시용) — 풀블리드와 동일 심볼, rx만 추가
function roundedSvg() {
  return masterSvg().replace(
    '<rect x="0" y="0" width="120" height="120" fill="url(#g)"/>',
    '<rect x="0" y="0" width="120" height="120" rx="26" fill="url(#g)"/>'
  );
}

async function png(svg, size, outName) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  fs.writeFileSync(path.join(root, outName), buf);
  console.log('wrote', outName, size + 'px', buf.length + 'B');
}

(async () => {
  const preview = process.argv.includes('--preview');
  const prefix = preview ? '_preview-' : '';
  const svg = masterSvg();
  await png(svg, 512, prefix + 'icon-512.png');
  await png(svg, 192, prefix + 'icon-192.png');
  await png(svg, 180, prefix + 'apple-touch-icon.png');
  if (!preview) {
    fs.writeFileSync(path.join(root, 'icon.svg'),
      roundedSvg().replace('viewBox="0 0 120 120"', 'viewBox="0 0 120 120" width="512" height="512"') + '\n');
    console.log('wrote icon.svg');
  }
  console.log('done');
})();
