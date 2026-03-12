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
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
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

  function getGalleryMaxScroll() {
    if (!galleryTrack) return 0;
    return Math.max(0, galleryTrack.scrollWidth - galleryTrack.clientWidth);
  }

  function runGalleryMomentum() {
    if (!galleryTrack) return;
    var maxScroll = getGalleryMaxScroll();
    galleryTargetScroll = Math.min(maxScroll, Math.max(0, galleryTargetScroll));
    var diff = galleryTargetScroll - galleryTrack.scrollLeft;
    if (Math.abs(diff) < 0.5) {
      galleryTrack.scrollLeft = galleryTargetScroll;
      galleryScrollRaf = 0;
      return;
    }
    galleryTrack.scrollLeft += diff * 0.28;
    galleryScrollRaf = window.requestAnimationFrame(runGalleryMomentum);
  }

  function queueGalleryScroll(delta) {
    if (!galleryTrack) return;
    var maxScroll = getGalleryMaxScroll();
    galleryTargetScroll = Math.min(maxScroll, Math.max(0, galleryTargetScroll + delta));
    if (!galleryScrollRaf) {
      galleryScrollRaf = window.requestAnimationFrame(runGalleryMomentum);
    }
  }

  function syncGalleryScrollTarget() {
    if (!galleryTrack) return;
    galleryTargetScroll = galleryTrack.scrollLeft;
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
    var galleryButtons = galleryTrack.querySelectorAll('[data-gallery-index]');
    for (var gi = 0; gi < galleryButtons.length; gi++) {
      galleryButtons[gi].setAttribute('data-gallery-index', String(gi));
      var galleryImage = galleryButtons[gi].querySelector('img');
      if (galleryImage) {
        galleryImages.push({
          src: galleryImage.getAttribute('src'),
          alt: galleryImage.getAttribute('alt') || 'KEDROVA'
        });
      }
    }

    syncGalleryScrollTarget();

    galleryTrack.addEventListener('wheel', function(event) {
      var dominantDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!dominantDelta) return;

      var maxScroll = getGalleryMaxScroll();
      var currentScroll = galleryTrack.scrollLeft;
      var atStart = currentScroll <= 0.5;
      var atEnd = currentScroll >= maxScroll - 0.5;
      var scrollingTowardStart = dominantDelta < 0;
      var scrollingTowardEnd = dominantDelta > 0;

      if ((scrollingTowardStart && !atStart) || (scrollingTowardEnd && !atEnd)) {
        event.preventDefault();
        queueGalleryScroll(dominantDelta * 8);
      }
    }, { passive: false });

    galleryTrack.addEventListener('scroll', syncGalleryScrollTarget, { passive: true });
    galleryTrack.addEventListener('click', function(event) {
      var trigger = event.target.closest('[data-gallery-index]');
      if (!trigger) return;
      var index = parseInt(trigger.getAttribute('data-gallery-index'), 10);
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
  if (galleryLightbox) {
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
  var langBtn = document.getElementById('langToggle');
  var langBtnMobile = document.getElementById('langToggleMobile');

  function toggleLang() {
    currentLang = currentLang === 'ua' ? 'en' : 'ua';
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
  }

  if (langBtn) {
    langBtn.addEventListener('click', toggleLang);
  }
  if (langBtnMobile) {
    langBtnMobile.addEventListener('click', toggleLang);
  }

})();
