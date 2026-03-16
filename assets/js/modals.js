(function () {
  'use strict';
  var Kedrova = window.Kedrova || {};
  Kedrova.initModals = function () {
    var videoModal = document.getElementById('videoModal');
    var videoContent = document.getElementById('videoModalContent');
    var videoClose = document.getElementById('videoModalClose');
    var spotifyModal = document.getElementById('spotifyModal');
    var spotifyContent = document.getElementById('spotifyModalContent');
    var spotifyClose = document.getElementById('spotifyModalClose');
    var releaseTrap = null;

    var openModal = function (backdrop, content, closeButton, html) {
      if (!backdrop || !content) return;
      content.innerHTML = html;
      backdrop.classList.add('active');
      backdrop.setAttribute('aria-hidden', 'false');
      Kedrova.setLastActiveTrigger(document.activeElement);
      Kedrova.lockBodyScroll();
      releaseTrap = Kedrova.activateFocusTrap(backdrop, closeButton || content);
    };
    var closeModal = function (backdrop, content) {
      if (!backdrop || !backdrop.classList.contains('active')) return;
      backdrop.classList.remove('active');
      backdrop.setAttribute('aria-hidden', 'true');
      if (content) content.innerHTML = '';
      if (typeof releaseTrap === 'function') releaseTrap();
      Kedrova.clearFocusTrap();
      Kedrova.unlockBodyScroll();
      Kedrova.restoreFocus();
    };
    var closeVideoModal = function () { closeModal(videoModal, videoContent); };
    var closeSpotifyModal = function () { closeModal(spotifyModal, spotifyContent); };
    Kedrova.closeVideoModal = closeVideoModal;
    Kedrova.closeSpotifyModal = closeSpotifyModal;
    Kedrova.openSpotifyEmbed = function (spotifyId) {
      if (!spotifyId) return;
      openModal(spotifyModal, spotifyContent, spotifyClose, '<iframe src="https://open.spotify.com/embed/album/' + spotifyId + '?utm_source=generator&theme=0" title="Spotify player" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>');
    };

    Kedrova.qsa('.video-card').forEach(function (card) {
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      if (!card.hasAttribute('role')) card.setAttribute('role', 'button');
      if (!card.hasAttribute('aria-label')) card.setAttribute('aria-label', 'Open video');
      var handleOpen = function () {
        if (!videoModal || !videoContent) return;
        var id = card.getAttribute('data-video');
        openModal(videoModal, videoContent, videoClose, '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>');
      };
      card.addEventListener('click', handleOpen);
      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpen();
        }
      });
    });

    Kedrova.qsa('.disco-card').forEach(function (card) {
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      card.addEventListener('click', function (event) {
        if (event.target.closest('a')) return;
        Kedrova.openSpotifyEmbed(card.getAttribute('data-spotify'));
      });
      card.addEventListener('keydown', function (event) {
        if (event.target.closest('a')) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          Kedrova.openSpotifyEmbed(card.getAttribute('data-spotify'));
        }
      });
    });
    var heroButton = document.querySelector('.hero-play-btn');
    if (heroButton) {
      heroButton.addEventListener('click', function (event) {
        event.stopPropagation();
        Kedrova.openSpotifyEmbed(heroButton.getAttribute('data-spotify'));
      });
    }

    if (videoClose) videoClose.addEventListener('click', closeVideoModal);
    if (videoModal) videoModal.addEventListener('click', function (event) { if (event.target === videoModal) closeVideoModal(); });
    if (spotifyClose) spotifyClose.addEventListener('click', closeSpotifyModal);
    if (spotifyModal) spotifyModal.addEventListener('click', function (event) { if (event.target === spotifyModal) closeSpotifyModal(); });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (typeof Kedrova.closeGalleryLightbox === 'function') Kedrova.closeGalleryLightbox();
        closeVideoModal();
        closeSpotifyModal();
        return;
      }
      var galleryLightbox = document.getElementById('galleryLightbox');
      if (galleryLightbox && galleryLightbox.classList.contains('active')) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          if (typeof Kedrova.showPrevGalleryImage === 'function') Kedrova.showPrevGalleryImage();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          if (typeof Kedrova.showNextGalleryImage === 'function') Kedrova.showNextGalleryImage();
        }
      }
    });
  };
})();
