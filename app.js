/* ============================================================
   STRUCTA — script unique
   Sections : Supabase · Utilitaires UI · Connexion/Inscription · Tableau de bord
   ============================================================ */


/* ========== SUPABASE ========== */

const SUPABASE_URL = 'https://gefpajwfodgyxqxwxofr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlZnBhandmb2RneXhxeHd4b2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3Mjk1MTIsImV4cCI6MjEwMjMwNTUxMn0.3I55EB7sqhr70mgPi6N0fVR8BXp5mdlJVnqtFfDCg64';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


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

function setButtonLoading(button, isLoading, loadingLabel) {
  if (isLoading) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = loadingLabel || 'Chargement...';
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
  }
}

async function initAuthPage() {
  const loginForm = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  if (!loginForm && !signupForm) return; // pas sur la page de connexion

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = 'dashboard.html';
    return;
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
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

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      setButtonLoading(submitBtn, true, 'Connexion...');

      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.value,
        password: password.value
      });

      setButtonLoading(submitBtn, false);

      if (error) {
        showAlert(error.message === 'Invalid login credentials'
          ? 'E-mail ou mot de passe incorrect.'
          : error.message);
        return;
      }

      showToast('Connexion réussie.', 'success');
      window.location.href = 'dashboard.html';
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      hideAlert();

      const firstNameEl = document.getElementById('signup-firstname');
      const lastNameEl = document.getElementById('signup-lastname');
      const companyEl = document.getElementById('signup-company');
      const emailEl = document.getElementById('signup-email');
      const passwordEl = document.getElementById('signup-password');

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

      const submitBtn = signupForm.querySelector('button[type="submit"]');
      setButtonLoading(submitBtn, true, 'Création...');

      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email: emailEl.value,
        password: passwordEl.value
      });

      if (signUpError) {
        setButtonLoading(submitBtn, false);
        showAlert(signUpError.message === 'User already registered'
          ? 'Un compte existe déjà avec cet e-mail.'
          : signUpError.message);
        return;
      }

      if (!signUpData.session) {
        setButtonLoading(submitBtn, false);
        showToast("Vérifiez votre boîte mail pour confirmer votre compte, puis connectez-vous.", 'info');
        switchTab('login');
        return;
      }

      const userId = signUpData.user.id;

      const { data: companyData, error: companyError } = await supabaseClient
        .from('companies')
        .insert({ name: companyEl.value.trim(), owner_id: userId })
        .select()
        .single();

      if (companyError) {
        setButtonLoading(submitBtn, false);
        showAlert("Compte créé, mais la création de l'espace entreprise a échoué : " + companyError.message);
        return;
      }

      const { error: memberError } = await supabaseClient
        .from('company_members')
        .insert({
          company_id: companyData.id,
          user_id: userId,
          first_name: firstNameEl.value.trim(),
          last_name: lastNameEl.value.trim(),
          role: 'admin'
        });

      setButtonLoading(submitBtn, false);

      if (memberError) {
        showAlert("Espace créé, mais une erreur est survenue : " + memberError.message);
        return;
      }

      showToast('Bienvenue sur STRUCTA !', 'success');
      window.location.href = 'dashboard.html';
    });
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'signup') {
    switchTab('signup');
  }
}


/* ========== PAGE TABLEAU DE BORD ========== */

function renderActivity() {
  const list = document.getElementById('activity-list');
  if (!list) return;

  const recentActivity = [];

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
}

function dismissOnboarding() {
  const banner = document.getElementById('onboarding-banner');
  if (!banner) return;
  banner.style.display = 'none';
  localStorage.setItem('structa_onboarding_dismissed', 'true');
}

function handleQuickAction(type) {
  const messages = {
    categorie: "La création de catégories arrive dans la prochaine étape.",
    document: "L'ajout de documents arrive dans la prochaine étape.",
    procedure: "La création de procédures arrive dans la prochaine étape."
  };
  showToast(messages[type] || "Bientôt disponible.", 'info');
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

async function initDashboardPage() {
  const banner = document.getElementById('onboarding-banner');
  const statDocuments = document.getElementById('stat-documents');
  if (!document.getElementById('activity-list') && !banner && !statDocuments) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const userId = session.user.id;

  const { data: membership, error: membershipError } = await supabaseClient
    .from('company_members')
    .select('company_id, first_name, role, companies ( name )')
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership) {
    showToast("Impossible de charger votre espace entreprise.", 'error');
    return;
  }

  const companyId = membership.company_id;
  const subtitle = document.getElementById('dashboard-subtitle');
  if (subtitle) {
    subtitle.textContent = membership.companies.name + ' · ' + (membership.first_name || '');
  }

  const [documentsCount, proceduresCount, categoriesCount, membersCount] = await Promise.all([
    supabaseClient.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabaseClient.from('procedures').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabaseClient.from('document_categories').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabaseClient.from('company_members').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
  ]);

  if (statDocuments) statDocuments.textContent = documentsCount.count ?? 0;
  const statProcedures = document.getElementById('stat-procedures');
  const statCategories = document.getElementById('stat-categories');
  const statMembers = document.getElementById('stat-members');
  if (statProcedures) statProcedures.textContent = proceduresCount.count ?? 0;
  if (statCategories) statCategories.textContent = categoriesCount.count ?? 0;
  if (statMembers) statMembers.textContent = membersCount.count ?? 1;

  renderActivity();

  if (banner && localStorage.getItem('structa_onboarding_dismissed') === 'true') {
    banner.style.display = 'none';
  }
}


/* ========== INITIALISATION GÉNÉRALE ========== */

document.addEventListener('DOMContentLoaded', function () {
  initAuthPage();
  initDashboardPage();
});
