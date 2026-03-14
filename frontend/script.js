/* =========================================
   GFG CLUB — script.js
   ========================================= */

(function () {
  'use strict';

  var API_BASE = 'http://localhost:3000';

  /* =========================================
     DARK MODE TOGGLE
     ========================================= */
  const themeToggleBtn = document.getElementById('themeToggle');
  const themeIcon      = document.getElementById('themeIcon');
  const htmlEl         = document.documentElement;

  const savedTheme = localStorage.getItem('gfg-theme') || 'light';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      const next = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem('gfg-theme', next);
    });
  }

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
    }
  }

  /* =========================================
     ACTIVE NAV LINK
     ========================================= */
  const navLinks = document.querySelectorAll('.nav-link-custom');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.forEach(function (l) { l.classList.remove('active-nav'); });
      this.classList.add('active-nav');
    });
  });

  /* =========================================
     STAT COUNTER ANIMATION (index.html only)
     ========================================= */
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    if (!counters.length) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.textContent.replace(/\D/g, ''), 10);
          const suffix = el.textContent.replace(/[0-9]/g, '');
          let current  = 0;
          const step   = Math.ceil(target / 60);
          const timer  = setInterval(function () {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = current + suffix;
          }, 20);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(function (c) { observer.observe(c); });
  }

  animateCounters();

  /* =========================================
     PASSWORD VISIBILITY TOGGLE
     ========================================= */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.pw-toggle');
    if (!btn) return;
    const targetId = btn.getAttribute('data-target');
    const input    = document.getElementById(targetId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type       = isPassword ? 'text' : 'password';
    const icon       = btn.querySelector('i');
    if (icon) {
      icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
    }
  });

  /* =========================================
     ROLE TOGGLE (signup & login pages)
     ========================================= */
  function initRoleToggle(toggleId, formMap) {
    const toggle = document.getElementById(toggleId);
    if (!toggle) return;

    const btns = toggle.querySelectorAll('.role-btn');

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        const role = btn.getAttribute('data-role');

        Object.keys(formMap).forEach(function (key) {
          const form = document.getElementById(formMap[key]);
          if (!form) return;
          if (key === role) {
            form.classList.remove('d-none');
            clearFormErrors(form);
          } else {
            form.classList.add('d-none');
            clearFormErrors(form);
          }
        });
      });
    });
  }

  initRoleToggle('signupRoleToggle', {
    participant: 'participantSignupForm',
    admin:       'adminSignupForm'
  });

  initRoleToggle('loginRoleToggle', {
    participant: 'participantLoginForm',
    admin:       'adminLoginForm'
  });

  /* =========================================
     FORM VALIDATION HELPERS
     ========================================= */
  function clearFormErrors(form) {
    form.querySelectorAll('.form-input').forEach(function (input) {
      input.classList.remove('is-invalid');
    });
    form.querySelectorAll('.invalid-feedback-custom').forEach(function (el) {
      el.classList.remove('visible');
    });
  }

  function validateField(input) {
    const wrapper  = input.closest('[class*="col-"]');
    const feedback = wrapper ? wrapper.querySelector('.invalid-feedback-custom') : null;
    let   valid    = true;

    if (input.hasAttribute('required') && !input.value.trim()) {
      valid = false;
    } else if (input.type === 'email' && input.value.trim()) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(input.value.trim())) valid = false;
    } else if (input.type === 'tel' && input.value.trim()) {
      const telRe = /^\+?[\d\s\-()]{7,15}$/;
      if (!telRe.test(input.value.trim())) valid = false;
    }

    if (!valid) {
      input.classList.add('is-invalid');
      if (feedback) feedback.classList.add('visible');
    } else {
      input.classList.remove('is-invalid');
      if (feedback) feedback.classList.remove('visible');
    }

    return valid;
  }

  function validateForm(form) {
    let allValid = true;
    form.querySelectorAll('.form-input').forEach(function (input) {
      if (input.offsetParent !== null) {
        if (!validateField(input)) allValid = false;
      }
    });
    return allValid;
  }

  document.addEventListener('blur', function (e) {
    if (e.target.classList.contains('form-input')) {
      validateField(e.target);
    }
  }, true);

  /* =========================================
     FORM SUBMIT — collect & log payload
     ========================================= */
  function collectFormData(form) {
    const data = {};
    form.querySelectorAll('.form-input').forEach(function (input) {
      if (!input.name) return;
      if (input.tagName === 'SELECT') {
        data[input.name] = input.value ? parseInt(input.value, 10) || input.value : '';
      } else if (input.type === 'password') {
        data[input.name] = input.value;
      } else {
        data[input.name] = input.value.trim();
      }
    });
    return data;
  }

  function showToast(message, type) {
    const toastEl  = document.getElementById('successToast');
    const toastMsg = document.getElementById('toastMessage');
    if (!toastEl || !toastMsg) return;

    toastMsg.textContent = message;
    toastEl.className    = 'toast align-items-center border-0 ' +
      (type === 'error' ? 'text-bg-danger' : 'text-bg-success');

    const bsToast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 });
    bsToast.show();
  }

  /* =========================================
     BUTTON LOADING STATE
     ========================================= */
  function setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Please wait…';
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || btn.textContent;
    }
  }

  /* =========================================
     STORE AUTH (JWT + profile to localStorage)
     ========================================= */
  function storeAuth(tokenObj, profile, role) {
    localStorage.setItem('gfg-token', tokenObj.token);
    localStorage.setItem('gfg-role', role);
    localStorage.setItem('gfg-user', JSON.stringify(profile));
  }

  /* =========================================
     API POST HELPER
     ========================================= */
  function apiPost(endpoint, payload) {
    return fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (res) {
      return res.json().then(function (data) {
        data._ok = res.ok;
        return data;
      });
    });
  }

  /* =========================================
     SIGNUP — PARTICIPANT  →  POST /users/register
     ========================================= */
  (function () {
    var form = document.getElementById('participantSignupForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) {
        showToast('Please fill in all required fields correctly.', 'error');
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      setButtonLoading(btn, true);
      apiPost('/users/register', collectFormData(form))
        .then(function (data) {
          if (data._ok) {
            showToast('Account created! Redirecting to login…', 'success');
            setTimeout(function () { window.location.href = 'login.html'; }, 1500);
          } else {
            showToast((data.error && data.error.message) ? data.error.message : 'Registration failed. Please try again.', 'error');
          }
        })
        .catch(function () {
          showToast('Network error. Please check your connection.', 'error');
        })
        .finally(function () {
          setButtonLoading(btn, false);
        });
    });
  }());

  /* =========================================
     SIGNUP — ADMIN  →  POST /admin/onboard
     ========================================= */
  (function () {
    var form = document.getElementById('adminSignupForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) {
        showToast('Please fill in all required fields correctly.', 'error');
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      setButtonLoading(btn, true);
      apiPost('/admin/onboard', collectFormData(form))
        .then(function (data) {
          if (data._ok) {
            showToast('Admin account created! Redirecting to login…', 'success');
            setTimeout(function () { window.location.href = 'login.html'; }, 1500);
          } else {
            showToast((data.error && data.error.message) ? data.error.message : 'Onboarding failed. Please try again.', 'error');
          }
        })
        .catch(function () {
          showToast('Network error. Please check your connection.', 'error');
        })
        .finally(function () {
          setButtonLoading(btn, false);
        });
    });
  }());

  /* =========================================
     LOGIN — PARTICIPANT  →  POST /users/login
     ========================================= */
  (function () {
    var form = document.getElementById('participantLoginForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) {
        showToast('Please fill in all required fields correctly.', 'error');
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      setButtonLoading(btn, true);
      apiPost('/users/login', collectFormData(form))
        .then(function (data) {
          if (data._ok) {
            storeAuth(data.data.token, data.data.user, 'user');
            showToast('Logged in! Redirecting…', 'success');
            setTimeout(function () { window.location.href = 'dashboard.html'; }, 800);
          } else {
            showToast((data.error && data.error.message) ? data.error.message : 'Login failed. Check your credentials.', 'error');
          }
        })
        .catch(function () {
          showToast('Network error. Please check your connection.', 'error');
        })
        .finally(function () {
          setButtonLoading(btn, false);
        });
    });
  }());

  /* =========================================
     LOGIN — ADMIN  →  POST /admin/login
     ========================================= */
  (function () {
    var form = document.getElementById('adminLoginForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) {
        showToast('Please fill in all required fields correctly.', 'error');
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      setButtonLoading(btn, true);
      apiPost('/admin/login', collectFormData(form))
        .then(function (data) {
          if (data._ok) {
            storeAuth(data.data.token, data.data.admin, 'admin');
            showToast('Logged in! Redirecting…', 'success');
            setTimeout(function () { window.location.href = 'dashboard.html'; }, 800);
          } else {
            showToast((data.error && data.error.message) ? data.error.message : 'Login failed. Check your credentials.', 'error');
          }
        })
        .catch(function () {
          showToast('Network error. Please check your connection.', 'error');
        })
        .finally(function () {
          setButtonLoading(btn, false);
        });
    });
  }());

})();
