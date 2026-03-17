(function () {
  'use strict';
  var Kedrova = window.Kedrova || {};

  Kedrova.initHeroParallax = function () {
    if (Kedrova.getMotionPreference()) return;

    var media = document.querySelector('.hero-bg-media');
    if (!media) return;

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
      targetX = 0;
      targetY = 0;
      if (!active) {
        active = true;
        tick();
      }
      // Stop loop once settled
      var stopWhenSteady = function () {
        if (Math.abs(currentX) < 0.02 && Math.abs(currentY) < 0.02) {
          active = false;
          currentX = 0;
          currentY = 0;
          media.style.transform = '';
          cancelAnimationFrame(rafId);
          return;
        }
        rafId = requestAnimationFrame(stopWhenSteady);
      };
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(stopWhenSteady);
    };

    var onMouseMove = function (e) {
      var rect = media.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = (e.clientX - cx) / (rect.width / 2);
      var dy = (e.clientY - cy) / (rect.height / 2);
      // Clamp to ±1
      dx = Math.max(-1, Math.min(1, dx));
      dy = Math.max(-1, Math.min(1, dy));
      targetX = dy * -MAX_DEG;
      targetY = dx * MAX_DEG;
      // Update light position
      media.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      media.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      if (!active) {
        active = true;
        tick();
      }
    };

    var onMouseLeave = function () {
      resetToZero();
    };

    // Device orientation (mobile gyroscope)
    var onDeviceOrientation = function (e) {
      if (e.gamma === null || e.beta === null) return;
      // gamma: left/right tilt (-90 to 90), beta: front/back tilt (-180 to 180)
      var dx = Math.max(-1, Math.min(1, e.gamma / 20));
      var dy = Math.max(-1, Math.min(1, (e.beta - 30) / 20)); // 30 = natural hold angle
      targetX = dy * -MAX_DEG;
      targetY = dx * MAX_DEG;
      if (!active) {
        active = true;
        tick();
      }
    };

    var attachListeners = function () {
      if (isTouchDevice) {
        // iOS 13+ requires permission
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
          // Can only request from user gesture — skip auto-attach,
          // attach on first touchstart as a one-time trigger
          var requestOnce = function () {
            DeviceOrientationEvent.requestPermission().then(function (state) {
              if (state === 'granted') {
                window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
              }
            }).catch(function () {});
            document.removeEventListener('touchstart', requestOnce);
          };
          document.addEventListener('touchstart', requestOnce, { once: true, passive: true });
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
          // Android / older iOS — no permission needed
          window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
        }
        // No mousemove on touch
      } else {
        document.addEventListener('mousemove', onMouseMove, { passive: true });
        media.addEventListener('mouseleave', onMouseLeave);
      }
    };

    // heroArtworkIn duration = 4s (defined in hero.css)
    // Attach listeners after animation completes + small buffer
    setTimeout(attachListeners, 4200);
  };
})();
