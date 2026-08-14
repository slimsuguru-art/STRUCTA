/* Ognandji Docs — utilitaires d'interface partagés
   (toasts, confirmation de suppression)
   À inclure sur toutes les pages internes après auth.js. */

// ---- Toasts ----

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
    setTimeout(function () {
      toast.remove();
    }, 200);
  }, 3200);
}

// ---- Modale de confirmation ----
// Usage : confirmAction({ title, message, confirmLabel, onConfirm })

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
    if (typeof options.onConfirm === 'function') {
      options.onConfirm();
    }
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
    setTimeout(function () {
      overlay.remove();
    }, 200);
  }

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) closeModal();
  });

  requestAnimationFrame(function () {
    overlay.classList.add('is-open');
  });
}
