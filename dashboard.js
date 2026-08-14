/* Ognandji Docs — logique du tableau de bord */

// Point d'intégration Supabase : remplacer ce tableau par une vraie
// requête sur la table d'activité de l'entreprise une fois connecté.
const recentActivity = [];

function renderActivity() {
  const list = document.getElementById('activity-list');

  if (recentActivity.length === 0) {
    list.innerHTML = '';
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-state-icon">◎</div>
      <h3>Rien à afficher pour l'instant</h3>
      <p>Dès que vous ajouterez un document ou créerez une procédure, l'activité apparaîtra ici.</p>
      <div class="empty-state-actions">
        <a href="documents.html" class="btn btn-secondary">Ajouter un document</a>
        <a href="procedures.html" class="btn btn-primary">Créer une procédure</a>
      </div>
    `;
    list.appendChild(emptyState);
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
  banner.style.display = 'none';
  localStorage.setItem('ognandji_onboarding_dismissed', 'true');
}

function handleQuickAction(type) {
  // Les pages Documents et Procédures arrivent à l'étape suivante :
  // ce bouton confirme déjà le geste pour ne pas laisser l'utilisateur sans réponse.
  const messages = {
    categorie: "La création de catégories arrive dans la prochaine étape.",
    document: "L'ajout de documents arrive dans la prochaine étape.",
    procedure: "La création de procédures arrive dans la prochaine étape."
  };
  showToast(messages[type] || "Bientôt disponible.", 'info');
}

document.addEventListener('DOMContentLoaded', function () {
  renderActivity();

  if (localStorage.getItem('ognandji_onboarding_dismissed') === 'true') {
    document.getElementById('onboarding-banner').style.display = 'none';
  }
});
