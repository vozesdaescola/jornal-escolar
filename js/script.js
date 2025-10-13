/* js/script.js
   Sistema "serverless" usando jsonbin.io + listagem dos arquivos em /uploads/ no GitHub Pages.
   Copie este arquivo para /js/script.js do seu repositório.
*/

/* ----------------- CONFIGURAÇÃO ----------------- */
const BIN_ID = "68ebfca3d0ea881f409f75d5";
const BIN_MASTER_KEY = "$2a$10$2Qc8dV9z9vAirV.69wNvgefyCBXpg5c/T/coV1YzxBWLGJhQBOmP.";

// Repo para listar uploads
const GITHUB_OWNER = "vozesdaescola";
const GITHUB_REPO = "jornal-escolar";
const GITHUB_UPLOADS_PATH = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/uploads`;
// URL base pública para arquivos via GitHub Pages
const UPLOADS_BASE_URL = `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}/uploads/`;

/* ----------------- USUÁRIOS (simples) -----------------
   Você pode editar essa lista: apenas emails listados aqui podem "logar".
   Se quiser permitir logins dinâmicos, posso adaptar.
*/
const users = [
  { email: "admin@vozesdaescola.org", name: "Administrador", role: "admin" },
  { email: "editor@vozesdaescola.org", name: "Editor", role: "editor" },
  { email: "membro@escola.org", name: "Membro", role: "member" }
];

let currentUser = null;

/* ----------------- HELPERS para jsonbin.io ----------------- */
async function fetchBin() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": BIN_MASTER_KEY }
    });
    if (!res.ok) throw new Error(`Erro ao ler bin: ${res.status}`);
    const j = await res.json();
    return j.record || { pauta: [], kanban: [], submissoes: [], forum: [] };
  } catch (err) {
    console.error("fetchBin error:", err);
    // Retorna estrutura vazia como fallback
    return { pauta: [], kanban: [], submissoes: [], forum: [] };
  }
}

async function saveBin(payload) {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": BIN_MASTER_KEY,
        "X-Bin-Versioning": "false"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Erro ao salvar bin: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("saveBin error:", err);
    throw err;
  }
}

/* ----------------- LOGIN / SESSÃO ----------------- */
function openLogin() {
  document.getElementById("loginModal").style.display = "flex";
}
function closeLogin() {
  document.getElementById("loginModal").style.display = "none";
}

function doLogin() {
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === email);
  if (!user) {
    alert("Usuário não encontrado (use um email cadastrado).");
    return;
  }
  currentUser = user;
  closeLogin();
  refreshUI();
}

function logout() {
  currentUser = null;
  refreshUI();
}

/* ----------------- UI REFRESH ----------------- */
function refreshUI() {
  document.getElementById("userName").innerText = currentUser ? currentUser.name : "Convidado";
  document.getElementById("userRole").innerText = currentUser ? currentUser.role : "Não autenticado";
  document.getElementById("userAvatar").src = currentUser ? `https://picsum.photos/seed/${encodeURIComponent(currentUser.email)}/200/200` : "https://picsum.photos/seed/default/200/200";

  // Atualiza todas as seções
  renderPauta();
  renderTasks();
  renderSubs();
  renderForum();
  renderFiles();
}

/* ----------------- NAVEGAÇÃO ----------------- */
function showSection(id) {
  document.querySelectorAll("main section").forEach(s => s.style.display = "none");
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
}

/* ----------------- PAUTA ----------------- */
async function addPauta() {
  if (!currentUser) return alert("Login necessário");
  const title = document.getElementById("pautaTitle").value.trim();
  const date = document.getElementById("pautaDate").value;
  if (!title || !date) return alert("Preencha título e data.");

  const data = await fetchBin();
  data.pauta = data.pauta || [];
  data.pauta.push({ id: Date.now(), title, date, owner: currentUser.email });
  await saveBin(data);
  document.getElementById("pautaTitle").value = "";
  document.getElementById("pautaDate").value = "";
  renderPauta();
}

async function renderPauta() {
  const data = await fetchBin();
  const list = (data.pauta || []).slice().sort((a,b)=> (a.date > b.date?1:-1));
  document.getElementById("pautaList").innerHTML = list.length ? list.map(p => `
    <div style="margin:6px 0">
      <strong>${escapeHtml(p.title)}</strong> — <span style="color:gray">${p.date}</span> <span style="font-size:12px;color:#9aa">${p.owner}</span>
      ${currentUser && (currentUser.role === "admin") ? `<button style="float:right" onclick="removePauta(${p.id})">Remover</button>` : ""}
    </div>
  `).join("") : "<em class='small'>nenhuma pauta</em>";
}

async function removePauta(id) {
  if (!currentUser || currentUser.role !== "admin") return alert("Apenas admin");
  const data = await fetchBin();
  data.pauta = (data.pauta || []).filter(p => p.id !== id);
  await saveBin(data);
  renderPauta();
}

/* ----------------- KANBAN (tarefas) ----------------- */
async function addTask() {
  if (!currentUser) return alert("Login necessário");
  const title = document.getElementById("taskTitle").value.trim();
  const status = document.getElementById("taskStatus").value;
  if (!title) return alert("Preencha o título da tarefa.");
  const data = await fetchBin();
  data.kanban = data.kanban || [];
  data.kanban.push({ id: Date.now(), title, status, owner: currentUser.email });
  await saveBin(data);
  document.getElementById("taskTitle").value = "";
  renderTasks();
}

async function renderTasks() {
  const data = await fetchBin();
  const tasks = data.kanban || [];
  if (!tasks.length) {
    document.getElementById("taskList").innerHTML = "<em class='small'>nenhuma tarefa</em>";
    return;
  }
  document.getElementById("taskList").innerHTML = tasks.map(t => `
    <div style="margin:6px 0">
      [${escapeHtml(t.status)}] <strong>${escapeHtml(t.title)}</strong> <span style="font-size:12px;color:#9aa">(${t.owner})</span>
      ${currentUser && (currentUser.role === "admin" || currentUser.email === t.owner) ? `
        <button style="margin-left:8px" onclick="changeTaskStatus(${t.id}, 'todo')">todo</button>
        <button style="margin-left:4px" onclick="changeTaskStatus(${t.id}, 'doing')">doing</button>
        <button style="margin-left:4px" onclick="changeTaskStatus(${t.id}, 'done')">done</button>
        <button style="margin-left:8px" onclick="removeTask(${t.id})">Remover</button>` : ""}
    </div>
  `).join("");
}

async function changeTaskStatus(id, newStatus) {
  if (!currentUser) return alert("Login necessário");
  const data = await fetchBin();
  data.kanban = (data.kanban || []).map(t => t.id === id ? {...t, status: newStatus} : t);
  await saveBin(data);
  renderTasks();
}

async function removeTask(id) {
  if (!currentUser) return alert("Login necessário");
  const data = await fetchBin();
  data.kanban = (data.kanban || []).filter(t => t.id !== id);
  await saveBin(data);
  renderTasks();
}

/* ----------------- SUBMISSÕES ----------------- */
async function addSub() {
  if (!currentUser) return alert("Login necessário");
  const title = document.getElementById("subTitle").value.trim();
  if (!title) return alert("Preencha o título da submissão.");
  const data = await fetchBin();
  data.submissoes = data.submissoes || [];
  data.submissoes.push({ id: Date.now(), title, author: currentUser.email, status: "pendente" });
  await saveBin(data);
  document.getElementById("subTitle").value = "";
  renderSubs();
}

async function renderSubs() {
  const data = await fetchBin();
  const subs = data.submissoes || [];
  document.getElementById("subList").innerHTML = subs.length ? subs.map(s=>`
    <div style="margin:6px 0">
      <strong>${escapeHtml(s.title)}</strong> — <em>${s.status}</em> <span style="color:#9aa">${s.author}</span>
      ${(currentUser && currentUser.role === "admin") ? `<button style="float:right" onclick="approveSub(${s.id})">Aprovar</button>` : ""}
    </div>`).join("") : "<em class='small'>nenhuma submissão</em>";
}

async function approveSub(id) {
  if (!currentUser || currentUser.role !== "admin") return alert("Apenas admin");
  const data = await fetchBin();
  data.submissoes = (data.submissoes || []).map(s => s.id === id ? {...s, status: "aprovado"} : s);
  await saveBin(data);
  renderSubs();
}

/* ----------------- FÓRUM ----------------- */
async function addForum() {
  if (!currentUser) return alert("Login necessário");
  const message = document.getElementById("forumMsg").value.trim();
  if (!message) return alert("Mensagem vazia");
  const data = await fetchBin();
  data.forum = data.forum || [];
  data.forum.push({ id: Date.now(), author: currentUser.email, message, created_at: new Date().toISOString() });
  await saveBin(data);
  document.getElementById("forumMsg").value = "";
  renderForum();
}

async function renderForum() {
  const data = await fetchBin();
  const posts = (data.forum || []).slice().sort((a,b)=> b.id - a.id);
  document.getElementById("forumList").innerHTML = posts.length ? posts.map(p => `
    <div style="margin:8px 0">
      <b>${escapeHtml(p.author)}</b> <span style="color:gray;font-size:12px">— ${new Date(p.created_at).toLocaleString()}</span>
      <div>${escapeHtml(p.message)}</div>
      ${(currentUser && (currentUser.role === "admin" || currentUser.email === p.author)) ? `<button onclick="removeForum(${p.id})">Remover</button>` : ""}
    </div>
  `).join("") : "<em class='small'>nenhuma mensagem</em>";
}

async function removeForum(id) {
  if (!currentUser) return alert("Login necessário");
  const data = await fetchBin();
  data.forum = (data.forum || []).filter(p => p.id !== id);
  await saveBin(data);
  renderForum();
}

/* ----------------- ARQUIVOS - lista dinâmica via GitHub API ----------------- */
async function renderFiles() {
  try {
    const res = await fetch(GITHUB_UPLOADS_PATH);
    if (!res.ok) {
      // fallback: se o path não existir, mostra mensagem genérica
      document.getElementById("fileList").innerHTML = "<em class='small'>nenhum arquivo disponível</em>";
      return;
    }
    const list = await res.json(); // array de objetos {name, path, download_url, ...}
    if (!Array.isArray(list) || !list.length) {
      document.getElementById("fileList").innerHTML = "<em class='small'>nenhum arquivo</em>";
      return;
    }
    document.getElementById("fileList").innerHTML = list.map(item => `
      <div style="margin:6px 0">
        <strong>${escapeHtml(item.name)}</strong><br/>
        <a href="${UPLOADS_BASE_URL + encodeURIComponent(item.name)}" target="_blank">Abrir arquivo</a>
      </div>
    `).join("");
  } catch (err) {
    console.error("renderFiles error:", err);
    document.getElementById("fileList").innerHTML = "<em class='small'>erro ao listar arquivos</em>";
  }
}

/* ----------------- UTILIDADES ----------------- */
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ----------------- INICIALIZAÇÃO ----------------- */
// Inicial: atualiza UI e mostra dashboard
refreshUI();
showSection("dashboard");

/* ----------------- Expor funções ao escopo global para botão onclick no HTML ----------------- */
window.openLogin = openLogin;
window.closeLogin = closeLogin;
window.doLogin = doLogin;
window.logout = logout;
window.showSection = showSection;

window.addPauta = addPauta;
window.addTask = addTask;
window.addSub = addSub;
window.addForum = addForum;

window.renderPauta = renderPauta;
window.renderTasks = renderTasks;
window.renderSubs = renderSubs;
window.renderForum = renderForum;
window.renderFiles = renderFiles;

/* Fim do arquivo */
