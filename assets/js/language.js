(function () {
  'use strict';
  var Kedrova = window.Kedrova || {};
  Kedrova.initLanguage = function () {
    var currentLang = 'ua';
    var storedLang = null;
    var langBtn = document.getElementById('langToggle');
    var langBtnMobile = document.getElementById('langToggleMobile');
    try { storedLang = window.localStorage.getItem('kedrova-lang'); } catch (error) { storedLang = null; }

    var syncButtons = function () {
      var btnLabel = currentLang === 'ua' ? 'ENG' : 'UA';
      [langBtn, langBtnMobile].forEach(function (button) {
        if (!button) return;
        button.textContent = btnLabel;
        button.setAttribute('aria-pressed', currentLang === 'en' ? 'true' : 'false');
        button.setAttribute('aria-label', currentLang === 'ua' ? 'Switch language to English' : 'Перемкнути мову на українську');
      });
    };
    var applyLang = function (langName) {
      currentLang = langName === 'en' ? 'en' : 'ua';
      var attr = currentLang === 'ua' ? 'data-ua' : 'data-en';
      document.documentElement.lang = currentLang === 'ua' ? 'uk' : 'en';
      Kedrova.qsa('[data-ua][data-en]').forEach(function (element) {
        var value = element.getAttribute(attr);
        if (value === null) return;
        if (value.indexOf('<') !== -1) element.innerHTML = value; else element.textContent = value;
      });
      syncButtons();
      try { window.localStorage.setItem('kedrova-lang', currentLang); } catch (error) {}
      document.dispatchEvent(new CustomEvent('kedrova:langchange', { detail: { lang: currentLang } }));
    };
    if (langBtn) langBtn.addEventListener('click', function () { applyLang(currentLang === 'ua' ? 'en' : 'ua'); });
    if (langBtnMobile) langBtnMobile.addEventListener('click', function () { applyLang(currentLang === 'ua' ? 'en' : 'ua'); });
    applyLang(storedLang === 'en' ? 'en' : 'ua');
  };
})();
