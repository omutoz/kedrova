(function () {
  'use strict';
  var Kedrova = window.Kedrova || {};
  Kedrova.initTheme = function () {
    var themeToggle = document.getElementById('themeToggle');
    var themeToggleMobile = document.getElementById('themeToggleMobile');
    var currentTheme = 'dark';
    var storedTheme = null;
    try { storedTheme = window.localStorage.getItem('kedrova-theme'); } catch (error) { storedTheme = null; }

    var syncButtons = function () {
      var isLight = currentTheme === 'light';
      [themeToggle, themeToggleMobile].forEach(function (button) {
        if (!button) return;
        button.setAttribute('aria-pressed', isLight ? 'true' : 'false');
        button.setAttribute('aria-label', isLight ? 'Увімкнути темну тему' : 'Увімкнути світлу тему');
        button.dataset.theme = currentTheme;
      });
    };
    var applyTheme = function (themeName, persist) {
      currentTheme = themeName === 'light' ? 'light' : 'dark';
      document.documentElement.dataset.theme = currentTheme;
      document.body.classList.toggle('theme-light', currentTheme === 'light');
      document.body.classList.add('theme-ready');
      syncButtons();
      if (persist) {
        try { window.localStorage.setItem('kedrova-theme', currentTheme); } catch (error) {}
      }
      document.dispatchEvent(new CustomEvent('kedrova:themechange', { detail: { theme: currentTheme } }));
    };
    var toggleTheme = function () {
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark', true);
    };
    applyTheme(storedTheme === 'light' ? 'light' : 'dark', false);
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);
  };
})();
