(function () {
  'use strict';
  var Kedrova = window.Kedrova || {};
  Kedrova.initPlayer = function () {
    var player = document.getElementById('stickyPlayer');
    if (!player || player.dataset.kedrovaInit === 'true') return;
    player.dataset.kedrovaInit = 'true';

    var cover = document.getElementById('stickyPlayerCover');
    var title = document.getElementById('stickyPlayerTitle');
    var meta = document.getElementById('stickyPlayerMeta');
    var progressFill = document.getElementById('stickyPlayerProgressFill');
    var progressLabel = document.getElementById('stickyPlayerProgressLabel');
    var prevButton = document.getElementById('stickyPlayerPrev');
    var nextButton = document.getElementById('stickyPlayerNext');
    var actionButton = document.getElementById('stickyPlayerPrimary');
    var listenLink = document.getElementById('stickyPlayerListen');
    var spotifyLink = document.getElementById('stickyPlayerSpotify');
    var volume = document.getElementById('stickyPlayerVolume');
    var status = document.getElementById('stickyPlayerStatus');
    var dismiss = document.getElementById('stickyPlayerDismiss');
    var storageKey = 'kedrova-player-index';
    var hiddenKey = 'kedrova-player-hidden';
    var releases = [];
    var currentIndex = 0;
    var currentScript = document.currentScript || Kedrova.qs('script[src$="/assets/js/player.js"], script[src$="assets/js/player.js"]');
    var basePath = currentScript && currentScript.src ? currentScript.src.replace(/assets\/js\/player\.js(?:\?.*)?$/, '') : Kedrova.getBasePath();

    var getHiddenPreference = function () {
      try { return window.localStorage.getItem(hiddenKey) === '1'; } catch (error) { return false; }
    };
    var applyVisibility = function () {
      var shouldHide = !releases.length || getHiddenPreference();
      player.hidden = shouldHide;
      document.body.classList.toggle('has-sticky-player', !shouldHide);
      if (status && shouldHide && releases.length) {
        status.textContent = 'Release launcher hidden. Open any release page to bring it back later.';
      }
    };
    var update = function () {
      if (!releases.length) {
        applyVisibility();
        return;
      }
      var release = releases[currentIndex];
      if (cover) {
        cover.src = basePath + String(release.cover || '').replace(/^\.\//, '').replace(/^\//, '');
        cover.alt = release.title || 'KEDROVA';
      }
      if (title) title.textContent = release.title || 'KEDROVA';
      if (meta) meta.textContent = [release.type || 'Release', release.year].filter(Boolean).join(' • ');
      if (progressFill) progressFill.style.width = ((currentIndex + 1) / releases.length * 100).toFixed(2) + '%';
      if (progressLabel) progressLabel.textContent = 'Release ' + (currentIndex + 1) + ' of ' + releases.length;
      var listenHref = basePath + 'listen/' + release.slug + '/';
      var spotifyHref = release.spotify || listenHref;
      if (listenLink) listenLink.setAttribute('href', listenHref);
      if (spotifyLink) spotifyLink.setAttribute('href', spotifyHref);
      if (actionButton) {
        actionButton.setAttribute('data-spotify', release.spotify_id || '');
        actionButton.setAttribute('aria-label', 'Open listening options for ' + (release.title || 'current release'));
      }
      if (status && !getHiddenPreference()) status.textContent = 'Selected release: ' + (release.title || 'KEDROVA') + '. Open its page or listening platforms.';
      try { window.localStorage.setItem(storageKey, String(currentIndex)); } catch (error) {}
      applyVisibility();
    };
    var setIndex = function (nextIndex) {
      if (!releases.length) return;
      currentIndex = (nextIndex + releases.length) % releases.length;
      try { window.localStorage.removeItem(hiddenKey); } catch (error) {}
      update();
    };
    var initializeData = function (items) {
      releases = (items || []).filter(function (item) { return item && item.show_player; });
      if (!releases.length) {
        applyVisibility();
        return;
      }
      var currentSlug = document.body.getAttribute('data-release-slug');
      var matchingIndex = releases.findIndex(function (item) { return item.slug === currentSlug; });
      var storedIndex = 0;
      try { storedIndex = parseInt(window.localStorage.getItem(storageKey) || '0', 10); } catch (error) { storedIndex = 0; }
      if (!isNaN(matchingIndex) && matchingIndex >= 0) currentIndex = matchingIndex;
      else if (!isNaN(storedIndex) && storedIndex >= 0 && storedIndex < releases.length) currentIndex = storedIndex;
      update();
    };

    if (dismiss) {
      dismiss.addEventListener('click', function () {
        try { window.localStorage.setItem(hiddenKey, '1'); } catch (error) {}
        applyVisibility();
      });
    }
    if (prevButton) prevButton.addEventListener('click', function () { setIndex(currentIndex - 1); });
    if (nextButton) nextButton.addEventListener('click', function () { setIndex(currentIndex + 1); });
    if (actionButton) {
      actionButton.addEventListener('click', function () {
        var spotifyId = actionButton.getAttribute('data-spotify');
        try { window.localStorage.removeItem(hiddenKey); } catch (error) {}
        if (spotifyId && typeof Kedrova.openSpotifyEmbed === 'function') {
          Kedrova.openSpotifyEmbed(spotifyId);
        } else if (spotifyLink) {
          window.location.href = spotifyLink.getAttribute('href');
        }
      });
    }
    if (volume) {
      volume.disabled = true;
      volume.setAttribute('aria-disabled', 'true');
      volume.tabIndex = -1;
      volume.addEventListener('input', function () {
        if (status) status.textContent = 'Audio controls will be added in a future playback phase.';
      });
    }
    document.addEventListener('keydown', function (event) {
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        setIndex(currentIndex + 1);
      } else if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        setIndex(currentIndex - 1);
      }
    });

    applyVisibility();
    fetch(basePath + 'content/releases.json')
      .then(function (response) {
        if (!response.ok) throw new Error('Player data request failed');
        return response.json();
      })
      .then(initializeData)
      .catch(function () {
        player.hidden = true;
        document.body.classList.remove('has-sticky-player');
        if (status) status.textContent = 'Release launcher data could not be loaded.';
      });
  };
})();
