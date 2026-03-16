(function () {
  'use strict';
  var Kedrova = window.Kedrova || {};
  Kedrova.initGallery = function () {
    var galleryTrack = document.getElementById('galleryTrack');
    var galleryLightbox = document.getElementById('galleryLightbox');
    var galleryLightboxImage = document.getElementById('galleryLightboxImage');
    var galleryLightboxClose = document.getElementById('galleryLightboxClose');
    var galleryLightboxPrev = document.getElementById('galleryLightboxPrev');
    var galleryLightboxNext = document.getElementById('galleryLightboxNext');
    var galleryProgressHost = document.querySelector('.gallery-scroll-indicator-line');
    var galleryLightboxFigure = galleryLightbox ? galleryLightbox.querySelector('.gallery-lightbox-figure') : null;
    var galleryImages = [];
    var galleryCurrentIndex = 0;
    var galleryTargetScroll = 0;
    var galleryScrollRaf = 0;
    var lightboxTouchStartX = 0;
    var lightboxTouchStartY = 0;
    var releaseTrap = null;

    var getGalleryMaxScroll = function () {
      if (!galleryTrack) return 0;
      return Math.max(0, galleryTrack.scrollWidth - galleryTrack.clientWidth);
    };
    var updateGalleryProgress = function () {
      if (!galleryTrack || !galleryProgressHost) return;
      var maxScroll = getGalleryMaxScroll();
      var progress = maxScroll > 0 ? (galleryTrack.scrollLeft / maxScroll) * 100 : 0;
      galleryProgressHost.style.setProperty('--gallery-progress', Math.max(0, Math.min(100, progress)) + '%');
    };
    var syncGalleryScrollTarget = function () {
      if (!galleryTrack) return;
      galleryTargetScroll = galleryTrack.scrollLeft;
      updateGalleryProgress();
    };
    var runGalleryMomentum = function () {
      if (!galleryTrack) return;
      var maxScroll = getGalleryMaxScroll();
      galleryTargetScroll = Math.min(maxScroll, Math.max(0, galleryTargetScroll));
      var diff = galleryTargetScroll - galleryTrack.scrollLeft;
      if (Math.abs(diff) < 0.5) {
        galleryTrack.scrollLeft = galleryTargetScroll;
        galleryScrollRaf = 0;
        updateGalleryProgress();
        return;
      }
      galleryTrack.scrollLeft += Kedrova.getMotionPreference() ? diff : diff * 0.28;
      updateGalleryProgress();
      galleryScrollRaf = window.requestAnimationFrame(runGalleryMomentum);
    };
    var queueGalleryScroll = function (delta) {
      if (!galleryTrack) return;
      var maxScroll = getGalleryMaxScroll();
      galleryTargetScroll = Math.min(maxScroll, Math.max(0, galleryTargetScroll + delta));
      if (!galleryScrollRaf) galleryScrollRaf = window.requestAnimationFrame(runGalleryMomentum);
    };
    var setGalleryImage = function (index) {
      if (!galleryImages.length || !galleryLightboxImage) return;
      galleryCurrentIndex = (index + galleryImages.length) % galleryImages.length;
      var currentImage = galleryImages[galleryCurrentIndex];
      galleryLightboxImage.src = currentImage.src;
      galleryLightboxImage.alt = currentImage.alt || 'KEDROVA';
    };
    var showPrev = function () { setGalleryImage(galleryCurrentIndex - 1); };
    var showNext = function () { setGalleryImage(galleryCurrentIndex + 1); };
    var close = function () {
      if (!galleryLightbox || !galleryLightbox.classList.contains('active')) return;
      galleryLightbox.classList.remove('active');
      galleryLightbox.setAttribute('aria-hidden', 'true');
      if (typeof releaseTrap === 'function') releaseTrap();
      Kedrova.clearFocusTrap();
      if (galleryLightboxImage) galleryLightboxImage.removeAttribute('src');
      Kedrova.unlockBodyScroll();
      Kedrova.restoreFocus();
    };
    var open = function (index) {
      if (!galleryLightbox || !galleryImages.length) return;
      setGalleryImage(index);
      galleryLightbox.classList.add('active');
      galleryLightbox.setAttribute('aria-hidden', 'false');
      Kedrova.setLastActiveTrigger(document.activeElement);
      Kedrova.lockBodyScroll();
      releaseTrap = Kedrova.activateFocusTrap(galleryLightbox, galleryLightboxClose || galleryLightbox);
    };
    Kedrova.closeGalleryLightbox = close;
    Kedrova.showPrevGalleryImage = showPrev;
    Kedrova.showNextGalleryImage = showNext;

    if (galleryTrack) {
      Kedrova.qsa('.gallery-item', galleryTrack).forEach(function (item, index) {
        var button = item.querySelector('button');
        var image = item.querySelector('img');
        if (button) {
          button.setAttribute('data-gallery-real-index', String(index));
          button.setAttribute('aria-label', (image && image.getAttribute('alt')) || 'Open gallery image');
        }
        if (image) galleryImages.push({ src: image.getAttribute('src'), alt: image.getAttribute('alt') || 'KEDROVA' });
      });
      syncGalleryScrollTarget();
      updateGalleryProgress();
      galleryTrack.addEventListener('wheel', function (event) {
        var dominantDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
        if (!dominantDelta) return;
        event.preventDefault();
        queueGalleryScroll(dominantDelta * 8);
      }, { passive: false });
      galleryTrack.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          queueGalleryScroll(galleryTrack.clientWidth * 0.7);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          queueGalleryScroll(-galleryTrack.clientWidth * 0.7);
        }
      });
      galleryTrack.addEventListener('scroll', syncGalleryScrollTarget, { passive: true });
      galleryTrack.addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-gallery-real-index]');
        if (!trigger) return;
        var index = parseInt(trigger.getAttribute('data-gallery-real-index'), 10);
        if (!isNaN(index)) open(index);
      });
      galleryTrack.addEventListener('dragstart', function (event) { event.preventDefault(); });
      window.addEventListener('resize', function () {
        window.cancelAnimationFrame(galleryScrollRaf);
        galleryScrollRaf = 0;
        galleryTrack.scrollLeft = Math.min(getGalleryMaxScroll(), galleryTrack.scrollLeft);
        galleryTargetScroll = galleryTrack.scrollLeft;
        syncGalleryScrollTarget();
      }, { passive: true });
    }
    if (galleryLightboxClose) galleryLightboxClose.addEventListener('click', close);
    if (galleryLightboxPrev) galleryLightboxPrev.addEventListener('click', showPrev);
    if (galleryLightboxNext) galleryLightboxNext.addEventListener('click', showNext);
    if (galleryLightboxFigure) {
      galleryLightboxFigure.addEventListener('click', function (event) {
        if (!galleryLightbox || !galleryLightbox.classList.contains('active')) return;
        if (!(window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(pointer: coarse)').matches)) return;
        if (event.target.closest('.gallery-lightbox-close, .gallery-lightbox-prev, .gallery-lightbox-next')) return;
        var rect = galleryLightboxFigure.getBoundingClientRect();
        var clickX = event.clientX - rect.left;
        if (clickX < rect.width / 2) showPrev(); else showNext();
      });
    }
    if (galleryLightbox) {
      galleryLightbox.addEventListener('touchstart', function (event) {
        if (!event.touches || !event.touches.length) return;
        lightboxTouchStartX = event.touches[0].clientX;
        lightboxTouchStartY = event.touches[0].clientY;
      }, { passive: true });
      galleryLightbox.addEventListener('touchend', function (event) {
        if (!event.changedTouches || !event.changedTouches.length) return;
        var deltaX = event.changedTouches[0].clientX - lightboxTouchStartX;
        var deltaY = event.changedTouches[0].clientY - lightboxTouchStartY;
        if (Math.abs(deltaX) > 46 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) showPrev(); else showNext();
        }
      }, { passive: true });
      galleryLightbox.addEventListener('click', function (event) { if (event.target === galleryLightbox) close(); });
      galleryLightbox.addEventListener('wheel', function (event) {
        if (!galleryLightbox.classList.contains('active')) return;
        event.preventDefault();
        if (event.deltaY < 0 || event.deltaX < 0) showPrev(); else showNext();
      }, { passive: false });
    }
  };
})();
