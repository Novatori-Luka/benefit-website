/* ========================================
   BENEFIT — Script
   ======================================== */

(function () {
  'use strict';

  // ── Header Scroll ──
  const header = document.getElementById('header');
  let lastScroll = 0;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Mobile Menu ──
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Smooth Scroll ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'));
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── Active Nav Highlighting ──
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header__nav a, .mobile-nav a');

  function updateActiveNav() {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // ── Scroll Reveal ──
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── Magazine Carousel ──
  const carousel = document.getElementById('magazine-carousel');
  if (carousel) {
    const slides = carousel.querySelectorAll('.magazine-carousel__slide');
    const total = slides.length;
    let currentIndex = Math.floor(total / 2); // start on middle
    let autoTimer;

    const positions = ['far-prev', 'prev', 'active', 'next', 'far-next'];

    function updateCarousel() {
      slides.forEach(s => {
        s.className = 'magazine-carousel__slide';
        s.style.opacity = '0';
        s.style.pointerEvents = 'none';
      });

      for (let i = 0; i < positions.length; i++) {
        const idx = (currentIndex - 2 + i + total) % total;
        slides[idx].classList.add(positions[i]);
        slides[idx].style.opacity = '';
        slides[idx].style.pointerEvents = '';
      }
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % total;
      updateCarousel();
    }

    function prevSlide() {
      currentIndex = (currentIndex - 1 + total) % total;
      updateCarousel();
    }

    // Click to navigate
    carousel.addEventListener('click', (e) => {
      const slide = e.target.closest('.magazine-carousel__slide');
      if (!slide) return;
      if (slide.classList.contains('prev') || slide.classList.contains('far-prev')) {
        prevSlide();
      } else if (slide.classList.contains('next') || slide.classList.contains('far-next')) {
        nextSlide();
      }
      resetAuto();
    });

    // Auto rotate
    function startAuto() {
      autoTimer = setInterval(nextSlide, 3500);
    }
    function resetAuto() {
      clearInterval(autoTimer);
      startAuto();
    }

    // Pause on hover
    carousel.addEventListener('mouseenter', () => clearInterval(autoTimer));
    carousel.addEventListener('mouseleave', startAuto);

    // Touch swipe
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      clearInterval(autoTimer);
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? nextSlide() : prevSlide();
      }
      startAuto();
    }, { passive: true });

    updateCarousel();
    startAuto();
  }

  // ── Panorama Slider (3D gallery) ──
  // Exposed globally so public-content.js can re-initialize after
  // replacing the cards with Supabase data. Calling it twice is safe:
  // the second call skips work if the panorama is already initialized
  // on the current card set.
  window.initPanoramaSlider = function () {
    const panorama = document.getElementById('panorama-slider');
    if (!panorama || panorama.dataset.initialized === 'true') return;

    const track = panorama.querySelector('.panorama-slider__track');
    const cards = Array.from(track.querySelectorAll('.panorama-slider__card'));
    const dotsEl = panorama.querySelector('.panorama-slider__dots');
    const arrowBtns = panorama.querySelectorAll('.panorama-slider__arrow');

    const aspect = (panorama.dataset.aspect || '3/4').split('/').map(Number);
    const showReflection = panorama.dataset.reflection !== 'false';
    const showArrows = panorama.dataset.arrows !== 'false';
    const showDots = panorama.dataset.dots !== 'false';
    const autoPlay = panorama.dataset.autoplay === 'true';
    const autoPlayInterval = parseInt(panorama.dataset.autoplayInterval, 10) || 3000;

    const DEPTH = [
      { translateX: 0,   rotateY: 0,  scale: 1,    opacity: 1    },
      { translateX: 320, rotateY: 38, scale: 0.84, opacity: 0.72 },
      { translateX: 540, rotateY: 52, scale: 0.70, opacity: 0.38 },
    ];

    if (showReflection) panorama.classList.add('panorama-slider--reflection');
    if (!showArrows) panorama.querySelector('.panorama-slider__arrows').style.display = 'none';
    if (!showDots) dotsEl.style.display = 'none';

    let active = Math.floor((cards.length - 1) / 2);
    let cardW = 320;
    let cardH = 427;
    let autoTimer = null;

    // Build dots
    if (showDots) {
      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'panorama-slider__dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => { setActive(i); resetAuto(); });
        dotsEl.appendChild(dot);
      });
    }
    const dotEls = Array.from(dotsEl.children);

    function measure() {
      const w = track.clientWidth || panorama.clientWidth;
      cardW = Math.round(Math.min(w * 0.28, 320));
      cardH = Math.round(cardW * (aspect[1] / aspect[0]));
      const reflectionPad = showReflection ? cardH * 0.12 + 8 : 0;
      track.style.height = (cardH + reflectionPad + 8) + 'px';
      cards.forEach(c => {
        c.style.width = cardW + 'px';
        c.style.height = cardH + 'px';
        c.style.marginLeft = -(cardW / 2) + 'px';
        c.style.marginTop = -(cardH / 2) + 'px';
      });
      render();
    }

    function render() {
      cards.forEach((card, i) => {
        const offset = i - active;
        const abs = Math.abs(offset);
        const dir = offset >= 0 ? 1 : -1;
        const cfg = abs >= DEPTH.length ? DEPTH[DEPTH.length - 1] : DEPTH[abs];
        const opacity = abs >= DEPTH.length ? 0 : cfg.opacity;
        card.style.transform =
          'translateX(' + (dir * cfg.translateX) + 'px) ' +
          'rotateY(' + (dir * cfg.rotateY) + 'deg) ' +
          'scale(' + cfg.scale + ')';
        card.style.opacity = opacity;
        card.style.zIndex = abs >= DEPTH.length ? 0 : (DEPTH.length - abs);
        card.classList.toggle('panorama-slider__card--active', i === active);
      });
      if (showDots) {
        dotEls.forEach((d, i) =>
          d.classList.toggle('panorama-slider__dot--active', i === active));
      }
    }

    function setActive(i) {
      active = Math.max(0, Math.min(cards.length - 1, i));
      render();
    }

    function go(dir) {
      setActive(active + dir);
      resetAuto();
    }

    // Card click
    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        if (!drag.moved) { setActive(i); resetAuto(); }
      });
    });

    // Arrows
    arrowBtns.forEach(btn => {
      btn.addEventListener('click', () => go(parseInt(btn.dataset.dir, 10)));
    });

    // Drag / swipe
    const drag = { startX: 0, dragging: false, moved: false };

    track.addEventListener('pointerdown', (e) => {
      drag.startX = e.clientX;
      drag.dragging = true;
      drag.moved = false;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if (!drag.dragging) return;
      if (Math.abs(e.clientX - drag.startX) > 8) drag.moved = true;
    });
    track.addEventListener('pointerup', (e) => {
      if (!drag.dragging) return;
      drag.dragging = false;
      const delta = e.clientX - drag.startX;
      if (drag.moved && Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    });

    // Autoplay
    function startAuto() {
      if (!autoPlay || cards.length < 2) return;
      autoTimer = setInterval(() => setActive((active + 1) % cards.length), autoPlayInterval);
    }
    function resetAuto() {
      if (autoTimer) clearInterval(autoTimer);
      startAuto();
    }

    // Resize
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    measure();
    startAuto();

    panorama.dataset.initialized = 'true';
  };

  // Fallback auto-init: if public-content.js doesn't run, still init the
  // panorama on page load with the hardcoded cards.
  setTimeout(() => {
    const panorama = document.getElementById('panorama-slider');
    if (panorama && !panorama.dataset.initialized) window.initPanoramaSlider();
  }, 2000);

  // ── Scroll Animation (frame-sequence canvas) ──
  const scrollAnim = document.getElementById('scroll-animation');
  if (scrollAnim) {
    const canvas = scrollAnim.querySelector('.scroll-animation__canvas');
    const placeholder = scrollAnim.querySelector('.scroll-animation__placeholder');
    const frameCount = parseInt(scrollAnim.dataset.frameCount, 10) || 83;
    const frameBaseUrl = (scrollAnim.dataset.frameBaseUrl || '').trim();
    const scrollHeight = parseInt(scrollAnim.dataset.scrollHeight, 10);
    if (scrollHeight) scrollAnim.style.height = scrollHeight + 'vh';

    const ctx = canvas.getContext('2d');
    canvas.width = 1920;
    canvas.height = 1080;

    const bitmaps = new Array(frameCount).fill(null);
    let currentIndex = -1;
    let firstFrameReady = false;

    function drawFrame(bm) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bm, 0, 0, canvas.width, canvas.height);
    }

    // Only load frames if a base URL is configured. Without frames the section
    // still renders: sticky black background with callouts revealed on scroll.
    if (frameBaseUrl) {
      // Show frame-001 as a static placeholder until the bitmap is ready.
      if (placeholder) {
        placeholder.src = frameBaseUrl + '/frame-001.webp';
      }

      for (let i = 0; i < frameCount; i++) {
        const idx = i;
        const url = frameBaseUrl + '/frame-' + String(i + 1).padStart(3, '0') + '.webp';
        fetch(url)
          .then(r => r.ok ? r.blob() : null)
          .then(b => b ? createImageBitmap(b) : null)
          .then(bm => {
            if (!bm) return;
            bitmaps[idx] = bm;
            if (idx === 0) {
              drawFrame(bm);
              canvas.classList.add('is-ready');
              if (placeholder) placeholder.style.display = 'none';
              firstFrameReady = true;
            }
          })
          .catch(() => {});
      }
    }

    function onAnimScroll() {
      if (!firstFrameReady) return;
      const rect = scrollAnim.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const targetIndex = Math.round(progress * (frameCount - 1));
      if (targetIndex === currentIndex) return;
      const bm = bitmaps[targetIndex];
      if (bm) {
        drawFrame(bm);
        currentIndex = targetIndex;
      }
    }

    window.addEventListener('scroll', onAnimScroll, { passive: true });
  }

  // ── Contact Form (Demo) ──
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');

  if (contactForm && formSuccess) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Simple validation
      const name = contactForm.querySelector('#cf-name');
      const email = contactForm.querySelector('#cf-email');

      if (!name.value.trim() || !email.value.trim()) return;

      // Show success
      contactForm.style.display = 'none';
      formSuccess.classList.add('show');

      // Reset after 5s
      setTimeout(() => {
        formSuccess.classList.remove('show');
        contactForm.style.display = '';
        contactForm.reset();
      }, 5000);
    });
  }

})();
