function switchTab(target) {
  const isLogin = target === 'login';

  document.getElementById('tab-login').classList.toggle('is-active', isLogin);
  document.getElementById('tab-signup').classList.toggle('is-active', !isLogin);
  document.getElementById('tab-login').setAttribute('aria-selected', isLogin);
  document.getElementById('tab-signup').setAttribute('aria-selected', !isLogin);

  document.getElementById('form-login').classList.toggle('is-active', isLogin);
  document.getElementById('form-signup').classList.toggle('is-active', !isLogin);

  hideAlert();
}

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  button.textContent = isHidden ? 'Masquer' : 'Afficher';
}

function showFieldError(fieldId) {
  document.getElementById(fieldId).classList.add('has-error');
}

function clearFieldError(fieldId) {
  document.getElementById(fieldId).classList.remove('has-error');
}

function showAlert(message) {
  const alertBox = document.getElementById('form-alert');
  alertBox.textContent = message;
  alertBox.style.display = 'flex';
}

function hideAlert() {
  const alertBox = document.getElementById('form-alert');
  alertBox.style.display = 'none';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

document.getElementById('form-login').addEventListener('submit', function (event) {
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
  showAlert('Connexion : intégration Supabase à venir.');
});

document.getElementById('form-signup').addEventListener('submit', function (event) {
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
  showAlert('Création de compte : intégration Supabase à venir.');
});
