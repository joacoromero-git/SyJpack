/* SyJ Pack — interacciones del sitio */
(() => {
  const WA_NUMBER = '5491164373892';
  const waLink = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };

  /* ---------- Menú móvil ---------- */
  const navToggle = $('.nav-toggle');
  if (navToggle) {
    const close = () => { document.body.classList.remove('nav-open', 'no-scroll'); navToggle.setAttribute('aria-expanded', 'false'); };
    navToggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      document.body.classList.toggle('no-scroll', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });
    $$('#nav-menu a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ---------- Header que se esconde + barra de progreso ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 8);
      const hide = y > lastY && y > 400 && !document.body.classList.contains('nav-open');
      header.classList.toggle('is-hidden', hide);
      document.body.classList.toggle('header-hidden', hide);
    }
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- Animaciones al hacer scroll ---------- */
  const revealEls = $$('[data-reveal], .process');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Contadores ---------- */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const end = parseInt(el.dataset.count, 10) || 0;
    const prefix = el.dataset.prefix || '';
    if (reduceMotion) { el.textContent = prefix + end; return; }
    const t0 = performance.now();
    const dur = 1400;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = prefix + Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  } else counters.forEach(runCounter);

  /* ---------- Pila de imágenes del hero ---------- */
  const stack = $('[data-hero-stack]');
  if (stack) {
    const cards = $$('.hero-card', stack);
    const dotsWrap = $('.hero-controls');
    let order = cards.map((_, i) => i);
    let timer;
    const paint = () => {
      order.forEach((cardIdx, pos) => { cards[cardIdx].dataset.pos = String(Math.min(pos, 3)); });
      if (dotsWrap) $$('button', dotsWrap).forEach((d, i) => d.classList.toggle('is-active', i === order[0]));
    };
    const next = () => { order.push(order.shift()); paint(); };
    const goTo = (i) => { while (order[0] !== i) order.push(order.shift()); paint(); restart(); };
    const restart = () => { clearInterval(timer); if (!reduceMotion) timer = setInterval(next, 3800); };
    if (dotsWrap) {
      cards.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Ver producto ${i + 1}`);
        b.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(b);
      });
    }
    stack.addEventListener('click', () => { next(); restart(); });
    stack.addEventListener('mouseenter', () => clearInterval(timer));
    stack.addEventListener('mouseleave', restart);
    paint(); restart();

    // Parallax suave con el mouse
    const visual = stack.closest('.hero-visual');
    if (visual && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
      visual.addEventListener('mousemove', (e) => {
        const r = visual.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        stack.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
      });
      visual.addEventListener('mouseleave', () => { stack.style.transform = ''; });
      stack.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)';
      stack.style.transformStyle = 'preserve-3d';
    }
  }

  /* ---------- Carrusel con arrastre ---------- */
  $$('[data-carousel]').forEach((wrap) => {
    const track = $('.carousel-track', wrap);
    if (!track) return;
    const bar = $('.carousel-progress span', wrap);
    const amount = () => { const c = $('.carousel-card', track); return c ? c.getBoundingClientRect().width + 18 : 300; };
    $$('[data-dir]', wrap).forEach((b) => b.addEventListener('click', () => {
      track.scrollBy({ left: b.dataset.dir === 'next' ? amount() : -amount(), behavior: 'smooth' });
    }));
    const upd = () => {
      if (!bar) return;
      const max = track.scrollWidth - track.clientWidth;
      const ratio = track.clientWidth / track.scrollWidth;
      bar.style.width = `${Math.max(ratio * 100, 12)}%`;
      const p = max > 0 ? track.scrollLeft / max : 0;
      bar.style.transform = `translateX(${p * (100 / Math.max(ratio, 0.12) - 100)}%)`;
    };
    track.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();

    let down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; track.classList.add('is-dragging'); }
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      setTimeout(() => track.classList.remove('is-dragging'), 0);
    });
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  });

  /* ---------- Pestañas (showcase) ---------- */
  $$('[data-tabs]').forEach((root) => {
    const btns = $$('[role="tab"]', root);
    const panels = $$('[role="tabpanel"]', root);
    const select = (i) => {
      btns.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      panels.forEach((p, j) => p.classList.toggle('is-active', i === j));
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); const n = (i + 1) % btns.length; select(n); btns[n].focus(); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); const n = (i - 1 + btns.length) % btns.length; select(n); btns[n].focus(); }
      });
    });
    select(0);
  });

  /* ---------- Caja 3D que se puede girar ---------- */
  $$('[data-box3d]').forEach((wrap) => {
    const box = $('.box3d', wrap);
    let rx = -14, ry = -30, vx = 0, vy = 0.25, dragging = false, px = 0, py = 0;
    const draw = () => { box.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; };
    const loop = () => {
      if (!dragging) { ry += vy; rx += vx; vx *= 0.94; if (Math.abs(vy) > 0.25) vy *= 0.96; else vy = reduceMotion ? 0 : 0.25 * Math.sign(vy || 1); rx = Math.max(-60, Math.min(60, rx)); }
      draw(); requestAnimationFrame(loop);
    };
    wrap.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      ry += dx * 0.5; rx -= dy * 0.4; rx = Math.max(-60, Math.min(60, rx));
      vy = dx * 0.25; vx = -dy * 0.15; px = e.clientX; py = e.clientY;
    });
    const end = () => { dragging = false; };
    wrap.addEventListener('pointerup', end);
    wrap.addEventListener('pointercancel', end);
    requestAnimationFrame(loop);
  });

  /* ---------- Comparador antes / después ---------- */
  $$('[data-compare]').forEach((c) => {
    const r = $('input[type=range]', c);
    const set = () => c.style.setProperty('--pos', `${r.value}%`);
    r.addEventListener('input', set); set();
  });

  /* ---------- Visor de vistas (cerrada / abierta / ambientada) ---------- */
  $$('[data-views]').forEach((v) => {
    const imgs = $$('.views-main img', v);
    const btns = $$('.views-thumbs button', v);
    let i = 0, t;
    const show = (n) => { i = n; imgs.forEach((im, j) => im.classList.toggle('is-active', j === n)); btns.forEach((b, j) => b.classList.toggle('is-active', j === n)); };
    btns.forEach((b, n) => b.addEventListener('click', () => { show(n); clearInterval(t); }));
    if (!reduceMotion) t = setInterval(() => show((i + 1) % imgs.length), 3000);
    show(0);
  });

  /* ---------- Armá tu consulta → WhatsApp ---------- */
  const quote = $('[data-quote]');
  if (quote) {
    const qty = $('#q-qty', quote);
    const qtyOut = $('#q-qty-out', quote);
    const preview = $('.quote-preview', quote);
    const send = $('#q-send', quote);
    const val = (name) => { const el = $(`input[name="${name}"]:checked`, quote); return el ? el.value : ''; };
    const vals = (name) => $$(`input[name="${name}"]:checked`, quote).map((x) => x.value);
    const build = () => {
      const q = parseInt(qty.value, 10);
      qtyOut.textContent = q >= 5000 ? '+5000 u.' : `${q} u.`;
      const lines = ['Hola SyJ Pack, quiero pedir un presupuesto:'];
      const prod = val('q-prod'); if (prod) lines.push(`• Producto: ${prod}`);
      const mat = val('q-mat'); if (mat) lines.push(`• Material: ${mat}`);
      const ext = vals('q-extra'); if (ext.length) lines.push(`• Extras: ${ext.join(', ')}`);
      lines.push(`• Cantidad aproximada: ${qtyOut.textContent}`);
      const med = $('#q-size', quote).value.trim(); if (med) lines.push(`• Medidas: ${med}`);
      const date = $('#q-date', quote).value.trim(); if (date) lines.push(`• Lo necesito para: ${date}`);
      const note = $('#q-note', quote).value.trim(); if (note) lines.push(`• Comentario: ${note}`);
      const name = $('#q-name', quote).value.trim(); if (name) lines.push(`\nSoy ${name}.`);
      const msg = lines.join('\n');
      preview.textContent = msg;
      send.href = waLink(msg);
    };
    quote.addEventListener('input', build);
    quote.addEventListener('change', build);
    build();
  }

  /* ---------- Catálogo: filtros y vistas ---------- */
  const grid = $('.product-grid');
  if (grid) {
    const cards = $$('.product-card', grid);
    const empty = $('.empty-state');
    $$('.filter-btn').forEach((b) => {
      b.addEventListener('click', () => {
        $$('.filter-btn').forEach((x) => x.classList.toggle('is-active', x === b));
        const f = b.dataset.filter;
        let shown = 0;
        cards.forEach((c) => {
          const ok = f === 'all' || (c.dataset.tags || '').split(' ').includes(f);
          c.classList.toggle('is-hidden', !ok);
          if (ok) { shown++; if (!reduceMotion) c.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: Math.min(shown * 35, 300), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }); }
        });
        if (empty) empty.classList.toggle('is-visible', shown === 0);
      });
    });
    const views = $$('.view-switch button');
    const setView = (v) => { grid.dataset.view = v; views.forEach((b) => b.classList.toggle('is-active', b.dataset.view === v)); store.set('syj-view', v); };
    views.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    const saved = store.get('syj-view');
    if (saved && views.some((b) => b.dataset.view === saved)) setView(saved);
  }

  /* ---------- Lightbox de producto ---------- */
  const lb = $('.lightbox');
  if (lb) {
    const cards = $$('.product-card');
    const img = $('.lb-zoom img', lb);
    const zoom = $('.lb-zoom', lb);
    const thumbs = $('.lb-thumbs', lb);
    const refEl = $('.lb-ref', lb), nameEl = $('.lb-name', lb), descEl = $('.lb-desc', lb), specsEl = $('.lb-specs', lb);
    const waBtn = $('.lb-wa', lb), counter = $('.lb-counter', lb);
    let idx = 0, viewIdx = 0, lastFocus = null;
    const visible = () => cards.filter((c) => !c.classList.contains('is-hidden'));
    const data = (c) => JSON.parse(c.dataset.product);
    const setImg = (src, alt) => {
      img.classList.add('is-fading');
      const n = new Image();
      n.onload = n.onerror = () => { img.src = src; img.alt = alt; img.classList.remove('is-fading'); };
      n.src = src;
    };
    const render = () => {
      const list = visible();
      const c = list[idx]; if (!c) return;
      const d = data(c);
      viewIdx = Math.min(viewIdx, d.views.length - 1);
      refEl.textContent = d.ref; nameEl.textContent = d.name; descEl.textContent = d.desc || '';
      specsEl.innerHTML = d.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      setImg(d.views[viewIdx].src, `${d.name} — ${d.views[viewIdx].label}`);
      thumbs.innerHTML = d.views.length > 1 ? d.views.map((v, i) => `<button type="button" class="${i === viewIdx ? 'is-active' : ''}" data-i="${i}"><img src="${v.thumb}" alt="" loading="lazy">${v.label}</button>`).join('') : '';
      thumbs.style.display = d.views.length > 1 ? '' : 'none';
      waBtn.href = waLink(`Hola SyJ Pack, quiero consultar por el modelo ${d.name} (${d.ref}).`);
      counter.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
      zoom.classList.remove('is-zoomed');
    };
    const open = (card) => {
      lastFocus = document.activeElement;
      idx = visible().indexOf(card); viewIdx = 0;
      render();
      lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      $('.lb-close', lb).focus();
    };
    const close = () => {
      lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      if (lastFocus) lastFocus.focus();
    };
    const go = (d) => { const n = visible().length; idx = (idx + d + n) % n; viewIdx = 0; render(); };
    cards.forEach((c) => {
      $$('[data-open]', c).forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); open(c); }));
    });
    thumbs.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { viewIdx = +b.dataset.i; render(); } });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-nav.prev', lb).addEventListener('click', () => go(-1));
    $('.lb-nav.next', lb).addEventListener('click', () => go(1));
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Tab') {
        const f = $$('button, a[href]', lb).filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    // Lupa: clic para acercar, mover para recorrer
    const setOrigin = (e) => {
      const r = zoom.getBoundingClientRect();
      zoom.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
      zoom.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    zoom.addEventListener('click', (e) => { setOrigin(e); zoom.classList.toggle('is-zoomed'); });
    zoom.addEventListener('mousemove', (e) => { if (zoom.classList.contains('is-zoomed')) setOrigin(e); });
    // Deslizar en celular
    let sx = null;
    zoom.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    zoom.addEventListener('touchend', (e) => {
      if (sx === null || zoom.classList.contains('is-zoomed')) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      sx = null;
    });
  }

  /* ---------- Burbuja del WhatsApp flotante ---------- */
  const wa = $('.whatsapp-float');
  if (wa && !store.get('syj-bubble')) {
    setTimeout(() => { wa.classList.add('show-bubble'); store.set('syj-bubble', '1'); }, 6000);
    setTimeout(() => wa.classList.remove('show-bubble'), 12000);
  }

  /* ---------- Año del footer ---------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();
