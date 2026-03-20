/* ============================================================
   E.M. Perry Group — Shared JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Sticky nav shadow ──────────────────────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile hamburger ───────────────────────────────────── */
  const burger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.nav__mobile');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      })
    );
  }

  /* ── FAQ accordion ──────────────────────────────────────── */
  document.querySelectorAll('.faq__item').forEach(item => {
    const q = item.querySelector('.faq__q');
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all others
      document.querySelectorAll('.faq__item.open').forEach(other => {
        if (other !== item) other.classList.remove('open');
      });
      item.classList.toggle('open', !isOpen);
    });
  });

  /* ── Stage modals ───────────────────────────────────────── */
  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const close = overlay.querySelector('.modal__close');
    if (close) close.focus();
  }
  function closeModal(overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.modal));
  });
  document.querySelectorAll('.modal__close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay);
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
    }
  });

  /* ── Expand/collapse sections ───────────────────────────── */
  document.querySelectorAll('.expand-toggle').forEach(btn => {
    const targetId = btn.dataset.target;
    const content = document.getElementById(targetId);
    if (!content) return;
    btn.addEventListener('click', () => {
      const open = btn.classList.toggle('open');
      content.classList.toggle('open', open);
      btn.querySelector('span').textContent = open ? 'Show less' : 'Learn more';
    });
  });

  /* ── Contact form ───────────────────────────────────────── */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  if (contactForm && formSuccess) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      contactForm.style.display = 'none';
      formSuccess.style.display = 'block';
      window.scrollTo({ top: formSuccess.offsetTop - 100, behavior: 'smooth' });
    });
  }

  /* ── Active nav link ────────────────────────────────────── */
  const path = window.location.pathname;
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href && path.endsWith(href)) a.classList.add('active');
  });

});
