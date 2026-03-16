(function () {
  'use strict';
  var Kedrova = window.Kedrova || {};
  Kedrova.initCore = function () {
    var header = document.getElementById('header');
    if (header) {
      var onScroll = function () {
        header.classList.toggle('scrolled', window.scrollY > 60);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    var anchors = Kedrova.qsa('a[href^="#"]');
    anchors.forEach(function (anchor) {
      anchor.addEventListener('click', function (event) {
        var href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        var target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        var position = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: position, behavior: Kedrova.getMotionPreference() ? 'auto' : 'smooth' });
        if (target.hasAttribute('tabindex') || /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });

    var reveals = Kedrova.qsa('.reveal');
    if (!reveals.length) return;
    if (Kedrova.getMotionPreference()) {
      reveals.forEach(function (element) { element.classList.add('visible'); });
      document.body.classList.add('reveal-ready');
      return;
    }
    var checkReveal = function () {
      reveals.forEach(function (element) {
        if (element.classList.contains('visible')) return;
        var rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight - 40) {
          element.classList.add('visible');
        }
      });
    };
    checkReveal();
    document.body.classList.add('reveal-ready');
    window.addEventListener('scroll', checkReveal, { passive: true });
    window.addEventListener('resize', checkReveal, { passive: true });
    setTimeout(checkReveal, 100);
    setTimeout(checkReveal, 500);
    setTimeout(function () {
      reveals.forEach(function (element) { element.classList.add('visible'); });
    }, 3000);
  };
})();
