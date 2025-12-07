
/* ===============================
   AvitPlanner — Final (complete)
   - Option: Dashboard user = Cards modern (Option 1)
   - Admin and User accounts included
   - Missions colorized by date (urgent / next week / future / past)
   - History tab for past missions (separated)
   - Comments shown directly in admin table
   - Storage in localStorage
   =============================== */

/* ===== Storage keys & seeds ===== */
const K_AG = 'avit_agences_v3';
const K_US = 'avit_users_v3';
const K_MS = 'avit_missions_v3';
const K_LG = 'avit_logs_v3';

const SEED_AGENCES = {
  A1:{id:'A1',nom:'Interim Pro',tel:'01 23 45 67 89',email:'contact@interimpro.fr'},
  A2:{id:'A2',nom:'Staff Rapide',tel:'09 87 65 43 21',email:'support@staffrapide.com'}
};
const SEED_USERS = {
  'ADMIN':{id:'ADMIN',name:'Admin',email:'admin@admin.com',pass:'123',role:'ADMIN',agence:null},
  'U1':{id:'U1',name:'User 1',email:'user1@example.com',pass:'123',role:'USER',agence:'A1'},
  'U2':{id:'U2',name:'Alice Dubois',email:'alice@example.com',pass:'123',role:'USER',agence:'A1'},
  'U3':{id:'U3',name:'Bob Martin',email:'bob@example.com',pass:'123',role:'USER',agence:'A2'}
};
const SEED_MISSIONS = [
  {id:1,interimaire:'User 1',userId:'U1',agence:'A1',date:addDaysISO(3),debut:'09:00',fin:'12:00',desc:'Mission test User1',statut:'ATTENTE',createdAt:nowISO()},
  {id:2,interimaire:'Alice Dubois',userId:'U2',agence:'A1',date:addDaysISO(10),debut:'13:00',fin:'17:00',desc:'Manutention',statut:'ATTENTE',createdAt:nowISO()},
  {id:3,interimaire:'Bob Martin',userId:'U2',agence:'A2',date:addDaysISO(-5),debut:'08:00',fin:'12:00',desc:'Inventaire passé',statut:'CONFIRME',createdAt:nowISO(),acceptedAt:nowISO()}
];

function load(key, seed){
  const raw = localStorage.getItem(key);
  if(!raw){
    if(seed!==undefined){ localStorage.setItem(key, JSON.stringify(seed)); return JSON.parse(JSON.stringify(seed)); }
    return null;
  }
  try{return JSON.parse(raw);}catch(e){return null;}
}
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

if(!load(K_AG)) save(K_AG, SEED_AGENCES);
if(!load(K_US)) save(K_US, SEED_USERS);
if(!load(K_MS)) save(K_MS, SEED_MISSIONS);
if(!load(K_LG)) save(K_LG, []);

/* getters/setters */
function getAgences(){ return load(K_AG) || {}; }
function setAgences(v){ save(K_AG, v); }
function getUsers(){ return load(K_US) || {}; }
function setUsers(v){ save(K_US, v); }
function getMissions(){ return load(K_MS) || []; }
function setMissions(v){ save(K_MS, v); }
function pushLog(entry){ const l = load(K_LG) || []; l.push(entry); save(K_LG, l); }

/* ===== Helpers ===== */
const toasts = document.getElementById('toasts');
function toast(msg){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; toasts.appendChild(el); requestAnimationFrame(()=>el.classList.add('show')); setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(),300); }, 2600); }
function initials(name='--'){ return name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase(); }
function nowISO(){ return new Date().toISOString(); }
function addDaysISO(days){ const d=new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }

/* ===== UI refs ===== */
const navLinks = document.querySelectorAll('#mainNav a');
const profileName = document.getElementById('profileName');
const profileRole = document.getElementById('profileRole');
const sidebarAvatar = document.getElementById('sidebarAvatar');
const topAvatar = document.getElementById('topAvatar');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');

const filterStatus = document.getElementById('filterStatus');
const filterInterimaire = document.getElementById('filterInterimaire');
const filterDate = document.getElementById('filterDate');
const clearFilters = document.getElementById('clearFilters');
const globalSearch = document.getElementById('globalSearch');
const missionsTable = document.getElementById('missionsTable');

const modalBack = document.getElementById('modalBack');
const mInputAgence = document.getElementById('m-input-agence');
const mInputInterimaire = document.getElementById('m-input-interimaire');
const mInputDate = document.getElementById('m-input-date');
const mInputDebut = document.getElementById('m-input-debut');
const mInputFin = document.getElementById('m-input-fin');
const mInputDesc = document.getElementById('m-input-desc');
const mSave = document.getElementById('m-save');
const mCancel = document.getElementById('m-cancel');
const modalTimeline = document.getElementById('modalTimeline');
const timelineProposed = document.getElementById('timelineProposed');

const actionModalBack = document.getElementById('actionModalBack');
const actionSelect = document.getElementById('actionSelect');
const actionComment = document.getElementById('actionComment');
const actionConfirm = document.getElementById('actionConfirm');
const actionCancel = document.getElementById('actionCancel');

const btnNew = document.getElementById('btnNew');
const mAddBtn = document.getElementById('mAddBtn');
const mFilterStatus = document.getElementById('mFilterStatus');
const mSearch = document.getElementById('mSearch');
const createAgenceBtn = document.getElementById('createAgenceBtn');
const createUserBtn = document.getElementById('createUserBtn');
const newAgenceName = document.getElementById('newAgenceName');
const newAgenceTel = document.getElementById('newAgenceTel');
const newUserName = document.getElementById('newUserName');
const newUserEmail = document.getElementById('newUserEmail');
const newUserPass = document.getElementById('newUserPass');
const newUserAgence = document.getElementById('newUserAgence');

const dashboardCards = document.getElementById('dashboardCards');
const dashTitle = document.getElementById('dashTitle');
const dashSubtitle = document.getElementById('dashSubtitle');
const lastUpdate = document.getElementById('lastUpdate');
const miniChart = document.getElementById('miniChart');
const agencesList = document.getElementById('agencesList');
const missionsAdminTable = document.getElementById('missionsAdminTable');
const agencesAdmin = document.getElementById('agencesAdmin');
const usersAdmin = document.getElementById('usersAdmin');
const historyTable = document.getElementById('historyTable');

let currentUser = null;
let editingMissionId = null;
let pendingActionMissionId = null;

/* ===== Date status function ===== */
function getMissionTimeStatus(dateStr){
  const today = new Date(); today.setHours(0,0,0,0);
  const mission = new Date(dateStr); mission.setHours(0,0,0,0);
  const diff = (mission - today) / (1000*60*60*24); // days
  if(diff < 0) return 'past';
  if(diff <= 7) return 'urgent';
  if(diff <= 14) return 'nextweek';
  return 'future';
}

/* ===== Init & events ===== */
function init(){
  navLinks.forEach(a=>a.addEventListener('click', navClick));
  loginBtn.addEventListener('click', openLogin);
  logoutBtn.addEventListener('click', ()=>{ setUser(null); toast('Déconnecté'); });
  themeToggle.addEventListener('click', ()=>document.body.classList.toggle('dark'));

  [filterStatus, filterInterimaire, filterDate].forEach(el=>el.addEventListener('change', renderMissionsView));
  clearFilters.addEventListener('click', ()=>{ filterStatus.value='ALL'; filterInterimaire.value='ALL'; filterDate.value=''; globalSearch.value=''; renderMissionsView(); });
  globalSearch.addEventListener('input', debounce(renderMissionsView,220));

  mCancel.addEventListener('click', closeModal);
  mSave.addEventListener('click', saveModalMission);
  mInputAgence.addEventListener('change', ()=>populateInterimaireSelect(mInputAgence.value));
  [mInputDate, mInputDebut, mInputFin, mInputInterimaire].forEach(el=>el.addEventListener('input', updateTimelinePreview));

  actionCancel.addEventListener('click', ()=>{ actionModalBack.style.display='none'; pendingActionMissionId=null; });
  actionConfirm.addEventListener('click', doActionConfirm);

  btnNew.addEventListener('click', ()=>openModalForNew());
  mAddBtn && mAddBtn.addEventListener('click', ()=>openModalForNew());

  mFilterStatus && mFilterStatus.addEventListener('change', renderAdminMissions);
  mSearch && mSearch.addEventListener('input', debounce(renderAdminMissions,220));

  createAgenceBtn && createAgenceBtn.addEventListener('click', createAgenceFromInput);
  createUserBtn && createUserBtn.addEventListener('click', createUserFromInput);

  populateAdminAgencesSelect();
  setUser(null);
  renderAll();
}

/* ===== Navigation ===== */
function navClick(e){
  e.preventDefault();
  navLinks.forEach(a=>a.classList.remove('active'));
  e.currentTarget.classList.add('active');
  const view = e.currentTarget.dataset.view;
  // hide all main sections
  document.querySelectorAll('main section').forEach(s=>s.style.display='none');
  const el = document.getElementById('view-' + view);
  if(el) el.style.display = 'block';
  renderAll();
}

/* ===== Auth ===== */
function openLogin(){
  // simple prompt-based login (accept username or email)
  const idOrEmail = prompt('Identifiant (admin or user1, or email):', 'user1');
  if(!idOrEmail) return;
  const pass = prompt('Mot de passe:', '123');
  if(pass === null) return;
  const users = getUsers();
  const key = Object.keys(users).find(k => {
    const u = users[k];
    return (u.email && u.email.toLowerCase() === idOrEmail.toLowerCase()) || (u.id && u.id.toLowerCase() === idOrEmail.toLowerCase()) || (u.name && u.name.toLowerCase() === idOrEmail.toLowerCase()) || (u.id && u.id.toLowerCase() === idOrEmail.toLowerCase());
  });
  if(!key){ toast('Utilisateur introuvable'); return; }
  const user = users[key];
  if(user.pass !== pass){ toast('Mot de passe incorrect'); return; }
  setUser(user);
  toast('Connecté en tant ' + user.name);
}

function setUser(user){
  if(user){
    currentUser = user;
    profileName.textContent = user.name;
    profileRole.textContent = user.role === 'USER' ? 'Intérimaire' : (user.role || 'Admin');
    sidebarAvatar.textContent = initials(user.name);
    topAvatar.textContent = initials(user.name);
    loginBtn.style.display = 'none'; logoutBtn.style.display = 'inline-block';
    btnNew.style.display = user.role === 'ADMIN' ? 'inline-block' : 'none';
    // default landing: dashboard
    document.querySelector('#mainNav a[data-view="dashboard"]').click();
  } else {
    currentUser = null;
    profileName.textContent = 'Invité';
    profileRole.textContent = 'Non connecté';
    sidebarAvatar.textContent = '--';
    topAvatar.textContent = '--';
    loginBtn.style.display = 'inline-block'; logoutBtn.style.display = 'none';
    btnNew.style.display = 'none';
  }
  populateAdminAgencesSelect();
  populateFilters();
  renderAll();
}

/* ===== Admin: create agence & user ===== */
function createAgenceFromInput(){
  const name = newAgenceName.value.trim(); const tel = newAgenceTel.value.trim();
  if(!name){ toast('Nom agence requis'); return; }
  const ag = getAgences(); const id = 'A' + Date.now();
  ag[id] = { id, nom:name, tel, email:'' }; setAgences(ag);
  newAgenceName.value=''; newAgenceTel.value=''; toast('Agence créée');
  populateAdminAgencesSelect(); renderAll();
}
function createUserFromInput(){
  const name = newUserName.value.trim(); const email = newUserEmail.value.trim(); const pass = newUserPass.value; const agence = newUserAgence.value;
  if(!name || !email || !pass || !agence){ toast('Remplir tous les champs'); return; }
  const users = getUsers(); const id = 'U' + Date.now();
  users[id] = { id, name, email, pass, role:'USER', agence }; setUsers(users);
  newUserName.value=''; newUserEmail.value=''; newUserPass.value=''; newUserAgence.value=''; toast('Utilisateur créé');
  populateAdminAgencesSelect(); populateFilters(); renderAll();
}
function populateAdminAgencesSelect(){
  const agences = getAgences();
  newUserAgence.innerHTML = '<option value="">Agence</option>';
  Object.values(agences).forEach(a => { const o=document.createElement('option'); o.value=a.id; o.textContent=a.nom; newUserAgence.appendChild(o); });
}

/* ===== Missions modal (admin) ===== */
function openModalForNew(){
  if(!currentUser || currentUser.role !== 'ADMIN'){ toast('Seul admin peut créer'); return; }
  editingMissionId = null; document.getElementById('modalTitle').textContent = 'Nouvelle mission';
  mInputDate.value=''; mInputDebut.value=''; mInputFin.value=''; mInputDesc.value='';
  const agences = getAgences(); mInputAgence.innerHTML = '';
  Object.values(agences).forEach(a => { const o=document.createElement('option'); o.value=a.id; o.textContent=a.nom; mInputAgence.appendChild(o); });
  populateInterimaireSelect(Object.keys(agences)[0]);
  modalBack.style.display = 'flex'; updateTimelinePreview();
}
function openModalForEdit(id){
  if(!currentUser || currentUser.role !== 'ADMIN'){ toast('Accès refusé'); return; }
  const ms = getMissions(); const m = ms.find(x=>x.id===id); if(!m) return;
  editingMissionId = id; document.getElementById('modalTitle').textContent = 'Éditer mission (confirmation requise)';
  const agences = getAgences(); mInputAgence.innerHTML = '';
  Object.values(agences).forEach(a => { const o=document.createElement('option'); o.value=a.id; o.textContent=a.nom; if(a.id===m.agence) o.selected=true; mInputAgence.appendChild(o); });
  populateInterimaireSelect(m.agence); mInputInterimaire.value = m.userId; mInputDate.value=m.date; mInputDebut.value=m.debut; mInputFin.value=m.fin; mInputDesc.value=m.desc;
  modalBack.style.display = 'flex'; updateTimelinePreview();
}
function closeModal(){ modalBack.style.display = 'none'; editingMissionId = null; clearTimelineExisting(); }

function saveModalMission(){
  const userId = mInputInterimaire.value; const users = getUsers(); const interName = users[userId]?.name || '';
  const agenceId = mInputAgence.value; const date = mInputDate.value; const debut = mInputDebut.value; const fin = mInputFin.value; const desc = mInputDesc.value.trim();
  if(!userId || !agenceId || !date || !debut || !fin || !desc){ toast('Tous les champs sont obligatoires'); return; }
  if(fin <= debut){ toast('Heure de fin doit être après le début'); return; }
  const missions = getMissions();
  const conflict = missions.some(ms => ms.userId === userId && ms.date === date && !(fin <= ms.debut || debut >= ms.fin) && (editingMissionId ? ms.id !== editingMissionId : true));
  if(conflict && !confirm('Conflit détecté pour cet intérimaire. Enregistrer quand même ?')) return;

  if(editingMissionId){
    if(!confirm('Confirmer la modification ?')) return;
    const idx = missions.findIndex(x=>x.id===editingMissionId);
    if(idx !== -1){ missions[idx] = {...missions[idx], interimaire:interName, userId, agence:agenceId, date, debut, fin, desc, updatedAt:nowISO()}; setMissions(missions); pushLog({ts:nowISO(),by:currentUser.email,action:'EDIT',missionId:editingMissionId}); toast('Mission mise à jour'); }
  } else {
    const newId = missions.length ? Math.max(...missions.map(m=>m.id))+1 : 1;
    const newMission = { id:newId, interimaire:interName, userId, agence:agenceId, date, debut, fin, desc, statut:'ATTENTE', createdAt: nowISO() };
    missions.push(newMission); setMissions(missions); pushLog({ts:nowISO(),by:currentUser.email,action:'CREATE',missionId:newId}); toast('Mission ajoutée');
  }
  closeModal(); renderAll();
}

/* populate inter select by agence */
function populateInterimaireSelect(agenceId){
  const users = getUsers(); mInputInterimaire.innerHTML = '';
  Object.values(users).filter(u=>u.role==='USER' && u.agence===agenceId).forEach(u=>{ const o=document.createElement('option'); o.value=u.id; o.textContent=u.name; mInputInterimaire.appendChild(o); });
  updateTimelinePreview();
}

/* timeline preview */
function updateTimelinePreview(){
  clearTimelineExisting();
  const userId = mInputInterimaire.value; const date = mInputDate.value; const debut = mInputDebut.value; const fin = mInputFin.value;
  if(!debut || !fin){ timelineProposed.style.left='0%'; timelineProposed.style.width='0%'; timelineProposed.textContent='Proposée'; }
  else {
    const s = timeToMinutes(debut), e = timeToMinutes(fin);
    const left = (s/1440)*100, width = Math.max((e-s)/1440*100, 0.6);
    timelineProposed.style.left = left + '%'; timelineProposed.style.width = width + '%'; timelineProposed.textContent = `${debut} → ${fin}`;
  }
  if(userId && date){
    const missions = getMissions();
    missions.filter(m=>m.userId===userId && m.date===date && m.id!==editingMissionId).forEach(m=>{
      const s = timeToMinutes(m.debut), e=timeToMinutes(m.fin); const left=(s/1440)*100, width=Math.max((e-s)/1440*100,0.6);
      const el=document.createElement('div'); el.className='block existing'; el.style.left=left+'%'; el.style.width=width+'%'; el.textContent=`${m.debut}-${m.fin}`; modalTimeline.appendChild(el);
    });
  }
}
function clearTimelineExisting(){ Array.from(modalTimeline.querySelectorAll('.block.existing')).forEach(n=>n.remove()); }
function timeToMinutes(t){ if(!t) return 0; const [hh,mm]=t.split(':').map(Number); return hh*60+mm; }

/* ===== Render functions ===== */
function populateFilters(){
  const missions = getMissions(); const uniq = [...new Set(missions.map(m=>m.interimaire))].filter(Boolean);
  filterInterimaire.innerHTML = '<option value="ALL">Tous intérimaires</option>'; uniq.forEach(u=>{ const o=document.createElement('option'); o.value=u; o.textContent=u; filterInterimaire.appendChild(o); });
}

/* Dashboard cards: different for admin and user (Option 1 for user) */
function renderDashboard(){
  dashboardCards.innerHTML = '';
  const missions = getMissions().slice().sort((a,b)=> (a.date+a.debut).localeCompare(b.date+b.debut));
  if(currentUser && currentUser.role === 'USER'){
    // user's missions
    const mine = missions.filter(m => m.userId === currentUser.id && getMissionTimeStatus(m.date) !== 'past');
    const today = new Date().toISOString().slice(0,10);
    const todays = mine.filter(m => m.date === today);
    const next = mine.find(m => m.date >= today) || null;
    const total = mine.length;
    const confirmed = mine.filter(m => m.statut === 'CONFIRME').length;
    const pending = mine.filter(m => m.statut === 'ATTENTE').length;
    // cards
    const c1 = document.createElement('div'); c1.className='card-small card'; c1.innerHTML = `<div class="title">Missions du jour</div><div class="value">${todays.length}</div><div style="color:var(--muted);margin-top:6px">${today}</div>`;
    const c2 = document.createElement('div'); c2.className='card-small card'; c2.innerHTML = `<div class="title">Prochaine mission</div><div class="value">${next? (next.date+' — '+next.debut) : '—'}</div><div style="color:var(--muted);margin-top:6px">${next? next.desc : 'Aucune'}</div>`;
    const c3 = document.createElement('div'); c3.className='card-small card'; c3.innerHTML = `<div class="title">Statut global</div><div class="value">${confirmed} confirmé • ${pending} en attente</div><div style="color:var(--muted);margin-top:6px">Total à venir : ${total}</div>`;
    const wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.gap='12px'; wrap.style.flexWrap='wrap';
    wrap.appendChild(c1); wrap.appendChild(c2); wrap.appendChild(c3);
    dashboardCards.appendChild(wrap);
    dashTitle.textContent = 'Tableau de bord — Mes missions';
    dashSubtitle.textContent = 'Résumé rapide';
  } else {
    // admin dashboard - summary cards
    const all = getMissions();
    const upcoming = all.filter(m => getMissionTimeStatus(m.date) !== 'past');
    const urgent = upcoming.filter(m => getMissionTimeStatus(m.date) === 'urgent').length;
    const confirmed = all.filter(m => m.statut === 'CONFIRME').length;
    const total = all.length;
    const c1 = document.createElement('div'); c1.className='card-small card'; c1.innerHTML = `<div class="title">Missions totales</div><div class="value">${total}</div><div style="color:var(--muted);margin-top:6px">Toutes</div>`;
    const c2 = document.createElement('div'); c2.className='card-small card'; c2.innerHTML = `<div class="title">Missions confirmées</div><div class="value">${confirmed}</div><div style="color:var(--muted);margin-top:6px">Confirmées</div>`;
    const c3 = document.createElement('div'); c3.className='card-small card'; c3.innerHTML = `<div class="title">Missions urgentes (&lt;7j)</div><div class="value">${urgent}</div><div style="color:var(--muted);margin-top:6px">À traiter</div>`;
    const wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.gap='12px'; wrap.style.flexWrap='wrap';
    wrap.appendChild(c1); wrap.appendChild(c2); wrap.appendChild(c3);
    dashboardCards.appendChild(wrap);
    dashTitle.textContent = 'Tableau de bord — Admin';
    dashSubtitle.textContent = 'Vue d’ensemble';
  }
}

/* Render missions list used on dashboard (upcoming for admin / user) */
function renderMissionsView(){
  let all = getMissions().slice().sort((a,b)=> (a.date+a.debut).localeCompare(b.date+b.debut));
  // show upcoming only (not past)
  all = all.filter(m => getMissionTimeStatus(m.date) !== 'past');
  if(currentUser && currentUser.role === 'USER') all = all.filter(m => m.userId === currentUser.id);
  const status = filterStatus.value || 'ALL';
  const inter = filterInterimaire.value || 'ALL';
  const dateFilter = filterDate.value || '';
  const q = (globalSearch.value || '').toLowerCase().trim();
  const filtered = all.filter(m => {
    if(status !== 'ALL' && m.statut !== status) return false;
    if(inter !== 'ALL' && m.interimaire !== inter) return false;
    if(dateFilter && m.date !== dateFilter) return false;
    if(q) return m.interimaire.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.date.includes(q);
    return true;
  });

  let html = '<table><thead><tr><th>Date</th><th>Horaire</th><th>Intérimaire</th><th>Description</th><th>Statut</th><th>Commentaire</th><th></th></tr></thead><tbody>';
  filtered.forEach(m => {
    const statusBadge = m.statut === 'CONFIRME' ? `<span class="badge confirm">Confirmé</span>` :
                        m.statut === 'RESERVE' ? `<span class="badge reserve">Sous réserve</span>` :
                        m.statut === 'INDISPONIBLE' ? `<span class="badge indispo">Indisponible</span>` :
                        `<span class="badge pending">En attente</span>`;
    const comment = m.comment ? (m.comment.length>80 ? m.comment.slice(0,80)+'…' : m.comment) : '';
    const timeClass = getMissionTimeStatus(m.date);
    const rowClass = timeClass === 'urgent' ? 'mission-urgent' : (timeClass === 'nextweek' ? 'mission-nextweek' : (timeClass === 'future' ? 'mission-future' : 'mission-past'));
    let actions = '';
    if(currentUser && currentUser.role === 'USER' && currentUser.id === m.userId && m.statut === 'ATTENTE'){
      actions = `<button class="btn small" data-id="${m.id}" data-action="act">Agir</button>`;
    }
    if(currentUser && currentUser.role === 'ADMIN' && m.statut === 'ATTENTE'){ actions += ` <button class="btn small ghost" data-id="${m.id}" data-action="confirm">Confirmer</button>`; }
    html += `<tr class="${rowClass}">
      <td>${m.date}</td>
      <td>${m.debut} - ${m.fin}</td>
      <td>${m.interimaire}</td>
      <td>${m.desc}</td>
      <td>${statusBadge}</td>
      <td>${comment}</td>
      <td>${actions}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  missionsTable.innerHTML = html;

  missionsTable.querySelectorAll('button[data-action="act"]').forEach(b => b.addEventListener('click', ev => {
    const id = Number(ev.currentTarget.dataset.id); openActionModal(id);
  }));
  missionsTable.querySelectorAll('button[data-action="confirm"]').forEach(b => b.addEventListener('click', ev => {
    const id = Number(ev.currentTarget.dataset.id); confirmMission(id);
  }));
}

/* Admin missions table (upcoming) */
function renderAdminMissions(){
  if(!currentUser) return;
  let all = getMissions().slice().sort((a,b)=> (a.date+a.debut).localeCompare(b.date+b.debut));
  all = all.filter(m => getMissionTimeStatus(m.date) !== 'past');
  if(currentUser.role !== 'ADMIN') all = all.filter(m => m.userId === currentUser.id);
  const status = (mFilterStatus && mFilterStatus.value) || 'ALL';
  const q = (mSearch && mSearch.value || '').toLowerCase().trim();
  const filtered = all.filter(m => {
    if(status !== 'ALL' && m.statut !== status) return false;
    if(q) return m.interimaire.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.date.includes(q);
    return true;
  });

  let html = '<table><thead><tr><th>Date</th><th>Horaire</th><th>Intérimaire</th><th>Description</th><th>Statut</th><th>Commentaire</th><th>Actions</th></tr></thead><tbody>';
  filtered.forEach(m => {
    const statusBadge = m.statut === 'CONFIRME' ? `<span class="badge confirm">Confirmé</span>` :
                        m.statut === 'RESERVE' ? `<span class="badge reserve">Sous réserve</span>` :
                        m.statut === 'INDISPONIBLE' ? `<span class="badge indispo">Indisponible</span>` :
                        `<span class="badge pending">En attente</span>`;
    const comment = m.comment ? (m.comment.length>120 ? m.comment.slice(0,120)+'…' : m.comment) : '';
    html += `<tr>
      <td>${m.date}</td>
      <td>${m.debut} - ${m.fin}</td>
      <td>${m.interimaire}</td>
      <td>${m.desc}</td>
      <td>${statusBadge}</td>
      <td>${comment}</td>
      <td>${currentUser.role === 'ADMIN' ? `<button class="btn ghost small" data-action="edit" data-id="${m.id}">✏️</button><button class="btn small" data-action="del" data-id="${m.id}">🗑️</button>` : ''}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  missionsAdminTable.innerHTML = html;

  missionsAdminTable.querySelectorAll('button[data-action="del"]').forEach(b => b.addEventListener('click', ev => {
    const id = Number(ev.currentTarget.dataset.id); deleteMission(id);
  }));
  missionsAdminTable.querySelectorAll('button[data-action="edit"]').forEach(b => b.addEventListener('click', ev => {
    const id = Number(ev.currentTarget.dataset.id); openModalForEdit(id);
  }));
}

/* History table (past missions) */
function renderHistory(){
  let all = getMissions().slice().sort((a,b)=> (a.date+a.debut).localeCompare(b.date+b.debut));
  all = all.filter(m => getMissionTimeStatus(m.date) === 'past');
  if(currentUser && currentUser.role === 'USER') all = all.filter(m => m.userId === currentUser.id);
  let html = '<table><thead><tr><th>Date</th><th>Horaire</th><th>Intérimaire</th><th>Description</th><th>Statut</th><th>Commentaire</th></tr></thead><tbody>';
  all.forEach(m => {
    const statusBadge = m.statut === 'CONFIRME' ? `<span class="badge confirm">Confirmé</span>` :
                        m.statut === 'RESERVE' ? `<span class="badge reserve">Sous réserve</span>` :
                        m.statut === 'INDISPONIBLE' ? `<span class="badge indispo">Indisponible</span>` :
                        `<span class="badge pending">En attente</span>`;
    const comment = m.comment ? (m.comment.length>120 ? m.comment.slice(0,120)+'…' : m.comment) : '';
    html += `<tr class="mission-past"><td>${m.date}</td><td>${m.debut} - ${m.fin}</td><td>${m.interimaire}</td><td>${m.desc}</td><td>${statusBadge}</td><td>${comment}</td></tr>`;
  });
  html += '</tbody></table>';
  historyTable.innerHTML = html;
}

/* ===== Actions: user action modal ===== */
function openActionModal(missionId){
  pendingActionMissionId = missionId;
  actionModalBack.style.display = 'flex';
  actionSelect.value = 'CONFIRME';
  actionComment.value = '';
  document.getElementById('actionTitle').textContent = 'Action sur la mission';
}
function doActionConfirm(){
  if(!pendingActionMissionId || !currentUser) return;
  const choice = actionSelect.value; const comment = actionComment.value.trim();
  if(choice === 'INDISPONIBLE' && !comment){ alert('Motif obligatoire pour Indisponible'); return; }
  const ms = getMissions(); const idx = ms.findIndex(m => m.id === pendingActionMissionId);
  if(idx === -1) return;
  ms[idx].statut = choice;
  if(choice === 'CONFIRME') ms[idx].acceptedAt = nowISO();
  if(comment) ms[idx].comment = comment;
  setMissions(ms);
  pushLog({ ts: nowISO(), by: currentUser.email, action:'USER_ACTION', missionId: pendingActionMissionId, status:choice, comment });
  actionModalBack.style.display = 'none'; pendingActionMissionId = null; toast('Action enregistrée');
  renderAll();
}

/* Admin quick confirm */
function confirmMission(id){
  const ms = getMissions(); const idx = ms.findIndex(m => m.id === id); if(idx === -1) return;
  ms[idx].statut = 'CONFIRME'; ms[idx].acceptedAt = nowISO(); setMissions(ms); pushLog({ ts: nowISO(), by: currentUser.email, action:'ADMIN_CONFIRM', missionId: id });
  toast('Mission confirmée');
  renderAll();
}

/* Delete mission */
function deleteMission(id){
  if(!confirm('Supprimer cette mission ?')) return;
  let ms = getMissions(); ms = ms.filter(m => m.id !== id); setMissions(ms); pushLog({ ts: nowISO(), by: currentUser.email, action:'DELETE', missionId:id});
  toast('Mission supprimée');
  renderAll();
}

/* ===== Agences & Users rendering ===== */
function renderAgences(){
  const agences = getAgences(); agencesList.innerHTML=''; agencesAdmin.innerHTML='';
  Object.values(agences).forEach(a => {
    const d = document.createElement('div'); d.style.padding='8px 0';
    d.innerHTML = `<div style="font-weight:700">${a.nom}</div><div style="color:var(--muted);font-size:0.9rem">${a.tel} ${a.email? ' • '+a.email:''}</div>`;
    agencesList.appendChild(d);
    const n = document.createElement('div'); n.className='card'; n.style.marginBottom='10px';
    n.innerHTML = `<div style="font-weight:700">${a.nom}</div><div style="color:var(--muted);font-size:0.95rem">${a.tel}<br>${a.email||''}</div>`;
    agencesAdmin.appendChild(n);
  });
}
function renderUsersAdmin(){
  const users = getUsers(); usersAdmin.innerHTML='';
  Object.keys(users).forEach(k => {
    const u = users[k];
    const div = document.createElement('div'); div.className='card'; div.style.marginBottom='8px';
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div><strong>${u.name}</strong><div style="color:var(--muted)">${u.email} ${u.role? ' • '+u.role : ''} ${u.agence? ' • '+u.agence : ''}</div></div>
      <div><button class="btn ghost small" onclick="deleteUser('${u.id}')">Supprimer</button></div>
    </div>`;
    usersAdmin.appendChild(div);
  });
}
function deleteUser(id){ if(!confirm('Supprimer l\'utilisateur ?')) return; const users = getUsers(); delete users[id]; setUsers(users); toast('Utilisateur supprimé'); renderAll(); }

/* ===== Stats & mini chart ===== */
function renderStats(){
  const all = getMissions(); const filtered = currentUser && currentUser.role==='USER' ? all.filter(m => m.userId === currentUser.id) : all;
  const total = filtered.length; const confirmed = filtered.filter(m => m.statut === 'CONFIRME').length; const pending = filtered.filter(m => m.statut === 'ATTENTE').length;
  document.getElementById('statTotal') && (document.getElementById('statTotal').textContent = total);
  document.getElementById('statConfirmed') && (document.getElementById('statConfirmed').textContent = confirmed);
  document.getElementById('statPending') && (document.getElementById('statPending').textContent = pending);
  lastUpdate.textContent = new Date().toLocaleString();
  renderMiniChart(confirmed, pending);
}
function renderMiniChart(confirmed, pending){
  const total = confirmed + pending || 1; const cPerc = Math.round((confirmed/total)*100); const pPerc = 100 - cPerc;
  miniChart.innerHTML = '';
  const svgns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(svgns,'svg');
  svg.setAttribute('viewBox','0 0 200 30'); svg.setAttribute('width','100%'); svg.setAttribute('height','100%');
  const r1 = document.createElementNS(svgns,'rect'); r1.setAttribute('x',8); r1.setAttribute('y',8); r1.setAttribute('width',(184*(cPerc/100)).toString()); r1.setAttribute('height',14); r1.setAttribute('rx',7);
  r1.setAttribute('fill',getComputedStyle(document.documentElement).getPropertyValue('--success').trim()||'#10b981');
  const r2 = document.createElementNS(svgns,'rect'); r2.setAttribute('x',8+(184*(cPerc/100))); r2.setAttribute('y',8); r2.setAttribute('width',(184*(pPerc/100)).toString()); r2.setAttribute('height',14); r2.setAttribute('rx',7);
  r2.setAttribute('fill',getComputedStyle(document.documentElement).getPropertyValue('--warning').trim()||'#f59e0b');
  svg.appendChild(r1); svg.appendChild(r2); miniChart.appendChild(svg);
}

/* ===== Utility: populate filters and selects ===== */
function populateFilters(){
  const missions = getMissions(); const uniq = [...new Set(missions.map(m=>m.interimaire))].filter(Boolean);
  filterInterimaire.innerHTML = '<option value="ALL">Tous intérimaires</option>'; uniq.forEach(u => { const o=document.createElement('option'); o.value=u; o.textContent=u; filterInterimaire.appendChild(o); });
}
function populateAdminAgencesSelect(){
  const agences = getAgences(); newUserAgence.innerHTML = '<option value="">Agence</option>';
  Object.values(agences).forEach(a => { const o=document.createElement('option'); o.value=a.id; o.textContent=a.nom; newUserAgence.appendChild(o); });
}

/* ===== Render all wrapper ===== */
function renderAll(){
  populateFilters(); renderDashboard(); renderMissionsView(); renderAdminMissions(); renderAgences(); renderUsersAdmin(); renderStats(); renderHistory();
}

/* ===== Debounce ===== */
function debounce(fn, wait){ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), wait); }; }

/* ===== Start ===== */
init();
renderAll();

/* expose deleteUser to window for inline handlers */
window.deleteUser = deleteUser;

