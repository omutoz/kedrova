(function () {
  'use strict';
  var Kedrova = (window.Kedrova = window.Kedrova || {});
  var bodyLockCount = 0;
  var lastActiveTrigger = null;
  var activeFocusTrapCleanup = null;

  Kedrova.qs = function (selector, context) { return (context || document).querySelector(selector); };
  Kedrova.qsa = function (selector, context) { return Array.prototype.slice.call((context || document).querySelectorAll(selector)); };
  Kedrova.getBasePath = function () {
    if (window.KEDROVA_BASE_PATH) return window.KEDROVA_BASE_PATH;
    var path = window.location.pathname || '/';
    var segments = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    if (!segments.length) return './';
    var lastSegment = segments[segments.length - 1];
    var directoryDepth = /\.[a-z0-9]+$/i.test(lastSegment) ? segments.length - 1 : segments.length;
    if (directoryDepth <= 0) return './';
    return new Array(directoryDepth + 1).join('../');
  };
  Kedrova.getMotionPreference = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  Kedrova.setLastActiveTrigger = function (element) { lastActiveTrigger = element || document.activeElement || null; };
  Kedrova.restoreFocus = function () {
    if (lastActiveTrigger && typeof lastActiveTrigger.focus === 'function') {
      try { lastActiveTrigger.focus({ preventScroll: true }); } catch (error) { lastActiveTrigger.focus(); }
    }
  };
  Kedrova.lockBodyScroll = function () {
    bodyLockCount += 1;
    if (bodyLockCount > 1) return;
    var scrollBarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) document.body.style.paddingRight = scrollBarWidth + 'px';
  };
  Kedrova.unlockBodyScroll = function () {
    bodyLockCount = Math.max(0, bodyLockCount - 1);
    if (bodyLockCount === 0) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  };
  Kedrova.makeFocusableCollection = function (container) {
    return Kedrova.qsa('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])', container)
      .filter(function (element) {
        return !element.hasAttribute('hidden') && window.getComputedStyle(element).display !== 'none' && window.getComputedStyle(element).visibility !== 'hidden';
      });
  };
  Kedrova.activateFocusTrap = function (container, initialFocus) {
    if (!container) return function () {};
    if (typeof activeFocusTrapCleanup === 'function') activeFocusTrapCleanup();
    var onKeydown = function (event) {
      if (event.key !== 'Tab') return;
      var focusable = Kedrova.makeFocusableCollection(container);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    container.addEventListener('keydown', onKeydown);
    activeFocusTrapCleanup = function () {
      container.removeEventListener('keydown', onKeydown);
      activeFocusTrapCleanup = null;
    };
    var target = initialFocus || Kedrova.makeFocusableCollection(container)[0] || container;
    if (target && typeof target.focus === 'function') {
      window.requestAnimationFrame(function () {
        try { target.focus({ preventScroll: true }); } catch (error) { target.focus(); }
      });
    }
    return activeFocusTrapCleanup;
  };
  Kedrova.clearFocusTrap = function () {
    if (typeof activeFocusTrapCleanup === 'function') activeFocusTrapCleanup();
  };
})();
