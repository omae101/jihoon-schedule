// 한번에 카드뉴스 — 각 카드 '이미지 저장' 버튼 (html2canvas)
function saveOne(el, i, prefix) {
  return html2canvas(el, { scale: 3, backgroundColor: null, useCORS: true }).then(function (canvas) {
    var a = document.createElement('a');
    a.download = (prefix || 'hanbeone') + '_card' + (i + 1) + '.png';
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a); a.click(); a.remove();
  });
}
window.addEventListener('load', function () {
  var prefix = (document.body.getAttribute('data-prefix') || 'hanbeone');
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  slides.forEach(function (el, i) {
    var bar = document.createElement('div'); bar.className = 'dlbar';
    var b = document.createElement('button'); b.className = 'dlbtn';
    b.textContent = '💾 ' + (i + 1) + '번 카드 저장';
    b.addEventListener('click', function () { saveOne(el, i, prefix); });
    bar.appendChild(b);
    el.parentNode.insertBefore(bar, el.nextSibling);
  });
  var all = document.getElementById('dlAll');
  if (all) all.addEventListener('click', function () {
    (function next(i) {
      if (i >= slides.length) return;
      saveOne(slides[i], i, prefix).then(function () { setTimeout(function () { next(i + 1); }, 600); });
    })(0);
  });
});
