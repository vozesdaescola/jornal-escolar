/* =========================================================
   VOZES DA ESCOLA — script.js (modo híbrido local + JSONBin)
   ========================================================= */

const BIN_ID = "68ebfca3d0ea881f409f75d5";
const SECRET_KEY = "$2a$10$2Qc8dV9z9vAirV.69wNvgefyCBXpg5c/T/coV1YzxBWLGJhQBOmP.";

// Dados locais (cache)
let db = JSON.parse(localStorage.getItem("vozesData") || `{
  "pauta": [],
  "kanban": [],
  "submissoes": [],
  "forum": [],
  "arquivos": []
}`);

let currentUser = null;

/* =========================================================
   Login simples
   ========================================================= */
function openLogin() {
  document.getElementById('loginModal').style.display = 'flex';
}
function closeLogin() {
  document.getElementById('loginModal').style.display = 'none';
}
function doLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const knownUsers = {
    "admin@vozes.com": { name: "Administrador", role: "Editor-chefe" },
    "rep@vozes.com": { name: "Repórter", role: "Membro" }
  };
  if (!knownUsers[email]) return alert("Usuário não encontrado.");
  currentUser = { email, ...knownUsers[email] };
  closeLogin();
  refreshUI();
}
function logout() {
  currentUser = null;
  refreshUI();
}

/* =========================================================
   Armazenamento local + sincronização
   ========================================================= */
function saveLocal() {
  localStorage.setItem("vozesData", JSON.stringify(db));
}

async function syncToCloud() {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": SECRET_KEY,
        "X-Bin-Versioning": "false"
      },
      body: JSON.stringify(db)
    });
  } catch (e) {
    console.warn("Falha ao sincronizar com nuvem:", e);
  }
}

async function syncFromCloud() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": SECRET_KEY }
    });
    const json = await res.json();
    db = json.record;
    saveLocal();
  } catch (e) {
    console.warn("Falha ao obter dados da nuvem:", e);
  }
}

/* =========================================================
   UI
   ========================================================= */
function refreshUI() {
  document.getElementById('userName').innerText = currentUser ? currentUser.name : "Convidado";
  document.getElementById('userRole').innerText = currentUser ? currentUser.role : "Não autenticado";
  document.getElementById('userAvatar').src = currentUser
    ? `https://picsum.photos/seed/${currentUser.email}/100/100`
    : "https://picsum.photos/seed/default/100/100";

  renderPauta();
  renderTasks();
  renderSubs();
  renderFiles();
  renderForum();
}

/* =========================================================
   Pauta
   ========================================================= */
function addPauta() {
  if (!currentUser) return alert("Login necessário.");
  const title = document.getElementById('pautaTitle').value;
  const date = document.getElementById('pautaDate').value;
  db.pauta.push({ title, date, owner: currentUser.email });
  saveLocal();
  syncToCloud();
  renderPauta();
}
function renderPauta() {
  const list = document.getElementById('pautaList');
  list.innerHTML = db.pauta.map(p => `<div>${p.date} — ${p.title} (${p.owner})</div>`).join('');
}

/* =========================================================
   Kanban
   ========================================================= */
function addTask() {
  if (!currentUser) return alert("Login necessário.");
  const title = document.getElementById('taskTitle').value;
  const status = document.getElementById('taskStatus').value;
  db.kanban.push({ title, status, owner: currentUser.email });
  saveLocal();
  syncToCloud();
  renderTasks();
}
function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = db.kanban.map(t => `<div>[${t.status}] ${t.title} (${t.owner})</div>`).join('');
}

/* =========================================================
   Submissões
   ========================================================= */
function addSub() {
  if (!currentUser) return alert("Login necessário.");
  const title = document.getElementById('subTitle').value;
  db.submissoes.push({ title, author: currentUser.email, status: "pendente" });
  saveLocal();
  syncToCloud();
  renderSubs();
}
function renderSubs() {
  const list = document.getElementById('subList');
  list.innerHTML = db.submissoes.map(s => `<div>${s.title} — ${s.status} (${s.author})</div>`).join('');
}

/* =========================================================
   Arquivos (manual via uploads/)
   ========================================================= */
function addFile() {
  if (!currentUser) return alert("Login necessário.");
  const name = document.getElementById('fileName').value;
  const desc = document.getElementById('fileDesc').value;
  const file = document.getElementById('fileInput').files[0];
  if (!file) return alert("Selecione um arquivo.");
  db.arquivos.push({ name, desc, file: file.name, by: currentUser.email });
  saveLocal();
  syncToCloud();
  renderFiles();
}
function renderFiles() {
  const list = document.getElementById('fileList');
  list.innerHTML = db.arquivos.map(f => `
    <div style="margin:6px 0">
      <strong>${f.name || f.file}</strong><br/>
      <em>${f.desc || ''}</em><br/>
      <a href="uploads/${f.file}" target="_blank">Abrir arquivo</a><br/>
      <span style="font-size:12px;color:gray">por ${f.by}</span>
    </div>
  `).join('');
}

/* =========================================================
   Fórum
   ========================================================= */
function addForum() {
  if (!currentUser) return alert("Login necessário.");
  const msg = document.getElementById('forumMsg').value;
  db.forum.unshift({ author: currentUser.email, message: msg, time: new Date().toLocaleString() });
  saveLocal();
  syncToCloud();
  renderForum();
}
function renderForum() {
  const list = document.getElementById('forumList');
  list.innerHTML = db.forum.map(m => `<div><b>${m.author}</b>: ${m.message}<br><small>${m.time}</small></div>`).join('');
}

/* =========================================================
   Navegação
   ========================================================= */
function showSection(id) {
  document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

/* =========================================================
   Inicialização
   ========================================================= */
(async function init() {
  await syncFromCloud();
  refreshUI();
  showSection('dashboard');
})();
