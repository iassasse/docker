/**
 * Equipe Manager - Client REST API
 * JavaScript Vanilla (ES6+)
 */

// Configuration de l'URL de base de l'API
// Si l'application est servie depuis le port 4000 (Express), on utilise des chemins relatifs.
// Sinon (ex: Live Server ou fichier local), on pointe explicitement vers http://localhost:4000.
const API_BASE_URL = window.location.port === '4000' ? '' : 'http://localhost:4000';

// Cache des éléments du DOM
const dom = {
  searchInput: document.getElementById('search-input'),
  btnViewGrid: document.getElementById('btn-view-grid'),
  btnViewTable: document.getElementById('btn-view-table'),
  btnOpenAddModal: document.getElementById('btn-open-add-modal'),
  apiStatusDot: document.getElementById('api-status-dot'),
  apiStatusText: document.getElementById('api-status-text'),
  loadingState: document.getElementById('loading-state'),
  errorState: document.getElementById('error-state'),
  errorMessage: document.getElementById('error-message'),
  btnRetry: document.getElementById('btn-retry'),
  emptyState: document.getElementById('empty-state'),
  contentArea: document.getElementById('content-area'),
  teamsGrid: document.getElementById('teams-grid'),
  teamsTableWrapper: document.getElementById('teams-table-wrapper'),
  teamsTableBody: document.getElementById('teams-table-body'),
  teamModal: document.getElementById('team-modal'),
  modalTitle: document.getElementById('modal-title'),
  teamForm: document.getElementById('team-form'),
  teamIdInput: document.getElementById('team-id-input'),
  teamNameInput: document.getElementById('team-name-input'),
  teamCountryInput: document.getElementById('team-country-input'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCancelModal: document.getElementById('btn-cancel-modal'),
  toastContainer: document.getElementById('toast-container')
};

// État de l'application
let state = {
  teams: [],
  viewMode: 'grid', // 'grid' | 'table'
  searchQuery: '',
  isOnline: false
};

// SVG Icons
const icons = {
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
};

/**
 * Initialisation de l'application
 */
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  init();
});

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
  // Changement de vue
  dom.btnViewGrid.addEventListener('click', () => setViewMode('grid'));
  dom.btnViewTable.addEventListener('click', () => setViewMode('table'));
  
  // Recherche en temps réel (avec filtre local rapide)
  dom.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    render();
  });

  // Modale Ajouter
  dom.btnOpenAddModal.addEventListener('click', () => openModal());
  dom.btnCloseModal.addEventListener('click', closeModal);
  dom.btnCancelModal.addEventListener('click', closeModal);
  
  // Fermer la modale en cliquant en dehors
  dom.teamModal.addEventListener('click', (e) => {
    if (e.target === dom.teamModal) closeModal();
  });

  // Soumission du formulaire (Ajout / Modification)
  dom.teamForm.addEventListener('submit', handleFormSubmit);

  // Bouton Réessayer en cas d'erreur
  dom.btnRetry.addEventListener('click', init);
}

/**
 * Initialise le chargement de l'API
 */
async function init() {
  showLoading(true);
  dom.errorState.classList.add('hidden');
  dom.contentArea.classList.add('hidden');
  dom.emptyState.classList.add('hidden');
  
  const connected = await checkApiStatus();
  if (connected) {
    await fetchTeams();
  } else {
    showError("Impossible de se connecter à l'API REST de l'application. Vérifiez que le conteneur Docker tourne sur le port 4000.");
  }
}

/**
 * Vérifie le statut de connexion à l'API REST
 */
async function checkApiStatus() {
  try {
    // Appel du endpoint root "/"
    const res = await fetch(`${API_BASE_URL}/`);
    if (res.ok) {
      updateApiStatus(true, "Connecté à l'API");
      return true;
    }
  } catch (error) {
    console.warn("Status check failed:", error);
  }
  updateApiStatus(false, "Hors ligne (Port 4000 injoignable)");
  return false;
}

/**
 * Met à jour l'indicateur visuel de connexion
 */
function updateApiStatus(online, message) {
  state.isOnline = online;
  if (online) {
    dom.apiStatusDot.className = 'status-indicator online';
    dom.apiStatusText.textContent = message;
  } else {
    dom.apiStatusDot.className = 'status-indicator offline';
    dom.apiStatusText.textContent = message;
  }
}

/**
 * Récupère la liste complète des équipes
 */
async function fetchTeams() {
  showLoading(true);
  try {
    const res = await fetch(`${API_BASE_URL}/equipe`);
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    
    state.teams = await res.json();
    showLoading(false);
    render();
    
    // Essayer de récupérer discrètement la valeur depuis Redis pour validation
    try {
      fetch(`${API_BASE_URL}/data`)
        .then(r => r.text())
        .then(html => {
          // Si le chargement Redis a fonctionné, log pour le debug
          console.log("Redis Status Check Ok");
        }).catch(() => {});
    } catch(e) {}
    
  } catch (error) {
    console.error("Fetch teams failed:", error);
    showError("Erreur lors de la récupération des équipes : " + error.message);
  }
}

/**
 * Alterne entre la vue Grille et Tableau
 */
function setViewMode(mode) {
  state.viewMode = mode;
  if (mode === 'grid') {
    dom.btnViewGrid.classList.add('active');
    dom.btnViewTable.classList.remove('active');
    dom.teamsGrid.classList.remove('hidden');
    dom.teamsTableWrapper.classList.add('hidden');
  } else {
    dom.btnViewGrid.classList.remove('active');
    dom.btnViewTable.classList.add('active');
    dom.teamsGrid.classList.add('hidden');
    dom.teamsTableWrapper.classList.remove('hidden');
  }
  render();
}

/**
 * Affiche ou masque l'état de chargement
 */
function showLoading(isLoading) {
  if (isLoading) {
    dom.loadingState.classList.remove('hidden');
    dom.contentArea.classList.add('hidden');
    dom.emptyState.classList.add('hidden');
  } else {
    dom.loadingState.classList.add('hidden');
  }
}

/**
 * Affiche l'état d'erreur
 */
function showError(msg) {
  showLoading(false);
  dom.errorMessage.textContent = msg;
  dom.errorState.classList.remove('hidden');
  dom.contentArea.classList.add('hidden');
  dom.emptyState.classList.add('hidden');
  showToast(msg, 'error');
}

/**
 * Gère le rendu global en fonction des filtres et de l'état
 */
function render() {
  // Filtrage local en fonction de la barre de recherche
  const filteredTeams = state.teams.filter(team => 
    team.name.toLowerCase().includes(state.searchQuery) ||
    team.country.toLowerCase().includes(state.searchQuery)
  );

  // Si aucun élément ne correspond
  if (filteredTeams.length === 0) {
    dom.emptyState.classList.remove('hidden');
    dom.contentArea.classList.add('hidden');
    return;
  }

  dom.emptyState.classList.add('hidden');
  dom.contentArea.classList.remove('hidden');

  if (state.viewMode === 'grid') {
    renderGrid(filteredTeams);
  } else {
    renderTable(filteredTeams);
  }
}

/**
 * Rendu sous forme de cartes (Grid)
 */
function renderGrid(teamsList) {
  dom.teamsGrid.innerHTML = '';
  
  teamsList.forEach((team, index) => {
    const card = document.createElement('div');
    card.className = 'team-card card';
    // Ajout d'un léger délai d'apparition décalé (stagger effect)
    card.style.animationDelay = `${index * 0.05}s`;
    
    card.innerHTML = `
      <div>
        <div class="team-card-header">
          <span class="team-number">#${team.id}</span>
        </div>
        <h3 class="team-name">${escapeHtml(team.name)}</h3>
        <div class="team-country-wrapper">
          <span class="flag-icon">${icons.flag}</span>
          <span class="team-country">${escapeHtml(team.country)}</span>
        </div>
      </div>
      <div class="team-actions">
        <button class="btn-icon btn-icon-edit" data-id="${team.id}" title="Modifier">
          ${icons.edit}
        </button>
        <button class="btn-icon btn-icon-delete" data-id="${team.id}" title="Supprimer">
          ${icons.delete}
        </button>
      </div>
    `;
    
    // Attacher les événements aux boutons d'action
    card.querySelector('.btn-icon-edit').addEventListener('click', () => loadTeamForEdit(team.id));
    card.querySelector('.btn-icon-delete').addEventListener('click', () => handleDelete(team.id));
    
    dom.teamsGrid.appendChild(card);
  });
}

/**
 * Rendu sous forme de tableau (Table)
 */
function renderTable(teamsList) {
  dom.teamsTableBody.innerHTML = '';
  
  teamsList.forEach(team => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-id">#${team.id}</td>
      <td class="col-name">${escapeHtml(team.name)}</td>
      <td class="col-country">${escapeHtml(team.country)}</td>
      <td class="col-actions">
        <div class="table-actions">
          <button class="btn-icon btn-icon-edit" data-id="${team.id}" title="Modifier">
            ${icons.edit}
          </button>
          <button class="btn-icon btn-icon-delete" data-id="${team.id}" title="Supprimer">
            ${icons.delete}
          </button>
        </div>
      </td>
    `;
    
    tr.querySelector('.btn-icon-edit').addEventListener('click', () => loadTeamForEdit(team.id));
    tr.querySelector('.btn-icon-delete').addEventListener('click', () => handleDelete(team.id));
    
    dom.teamsTableBody.appendChild(tr);
  });
}

/**
 * Ouvre la modale en mode Ajout ou Modification
 */
function openModal(team = null) {
  dom.teamForm.reset();
  
  if (team) {
    dom.modalTitle.textContent = "Modifier l'équipe";
    dom.teamIdInput.value = team.id;
    dom.teamNameInput.value = team.name;
    dom.teamCountryInput.value = team.country;
  } else {
    dom.modalTitle.textContent = "Ajouter une équipe";
    dom.teamIdInput.value = '';
  }
  
  dom.teamModal.classList.remove('hidden');
  dom.teamNameInput.focus();
}

/**
 * Ferme la modale
 */
function closeModal() {
  dom.teamModal.classList.add('hidden');
  dom.teamForm.reset();
}

/**
 * Charge les informations d'une équipe spécifique pour l'éditer
 */
async function loadTeamForEdit(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/equipe/${id}`);
    if (!res.ok) throw new Error("Impossible de récupérer les détails de l'équipe");
    
    const team = await res.json();
    openModal(team);
  } catch (error) {
    showToast("Erreur de chargement de l'équipe : " + error.message, "error");
  }
}

/**
 * Soumission du formulaire d'enregistrement (Création ou Mise à jour)
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = dom.teamIdInput.value;
  const name = dom.teamNameInput.value.trim();
  const country = dom.teamCountryInput.value.trim();
  
  if (!name || !country) {
    showToast("Tous les champs sont requis", "error");
    return;
  }
  
  const payload = { name, country };
  const isEdit = id !== '';
  
  // Configuration de l'appel Fetch (POST ou PUT)
  const url = isEdit ? `${API_BASE_URL}/equipe/${id}` : `${API_BASE_URL}/equipe`;
  const method = isEdit ? 'PUT' : 'POST';
  
  try {
    // Blocage visuel mineur
    dom.teamForm.querySelector('button[type="submit"]').disabled = true;
    
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    
    const savedTeam = await res.json();
    
    closeModal();
    showToast(
      isEdit ? `L'équipe "${savedTeam.name}" a été mise à jour.` : `L'équipe "${savedTeam.name}" a été ajoutée avec succès.`,
      'success'
    );
    
    // Recharger les équipes pour afficher les données fraîches
    await fetchTeams();
    
  } catch (error) {
    console.error("Save team failed:", error);
    showToast("Erreur lors de l'enregistrement : " + error.message, 'error');
  } finally {
    dom.teamForm.querySelector('button[type="submit"]').disabled = false;
  }
}

/**
 * Supprime une équipe après confirmation
 */
async function handleDelete(id) {
  const team = state.teams.find(t => t.id === id);
  if (!team) return;
  
  const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ?`);
  if (!confirmed) return;
  
  try {
    const res = await fetch(`${API_BASE_URL}/equipe/${id}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    
    showToast(`L'équipe "${team.name}" a été supprimée.`, 'info');
    await fetchTeams();
    
  } catch (error) {
    console.error("Delete team failed:", error);
    showToast("Erreur lors de la suppression : " + error.message, 'error');
  }
}

/**
 * Utilitaire pour échapper les caractères spéciaux HTML afin d'éviter les failles XSS
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Système dynamique de notifications Toasts
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = icons.info;
  if (type === 'success') icon = icons.check;
  if (type === 'error') icon = icons.x;
  
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;
  
  dom.toastContainer.appendChild(toast);
  
  // Fermeture automatique après 4 secondes
  const autoRemoveTimeout = setTimeout(() => {
    removeToast(toast);
  }, 4000);
  
  // Permettre de fermer au clic manuel
  toast.addEventListener('click', () => {
    clearTimeout(autoRemoveTimeout);
    removeToast(toast);
  });
}

function removeToast(toast) {
  toast.classList.add('removing');
  toast.addEventListener('animationend', () => {
    toast.remove();
  });
}
