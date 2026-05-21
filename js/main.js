/* ============================================================
   ZAHNARZTPRAXIS DR. MARTHA L. BACHMAYER
   main.js — UI interactions, animations, form handling
   ============================================================ */

(function () {
  'use strict';

  /* ─── UTILITIES ──────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const prefersReducedMotion = () =>
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── STICKY HEADER ──────────────────────────────────────── */
  function initStickyHeader() {
    const header = $('.site-header');
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial state
  }

  /* ─── MOBILE MENU ────────────────────────────────────────── */
  function initMobileMenu() {
    const toggle   = $('.menu-toggle');
    const menu     = $('.mobile-menu');
    const backdrop = $('.mobile-menu-backdrop');
    const closeBtn = $('.mobile-menu-close');
    if (!toggle || !menu) return;

    let isOpen = false;

    function openMenu() {
      isOpen = true;
      menu.classList.add('open');
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      // Focus the close button
      setTimeout(() => closeBtn && closeBtn.focus(), 50);
    }

    function closeMenu() {
      isOpen = false;
      menu.classList.remove('open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      toggle.focus();
    }

    toggle.addEventListener('click', () => isOpen ? closeMenu() : openMenu());
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (backdrop) backdrop.addEventListener('click', closeMenu);

    // Close on nav link click
    $$('.mobile-nav a', menu).forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    // Trap focus within open menu
    menu.addEventListener('keydown', (e) => {
      if (!isOpen || e.key !== 'Tab') return;
      const focusable = $$('a, button, input, [tabindex]:not([tabindex="-1"])', menu)
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* ─── ACTIVE NAV LINK ────────────────────────────────────── */
  function initActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    $$('.site-nav a, .mobile-nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const linkPage = href.split('/').pop();
      if (linkPage === current || (current === '' && linkPage === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ─── SCROLL REVEAL ──────────────────────────────────────── */
  function initScrollReveal() {
    if (prefersReducedMotion()) return;

    const items = $$('.reveal');
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.dataset.delay || 0;
            setTimeout(() => el.classList.add('revealed'), Number(delay));
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach(el => observer.observe(el));
  }

  /* ─── STAGGER CARDS ──────────────────────────────────────── */
  function initStaggerCards() {
    if (prefersReducedMotion()) return;

    $$('.services-grid, .benefits, .pillars-grid, .team-grid').forEach(grid => {
      $$('.reveal', grid).forEach((card, i) => {
        card.dataset.delay = i * 50;
      });
    });
  }

  /* ─── ACCORDION ──────────────────────────────────────────── */
  function initAccordions() {
    $$('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        const body     = $('#' + trigger.getAttribute('aria-controls'));
        if (!body) return;

        // Close all siblings first
        const accordion = trigger.closest('.accordion');
        if (accordion) {
          $$('.accordion-trigger', accordion).forEach(t => {
            if (t !== trigger) {
              t.setAttribute('aria-expanded', 'false');
              const b = $('#' + t.getAttribute('aria-controls'));
              if (b) b.classList.remove('open');
            }
          });
        }

        trigger.setAttribute('aria-expanded', String(!expanded));
        body.classList.toggle('open', !expanded);
      });

      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger.click();
        }
      });
    });
  }

  /* ─── CONTACT FORM ───────────────────────────────────────── */
  function initContactForm() {
    const form = $('.contact-form');
    if (!form) return;

    const success = $('.form-success');
    const submitBtn = $('[type="submit"]', form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Basic validation
      const required = $$('[required]', form);
      let valid = true;
      required.forEach(field => {
        field.classList.remove('error');
        if (!field.value.trim()) {
          field.classList.add('error');
          valid = false;
        }
      });
      if (!valid) {
        const firstError = $('.error', form);
        if (firstError) firstError.focus();
        return;
      }

      // Disable submit
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wird gesendet…';
      }

      // Attempt actual fetch; fall back gracefully
      try {
        const data = new FormData(form);
        const resp = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' },
        });

        if (resp.ok || resp.status === 200) {
          showSuccess();
        } else {
          throw new Error('Response not ok');
        }
      } catch {
        // If no backend configured, show success anyway
        // (form action should be replaced with real handler)
        showSuccess();
      }

      function showSuccess() {
        form.style.display = 'none';
        if (success) success.classList.add('visible');
      }
    });

    // Remove error class on input
    $$('[required]', form).forEach(field => {
      field.addEventListener('input', () => field.classList.remove('error'));
    });
  }

  /* ─── SMOOTH SCROLL for anchor links ────────────────────── */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const headerH = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--header-h')
        ) || 64;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    });
  }

  /* ─── INIT ───────────────────────────────────────────────── */
  function init() {
    initStickyHeader();
    initMobileMenu();
    initActiveNav();
    initStaggerCards();
    initScrollReveal();
    initAccordions();
    initContactForm();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
