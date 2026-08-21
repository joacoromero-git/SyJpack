document.addEventListener('DOMContentLoaded', () => {
  /* Menú móvil */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = document.body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Carrusel de modelos destacados */
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('.carousel-track');
    const prevBtn = carousel.querySelector('[data-dir="prev"]');
    const nextBtn = carousel.querySelector('[data-dir="next"]');
    if (!track) return;

    const scrollAmount = () => {
      const card = track.querySelector('.carousel-card');
      const gap = 24;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
      });
    }
  });

  /* Carrusel automático del hero (cuadrado) */
  const heroCarousel = document.querySelector('[data-hero-carousel]');
  if (heroCarousel) {
    const slides = Array.from(heroCarousel.querySelectorAll('.hero-carousel-slide'));
    const dotsWrap = heroCarousel.parentElement.querySelector('.hero-carousel-dots');
    let current = Math.max(0, slides.findIndex((s) => s.classList.contains('is-active')));
    let timer = null;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle('is-active', i === current));
      }
    };

    const goTo = (index) => {
      current = (index + slides.length) % slides.length;
      render();
      restartTimer();
    };

    const next = () => goTo(current + 1);
    const startTimer = () => { if (!prefersReducedMotion && slides.length > 1) timer = setInterval(next, 4000); };
    const stopTimer = () => { if (timer) clearInterval(timer); };
    const restartTimer = () => { stopTimer(); startTimer(); };

    if (dotsWrap) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'hero-carousel-dot' + (i === current ? ' is-active' : '');
        dot.setAttribute('aria-label', `Ver imagen destacada ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    }

    heroCarousel.addEventListener('mouseenter', stopTimer);
    heroCarousel.addEventListener('mouseleave', startTimer);
    heroCarousel.addEventListener('focusin', stopTimer);
    heroCarousel.addEventListener('focusout', startTimer);

    render();
    startTimer();
  }

  /* Sombra del header al scrollear */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Año dinámico en el footer */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});