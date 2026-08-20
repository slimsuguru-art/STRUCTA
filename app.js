/* ============================================================
   STRUCTA — script unique
   Sections : Supabase · Utilitaires UI · Connexion/Inscription · Tableau de bord
   ============================================================ */


/* ========== SUPABASE ========== */

const SUPABASE_URL = 'https://gefpajwfodgyxqxwxofr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlZnBhandmb2RneXhxeHd4b2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3Mjk1MTIsImV4cCI6MjEwMjMwNTUxMn0.3I55EB7sqhr70mgPi6N0fVR8BXp5mdlJVnqtFfDCg64';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_CATEGORIES = [
  'Contrats', 'Documents administratifs', 'Rapports', 'Factures',
  'Modèles', 'Documents RH', 'Documents techniques', 'Autres fichiers importants'
];

// Filet de sécurité : si un compte existe côté auth mais n'a jamais eu
// d'entreprise créée (ex: interruption par la confirmation e-mail),
// on la crée automatiquement à la prochaine visite d'une page protégée.
async function ensureCompanySetup(session) {
  const userId = session.user.id;

  const { data: existingRows } = await supabaseClient
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', userId)
    .limit(1);

  if (existingRows && existingRows.length > 0) return existingRows[0];

  const meta = session.user.user_metadata || {};
  const companyName = meta.company_name || 'Mon entreprise';

  const { data: companyData, error: companyError } = await supabaseClient
    .from('companies')
    .insert({ name: companyName, owner_id: userId })
    .select()
    .single();

  if (companyError) {
    console.error('Auto-reparation (companies):', companyError);
    return null;
  }

  const { error: memberError } = await supabaseClient
    .from('company_members')
    .insert({
      company_id: companyData.id,
      user_id: userId,
      first_name: meta.first_name || '',
      last_name: meta.last_name || '',
      role: 'admin'
    });

  if (memberError) {
    console.error('Auto-reparation (company_members):', memberError);
    return null;
  }

  await supabaseClient
    .from('document_categories')
    .insert(DEFAULT_CATEGORIES.map(name => ({ company_id: companyData.id, name })));

  return { company_id: companyData.id, role: 'admin' };
}


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


function hidePageLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) loader.classList.add('is-hidden');
}


function openSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.add('is-open');
  if (backdrop) backdrop.classList.add('is-open');
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('is-open');
  if (backdrop) backdrop.classList.remove('is-open');
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

async function acceptInviteToken(token) {
  const { data, error } = await supabaseClient.rpc('accept_invite', { p_token: token });
  if (error) return { success: false, error: error.message };
  return data;
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
  hidePageLoader();

  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get('invite');

  if (inviteToken) {
    const banner = document.getElementById('invite-banner');
    if (banner) {
      banner.style.display = '';
      banner.textContent = "Vous avez été invité à rejoindre une entreprise sur STRUCTA. Connectez-vous ou créez un compte pour accepter.";
    }
    const companyField = document.getElementById('signup-company-field');
    if (companyField) companyField.style.display = 'none';
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

      if (error) {
        setButtonLoading(submitBtn, false);
        showAlert(error.message === 'Invalid login credentials'
          ? 'E-mail ou mot de passe incorrect.'
          : error.message);
        return;
      }

      if (inviteToken) {
        const result = await acceptInviteToken(inviteToken);
        if (!result.success) {
          setButtonLoading(submitBtn, false);
          showAlert(result.error || "Impossible d'accepter cette invitation.");
          return;
        }
      }

      setButtonLoading(submitBtn, false);
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
        { id: 'signup-email', field: 'signup-email-field', check: isValidEmail },
        { id: 'signup-password', field: 'signup-password-field', check: v => v.length >= 8 }
      ];
      if (!inviteToken) {
        fields.splice(2, 0, { id: 'signup-company', field: 'signup-company-field', check: v => v.trim().length > 0 });
      }

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
        password: passwordEl.value,
        options: {
          data: {
            company_name: inviteToken ? '' : companyEl.value.trim(),
            first_name: firstNameEl.value.trim(),
            last_name: lastNameEl.value.trim()
          }
        }
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

      if (inviteToken) {
        const result = await acceptInviteToken(inviteToken);
        setButtonLoading(submitBtn, false);
        if (!result.success) {
          showAlert(result.error || "Impossible d'accepter cette invitation.");
          return;
        }
        showToast('Bienvenue sur STRUCTA !', 'success');
        window.location.href = 'dashboard.html';
        return;
      }

      const setup = await ensureCompanySetup(signUpData.session);

      if (!setup) {
        setButtonLoading(submitBtn, false);
        showAlert("Compte créé, mais la création de l'espace entreprise a échoué. Réessayez de vous connecter dans un instant.");
        return;
      }

      setButtonLoading(submitBtn, false);

      showToast('Bienvenue sur STRUCTA !', 'success');
      window.location.href = 'dashboard.html';
    });
  }

  const forgotForm = document.getElementById('forgot-password-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const emailInput = document.getElementById('forgot-password-email');
      if (!isValidEmail(emailInput.value)) {
        showFieldError('forgot-password-email-field');
        return;
      }
      clearFieldError('forgot-password-email-field');

      const submitBtn = document.getElementById('forgot-password-submit');
      setButtonLoading(submitBtn, true, 'Envoi...');

      const redirectTo = 'https://slimsuguru-art.github.io/STRUCTA/nouveau-mot-de-passe.html';

      const { error } = await supabaseClient.auth.resetPasswordForEmail(emailInput.value.trim(), {
        redirectTo: redirectTo
      });

      setButtonLoading(submitBtn, false);

      if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
      }

      document.getElementById('forgot-password-intro').textContent =
        "Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé.";
      forgotForm.style.display = 'none';
    });
  }

  if (params.get('tab') === 'signup' || inviteToken) {
    switchTab('signup');
  }
}


async function initResetPasswordPage() {
  const form = document.getElementById('reset-password-form');
  if (!form) return; // pas sur la page de reinitialisation

  let resolved = false;

  function showFormReady() {
    if (resolved) return;
    resolved = true;
    document.getElementById('reset-invalid').style.display = 'none';
    form.style.display = '';
  }

  function showInvalidLink() {
    if (resolved) return;
    resolved = true;
    document.getElementById('reset-invalid').style.display = 'flex';
    form.style.display = 'none';
  }

  // Le lien de recuperation met parfois un instant a etre traite par Supabase
  // avant que la session soit disponible : on ecoute l'evenement dedie...
  supabaseClient.auth.onAuthStateChange(function (event, session) {
    if (event === 'PASSWORD_RECOVERY' && session) {
      showFormReady();
    }
  });

  // ...et on verifie aussi immediatement, au cas ou la session soit deja prete.
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    showFormReady();
  } else {
    // Dernier recours : on laisse un court instant au client Supabase
    // pour terminer de traiter le lien avant de conclure qu'il est invalide.
    setTimeout(async function () {
      const { data: { session: retrySession } } = await supabaseClient.auth.getSession();
      if (retrySession) {
        showFormReady();
      } else {
        showInvalidLink();
      }
    }, 1500);
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const passwordInput = document.getElementById('reset-password');
    const confirmInput = document.getElementById('reset-password-confirm');
    let hasError = false;

    if (passwordInput.value.length < 8) {
      showFieldError('reset-password-field');
      hasError = true;
    } else {
      clearFieldError('reset-password-field');
    }

    if (confirmInput.value !== passwordInput.value || confirmInput.value.length === 0) {
      showFieldError('reset-password-confirm-field');
      hasError = true;
    } else {
      clearFieldError('reset-password-confirm-field');
    }

    if (hasError) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Mise à jour...');

    const { error } = await supabaseClient.auth.updateUser({ password: passwordInput.value });

    setButtonLoading(submitBtn, false);

    if (error) {
      showToast('Erreur : ' + error.message, 'error');
      return;
    }

    showToast('Mot de passe mis à jour.', 'success');
    window.location.href = 'dashboard.html';
  });
}


/* ========== PAGE TABLEAU DE BORD ========== */

async function logActivity(companyId, label) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    await supabaseClient.from('activity_log').insert({
      company_id: companyId,
      actor_id: session ? session.user.id : null,
      action: 'event',
      label: label
    });
  } catch (e) {
    // Silencieux : l'activite est un confort, pas une operation critique.
    console.error('logActivity:', e);
  }
}

function relativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} j`;
  return new Date(isoString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

async function renderActivity(companyId) {
  const list = document.getElementById('activity-list');
  if (!list) return;

  const { data: recentActivity } = await supabaseClient
    .from('activity_log')
    .select('label, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(8);

  if (!recentActivity || recentActivity.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2 4h6l2-4h4"/><path d="M5 12V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"/></svg></div>
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

  list.innerHTML = recentActivity.map(function (item) {
    return `<div class="activity-row"><span>${item.label}</span><span class="activity-time">${relativeTime(item.created_at)}</span></div>`;
  }).join('');
}

function dismissOnboarding() {
  const banner = document.getElementById('onboarding-banner');
  if (!banner) return;
  banner.style.display = 'none';
  localStorage.setItem('structa_onboarding_dismissed', 'true');
}

function handleQuickAction(type) {
  if (type === 'categorie') {
    window.location.href = 'documents.html?action=add-category';
    return;
  }
  if (type === 'document') {
    window.location.href = 'documents.html?action=add-document';
    return;
  }
  if (type === 'procedure') {
    window.location.href = 'procedures.html?action=add';
    return;
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

function renderTrialBanner(company, role) {
  const banner = document.getElementById('trial-banner');
  if (!banner || !company) return;

  const upgradeLink = 'https://wa.me/24174713255?text=' + encodeURIComponent('Bonjour, je souhaite passer au plan Pro sur STRUCTA pour ' + company.name);

  if (company.status === 'active') {
    banner.style.display = 'none';
    return;
  }

  const daysLeft = Math.ceil((new Date(company.trial_ends_at) - new Date()) / 86400000);
  const planLabel = company.plan === 'pro' ? 'Pro' : 'Starter';
  const upgradeBtn = role === 'admin'
    ? `<a href="${upgradeLink}" target="_blank" class="btn btn-primary" style="padding:0.4rem 1rem;font-size:var(--fs-xs);">Passer Pro</a>`
    : '';

  banner.style.display = 'flex';

  if (daysLeft <= 0) {
    banner.className = 'trial-banner is-expired';
    banner.innerHTML = `<span><strong>Votre essai gratuit est terminé.</strong> Passez au plan ${planLabel} pour continuer à utiliser STRUCTA sans interruption.</span>${upgradeBtn}`;
  } else if (daysLeft <= 3) {
    banner.className = 'trial-banner is-warning';
    banner.innerHTML = `<span><strong>Essai gratuit : ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}.</strong> Passez au plan ${planLabel} pour ne pas perdre l'accès.</span>${upgradeBtn}`;
  } else {
    banner.className = 'trial-banner';
    banner.innerHTML = `<span>Essai gratuit — <strong>${daysLeft} jours restants</strong> · Plan ${planLabel}</span>${upgradeBtn}`;
  }
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

  await ensureCompanySetup(session);

  const { data: membership, error: membershipError } = await supabaseClient
    .from('company_members')
    .select('company_id, first_name, role, companies ( name, plan, status, trial_ends_at )')
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership) {
    hidePageLoader();
    console.error('Erreur membership:', membershipError);
    showToast("Impossible de charger votre espace entreprise : " + (membershipError ? membershipError.message : 'aucune entreprise associee a ce compte.'), 'error');
    return;
  }

  renderTrialBanner(membership.companies, membership.role);

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

  renderActivity(companyId);

  if (banner && localStorage.getItem('structa_onboarding_dismissed') === 'true') {
    banner.style.display = 'none';
  }

  hidePageLoader();
}


/* ========== PAGE DOCUMENTS ========== */

let docsCompanyId = null;
let docsRole = null;
let allCategories = [];
let allDocuments = [];
let activeCategoryFilter = null;

function openModalById(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  requestAnimationFrame(function () { overlay.classList.add('is-open'); });
}

function closeModalById(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('is-open');
}

function openCategoryModal() {
  document.getElementById('category-form').reset();
  clearFieldError('category-name-field');
  openModalById('category-modal');
}

function openDocumentModal() {
  const form = document.getElementById('document-form');
  form.reset();
  clearFieldError('document-name-field');
  clearFieldError('document-file-field');

  const select = document.getElementById('document-category');
  select.innerHTML = '<option value="">Sans catégorie</option>' +
    allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  const dropLabel = document.getElementById('file-drop-label');
  dropLabel.textContent = 'Cliquez pour choisir un fichier';
  dropLabel.classList.remove('has-file');

  openModalById('document-modal');
}

function renderCategories() {
  const strip = document.getElementById('category-strip');
  if (!strip) return;

  let html = `<span class="category-chip ${activeCategoryFilter === null ? 'is-active' : ''}" onclick="setCategoryFilter(null)">Tous (${allDocuments.length})</span>`;

  allCategories.forEach(function (cat) {
    const count = allDocuments.filter(d => d.category_id === cat.id).length;
    html += `<span class="category-chip ${activeCategoryFilter === cat.id ? 'is-active' : ''}" onclick="setCategoryFilter('${cat.id}')">${cat.name} (${count})</span>`;
  });

  html += `<span class="category-chip category-chip-add" onclick="openCategoryModal()">+ Nouvelle catégorie</span>`;

  strip.innerHTML = html;
}

function setCategoryFilter(categoryId) {
  activeCategoryFilter = categoryId;
  renderCategories();
  renderDocuments();
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderDocuments() {
  const list = document.getElementById('doc-list');
  if (!list) return;

  const searchInput = document.getElementById('documents-search-input');
  const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();

  const filtered = allDocuments.filter(function (doc) {
    const matchesCategory = activeCategoryFilter === null || doc.category_id === activeCategoryFilter;
    const matchesSearch = !searchTerm || doc.name.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg></div>
        <h3>Aucun document pour l'instant</h3>
        <p>Ajoutez votre premier document — contrat, facture, document RH ou technique.</p>
        <div class="empty-state-actions">
          <button type="button" class="btn btn-primary" onclick="openDocumentModal()">Ajouter un document</button>
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(function (doc) {
    const categoryName = doc.category_id
      ? (allCategories.find(c => c.id === doc.category_id)?.name || '')
      : 'Sans catégorie';
    const extension = (doc.name.split('.').pop() || '?').slice(0, 3).toUpperCase();
    const safePath = doc.file_path.replace(/'/g, "\\'");
    const safeId = doc.id.replace(/'/g, "\\'");
    const safeName = doc.name.replace(/'/g, "\\'");

    const deleteBtn = docsRole === 'admin'
      ? `<button type="button" class="icon-btn icon-btn-danger" onclick="deleteDocument('${safeId}', '${safePath}', '${safeName}')" aria-label="Supprimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg></button>`
      : '';

    return `
      <div class="doc-row">
        <div class="doc-icon">${extension}</div>
        <div class="doc-info">
          <div class="doc-name">${doc.name}</div>
          <div class="doc-meta"><span>${categoryName}</span><span>·</span><span>${formatDate(doc.created_at)}</span></div>
        </div>
        <div class="doc-actions">
          <button type="button" class="icon-btn" onclick="downloadDocument('${safePath}', '${safeName}')" aria-label="Télécharger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg></button>
          ${deleteBtn}
        </div>
      </div>
    `;
  }).join('');
}

async function loadDocumentsData() {
  const [categoriesRes, documentsRes] = await Promise.all([
    supabaseClient.from('document_categories').select('id, name').eq('company_id', docsCompanyId).order('name'),
    supabaseClient.from('documents').select('id, name, file_path, category_id, created_at').eq('company_id', docsCompanyId).order('created_at', { ascending: false })
  ]);

  allCategories = categoriesRes.data || [];
  allDocuments = documentsRes.data || [];

  renderCategories();
  renderDocuments();
}

async function downloadDocument(filePath, fileName) {
  const { data, error } = await supabaseClient.storage.from('documents').createSignedUrl(filePath, 60);
  if (error) {
    showToast("Impossible d'ouvrir le document : " + error.message, 'error');
    return;
  }
  window.open(data.signedUrl, '_blank');
}

function deleteDocument(id, filePath, name) {
  confirmAction({
    title: 'Supprimer ce document ?',
    message: "Cette action est définitive. Le fichier et son entrée seront supprimés.",
    confirmLabel: 'Supprimer',
    danger: true,
    onConfirm: async function () {
      await supabaseClient.storage.from('documents').remove([filePath]);
      const { error } = await supabaseClient.from('documents').delete().eq('id', id);
      if (error) {
        showToast('Suppression impossible : ' + error.message, 'error');
        return;
      }
      showToast('Document supprimé.', 'success');
      await logActivity(docsCompanyId, `Document supprimé : ${name}`);
      await loadDocumentsData();
    }
  });
}

async function initDocumentsPage() {
  const list = document.getElementById('doc-list');
  if (!list) return; // pas sur la page Documents

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const userId = session.user.id;

  await ensureCompanySetup(session);

  const { data: membership, error: membershipError } = await supabaseClient
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership) {
    hidePageLoader();
    console.error('Erreur membership:', membershipError);
    showToast("Impossible de charger votre espace entreprise : " + (membershipError ? membershipError.message : 'aucune entreprise associee a ce compte.'), 'error');
    return;
  }

  docsCompanyId = membership.company_id;
  docsRole = membership.role;

  await loadDocumentsData();

  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'add-category') openCategoryModal();
  if (params.get('action') === 'add-document') openDocumentModal();
  if (params.get('category')) {
    const match = allCategories.find(c => c.name === params.get('category'));
    if (match) setCategoryFilter(match.id);
  }

  document.getElementById('documents-search-input').addEventListener('input', renderDocuments);

  hidePageLoader();

  document.getElementById('category-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const nameInput = document.getElementById('category-name');

    if (nameInput.value.trim().length === 0) {
      showFieldError('category-name-field');
      return;
    }
    clearFieldError('category-name-field');

    const submitBtn = event.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Création...');

    const { error } = await supabaseClient
      .from('document_categories')
      .insert({ company_id: docsCompanyId, name: nameInput.value.trim() });

    setButtonLoading(submitBtn, false);

    if (error) {
      showToast('Erreur : ' + error.message, 'error');
      return;
    }

    showToast('Catégorie créée.', 'success');
    await logActivity(docsCompanyId, `Catégorie créée : ${nameInput.value.trim()}`);
    closeModalById('category-modal');
    await loadDocumentsData();
  });

  document.getElementById('document-file').addEventListener('change', function (event) {
    const dropLabel = document.getElementById('file-drop-label');
    if (event.target.files.length > 0) {
      dropLabel.textContent = event.target.files[0].name;
      dropLabel.classList.add('has-file');
      clearFieldError('document-file-field');
    }
  });

  document.getElementById('document-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const nameInput = document.getElementById('document-name');
    const categorySelect = document.getElementById('document-category');
    const fileInput = document.getElementById('document-file');

    let hasError = false;
    if (nameInput.value.trim().length === 0) {
      showFieldError('document-name-field');
      hasError = true;
    } else {
      clearFieldError('document-name-field');
    }
    if (fileInput.files.length === 0) {
      showFieldError('document-file-field');
      hasError = true;
    } else {
      clearFieldError('document-file-field');
    }
    if (hasError) return;

    const file = fileInput.files[0];
    const submitBtn = event.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Envoi...');

    const filePath = `${docsCompanyId}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      setButtonLoading(submitBtn, false);
      showToast("Échec de l'envoi : " + uploadError.message, 'error');
      return;
    }

    const { data: { session: currentSession } } = await supabaseClient.auth.getSession();

    const { error: insertError } = await supabaseClient
      .from('documents')
      .insert({
        company_id: docsCompanyId,
        category_id: categorySelect.value || null,
        name: nameInput.value.trim(),
        file_path: filePath,
        uploaded_by: currentSession.user.id
      });

    setButtonLoading(submitBtn, false);

    if (insertError) {
      showToast('Fichier envoyé, mais erreur d\'enregistrement : ' + insertError.message, 'error');
      return;
    }

    showToast('Document ajouté.', 'success');
    await logActivity(docsCompanyId, `Document ajouté : ${nameInput.value.trim()}`);
    closeModalById('document-modal');
    await loadDocumentsData();
  });
}


/* ========== PAGE PROCEDURES ========== */

let procCompanyId = null;
let procRole = null;
let allProcedures = [];
let editingProcedureId = null;

function openProcedureFormModal(procedure) {
  const form = document.getElementById('procedure-form');
  form.reset();
  ['procedure-title-field', 'procedure-steps-field'].forEach(clearFieldError);

  editingProcedureId = procedure ? procedure.id : null;
  document.getElementById('procedure-form-title').textContent = procedure ? 'Modifier la procédure' : 'Nouvelle procédure';
  document.getElementById('procedure-form-submit').textContent = procedure ? 'Enregistrer' : 'Créer';

  if (procedure) {
    document.getElementById('procedure-title').value = procedure.title || '';
    document.getElementById('procedure-objective').value = procedure.objective || '';
    document.getElementById('procedure-responsible').value = procedure.responsible || '';
    document.getElementById('procedure-documents').value = procedure.documents_needed || '';
    document.getElementById('procedure-steps').value = (procedure.steps || []).join('\n');
    document.getElementById('procedure-info').value = procedure.additional_info || '';
  }

  closeModalById('procedure-view-modal');
  openModalById('procedure-form-modal');
}

function formatDateShort(isoString) {
  return new Date(isoString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderProcedures() {
  const list = document.getElementById('proc-list');
  if (!list) return;

  const searchInput = document.getElementById('procedures-search-input');
  const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();

  const filtered = allProcedures.filter(p => !searchTerm || p.title.toLowerCase().includes(searchTerm));

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M8 12l3 3 5-6"/></svg></div>
        <h3>Aucune procédure pour l'instant</h3>
        <p>Écrivez votre première méthode de travail pour qu'elle reste accessible à toute l'équipe.</p>
        <div class="empty-state-actions">
          <button type="button" class="btn btn-primary" onclick="openProcedureFormModal()">Créer une procédure</button>
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(function (proc) {
    const stepCount = (proc.steps || []).length;
    return `
      <div class="proc-row" onclick="viewProcedure('${proc.id}')">
        <div class="proc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M8 12l3 3 5-6"/></svg></div>
        <div class="proc-info">
          <div class="proc-title">${proc.title}</div>
          <div class="proc-meta">
            <span>${proc.responsible || 'Responsable non défini'}</span><span>·</span>
            <span>${stepCount} étape${stepCount > 1 ? 's' : ''}</span><span>·</span>
            <span>${formatDateShort(proc.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function viewProcedure(id) {
  const proc = allProcedures.find(p => p.id === id);
  if (!proc) return;

  document.getElementById('view-title').textContent = proc.title;
  document.getElementById('view-objective').textContent = proc.objective || '—';
  document.getElementById('view-responsible').textContent = proc.responsible || '—';
  document.getElementById('view-documents').textContent = proc.documents_needed || '—';

  const stepsList = document.getElementById('view-steps');
  stepsList.innerHTML = (proc.steps || []).map(s => `<li>${s}</li>`).join('') || '<li>Aucune étape renseignée</li>';

  const infoLabel = document.getElementById('view-info-label');
  const infoValue = document.getElementById('view-info');
  if (proc.additional_info) {
    infoLabel.style.display = '';
    infoValue.style.display = '';
    infoValue.textContent = proc.additional_info;
  } else {
    infoLabel.style.display = 'none';
    infoValue.style.display = 'none';
  }

  document.getElementById('view-edit-btn').onclick = function () { openProcedureFormModal(proc); };

  const deleteBtn = document.getElementById('view-delete-btn');
  if (procRole === 'admin') {
    deleteBtn.style.display = '';
    deleteBtn.onclick = function () { deleteProcedure(proc.id, proc.title); };
  } else {
    deleteBtn.style.display = 'none';
  }

  openModalById('procedure-view-modal');
}

function deleteProcedure(id, title) {
  confirmAction({
    title: 'Supprimer cette procédure ?',
    message: "Cette action est définitive.",
    confirmLabel: 'Supprimer',
    danger: true,
    onConfirm: async function () {
      const { error } = await supabaseClient.from('procedures').delete().eq('id', id);
      if (error) {
        showToast('Suppression impossible : ' + error.message, 'error');
        return;
      }
      showToast('Procédure supprimée.', 'success');
      await logActivity(procCompanyId, `Procédure supprimée : ${title}`);
      closeModalById('procedure-view-modal');
      await loadProceduresData();
    }
  });
}

async function loadProceduresData() {
  const { data, error } = await supabaseClient
    .from('procedures')
    .select('id, title, objective, responsible, documents_needed, steps, additional_info, created_at')
    .eq('company_id', procCompanyId)
    .order('created_at', { ascending: false });

  allProcedures = error ? [] : data;
  renderProcedures();
}

async function initProceduresPage() {
  const list = document.getElementById('proc-list');
  if (!list) return; // pas sur la page Procédures

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  await ensureCompanySetup(session);

  const { data: membership, error: membershipError } = await supabaseClient
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .single();

  if (membershipError || !membership) {
    hidePageLoader();
    console.error('Erreur membership:', membershipError);
    showToast("Impossible de charger votre espace entreprise : " + (membershipError ? membershipError.message : 'aucune entreprise associee a ce compte.'), 'error');
    return;
  }

  procCompanyId = membership.company_id;
  procRole = membership.role;

  await loadProceduresData();

  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'add') openProcedureFormModal();

  document.getElementById('procedures-search-input').addEventListener('input', renderProcedures);

  hidePageLoader();

  document.getElementById('procedure-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const titleInput = document.getElementById('procedure-title');
    const stepsInput = document.getElementById('procedure-steps');
    const steps = stepsInput.value.split('\n').map(s => s.trim()).filter(Boolean);

    let hasError = false;
    if (titleInput.value.trim().length === 0) {
      showFieldError('procedure-title-field');
      hasError = true;
    } else {
      clearFieldError('procedure-title-field');
    }
    if (steps.length === 0) {
      showFieldError('procedure-steps-field');
      hasError = true;
    } else {
      clearFieldError('procedure-steps-field');
    }
    if (hasError) return;

    const payload = {
      company_id: procCompanyId,
      title: titleInput.value.trim(),
      objective: document.getElementById('procedure-objective').value.trim(),
      responsible: document.getElementById('procedure-responsible').value.trim(),
      documents_needed: document.getElementById('procedure-documents').value.trim(),
      steps: steps,
      additional_info: document.getElementById('procedure-info').value.trim(),
      updated_at: new Date().toISOString()
    };

    const submitBtn = document.getElementById('procedure-form-submit');
    setButtonLoading(submitBtn, true, 'Enregistrement...');

    let result;
    if (editingProcedureId) {
      result = await supabaseClient.from('procedures').update(payload).eq('id', editingProcedureId);
    } else {
      const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
      payload.created_by = currentSession.user.id;
      result = await supabaseClient.from('procedures').insert(payload);
    }

    setButtonLoading(submitBtn, false);

    if (result.error) {
      showToast('Erreur : ' + result.error.message, 'error');
      return;
    }

    showToast(editingProcedureId ? 'Procédure mise à jour.' : 'Procédure créée.', 'success');
    await logActivity(procCompanyId, editingProcedureId ? `Procédure modifiée : ${payload.title}` : `Procédure créée : ${payload.title}`);
    closeModalById('procedure-form-modal');
    await loadProceduresData();
  });
}


/* ========== PAGE CONNAISSANCES ========== */

let knowCompanyId = null;
let knowRole = null;
let allKnowledge = [];
let activeKnowledgeType = null;
let editingKnowledgeId = null;

const KNOWLEDGE_TYPE_LABELS = { role: 'Rôle & responsabilité', contact: 'Contact utile', note: 'Note libre' };
const KNOWLEDGE_TYPE_ICONS = { role: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M8 14l-2 7 6-3 6 3-2-7"/></svg>', contact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 1h2a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.28-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.92z"/></svg>', note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>' };

function openKnowledgeFormModal(entry) {
  const form = document.getElementById('knowledge-form');
  form.reset();
  clearFieldError('knowledge-title-field');

  editingKnowledgeId = entry ? entry.id : null;
  document.getElementById('knowledge-form-title').textContent = entry ? "Modifier l'entrée" : 'Nouvelle entrée';
  document.getElementById('knowledge-form-submit').textContent = entry ? 'Enregistrer' : 'Créer';

  if (entry) {
    document.getElementById('knowledge-type').value = entry.type;
    document.getElementById('knowledge-title').value = entry.title;
    document.getElementById('knowledge-content').value = entry.content || '';
  }

  closeModalById('knowledge-view-modal');
  openModalById('knowledge-form-modal');
}

function renderKnowledgeTypeStrip() {
  const strip = document.getElementById('knowledge-type-strip');
  if (!strip) return;

  let html = `<span class="category-chip ${activeKnowledgeType === null ? 'is-active' : ''}" onclick="setKnowledgeTypeFilter(null)">Tous (${allKnowledge.length})</span>`;
  Object.keys(KNOWLEDGE_TYPE_LABELS).forEach(function (type) {
    const count = allKnowledge.filter(k => k.type === type).length;
    html += `<span class="category-chip ${activeKnowledgeType === type ? 'is-active' : ''}" onclick="setKnowledgeTypeFilter('${type}')">${KNOWLEDGE_TYPE_LABELS[type]} (${count})</span>`;
  });
  strip.innerHTML = html;
}

function setKnowledgeTypeFilter(type) {
  activeKnowledgeType = type;
  renderKnowledgeTypeStrip();
  renderKnowledge();
}

function renderKnowledge() {
  const list = document.getElementById('knowledge-list');
  if (!list) return;

  const searchInput = document.getElementById('knowledge-search-input');
  const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();

  const filtered = allKnowledge.filter(function (entry) {
    const matchesType = activeKnowledgeType === null || entry.type === activeKnowledgeType;
    const matchesSearch = !searchTerm || entry.title.toLowerCase().includes(searchTerm);
    return matchesType && matchesSearch;
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2 4h6l2-4h4"/><path d="M5 12V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"/></svg></div>
        <h3>Rien pour l'instant</h3>
        <p>Ajoutez les rôles, contacts utiles et notes qui font tourner l'entreprise.</p>
        <div class="empty-state-actions">
          <button type="button" class="btn btn-primary" onclick="openKnowledgeFormModal()">Ajouter une entrée</button>
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(function (entry) {
    return `
      <div class="know-row" onclick="viewKnowledge('${entry.id}')">
        <div class="know-icon know-icon-${entry.type}">${KNOWLEDGE_TYPE_ICONS[entry.type]}</div>
        <div class="know-info">
          <div class="know-title">${entry.title}</div>
          <div class="know-meta">${KNOWLEDGE_TYPE_LABELS[entry.type]}</div>
        </div>
      </div>
    `;
  }).join('');
}

function viewKnowledge(id) {
  const entry = allKnowledge.find(k => k.id === id);
  if (!entry) return;

  document.getElementById('knowledge-view-title').textContent = entry.title;
  document.getElementById('knowledge-view-content').textContent = entry.content || 'Aucun détail renseigné.';

  document.getElementById('knowledge-edit-btn').onclick = function () { openKnowledgeFormModal(entry); };

  const deleteBtn = document.getElementById('knowledge-delete-btn');
  if (knowRole === 'admin') {
    deleteBtn.style.display = '';
    deleteBtn.onclick = function () { deleteKnowledge(entry.id, entry.title); };
  } else {
    deleteBtn.style.display = 'none';
  }

  openModalById('knowledge-view-modal');
}

function deleteKnowledge(id, title) {
  confirmAction({
    title: 'Supprimer cette entrée ?',
    message: "Cette action est définitive.",
    confirmLabel: 'Supprimer',
    danger: true,
    onConfirm: async function () {
      const { error } = await supabaseClient.from('knowledge_entries').delete().eq('id', id);
      if (error) {
        showToast('Suppression impossible : ' + error.message, 'error');
        return;
      }
      showToast('Entrée supprimée.', 'success');
      await logActivity(knowCompanyId, `Connaissance supprimée : ${title}`);
      closeModalById('knowledge-view-modal');
      await loadKnowledgeData();
    }
  });
}

async function loadKnowledgeData() {
  const { data, error } = await supabaseClient
    .from('knowledge_entries')
    .select('id, title, type, content, created_at')
    .eq('company_id', knowCompanyId)
    .order('created_at', { ascending: false });

  allKnowledge = error ? [] : data;
  renderKnowledgeTypeStrip();
  renderKnowledge();
}

async function initKnowledgePage() {
  const list = document.getElementById('knowledge-list');
  if (!list) return; // pas sur la page Connaissances

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  await ensureCompanySetup(session);

  const { data: membership, error: membershipError } = await supabaseClient
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .single();

  if (membershipError || !membership) {
    hidePageLoader();
    console.error('Erreur membership:', membershipError);
    showToast("Impossible de charger votre espace entreprise : " + (membershipError ? membershipError.message : 'aucune entreprise associee a ce compte.'), 'error');
    return;
  }

  knowCompanyId = membership.company_id;
  knowRole = membership.role;

  await loadKnowledgeData();

  document.getElementById('knowledge-search-input').addEventListener('input', renderKnowledge);

  hidePageLoader();

  document.getElementById('knowledge-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const titleInput = document.getElementById('knowledge-title');
    if (titleInput.value.trim().length === 0) {
      showFieldError('knowledge-title-field');
      return;
    }
    clearFieldError('knowledge-title-field');

    const payload = {
      company_id: knowCompanyId,
      type: document.getElementById('knowledge-type').value,
      title: titleInput.value.trim(),
      content: document.getElementById('knowledge-content').value.trim(),
      updated_at: new Date().toISOString()
    };

    const submitBtn = document.getElementById('knowledge-form-submit');
    setButtonLoading(submitBtn, true, 'Enregistrement...');

    let result;
    if (editingKnowledgeId) {
      result = await supabaseClient.from('knowledge_entries').update(payload).eq('id', editingKnowledgeId);
    } else {
      const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
      payload.created_by = currentSession.user.id;
      result = await supabaseClient.from('knowledge_entries').insert(payload);
    }

    setButtonLoading(submitBtn, false);

    if (result.error) {
      showToast('Erreur : ' + result.error.message, 'error');
      return;
    }

    showToast(editingKnowledgeId ? 'Entrée mise à jour.' : 'Entrée créée.', 'success');
    await logActivity(knowCompanyId, editingKnowledgeId ? `Connaissance modifiée : ${payload.title}` : `Connaissance ajoutée : ${payload.title}`);
    closeModalById('knowledge-form-modal');
    await loadKnowledgeData();
  });
}


/* ========== PAGE EQUIPE ========== */

let teamCompanyId = null;
let teamRole = null;
let currentInviteLink = '';

function openInviteModal() {
  document.getElementById('invite-form').reset();
  clearFieldError('invite-email-field');
  openModalById('invite-modal');
}

function copyInviteLink() {
  navigator.clipboard.writeText(currentInviteLink).then(function () {
    showToast('Lien copié.', 'success');
  }).catch(function () {
    showToast('Impossible de copier automatiquement — sélectionnez le lien manuellement.', 'error');
  });
}

function initialsFor(firstName, lastName) {
  const a = (firstName || '').charAt(0);
  const b = (lastName || '').charAt(0);
  return (a + b).toUpperCase() || '?';
}

function renderMembers(members) {
  const list = document.getElementById('member-list');
  list.innerHTML = members.map(function (m) {
    const fullName = [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Membre';
    const removeBtn = (teamRole === 'admin')
      ? `<button type="button" class="icon-btn icon-btn-danger" onclick="removeMember('${m.id}', '${fullName.replace(/'/g, "\\'")}')" aria-label="Retirer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg></button>`
      : '';
    return `
      <div class="member-row">
        <div class="member-avatar">${initialsFor(m.first_name, m.last_name)}</div>
        <div class="member-info">
          <div class="member-name">${fullName}</div>
        </div>
        <span class="role-badge role-badge-${m.role}">${m.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
        ${removeBtn}
      </div>
    `;
  }).join('');
}

function removeMember(memberId, name) {
  confirmAction({
    title: `Retirer ${name} ?`,
    message: "Cette personne perdra l'accès à l'espace de l'entreprise.",
    confirmLabel: 'Retirer',
    danger: true,
    onConfirm: async function () {
      const { error } = await supabaseClient.from('company_members').delete().eq('id', memberId);
      if (error) {
        showToast('Suppression impossible : ' + error.message, 'error');
        return;
      }
      showToast('Membre retiré.', 'success');
      await logActivity(teamCompanyId, `Membre retiré : ${name}`);
      await loadTeamData();
    }
  });
}

function renderInvites(invites) {
  const section = document.getElementById('invites-section');
  const list = document.getElementById('invite-list');

  if (teamRole !== 'admin' || invites.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  list.innerHTML = invites.map(function (inv) {
    return `
      <div class="member-row">
        <div class="member-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></div>
        <div class="member-info">
          <div class="member-name">${inv.email}</div>
          <div class="member-email">En attente</div>
        </div>
        <span class="role-badge role-badge-${inv.role}">${inv.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
        <button type="button" class="icon-btn icon-btn-danger" onclick="revokeInvite('${inv.id}')" aria-label="Annuler"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg></button>
      </div>
    `;
  }).join('');
}

function revokeInvite(id) {
  confirmAction({
    title: "Annuler cette invitation ?",
    message: "Le lien ne fonctionnera plus.",
    confirmLabel: 'Annuler l\'invitation',
    danger: true,
    onConfirm: async function () {
      const { error } = await supabaseClient.from('company_invites').delete().eq('id', id);
      if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
      }
      showToast('Invitation annulée.', 'success');
      await loadTeamData();
    }
  });
}

async function loadTeamData() {
  const { data: members } = await supabaseClient
    .from('company_members')
    .select('id, first_name, last_name, role')
    .eq('company_id', teamCompanyId)
    .order('created_at');

  renderMembers(members || []);

  const statMembers = document.getElementById('stat-members');
  if (statMembers) statMembers.textContent = (members || []).length;

  if (teamRole === 'admin') {
    const { data: invites } = await supabaseClient
      .from('company_invites')
      .select('id, email, role')
      .eq('company_id', teamCompanyId)
      .eq('status', 'pending')
      .order('created_at');
    renderInvites(invites || []);
  }
}

async function initTeamPage() {
  const list = document.getElementById('member-list');
  if (!list) return; // pas sur la page Equipe

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  await ensureCompanySetup(session);

  const { data: membership, error: membershipError } = await supabaseClient
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .single();

  if (membershipError || !membership) {
    hidePageLoader();
    console.error('Erreur membership:', membershipError);
    showToast("Impossible de charger votre espace entreprise : " + (membershipError ? membershipError.message : 'aucune entreprise associee a ce compte.'), 'error');
    return;
  }

  teamCompanyId = membership.company_id;
  teamRole = membership.role;

  if (teamRole === 'admin') {
    document.getElementById('team-admin-only').style.display = '';
  }

  await loadTeamData();
  hidePageLoader();

  document.getElementById('invite-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const emailInput = document.getElementById('invite-email');
    if (!isValidEmail(emailInput.value)) {
      showFieldError('invite-email-field');
      return;
    }
    clearFieldError('invite-email-field');

    const submitBtn = document.getElementById('invite-form-submit');
    setButtonLoading(submitBtn, true, 'Création...');

    const { data, error } = await supabaseClient
      .from('company_invites')
      .insert({
        company_id: teamCompanyId,
        email: emailInput.value.trim().toLowerCase(),
        role: document.getElementById('invite-role').value,
        invited_by: session.user.id
      })
      .select()
      .single();

    setButtonLoading(submitBtn, false);

    if (error) {
      showToast('Erreur : ' + error.message, 'error');
      return;
    }

    currentInviteLink = window.location.origin + window.location.pathname.replace('team.html', '') + 'login.html?invite=' + data.token;
    document.getElementById('invite-link-text').textContent = currentInviteLink;

    await logActivity(teamCompanyId, `Invitation envoyée : ${data.email}`);
    closeModalById('invite-modal');
    openModalById('invite-link-modal');
    await loadTeamData();
  });
}


/* ========== PAGE PARAMETRES ========== */

async function initSettingsPage() {
  const nameInput = document.getElementById('company-name-input');
  if (!nameInput) return; // pas sur la page Parametres

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  await ensureCompanySetup(session);

  const { data: membership, error: membershipError } = await supabaseClient
    .from('company_members')
    .select('company_id, first_name, last_name, role, companies ( name, plan, status, trial_ends_at )')
    .eq('user_id', session.user.id)
    .single();

  if (membershipError || !membership) {
    hidePageLoader();
    console.error('Erreur membership:', membershipError);
    showToast("Impossible de charger votre espace entreprise : " + (membershipError ? membershipError.message : 'aucune entreprise associee a ce compte.'), 'error');
    return;
  }

  const companyId = membership.company_id;
  const company = membership.companies;

  nameInput.value = company.name;

  if (membership.role === 'admin') {
    nameInput.disabled = false;
    document.getElementById('company-settings-submit').style.display = '';
  } else {
    document.getElementById('company-settings-readonly-note').style.display = '';
  }

  const planLabel = company.plan === 'pro' ? 'Plan Pro' : 'Plan Starter';
  document.getElementById('settings-plan-label').textContent = planLabel;

  const detail = document.getElementById('settings-plan-detail');
  if (company.status === 'active') {
    detail.textContent = 'Abonnement actif.';
  } else {
    const daysLeft = Math.ceil((new Date(company.trial_ends_at) - new Date()) / 86400000);
    detail.textContent = daysLeft > 0
      ? `Essai gratuit — ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}.`
      : "Essai gratuit terminé.";
  }

  const fullName = [membership.first_name, membership.last_name].filter(Boolean).join(' ') || 'Vous';
  document.getElementById('settings-user-name').textContent = fullName;
  document.getElementById('settings-user-email').textContent = session.user.email;
  document.getElementById('settings-user-role').textContent = membership.role === 'admin' ? 'Administrateur' : 'Utilisateur';

  hidePageLoader();

  const form = document.getElementById('company-settings-form');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (nameInput.value.trim().length === 0) {
      showFieldError('company-name-field');
      return;
    }
    clearFieldError('company-name-field');

    const submitBtn = document.getElementById('company-settings-submit');
    setButtonLoading(submitBtn, true, 'Enregistrement...');

    const { error } = await supabaseClient
      .from('companies')
      .update({ name: nameInput.value.trim() })
      .eq('id', companyId);

    setButtonLoading(submitBtn, false);

    if (error) {
      showToast('Erreur : ' + error.message, 'error');
      return;
    }

    showToast('Nom de l\'entreprise mis à jour.', 'success');
    await logActivity(companyId, `Entreprise renommée : ${nameInput.value.trim()}`);
  });
}


/* ========== INITIALISATION GÉNÉRALE ========== */

document.addEventListener('DOMContentLoaded', function () {
  initAuthPage();
  initDashboardPage();
  initDocumentsPage();
  initProceduresPage();
  initKnowledgePage();
  initTeamPage();
  initResetPasswordPage();
  initSettingsPage();
});
