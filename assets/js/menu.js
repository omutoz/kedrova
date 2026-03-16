(function () {
  'use strict';
  var Kedrova = window.Kedrova || {};
  Kedrova.initMenu = function () {
    var header = document.getElementById('header');
    var hamburger = document.getElementById('hamburger');
    var mobileMenu = document.getElementById('mobileMenu');
    if (!hamburger || !mobileMenu) return;

    var releaseTrap = null;
    var isOpen = false;
    var setMenuState = function (nextOpen) {
      isOpen = !!nextOpen;
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      mobileMenu.classList.toggle('active', isOpen);
      mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      document.body.classList.toggle('menu-open', isOpen);
      if (isOpen) {
        Kedrova.setLastActiveTrigger(document.activeElement);
        Kedrova.lockBodyScroll();
        releaseTrap = Kedrova.activateFocusTrap(mobileMenu, Kedrova.qs('a, button', mobileMenu));
      } else {
        if (typeof releaseTrap === 'function') releaseTrap();
        Kedrova.clearFocusTrap();
        Kedrova.unlockBodyScroll();
        try { hamburger.focus({ preventScroll: true }); } catch (error) { hamburger.focus(); }
      }
    };
    var syncOffset = function () {
      if (!header) return;
      var headerHeight = Math.ceil(header.getBoundingClientRect().height);
      mobileMenu.style.setProperty('--mobile-menu-offset', Math.max(96, headerHeight + 28) + 'px');
    };

    syncOffset();
    hamburger.addEventListener('click', function () {
      syncOffset();
      setMenuState(!isOpen);
    });
    Kedrova.qsa('a', mobileMenu).forEach(function (link) {
      link.addEventListener('click', function () { setMenuState(false); });
    });
    document.addEventListener('click', function (event) {
      if (!isOpen) return;
      if (mobileMenu.contains(event.target) || hamburger.contains(event.target)) return;
      setMenuState(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setMenuState(false);
      }
    });
    window.addEventListener('resize', function () {
      syncOffset();
      if (window.innerWidth > 1024 && isOpen) setMenuState(false);
    }, { passive: true });
    window.addEventListener('orientationchange', syncOffset, { passive: true });
  };
})();
