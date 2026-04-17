'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── Sticky Header + Logo Swap ────────────────────────────
  const header = document.querySelector('.site-header');
  const headerLogo = header ? header.querySelector('.site-logo img') : null;
  if (header) {
    const forceScrolled = document.body.dataset.headerScrolled === 'always';
    const onScroll = () => {
      const scrolled = forceScrolled || window.scrollY > 20;
      header.classList.toggle('scrolled', scrolled);
      if (headerLogo) {
        headerLogo.src = scrolled
          ? '/assets/logo/logo.svg'
          : '/assets/logo/logo-light.svg';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Hamburger Menu ───────────────────────────────────────
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        mobileMenu.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        menuToggle.focus();
      }
    });
  }

  // ── Form Validation (generic) ────────────────────────────
  function validateField(field) {
    const row = field.closest('.form-row');
    const errorEl = row ? row.querySelector('.form-error') : null;
    let valid = true;
    let message = '';

    if (field.required && !field.value.trim()) {
      valid = false;
      message = 'Dieses Feld ist erforderlich.';
    } else if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
      valid = false;
      message = 'Bitte eine gültige E-Mail-Adresse eingeben.';
    } else if (field.type === 'tel' && field.value && !/^[\d\s\+\-\(\)\/]{6,}$/.test(field.value)) {
      valid = false;
      message = 'Bitte eine gültige Telefonnummer eingeben.';
    }

    field.classList.toggle('error', !valid);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.toggle('visible', !valid);
    }

    return valid;
  }

  function setupForm(form) {
    if (!form) return;

    const inputs = form.querySelectorAll(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([name="bot-field"]), select, textarea'
    );
    inputs.forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) validateField(field);
      });
    });

    const checkboxes = form.querySelectorAll('input[type="checkbox"][required]');
    checkboxes.forEach(cb => {
      const row = cb.closest('.checkbox-row') || cb.closest('.form-row');
      const errorEl = row ? row.querySelector('.form-error') : null;
      cb.addEventListener('change', () => {
        const valid = cb.checked;
        if (errorEl) {
          errorEl.textContent = valid ? '' : 'Bitte bestätigen Sie die Datenschutzerklärung.';
          errorEl.classList.toggle('visible', !valid);
        }
      });
    });

    const radioGroups = {};
    form.querySelectorAll('input[type="radio"][required]').forEach(r => {
      if (!radioGroups[r.name]) radioGroups[r.name] = [];
      radioGroups[r.name].push(r);
    });
    Object.values(radioGroups).forEach(radios => {
      const fieldset = radios[0].closest('fieldset');
      const errorEl = fieldset ? fieldset.querySelector('.form-error') : null;
      const validate = () => {
        const checked = radios.some(r => r.checked);
        if (errorEl) {
          errorEl.textContent = checked ? '' : 'Bitte wählen Sie eine Option.';
          errorEl.classList.toggle('visible', !checked);
        }
        return checked;
      };
      radios.forEach(r => r.addEventListener('change', validate));
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      let allValid = true;
      inputs.forEach(field => { if (!validateField(field)) allValid = false; });
      checkboxes.forEach(cb => {
        if (!cb.checked) {
          allValid = false;
          const row = cb.closest('.checkbox-row') || cb.closest('.form-row');
          const errorEl = row ? row.querySelector('.form-error') : null;
          if (errorEl) {
            errorEl.textContent = 'Bitte bestätigen Sie die Datenschutzerklärung.';
            errorEl.classList.add('visible');
          }
        }
      });
      Object.values(radioGroups).forEach(radios => {
        const checked = radios.some(r => r.checked);
        if (!checked) {
          allValid = false;
          const fieldset = radios[0].closest('fieldset');
          const errorEl = fieldset ? fieldset.querySelector('.form-error') : null;
          if (errorEl) {
            errorEl.textContent = 'Bitte wählen Sie eine Option.';
            errorEl.classList.add('visible');
          }
        }
      });

      if (!allValid) {
        const firstError = form.querySelector('.error, input[required]:invalid');
        if (firstError) firstError.focus();
        return;
      }

      const body = new URLSearchParams();
      body.append('form-name', form.getAttribute('name'));
      new FormData(form).forEach((v, k) => body.append(k, v));
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });
        if (res.ok) {
          const successEl = form.querySelector('.form-success');
          if (successEl) successEl.classList.add('visible');
          form.reset();
        }
      } catch (_) {
        form.submit();
      }
    });
  }

  document.querySelectorAll('form[data-netlify="true"]').forEach(setupForm);

  // ── Google Maps Click-to-Load ────────────────────────────
  const loadMapBtn = document.getElementById('load-map-btn');
  if (loadMapBtn) {
    loadMapBtn.addEventListener('click', () => {
      const container = document.getElementById('map-container');
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2620.123456789!2d11.07752!3d49.44721!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479f5724f0e!2sWerkstra%C3%9Fe+14%2C+90441+N%C3%BCrnberg!5e0!3m2!1sde!2sde!4v1700000000000!5m2!1sde!2sde';
      iframe.width = '100%';
      iframe.height = '450';
      iframe.style.border = '0';
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      iframe.setAttribute('title', 'Standort Müller Handwerk & Notdienst, Werkstraße 14, 90441 Nürnberg');
      container.replaceChildren(iframe);
    });
  }

  // ── Active Nav Highlight ─────────────────────────────────
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
  document.querySelectorAll('.nav-list a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const normalized = href.replace(/\/$/, '');
    if (
      normalized === currentPath ||
      (normalized === '' && (currentPath === '' || currentPath === '/index.html')) ||
      (normalized === '/' && (currentPath === '' || currentPath === '/index.html'))
    ) {
      link.setAttribute('aria-current', 'page');
    }
  });

});
