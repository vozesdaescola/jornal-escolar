// Usuários fixos (apenas você cria contas)
const users = [
  { email:'admin@jornal.com', name:'Admin', role:'Administrador', avatar:'' },
  { email:'editor@jornal.com', name:'Editor', role:'Editor', avatar:'' }
];

let currentUser = null;

// Login/Logout
function openLogin(){ document.getElementById('loginModal').style.display='flex'; }
function closeLogin(){ document.getElementById('loginModal').style.display='none'; }
function doLogin(){
  const email = document.getElementById('loginEmail').value.trim();
  const user = users.find(u=>u.email===email);
  if(!user){ alert('Usuário não encontrado'); return; }
  currentUser = user;
  refreshUI();
  closeLogin();
}
function logout(){ currentUser=null; refreshUI(); }

// Atualizar UI
function refreshUI(){
  document.getElementById('userName').innerText = currentUser ? currentUser.name : 'Convidado';
  document.getElementById('userRole').innerText = currentUser ? currentUser.role : 'Não autenticado';
  document.getElementById('userAvatar').src = currentUser ? 'https://picsum.photos/seed/'+currentUser.email+'/200/200' : 'https://picsum.photos/seed/guest/200/200';
  renderPauta(); renderTasks(); renderSubs(); renderFiles(); renderForum();
}

// Navegação
function showSection(id){
  document.querySelectorAll('main section').forEach(s=>s.style.display='none');
  document.getElementById(id).style.display='block';
}

// Pauta
function addPauta(){
  if(!currentUser) return alert('Login necessário');
  const title = document.getElementById('pautaTitle').value;
  const date = document.getElementById('pautaDate').value;
  let pauta = JSON.parse(localStorage.getItem('pauta')||'[]');
  pauta.push({title,date,owner:currentUser.email});
  localStorage.setItem('pauta', JSON.stringify(pauta));
  renderPauta();
}
function renderPauta(){
  let pauta = JSON.parse(localStorage.getItem('pauta')||'[]');
  document.getElementById('pautaList').innerHTML = pauta.map(p=>`<div>${p.date} — ${p.title} (${p.owner})</div>`).join('');
}

// Kanban
function addTask(){
  if(!currentUser) return alert('Login necessário');
  const title = document.getElementById('taskTitle').value;
  const status = document.getElementById('taskStatus').value;
  let tasks = JSON.parse(localStorage.getItem('tasks')||'[]');
  tasks.push({title,status,owner:currentUser.email});
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
}
function renderTasks(){
  let tasks = JSON.parse(localStorage.getItem('tasks')||'[]');
  document.getElementById('taskList').innerHTML = tasks.map(t=>`<div>[${t.status}] ${t.title} (${t.owner})</div>`).join('');
}

// Submissões
function addSub(){
  if(!currentUser) return alert('Login necessário');
  const title = document.getElementById('subTitle').value;
  let subs = JSON.parse(localStorage.getItem('subs')||'[]');
  subs.push({title,author:currentUser.email,status:'pendente'});
  localStorage.setItem('subs', JSON.stringify(subs));
  renderSubs();
}
function renderSubs(){
  let subs = JSON.parse(localStorage.getItem('subs')||'[]');
  document.getElementById('subList').innerHTML = subs.map(s=>`<div>${s.title} — ${s.status} (${s.author})</div>`).join('');
}

// Arquivos
function renderFiles(){
  // Lista arquivos da pasta /uploads/ do GitHub Pages
  const arquivos = [
    {name:'arquivo1.pdf', desc:'Documento 1'},
    {name:'arquivo2.png', desc:'Imagem 2'}
  ];
  document.getElementById('fileList').innerHTML = arquivos.map(f=>`
    <div style="margin:6px 0">
      <strong>${f.name}</strong><br/>
      <em>${f.desc||''}</em><br/>
      <a href="uploads/${f.name}" target="_blank">Abrir arquivo</a>
    </div>
  `).join('');
}

// Fórum
function addForum(){
  if(!currentUser) return alert('Login necessário');
  const message = document.getElementById('forumMsg').value;
  let forum = JSON.parse(localStorage
