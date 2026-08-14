/* ============================================================
   OGNANDJI DOCS — script unique
   Sections : Utilitaires UI (toasts/modale) · Connexion/Inscription · Tableau de bord
   Chaque section vérifie la présence des éléments avant d'agir,
   pour pouvoir être chargée telle quelle sur n'importe quelle page.
   ============================================================ */


/* ========== UTILITAIRES UI (toasts, confirmation) ========== */

function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type) {
  type = type || 'info';
  const container = ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = type === 'success' ? '✓' : type === 'error' ? '!' : 'i';

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('is-leaving');
    setTimeout(function () { toast.remove(); }, 200);
  }, 3200);
}

function confirmAction(options) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const box = document.createElement('div');
  box.className = 'modal-box';

  const title = document.createElement('h3');
  title.textContent = options.title || 'Confirmer';

  const message = document.createElement('p');
  message.textContent = options.message || '';

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Annuler';
  cancelBtn.onclick = closeModal;

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'btn ' + (options.danger ? 'btn-danger' : 'btn-primary');
  confirmBtn.textContent = options.confirmLabel || 'Confirmer';
  confirmBtn.onclick = function () {
    closeModal();
    if (typeof options.onConfirm === 'function') options.onConfirm();
  };

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  box.appendChild(title);
  box.appendChild(message);
  box.appendChild(actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function closeModal() {
    overlay.classList.remove('is-open');
    setTimeout(function () { overlay.remove(); }, 200);
  }

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) closeModal();
  });

  requestAnimationFrame(function () { overlay.classList.add('is-open'); });
}


/* ========== PAGE CONNEXION / INSCRIPTION ========== */

function switchTab(target) {
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const loginForm = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  if (!tabLogin || !tabSignup || !loginForm || !signupForm) return;

  const isLogin = target === 'login';

  tabLogin.classList.toggle('is-active', isLogin);
  tabSignup.classList.toggle('is-active', !isLogin);
  tabLogin.setAttribute('aria-selected', isLogin);
  tabSignup.setAttribute('aria-selected', !isLogin);

  loginForm.classList.toggle('is-active', isLogin);
  signupForm.classList.toggle('is-active', !isLogin);

  const enteringForm = isLogin ? loginForm : signupForm;
  enteringForm.classList.remove('form-enter');
  void enteringForm.offsetWidth;
  enteringForm.classList.add('form-enter');

  hideAlert();
}

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  button.textContent = isHidden ? 'Masquer' : 'Afficher';
}

function showFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) field.classList.add('has-error');
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) field.classList.remove('has-error');
}

function showAlert(message) {
  const alertBox = document.getElementById('form-alert');
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.style.display = 'flex';
}

function hideAlert() {
  const alertBox = document.getElementById('form-alert');
  if (alertBox) alertBox.style.display = 'none';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function initAuthPage() {
  const loginForm = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  if (!loginForm && !signupForm) return; // on n'est pas sur la page de connexion

  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      hideAlert();

      const email = document.getElementById('login-email');
      const password = document.getElementById('login-password');
      let hasError = false;

      if (!isValidEmail(email.value)) {
        showFieldError('login-email-field');
        hasError = true;
      } else {
        clearFieldError('login-email-field');
      }

      if (password.value.length === 0) {
        showFieldError('login-password-field');
        hasError = true;
      } else {
        clearFieldError('login-password-field');
      }

      if (hasError) return;

      // Point d'intégration Supabase Auth (signInWithPassword) à brancher ici.
      showToast('Connexion : intégration Supabase à venir.', 'info');
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', function (event) {
      event.preventDefault();
      hideAlert();

      const fields = [
        { id: 'signup-firstname', field: 'signup-firstname-field', check: v => v.trim().length > 0 },
        { id: 'signup-lastname', field: 'signup-lastname-field', check: v => v.trim().length > 0 },
        { id: 'signup-company', field: 'signup-company-field', check: v => v.trim().length > 0 },
        { id: 'signup-email', field: 'signup-email-field', check: isValidEmail },
        { id: 'signup-password', field: 'signup-password-field', check: v => v.length >= 8 }
      ];

      let hasError = false;

      fields.forEach(function (item) {
        const value = document.getElementById(item.id).value;
        if (!item.check(value)) {
          showFieldError(item.field);
          hasError = true;
        } else {
          clearFieldError(item.field);
        }
      });

      if (hasError) return;

      // Point d'intégration Supabase Auth (signUp) + création de l'espace entreprise à brancher ici.
      showToast('Création de compte : intégration Supabase à venir.', 'info');
    });
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'signup') {
    switchTab('signup');
  }
}


/* ========== PAGE TABLEAU DE BORD ========== */

// Point d'intégration Supabase : remplacer ce tableau par une vraie
// requête sur la table d'activité de l'entreprise une fois connecté.
const recentActivity = [];

function renderActivity() {
  const list = document.getElementById('activity-list');
  if (!list) return; // on n'est pas sur le dashboard

  if (recentActivity.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">◎</div>
        <h3>Rien à afficher pour l'instant</h3>
        <p>Dès que vous ajouterez un document ou créerez une procédure, l'activité apparaîtra ici.</p>
        <div class="empty-state-actions">
          <a href="documents.html" class="btn btn-secondary">Ajouter un document</a>
          <a href="procedures.html" class="btn btn-primary">Créer une procédure</a>
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = '';
  recentActivity.forEach(function (item) {
    const row = document.createElement('div');
    row.className = 'activity-row';
    row.innerHTML = `<span>${item.label}</span><span class="activity-time">${item.time}</span>`;
    list.appendChild(row);
  });
}

function dismissOnboarding() {
  const banner = document.getElementById('onboarding-banner');
  if (!banner) return;
  banner.style.display = 'none';
  localStorage.setItem('ognandji_onboarding_dismissed', 'true');
}

function handleQuickAction(type) {
  const messages = {
    categorie: "La création de catégories arrive dans la prochaine étape.",
    document: "L'ajout de documents arrive dans la prochaine étape.",
    procedure: "La création de procédures arrive dans la prochaine étape."
  };
  showToast(messages[type] || "Bientôt disponible.", 'info');
}

function initDashboardPage() {
  const banner = document.getElementById('onboarding-banner');
  if (!document.getElementById('activity-list') && !banner) return; // pas sur le dashboard

  renderActivity();

  if (banner && localStorage.getItem('ognandji_onboarding_dismissed') === 'true') {
    banner.style.display = 'none';
  }
}


/* ========== INITIALISATION GÉNÉRALE ========== */

document.addEventListener('DOMContentLoaded', function () {
  initAuthPage();
  initDashboardPage();
});
