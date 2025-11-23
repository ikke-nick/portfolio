/* ====== Helpers ====== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ====== Theme toggle (dark mode) ====== */
const themeToggle = $('#theme-toggle');
function applyTheme(theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
}
const saved = localStorage.getItem('theme');
applyTheme(saved === 'dark' ? 'dark' : 'light');

/* ====== Automatic dark/light background image swap (all elements) ====== */
function swapBackgroundImages(theme) {
  const allElements = $$('*'); 
  allElements.forEach(el => {
    const style = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;

    // Only process elements with -light or -dark images
    if (style.includes('-light') || style.includes('-dark')) {
      const newBg = theme === 'dark'
        ? style.replace('-light', '-dark')
        : style.replace('-dark', '-light');
      el.style.backgroundImage = newBg;
    }
  });
}
// apply on page load according to saved theme
swapBackgroundImages(saved === 'dark' ? 'dark' : 'light');

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next === 'dark' ? 'dark' : 'light');

    // swap all background images
  swapBackgroundImages(next);
});

/* ====== Project cards: keyboard accessible (Enter to open) ====== */
$$('.project-card').forEach(card => {
  card.setAttribute('tabindex', '0');

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      
      const href = card.getAttribute('href');
      if (href) window.location.href = href;
    }
  });
});

/* ====== Hero role switch animation ====== */
(function heroRoles() {
  const roles = $$('.role');
  let idx = 0;

  function tick() {
    roles.forEach((r, i) => r.classList.toggle('active', i === idx));
    idx = (idx + 1) % roles.length;
  }

  // prefer-reduced-motion respects user's settings
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    tick();
    setInterval(tick, 2500);
  } else {
    roles.forEach((r,i) => r.classList.toggle('active', i === 0));
  }
})();

/* ====== IntersectionObserver for reveal animations ====== */
(function revealOnScroll() {
  const reveals = $$('.reveal');
  const opts = { root: null, rootMargin: '0px', threshold: 0.12 };

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, opts);

  reveals.forEach(r => io.observe(r));
})();

/* ====== Contact starfield canvas (sized to contact section) ====== */
(function starfield() {
  const canvas = $('#starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w = 0, h = 0;
  let stars = [];
  const numStars = 1600; // decreased to reduce CPU
  const speed = 0.9;
  const streaks = true;
  const warp = false;

  function initStars() {
    stars = Array.from({ length: numStars }, () => ({
      x: (Math.random() - 0.5) * w * 2,
      y: (Math.random() - 0.5) * h * 2,
      z: Math.random() * Math.max(w, h)
    }));
  }

  function resize() {
    // Make canvas size match the contact section itself (not whole window)
    const section = canvas.parentElement;
    if (!section) return;
    w = canvas.width = Math.max(1, Math.floor(section.clientWidth));
    h = canvas.height = Math.max(1, Math.floor(section.clientHeight));
    ctx.setTransform(1,0,0,1,0,0); 
    initStars();
  }

  let rafId;
  function draw() {
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0,0,w,h);

    const cx = w / 2;
    const cy = h / 2;

    for (let s of stars) {
      s.z -= speed;
      if (s.z <= 0) {
        s.z = Math.max(w,h);
        s.x = (Math.random() - 0.5) * w * 2;
        s.y = (Math.random() - 0.5) * h * 2;
      }
      const sx = cx + (s.x / s.z) * w;
      const sy = cy + (s.y / s.z) * w;
      const pz = s.z + speed;
      const px = cx + (s.x / pz) * w;
      const py = cy + (s.y / pz) * w;

      const size = Math.max(0.3, (1 - s.z / Math.max(w,h)) * 2.2);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = size;

      if (streaks) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      }
    }

    if (warp) {
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
      gradient.addColorStop(0, 'rgba(255,255,255,0.12)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    rafId = requestAnimationFrame(draw);
  }

  // Resize observer for container changes (responsive)
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(rafId);
    resize();
    rafId = requestAnimationFrame(draw);
  });

  ro.observe(canvas.parentElement);
  resize();
  draw();

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId);
    ro.disconnect();
  });
})();

/* ====== Simple form submit UX (no real backend changes) ====== */
const contactForm = document.forms['contact'];
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = $('#send-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    // simulated send
    setTimeout(() => {
      btn.textContent = 'Sent ✓';
      btn.disabled = false;
      contactForm.reset();
      setTimeout(() => btn.textContent = 'Send Message', 1400);
    }, 900);
  });
}

/* ====== Small accessibility tweak: show focus outlines for keyboard users only ====== */
(function focusStyle() {
  function handleFirstTab(e) {
    if (e.key === 'Tab') {
      document.documentElement.classList.add('user-is-tabbing');
      window.removeEventListener('keydown', handleFirstTab);
    }
  }
  window.addEventListener('keydown', handleFirstTab);
})();

const scrollElements = document.querySelectorAll('.scroll-animate');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target); // animate once
    }
  });
}, { threshold: 0.1 });

scrollElements.forEach(el => observer.observe(el));

