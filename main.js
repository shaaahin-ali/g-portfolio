/* ============================================================
   main.js — Game Portfolio Interactive Engine v2
   ============================================================ */

(function () {
  'use strict';

  // ── Audio Context (Web Audio API for retro bleeps) ─────────
  let audioCtx = null;
  let soundEnabled = true;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playBeep(freq = 440, type = 'square', duration = 0.08, vol = 0.08) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported, silently fail
    }
  }

  function playClick() { playBeep(880, 'square', 0.06, 0.07); }
  function playHover() { playBeep(660, 'square', 0.04, 0.03); }
  function playKonami() {
    const notes = [523, 659, 784, 1047, 784, 659, 523];
    notes.forEach((freq, i) => {
      setTimeout(() => playBeep(freq, 'square', 0.12, 0.1), i * 80);
    });
  }

  // ── Mute Button ────────────────────────────────────────────
  const muteBtn = document.getElementById('nav-mute');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      muteBtn.textContent = soundEnabled ? '🔊' : '🔇';
      muteBtn.title = soundEnabled ? 'Mute' : 'Unmute';
      if (soundEnabled) playBeep(440, 'square', 0.1, 0.06);
    });
  }

  // Add hover & click sounds to all interactive elements
  function attachSounds() {
    const clickables = document.querySelectorAll(
      'a, button, .achievement-card, .cartridge-card, .contact-link, .side-quest-item'
    );
    clickables.forEach(el => {
      el.addEventListener('mouseenter', playHover, { passive: true });
      el.addEventListener('click', playClick, { passive: true });
    });
  }
  attachSounds();

  // ── Starfield Canvas ───────────────────────────────────────
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = 180;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.15 + 0.02,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
      });
    }
  }

  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const star of stars) {
      star.opacity += star.twinkleSpeed * star.twinkleDir;
      if (star.opacity >= 0.9) star.twinkleDir = -1;
      if (star.opacity <= 0.15) star.twinkleDir = 1;
      star.y -= star.speed;
      if (star.y < -2) {
        star.y = canvas.height + 2;
        star.x = Math.random() * canvas.width;
      }
      ctx.fillStyle = `rgba(245, 245, 240, ${star.opacity})`;
      ctx.fillRect(Math.round(star.x), Math.round(star.y), Math.ceil(star.size), Math.ceil(star.size));
    }
    requestAnimationFrame(drawStars);
  }

  resizeCanvas();
  createStars();
  drawStars();
  window.addEventListener('resize', () => { resizeCanvas(); createStars(); });

  // ── XP Reading Progress Bar ─────────────────────────────────
  const xpFill = document.getElementById('xp-fill');
  const xpLabel = document.getElementById('xp-label');

  function updateXP() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;
    if (xpFill) xpFill.style.width = pct + '%';
    if (xpLabel) xpLabel.textContent = `XP ${pct}%`;
  }

  window.addEventListener('scroll', updateXP, { passive: true });
  updateXP();

  // ── Pixel Nav Show/Hide & Active State ─────────────────────
  const pixelNav = document.getElementById('pixel-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  let lastScrollY = 0;

  const sectionMap = [
    { id: 'about',       navId: 'nav-about'   },
    { id: 'experience',  navId: 'nav-exp'     },
    { id: 'skills',      navId: 'nav-skills'  },
    { id: 'education',   navId: null           },
    { id: 'project',     navId: 'nav-project' },
    { id: 'achievements',navId: null           },
    { id: 'sidequests',  navId: 'nav-quests'  },
    { id: 'footer',      navId: 'nav-contact' },
  ];

  function updateNav() {
    const scrollY = window.scrollY;

    // Show nav after hero
    if (pixelNav) {
      if (scrollY > window.innerHeight * 0.3) {
        pixelNav.classList.add('nav-visible');
      } else {
        pixelNav.classList.remove('nav-visible');
      }
    }

    // Active link detection
    let currentNavId = null;
    for (const entry of sectionMap) {
      const el = document.getElementById(entry.id);
      if (el && entry.navId) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) {
          currentNavId = entry.navId;
        }
      }
    }

    navLinks.forEach(link => {
      link.classList.toggle('active', link.id === currentNavId);
    });

    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Smooth scroll for all nav links
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        playClick();
      }
      // Close mobile menu on link click
      navLinksList.classList.remove('open');
      if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // ── Hamburger Menu ─────────────────────────────────────────
  const hamburgerBtn  = document.getElementById('nav-hamburger');
  const navLinksList  = document.querySelector('.nav-links');

  if (hamburgerBtn && navLinksList) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = navLinksList.classList.toggle('open');
      hamburgerBtn.setAttribute('aria-expanded', isOpen);
      hamburgerBtn.textContent = isOpen ? '✕' : '☰';
      playClick();
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.pixel-nav')) {
        navLinksList.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.textContent = '☰';
      }
    });
  }

  // ── Scroll Reveal ──────────────────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');

  function handleReveal() {
    const windowHeight = window.innerHeight;
    revealElements.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      if (top < windowHeight * 0.85) {
        el.classList.add('visible');
      }
    });
  }

  handleReveal();
  window.addEventListener('scroll', handleReveal, { passive: true });

  // ── Smooth scroll for start button ────────────────────────
  const startBtn = document.getElementById('start-button');
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('about');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        playBeep(523, 'square', 0.15, 0.1);
      }
    });
  }

  // ── Parallax pixel decorations ─────────────────────────────
  const decorations = document.querySelectorAll('.pixel-deco');
  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;
    decorations.forEach((deco, i) => {
      const rate = 0.02 + (i % 4) * 0.015;
      deco.style.transform = `translateY(${scrollY * rate}px)`;
    });
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  // ── Typewriter for hero subtitle ───────────────────────────
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) {
    const text = heroSub.textContent;
    heroSub.textContent = '';
    heroSub.style.visibility = 'visible';
    let charIndex = 0;

    function typeChar() {
      if (charIndex < text.length) {
        heroSub.textContent += text[charIndex];
        charIndex++;
        setTimeout(typeChar, 55);
      }
    }
    setTimeout(typeChar, 800);
  }

  // ── Achievement card pop-in stagger ────────────────────────
  const achCards = document.querySelectorAll('.achievement-card');
  const achObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = Array.from(achCards).indexOf(entry.target);
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, idx * 80);
        achObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  achCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    achObserver.observe(card);
  });

  // ── Konami Code Easter Egg ─────────────────────────────────
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiIndex = 0;

  const konamiModal = document.getElementById('konami-modal');
  const konamiClose = document.getElementById('konami-close');

  document.addEventListener('keydown', (e) => {
    if (e.key === KONAMI[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === KONAMI.length) {
        konamiIndex = 0;
        triggerKonami();
      }
    } else {
      konamiIndex = 0;
    }
  });

  function triggerKonami() {
    playKonami();
    if (konamiModal) {
      konamiModal.classList.add('active');
      konamiModal.removeAttribute('aria-hidden');
    }
  }

  if (konamiClose) {
    konamiClose.addEventListener('click', () => {
      konamiModal.classList.remove('active');
      konamiModal.setAttribute('aria-hidden', 'true');
      playClick();
    });
  }

  if (konamiModal) {
    konamiModal.addEventListener('click', (e) => {
      if (e.target === konamiModal) {
        konamiModal.classList.remove('active');
        konamiModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // ── Side quest hover highlight ─────────────────────────────
  document.querySelectorAll('.side-quest-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.color = 'var(--text-light)';
      item.querySelector('.sq-check').style.color = 'var(--neon-green)';
      item.querySelector('.sq-name').style.color = 'var(--neon-green)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.color = '';
      item.querySelector('.sq-check').style.color = '';
      item.querySelector('.sq-name').style.color = '';
    });
    item.style.transition = 'all 0.2s ease';
    item.style.cursor = 'default';
    item.style.paddingLeft = '4px';
    item.style.borderRadius = '4px';
  });

  // ── Boss card shimmer on scroll into view ──────────────────
  const bossCard = document.querySelector('.boss-card');
  if (bossCard) {
    const bossObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        bossCard.style.animation = 'none';
        setTimeout(() => {
          bossCard.style.animation = '';
          playBeep(220, 'sawtooth', 0.3, 0.06);
        }, 100);
        bossObserver.disconnect();
      }
    }, { threshold: 0.3 });
    bossObserver.observe(bossCard);
  }

  // ── Cursor Particle Trail ──────────────────────────────────
  const PARTICLE_COLORS = ['#39FF14', '#FF3FA4', '#FFD700', '#3DA9FC'];
  let lastParticleTime = 0;

  function spawnParticle(x, y) {
    const el = document.createElement('div');
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    const size  = Math.random() * 6 + 3;
    el.style.cssText = `
      position:fixed;
      left:${x}px;top:${y}px;
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:${Math.random() > 0.5 ? '50%' : '1px'};
      pointer-events:none;
      z-index:9999;
      opacity:0.9;
      transform:translate(-50%,-50%);
      transition:opacity 0.5s ease, transform 0.5s ease;
      box-shadow:0 0 6px ${color};
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '0';
      el.style.transform = `translate(-50%,-50%) translate(${(Math.random()-0.5)*30}px, ${-20-Math.random()*20}px) scale(0.3)`;
    });
    setTimeout(() => el.remove(), 520);
  }

  document.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - lastParticleTime > 40) {
      lastParticleTime = now;
      spawnParticle(e.clientX, e.clientY);
    }
  }, { passive: true });

  // ── DS screen flicker on page load ─────────────────────────
  const dsScreen = document.querySelector('.ds-photo-placeholder');
  if (dsScreen) {
    let flickers = 0;
    const flickerInterval = setInterval(() => {
      dsScreen.style.filter = flickers % 2 === 0 ? 'brightness(1.8)' : '';
      flickers++;
      if (flickers >= 6) {
        clearInterval(flickerInterval);
        dsScreen.style.filter = '';
      }
    }, 120);
  }

  // ── Scroll-to-top on logo click ────────────────────────────
  const navLogo = document.querySelector('.nav-logo');
  if (navLogo) {
    navLogo.style.cursor = 'pointer';
    navLogo.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      playBeep(880, 'square', 0.08, 0.06);
    });
  }

  // ── Stat bar number counter animation ──────────────────────
  document.querySelectorAll('.stat-fill').forEach(bar => {
    const targetW = bar.style.width;
    bar.dataset.target = targetW;
  });

  // ── Year auto-update in credits ────────────────────────────
  document.querySelectorAll('.credits').forEach(el => {
    el.textContent = el.textContent.replace('2026', new Date().getFullYear());
  });

})();
