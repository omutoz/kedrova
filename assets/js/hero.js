(function () {
  'use strict';
  var Kedrova = window.Kedrova || {};

  Kedrova.initHeroParallax = function () {
    if (Kedrova.getMotionPreference()) return;

    var media = document.querySelector('.hero-bg-media');
    var heroSection = document.getElementById('hero');
    if (!media || !heroSection) return;

    var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    var active = false;
    var currentX = 0;
    var currentY = 0;
    var targetX = 0;
    var targetY = 0;
    var rafId = null;
    var MAX_DEG = 4.5;
    var LERP = 0.07;

    var lerp = function (a, b, t) { return a + (b - a) * t; };

    var applyTransform = function () {
      media.style.transform =
        'perspective(900px) rotateX(' + currentX.toFixed(3) + 'deg) rotateY(' + currentY.toFixed(3) + 'deg)';
    };

    var tick = function () {
      if (!active) return;
      currentX = lerp(currentX, targetX, LERP);
      currentY = lerp(currentY, targetY, LERP);
      applyTransform();
      rafId = requestAnimationFrame(tick);
    };

    var resetToZero = function () {
      media.classList.remove('parallax-active');
      targetX = 0;
      targetY = 0;
      cancelAnimationFrame(rafId);
      var stopWhenSteady = function () {
        currentX = lerp(currentX, 0, LERP);
        currentY = lerp(currentY, 0, LERP);
        applyTransform();
        if (Math.abs(currentX) < 0.02 && Math.abs(currentY) < 0.02) {
          active = false;
          currentX = 0;
          currentY = 0;
          media.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
          return;
        }
        rafId = requestAnimationFrame(stopWhenSteady);
      };
      rafId = requestAnimationFrame(stopWhenSteady);
    };

    var onMouseMove = function (e) {
      var rect = media.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = (e.clientX - cx) / (rect.width / 2);
      var dy = (e.clientY - cy) / (rect.height / 2);
      dx = Math.max(-1, Math.min(1, dx));
      dy = Math.max(-1, Math.min(1, dy));
      targetX = dy * -MAX_DEG;
      targetY = dx * MAX_DEG;
      media.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      media.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      media.classList.add('parallax-active');
      if (!active) {
        active = true;
        tick();
      }
    };

    var onMouseLeave = function () {
      resetToZero();
    };

    var onDeviceOrientation = function (e) {
      if (e.gamma === null || e.beta === null) return;
      var dx = Math.max(-1, Math.min(1, e.gamma / 20));
      var dy = Math.max(-1, Math.min(1, (e.beta - 30) / 20));
      targetX = dy * -MAX_DEG;
      targetY = dx * MAX_DEG;
      if (!active) {
        active = true;
        tick();
      }
    };

    var attachListeners = function () {
      // Bug #3 fix: explicitly end CSS animation before JS takes over transform
      media.style.animation = 'none';
      media.style.opacity = '1';
      media.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';

      if (isTouchDevice) {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
          document.addEventListener('touchstart', function () {
            DeviceOrientationEvent.requestPermission().then(function (state) {
              if (state === 'granted') {
                window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
              }
            }).catch(function () {});
          }, { once: true, passive: true });
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
          window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
        }
      } else {
        document.addEventListener('mousemove', onMouseMove, { passive: true });
        // Bug #2 fix: mouseleave on heroSection, not media
        heroSection.addEventListener('mouseleave', onMouseLeave);
      }
    };

    // heroArtworkIn = 4s, attach after animation completes
    setTimeout(attachListeners, 4200);
  };
})();
