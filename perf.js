(function () {
  function throttle(fn, wait) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        fn();
        ticking = false;
      });
    };
  }

  window.runOnScroll = function (handler) {
    window.addEventListener('scroll', throttle(handler, 16), { passive: true });
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img:not([fetchpriority="high"])').forEach(function (img) {
      if (!img.getAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.getAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
    });
  });
})();
