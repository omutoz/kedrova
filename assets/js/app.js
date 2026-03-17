(function () {
  'use strict';
  var Kedrova = window.Kedrova || {};
  var moduleOrder = [
    'initTheme',
    'initLanguage',
    'initCore',
    'initMenu',
    'initGallery',
    'initModals',
    'initPlayer',
    'initHeroParallax'
  ];
  var start = function () {
    if (document.documentElement.dataset.kedrovaBooted === 'true') return;
    document.documentElement.dataset.kedrovaBooted = 'true';
    moduleOrder.forEach(function (name) {
      if (typeof Kedrova[name] !== 'function') return;
      try {
        Kedrova[name]();
      } catch (error) {
        console.error('[KEDROVA] Module init failed:', name, error);
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
