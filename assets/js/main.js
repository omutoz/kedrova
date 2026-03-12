(function() {
  'use strict';

  /* ─── Header scroll ─── */
  var header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function() {
      header.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ─── Hamburger ─── */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  function syncMobileMenuOffset() {
    if (!header || !mobileMenu) return;
    var headerHeight = Math.ceil(header.getBoundingClientRect().height);
    mobileMenu.style.setProperty('--mobile-menu-offset', Math.max(96, headerHeight + 28) + 'px');
  }

  if (hamburger && mobileMenu) {
    syncMobileMenuOffset();
    hamburger.addEventListener('click', function() {
      syncMobileMenuOffset();
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      if (mobileMenu.classList.contains('active')) {
        lockBodyScroll();
      } else {
        unlockBodyScroll();
      }
    });
    var mobileLinks = mobileMenu.querySelectorAll('a');
    for (var i = 0; i < mobileLinks.length; i++) {
      mobileLinks[i].addEventListener('click', function() {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        unlockBodyScroll();
      });
    }

    window.addEventListener('resize', syncMobileMenuOffset, { passive: true });
    window.addEventListener('orientationchange', syncMobileMenuOffset, { passive: true });
  }

  /* ─── Smooth scroll ─── */
  var anchors = document.querySelectorAll('a[href^="#"]');
  for (var j = 0; j < anchors.length; j++) {
    anchors[j].addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        var pos = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: pos, behavior: 'smooth' });
      }
    });
  }

  /* ─── Scroll reveal ─── */
  var reveals = document.querySelectorAll('.reveal');

  function checkReveal() {
    for (var k = 0; k < reveals.length; k++) {
      var el = reveals[k];
      if (el.classList.contains('visible')) continue;
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 40) {
        el.classList.add('visible');
      }
    }
  }

  // First: mark everything currently in viewport as visible BEFORE enabling animations
  checkReveal();
  // Then: enable the animation system (only offscreen items will animate in)
  document.body.classList.add('reveal-ready');

  window.addEventListener('scroll', checkReveal, { passive: true });
  window.addEventListener('resize', checkReveal, { passive: true });
  setTimeout(checkReveal, 100);
  setTimeout(checkReveal, 500);
  // Ultimate safety net: reveal everything after 3 seconds
  setTimeout(function() {
    for (var s = 0; s < reveals.length; s++) {
      reveals[s].classList.add('visible');
    }
  }, 3000);

  /* ─── Shared body scroll lock ─── */
  var bodyLockCount = 0;

  function lockBodyScroll() {
    bodyLockCount += 1;
    document.body.style.overflow = 'hidden';
  }

  function unlockBodyScroll() {
    bodyLockCount = Math.max(0, bodyLockCount - 1);
    if (bodyLockCount === 0) {
      document.body.style.overflow = '';
    }
  }

  /* ─── Gallery horizontal scroll + lightbox ─── */
  var galleryTrack = document.getElementById('galleryTrack');
  var galleryLightbox = document.getElementById('galleryLightbox');
  var galleryLightboxImage = document.getElementById('galleryLightboxImage');
  var galleryLightboxClose = document.getElementById('galleryLightboxClose');
  var galleryLightboxPrev = document.getElementById('galleryLightboxPrev');
  var galleryLightboxNext = document.getElementById('galleryLightboxNext');
  var galleryImages = [];
  var galleryCurrentIndex = 0;
  var galleryTargetScroll = 0;
  var galleryScrollRaf = 0;
  var galleryLoopSpan = 0;
  var galleryLoopReady = false;
  var galleryOriginalItems = [];

  function getGalleryMaxScroll() {
    if (!galleryTrack) return 0;
    return Math.max(0, galleryTrack.scrollWidth - galleryTrack.clientWidth);
  }

  function measureGalleryLoopSpan() {
    if (!galleryTrack || !galleryOriginalItems.length) return 0;
    var styles = window.getComputedStyle(galleryTrack);
    var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    var total = 0;
    for (var gi = 0; gi < galleryOriginalItems.length; gi++) {
      total += galleryOriginalItems[gi].getBoundingClientRect().width;
      if (gi < galleryOriginalItems.length - 1) {
        total += gap;
      }
    }
    return Math.round(total);
  }

  function normalizeGalleryTarget(value) {
    if (!galleryLoopReady || !galleryLoopSpan) return Math.max(0, value);
    var normalized = value;
    while (normalized < galleryLoopSpan) {
      normalized += galleryLoopSpan;
    }
    while (normalized >= galleryLoopSpan * 2) {
      normalized -= galleryLoopSpan;
    }
    return normalized;
  }

  function normalizeGalleryLoop() {
    if (!galleryTrack || !galleryLoopReady || !galleryLoopSpan) return;
    var loopStart = galleryLoopSpan;
    var loopEnd = galleryLoopSpan * 2;
    var current = galleryTrack.scrollLeft;

    if (current <= 1) {
      galleryTrack.scrollLeft = current + galleryLoopSpan;
      galleryTargetScroll = normalizeGalleryTarget(galleryTargetScroll + galleryLoopSpan);
    } else if (current >= loopEnd - 1) {
      galleryTrack.scrollLeft = current - galleryLoopSpan;
      galleryTargetScroll = normalizeGalleryTarget(galleryTargetScroll - galleryLoopSpan);
    }
  }

  function runGalleryMomentum() {
    if (!galleryTrack) return;
    var maxScroll = getGalleryMaxScroll();
    galleryTargetScroll = galleryLoopReady ? normalizeGalleryTarget(galleryTargetScroll) : Math.min(maxScroll, Math.max(0, galleryTargetScroll));
    var diff = galleryTargetScroll - galleryTrack.scrollLeft;
    if (Math.abs(diff) < 0.5) {
      galleryTrack.scrollLeft = galleryTargetScroll;
      normalizeGalleryLoop();
      galleryScrollRaf = 0;
      updateGalleryProgress();
      return;
    }
    galleryTrack.scrollLeft += diff * 0.28;
    normalizeGalleryLoop();
    updateGalleryProgress();
    galleryScrollRaf = window.requestAnimationFrame(runGalleryMomentum);
  }

  function queueGalleryScroll(delta) {
    if (!galleryTrack) return;
    var maxScroll = getGalleryMaxScroll();
    galleryTargetScroll = galleryLoopReady ? normalizeGalleryTarget(galleryTargetScroll + delta) : Math.min(maxScroll, Math.max(0, galleryTargetScroll + delta));
    if (!galleryScrollRaf) {
      galleryScrollRaf = window.requestAnimationFrame(runGalleryMomentum);
    }
  }

  function syncGalleryScrollTarget() {
    if (!galleryTrack) return;
    normalizeGalleryLoop();
    galleryTargetScroll = galleryTrack.scrollLeft;
    updateGalleryProgress();
  }

  var galleryProgressHost = document.querySelector('.gallery-scroll-indicator-line');

  function updateGalleryProgress() {
    if (!galleryTrack || !galleryProgressHost) return;
    var effectiveScroll = galleryTrack.scrollLeft;
    if (galleryLoopReady && galleryLoopSpan > 0) {
      effectiveScroll = ((effectiveScroll - galleryLoopSpan) % galleryLoopSpan + galleryLoopSpan) % galleryLoopSpan;
    }
    var progress = galleryLoopSpan > 0 ? (effectiveScroll / galleryLoopSpan) * 100 : 0;
    progress = Math.max(0, Math.min(100, progress));
    galleryProgressHost.style.setProperty('--gallery-progress', progress + '%');
  }

  function setGalleryImage(index) {
    if (!galleryImages.length || !galleryLightboxImage) return;
    galleryCurrentIndex = (index + galleryImages.length) % galleryImages.length;
    var currentImage = galleryImages[galleryCurrentIndex];
    galleryLightboxImage.src = currentImage.src;
    galleryLightboxImage.alt = currentImage.alt || 'KEDROVA';
  }

  function openGalleryLightbox(index) {
    if (!galleryLightbox || !galleryImages.length) return;
    setGalleryImage(index);
    galleryLightbox.classList.add('active');
    galleryLightbox.setAttribute('aria-hidden', 'false');
    lockBodyScroll();
  }

  function closeGalleryLightbox() {
    if (!galleryLightbox || !galleryLightbox.classList.contains('active')) return;
    galleryLightbox.classList.remove('active');
    galleryLightbox.setAttribute('aria-hidden', 'true');
    if (galleryLightboxImage) {
      galleryLightboxImage.removeAttribute('src');
    }
    unlockBodyScroll();
  }

  function showPrevGalleryImage() {
    setGalleryImage(galleryCurrentIndex - 1);
  }

  function showNextGalleryImage() {
    setGalleryImage(galleryCurrentIndex + 1);
  }

  if (galleryTrack) {
    var originalItems = Array.prototype.slice.call(galleryTrack.querySelectorAll('.gallery-item'));
    galleryOriginalItems = originalItems.slice();

    for (var oi = 0; oi < originalItems.length; oi++) {
      var originalButton = originalItems[oi].querySelector('button');
      var originalImage = originalItems[oi].querySelector('img');
      if (originalButton) {
        originalButton.setAttribute('data-gallery-real-index', String(oi));
      }
      if (originalImage) {
        galleryImages.push({
          src: originalImage.getAttribute('src'),
          alt: originalImage.getAttribute('alt') || 'KEDROVA'
        });
      }
    }

    if (originalItems.length) {
      var prependFragment = document.createDocumentFragment();
      var appendFragment = document.createDocumentFragment();

      for (var pi = 0; pi < originalItems.length; pi++) {
        var prependClone = originalItems[pi].cloneNode(true);
        var prependButton = prependClone.querySelector('button');
        if (prependButton) {
          prependButton.setAttribute('data-gallery-real-index', String(pi));
          prependButton.setAttribute('tabindex', '-1');
        }
        prependClone.setAttribute('aria-hidden', 'true');
        prependFragment.appendChild(prependClone);

        var appendClone = originalItems[pi].cloneNode(true);
        var appendButton = appendClone.querySelector('button');
        if (appendButton) {
          appendButton.setAttribute('data-gallery-real-index', String(pi));
          appendButton.setAttribute('tabindex', '-1');
        }
        appendClone.setAttribute('aria-hidden', 'true');
        appendFragment.appendChild(appendClone);
      }

      galleryTrack.insertBefore(prependFragment, galleryTrack.firstChild);
      galleryTrack.appendChild(appendFragment);

      function initializeGalleryLoop() {
        galleryLoopSpan = measureGalleryLoopSpan();
        galleryLoopReady = galleryLoopSpan > 0;
        if (galleryLoopReady) {
          galleryTrack.scrollLeft = galleryLoopSpan;
          galleryTargetScroll = galleryLoopSpan;
          updateGalleryProgress();
        }
      }

      window.requestAnimationFrame(initializeGalleryLoop);
      for (var ii = 0; ii < galleryOriginalItems.length; ii++) {
        var loopImage = galleryOriginalItems[ii].querySelector('img');
        if (loopImage && !loopImage.complete) {
          loopImage.addEventListener('load', initializeGalleryLoop, { passive: true });
        }
      }
    }

    syncGalleryScrollTarget();
    updateGalleryProgress();

    galleryTrack.addEventListener('wheel', function(event) {
      var dominantDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!dominantDelta) return;
      event.preventDefault();
      queueGalleryScroll(dominantDelta * 8);
    }, { passive: false });

    galleryTrack.addEventListener('scroll', syncGalleryScrollTarget, { passive: true });
    galleryTrack.addEventListener('click', function(event) {
      var trigger = event.target.closest('[data-gallery-real-index]');
      if (!trigger) return;
      var index = parseInt(trigger.getAttribute('data-gallery-real-index'), 10);
      if (!isNaN(index)) {
        openGalleryLightbox(index);
      }
    });

    galleryTrack.addEventListener('dragstart', function(event) {
      event.preventDefault();
    });

    window.addEventListener('resize', function() {
      window.cancelAnimationFrame(galleryScrollRaf);
      galleryScrollRaf = 0;
      if (galleryLoopReady) {
        var relativeOffset = ((galleryTargetScroll - galleryLoopSpan) % galleryLoopSpan + galleryLoopSpan) % galleryLoopSpan;
        galleryLoopSpan = measureGalleryLoopSpan();
        galleryTrack.scrollLeft = galleryLoopSpan + relativeOffset;
        galleryTargetScroll = galleryTrack.scrollLeft;
      }
      syncGalleryScrollTarget();
    }, { passive: true });
  }

  if (galleryLightboxClose) {
    galleryLightboxClose.addEventListener('click', closeGalleryLightbox);
  }
  if (galleryLightboxPrev) {
    galleryLightboxPrev.addEventListener('click', showPrevGalleryImage);
  }
  if (galleryLightboxNext) {
    galleryLightboxNext.addEventListener('click', showNextGalleryImage);
  }

  var lightboxTouchStartX = 0;
  var lightboxTouchStartY = 0;

  function onLightboxTouchStart(event) {
    if (!galleryLightbox || !galleryLightbox.classList.contains('active')) return;
    if (!event.touches || !event.touches.length) return;
    lightboxTouchStartX = event.touches[0].clientX;
    lightboxTouchStartY = event.touches[0].clientY;
  }

  function onLightboxTouchEnd(event) {
    if (!galleryLightbox || !galleryLightbox.classList.contains('active')) return;
    if (!event.changedTouches || !event.changedTouches.length) return;
    var deltaX = event.changedTouches[0].clientX - lightboxTouchStartX;
    var deltaY = event.changedTouches[0].clientY - lightboxTouchStartY;
    if (Math.abs(deltaX) > 46 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        showPrevGalleryImage();
      } else {
        showNextGalleryImage();
      }
    }
  }

  if (galleryLightbox) {
    galleryLightbox.addEventListener('touchstart', onLightboxTouchStart, { passive: true });
    galleryLightbox.addEventListener('touchend', onLightboxTouchEnd, { passive: true });
    galleryLightbox.addEventListener('click', function(event) {
      if (event.target === galleryLightbox) {
        closeGalleryLightbox();
      }
    });

    galleryLightbox.addEventListener('wheel', function(event) {
      if (!galleryLightbox.classList.contains('active')) return;
      event.preventDefault();
      if (event.deltaY < 0 || event.deltaX < 0) {
        showPrevGalleryImage();
      } else {
        showNextGalleryImage();
      }
    }, { passive: false });
  }

  /* ─── Video modal ─── */
  var videoModal = document.getElementById('videoModal');
  var videoContent = document.getElementById('videoModalContent');
  var videoClose = document.getElementById('videoModalClose');
  var videoCards = document.querySelectorAll('.video-card');
  for (var v = 0; v < videoCards.length; v++) {
    videoCards[v].addEventListener('click', function() {
      var id = this.getAttribute('data-video');
      videoContent.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
      videoModal.classList.add('active');
      lockBodyScroll();
    });
  }
  function closeVideoModal() {
    if (!videoModal || !videoModal.classList.contains('active')) return;
    videoModal.classList.remove('active');
    videoContent.innerHTML = '';
    unlockBodyScroll();
  }
  if (videoClose) {
    videoClose.addEventListener('click', closeVideoModal);
  }
  if (videoModal) {
    videoModal.addEventListener('click', function(e) { if (e.target === videoModal) closeVideoModal(); });
  }

  /* ─── Spotify modal ─── */
  var spotifyModal = document.getElementById('spotifyModal');
  var spotifyContent = document.getElementById('spotifyModalContent');
  var spotifyClose = document.getElementById('spotifyModalClose');

  function openSpotify(id) {
    if (!spotifyModal || !spotifyContent) return;
    spotifyContent.innerHTML = '<iframe src="https://open.spotify.com/embed/album/' + id + '?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    spotifyModal.classList.add('active');
    lockBodyScroll();
  }

  var discoCards = document.querySelectorAll('.disco-card');
  for (var d = 0; d < discoCards.length; d++) {
    discoCards[d].addEventListener('click', function() {
      openSpotify(this.getAttribute('data-spotify'));
    });
  }

  /* Hero play button */
  var heroBtn = document.querySelector('.hero-play-btn');
  if (heroBtn) {
    heroBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      openSpotify(this.getAttribute('data-spotify'));
    });
  }

  function closeSpotifyModal() {
    if (!spotifyModal || !spotifyModal.classList.contains('active')) return;
    spotifyModal.classList.remove('active');
    spotifyContent.innerHTML = '';
    unlockBodyScroll();
  }
  if (spotifyClose) {
    spotifyClose.addEventListener('click', closeSpotifyModal);
  }
  if (spotifyModal) {
    spotifyModal.addEventListener('click', function(e) { if (e.target === spotifyModal) closeSpotifyModal(); });
  }

  /* ─── Keyboard controls ─── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeGalleryLightbox();
      closeVideoModal();
      closeSpotifyModal();
      return;
    }

    if (galleryLightbox && galleryLightbox.classList.contains('active')) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showPrevGalleryImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showNextGalleryImage();
      }
    }
  });

  /* ─── Theme toggle ─── */
  var themeToggle = document.getElementById('themeToggle');
  var themeToggleMobile = document.getElementById('themeToggleMobile');
  var currentTheme = 'dark';
  var storedTheme = null;

  try {
    storedTheme = window.localStorage.getItem('kedrova-theme');
  } catch (themeStorageError) {
    storedTheme = null;
  }

  function syncThemeButtons() {
    var isLight = currentTheme === 'light';
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      themeToggle.setAttribute('aria-label', isLight ? 'Увімкнути темну тему' : 'Увімкнути світлу тему');
    }
    if (themeToggleMobile) {
      themeToggleMobile.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      themeToggleMobile.setAttribute('aria-label', isLight ? 'Увімкнути темну тему' : 'Увімкнути світлу тему');
    }
  }

  function applyTheme(themeName) {
    currentTheme = themeName === 'light' ? 'light' : 'dark';
    document.body.classList.toggle('theme-light', currentTheme === 'light');
    syncThemeButtons();
  }

  function persistTheme() {
    try {
      window.localStorage.setItem('kedrova-theme', currentTheme);
    } catch (themeStorageError) {}
  }

  function toggleTheme() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    persistTheme();
    window.location.reload();
  }

  applyTheme(storedTheme === 'light' ? 'light' : 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  if (themeToggleMobile) {
    themeToggleMobile.addEventListener('click', toggleTheme);
  }

  /* ─── Language toggle ─── */
  var currentLang = 'ua';
  var storedLang = null;

  try {
    storedLang = window.localStorage.getItem('kedrova-lang');
  } catch (langStorageError) {
    storedLang = null;
  }
  var langBtn = document.getElementById('langToggle');
  var langBtnMobile = document.getElementById('langToggleMobile');

  function applyLang(langName) {
    currentLang = langName === 'en' ? 'en' : 'ua';
    var attr = currentLang === 'ua' ? 'data-ua' : 'data-en';
    var btnLabel = currentLang === 'ua' ? 'ENG' : 'UA';
    if (langBtn) langBtn.textContent = btnLabel;
    if (langBtnMobile) langBtnMobile.textContent = btnLabel;
    document.documentElement.lang = currentLang === 'ua' ? 'uk' : 'en';

    var els = document.querySelectorAll('[data-ua][data-en]');
    for (var n = 0; n < els.length; n++) {
      var el = els[n];
      var val = el.getAttribute(attr);
      if (val === null) continue;
      if (val.indexOf('<') !== -1) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    }
    try {
      window.localStorage.setItem('kedrova-lang', currentLang);
    } catch (langStorageError) {}
  }

  function toggleLang() {
    applyLang(currentLang === 'ua' ? 'en' : 'ua');
  }

  applyLang(storedLang === 'en' ? 'en' : 'ua');

  if (langBtn) {
    langBtn.addEventListener('click', toggleLang);
  }
  if (langBtnMobile) {
    langBtnMobile.addEventListener('click', toggleLang);
  }

})();
