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

      if (memberError) {
        setButtonLoading(submitBtn, false);
        showAlert("Espace créé, mais une erreur est survenue : " + memberError.message);
        return;
      }

      // Catégories par défaut, conformes au cahier des charges.
      const defaultCategories = [
        'Contrats', 'Documents administratifs', 'Rapports', 'Factures',
        'Modèles', 'Documents RH', 'Documents techniques', 'Autres fichiers importants'
      ];
      await supabaseClient
        .from('document_categories')
        .insert(defaultCategories.map(name => ({ company_id: companyData.id, name })));

      setButtonLoading(submitBtn, false);

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
    hidePageLoader();
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
        <div class="empty-state-icon">▤</div>
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
    const deleteBtn = docsRole === 'admin'
      ? `<button type="button" class="icon-btn icon-btn-danger" onclick="deleteDocument('${doc.id}', '${doc.file_path}')" aria-label="Supprimer">🗑</button>`
      : '';

    return `
      <div class="doc-row">
        <div class="doc-icon">${extension}</div>
        <div class="doc-info">
          <div class="doc-name">${doc.name}</div>
          <div class="doc-meta"><span>${categoryName}</span><span>·</span><span>${formatDate(doc.created_at)}</span></div>
        </div>
        <div class="doc-actions">
          <button type="button" class="icon-btn" onclick="downloadDocument('${doc.file_path}', '${doc.name.replace(/'/g, "\\'")}')" aria-label="Télécharger">⬇</button>
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

function deleteDocument(id, filePath) {
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

  const { data: membership, error: membershipError } = await supabaseClient
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership) {
    hidePageLoader();
    showToast("Impossible de charger votre espace entreprise.", 'error');
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
        <div class="empty-state-icon">☑</div>
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
        <div class="proc-icon">☑</div>
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
    deleteBtn.onclick = function () { deleteProcedure(proc.id); };
  } else {
    deleteBtn.style.display = 'none';
  }

  openModalById('procedure-view-modal');
}

function deleteProcedure(id) {
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

  const { data: membership, error: membershipError } = await supabaseClient
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .single();

  if (membershipError || !membership) {
    hidePageLoader();
    showToast("Impossible de charger votre espace entreprise.", 'error');
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
const KNOWLEDGE_TYPE_ICONS = { role: '◆', contact: '☎', note: '✎' };

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
        <div class="empty-state-icon">◎</div>
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
    deleteBtn.onclick = function () { deleteKnowledge(entry.id); };
  } else {
    deleteBtn.style.display = 'none';
  }

  openModalById('knowledge-view-modal');
}

function deleteKnowledge(id) {
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

  const { data: membership, error: membershipError } = await supabaseClient
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .single();

  if (membershipError || !membership) {
    hidePageLoader();
    showToast("Impossible de charger votre espace entreprise.", 'error');
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
    closeModalById('knowledge-form-modal');
    await loadKnowledgeData();
  });
}


/* ========== INITIALISATION GÉNÉRALE ========== */

document.addEventListener('DOMContentLoaded', function () {
  initAuthPage();
  initDashboardPage();
  initDocumentsPage();
  initProceduresPage();
  initKnowledgePage();
});
