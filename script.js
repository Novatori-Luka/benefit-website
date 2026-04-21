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
