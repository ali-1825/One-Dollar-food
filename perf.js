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

  function initMobileMenu() {
    var toggle = document.getElementById('mobile-menu-btn');
    var panel = document.getElementById('mobile-menu-panel');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', function () {
      var isOpen = !panel.classList.contains('hidden');
      panel.classList.toggle('hidden', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });

    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        panel.classList.add('hidden');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img:not([fetchpriority="high"])').forEach(function (img) {
      if (!img.getAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.getAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
    });

    initMobileMenu();
  });
})();
