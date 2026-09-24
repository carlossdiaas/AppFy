/**
 * usuarios.js — Cadastro de usuários/operadores (com foto) e relatório individual
 */
let modalAberto = null;
let fotoUsuarioTemp = '';
const SENHA_PAGINA_USUARIOS = '1234';
let paginaUsuariosDesbloqueada = false;

document.addEventListener('DOMContentLoaded', () => {
  protegerPagina(() => {
    renderShell('usuarios.html', 'Usuários');
    renderPage();
  });
});

function fecharModal() { if (modalAberto) { modalAberto.remove(); modalAberto = null; } }
function abrirModal(html, wide = false) {
  fecharModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box" style="${wide ? 'max-width:640px' : ''}">${html}</div>`;
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) fecharModal(); });
  document.body.appendChild(overlay);
  modalAberto = overlay;
  const first = overlay.querySelector('[data-autofocus]');
  if (first) setTimeout(() => first.focus(), 30);
  return overlay.querySelector('.modal-box');
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

function renderPage() {
  const content = document.getElementById('page-content');
  if (!paginaUsuariosDesbloqueada) {
    content.innerHTML = paginaBloqueadaHTML('Usuários', 'senha-pagina-usuarios', 'desbloquearPaginaUsuarios');
    const campo = document.getElementById('senha-pagina-usuarios');
    if (campo) setTimeout(() => campo.focus(), 30);
    return;
  }
  const usuarios = DB.list('usuarios').slice().sort((a, b) => a.nome.localeCompare(b.nome));

  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-slate-500">${usuarios.length} usuário(s) cadastrado(s)</p>
      <button class="btn btn-success" onclick="abrirUsuarioModal()">+ Novo usuário</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      ${usuarios.map((u) => usuarioCard(u)).join('') || `<p class="text-slate-400 text-sm col-span-full text-center py-10">Nenhum usuário cadastrado ainda. Cadastre quem trabalha no caixa pra saber quem fez cada venda, sangria e fechamento — e poder selecionar em vez de digitar toda vez.</p>`}
    </div>
  `;
}

function desbloquearPaginaUsuarios() {
  const senha = document.getElementById('senha-pagina-usuarios').value;
  if (senha === SENHA_PAGINA_USUARIOS) { paginaUsuariosDesbloqueada = true; renderPage(); }
  else toast('Senha incorreta', 'error');
}

function usuarioCard(u) {
  const foto = u.foto
    ? `<img src="${u.foto}" class="w-16 h-16 rounded-full object-cover border border-[--color-border]" />`
    : `<div class="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold text-xl">${u.nome[0].toUpperCase()}</div>`;
  return `
    <div class="card p-4 flex flex-col items-center text-center gap-2 cursor-pointer hover:border-[--color-primary]" onclick='abrirDetalheUsuario(${JSON.stringify(u.id)})'>
      ${foto}
      <p class="font-medium truncate w-full">${u.nome}</p>
    </div>`;
}

// ---------------- cadastro/edição de usuário ----------------
function abrirUsuarioModal(id) {
  const u = id ? DB.get('usuarios', id) : null;
  fotoUsuarioTemp = u?.foto || '';
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">${u ? 'Editar usuário' : 'Novo usuário'}</h3></div>
    <div class="p-4 space-y-3">
      <div class="flex items-center gap-3">
        <img id="foto-usuario-preview" src="${u?.foto || ''}" class="w-16 h-16 rounded-full object-cover bg-slate-100 border border-[--color-border] ${u?.foto ? 'cursor-pointer' : ''} ${u?.foto ? '' : 'hidden'}" onclick="if(this.src) abrirFotoTelaCheia(this.src)" />
        <div id="foto-usuario-placeholder" class="w-16 h-16 rounded-full bg-slate-100 border border-dashed border-[--color-border] flex items-center justify-center text-slate-400 text-xs ${u?.foto ? 'hidden' : ''}">foto</div>
        <div>
          <label class="btn btn-ghost text-xs cursor-pointer">
            Enviar foto
            <input id="f-foto" type="file" accept="image/*" class="hidden" onchange="previewFotoUsuario(event)" />
          </label>
          <p class="text-[11px] text-slate-400 mt-1">Opcional. JPG/PNG.</p>
        </div>
      </div>
      <div><label class="text-xs text-slate-500">Nome</label><input id="f-nome" data-autofocus class="input mt-1" value="${u?.nome || ''}" /></div>
      <div class="flex gap-2 pt-2">
        <button class="btn btn-primary flex-1" onclick='salvarUsuario(${JSON.stringify(u?.id || null)})'>Salvar</button>
        <button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
      </div>
    </div>
  `);
  ativarEnterSubmit(modalBox, () => salvarUsuario(u?.id || null));
}

function previewFotoUsuario(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    fotoUsuarioTemp = reader.result;
    const img = document.getElementById('foto-usuario-preview');
    img.src = fotoUsuarioTemp;
    img.classList.remove('hidden');
    img.classList.add('cursor-pointer');
    img.onclick = () => abrirFotoTelaCheia(fotoUsuarioTemp);
    document.getElementById('foto-usuario-placeholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

function salvarUsuario(id) {
  const nomeAntigo = id ? DB.get('usuarios', id)?.nome : null;
  const nome = document.getElementById('f-nome').value.trim();
  if (!nome) { toast('Informe o nome do usuário', 'error'); return; }

  const dados = { nome, foto: fotoUsuarioTemp || '' };
  if (id) DB.update('usuarios', id, dados);
  else DB.insert('usuarios', dados);

  // se o nome mudou, atualiza os registros antigos de caixa/sangria que
  // usavam o nome anterior, pra não perder o vínculo do histórico
  if (id && nomeAntigo && nomeAntigo !== nome) {
    atualizarNomeOperadorEmTudo(nomeAntigo, nome);
  }

  fotoUsuarioTemp = '';
  fecharModal();
  toast('Usuário salvo', 'success');
  renderPage();
}

function atualizarNomeOperadorEmTudo(nomeAntigo, nomeNovo) {
  DB.list('caixa').forEach((c) => {
    let mudou = false;
    const patch = {};
    if (c.operadorAbertura === nomeAntigo) { patch.operadorAbertura = nomeNovo; mudou = true; }
    if (c.operadorFechamento === nomeAntigo) { patch.operadorFechamento = nomeNovo; mudou = true; }
    if ((c.movimentos || []).some((m) => m.operador === nomeAntigo)) {
      patch.movimentos = c.movimentos.map((m) => (m.operador === nomeAntigo ? { ...m, operador: nomeNovo } : m));
      mudou = true;
    }
    if (mudou) DB.update('caixa', c.id, patch);
  });
  const cfg = DB.getConfig();
  if ((cfg.operadores || []).includes(nomeAntigo)) {
    DB.setConfig({ ...cfg, operadores: cfg.operadores.map((o) => (o === nomeAntigo ? nomeNovo : o)) });
  }
}

function excluirUsuario(id) {
  const u = DB.get('usuarios', id);
  if (confirmDialog(`Excluir o usuário ${u.nome}? O histórico de vendas/caixa dele continua registrado, só o cadastro é removido.`)) {
    DB.remove('usuarios', id);
    fecharModal();
    toast('Usuário excluído', 'warning');
    renderPage();
  }
}

// ---------------- detalhe / relatório individual ----------------
function abrirDetalheUsuario(id) {
  const u = DB.get('usuarios', id);
  const caixas = DB.list('caixa');
  const vendas = DB.list('vendas');

  const caixasAbertos = caixas.filter((c) => c.operadorAbertura === u.nome);
  const caixaIds = caixasAbertos.map((c) => c.id);
  const vendasDoUsuario = vendas.filter((v) => caixaIds.includes(v.caixaId)).sort((a, b) => new Date(b.data) - new Date(a.data));
  const totalVendido = vendasDoUsuario.reduce((s, v) => s + v.total, 0);
  const sangriasDoUsuario = caixas.flatMap((c) => c.movimentos || []).filter((m) => m.operador === u.nome && m.tipo === 'sangria');
  const totalSangrias = sangriasDoUsuario.reduce((s, m) => s + m.valor, 0);
  const fechamentosDoUsuario = caixas.filter((c) => c.operadorFechamento === u.nome && c.diferenca != null);
  const diferencaAcumulada = fechamentosDoUsuario.reduce((s, c) => s + c.diferenca, 0);

  const foto = u.foto
    ? `<img src="${u.foto}" class="w-20 h-20 rounded-full object-cover border border-[--color-border] cursor-pointer" onclick="abrirFotoTelaCheia('${u.foto}')" />`
    : `<div class="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold text-2xl">${u.nome[0].toUpperCase()}</div>`;

  abrirModal(`
    <div class="p-4 border-b border-[--color-border] flex items-center gap-3">
      ${foto}
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-base truncate">${u.nome}</h3>
        <p class="text-xs text-slate-400">${caixasAbertos.length} caixa(s) aberto(s) · ${vendasDoUsuario.length} venda(s)</p>
      </div>
    </div>
    <div class="p-4">
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="card p-3"><p class="text-xs text-slate-500">Total vendido</p><p class="text-lg font-bold text-[--color-primary]">${fmtBRL(totalVendido)}</p></div>
        <div class="card p-3"><p class="text-xs text-slate-500">Sangrias registradas</p><p class="text-lg font-bold">${sangriasDoUsuario.length} <span class="text-xs font-normal text-slate-400">(${fmtBRL(totalSangrias)})</span></p></div>
        <div class="card p-3"><p class="text-xs text-slate-500">Fechamentos de caixa</p><p class="text-lg font-bold">${fechamentosDoUsuario.length}</p></div>
        <div class="card p-3"><p class="text-xs text-slate-500">Diferença acumulada</p><p class="text-lg font-bold ${diferencaAcumulada < 0 ? 'text-[--color-danger]' : diferencaAcumulada > 0 ? 'text-[--color-success]' : ''}">${fmtBRL(diferencaAcumulada)}</p></div>
      </div>

      <p class="text-xs font-semibold text-slate-500 mb-1.5">Últimas vendas</p>
      <div class="max-h-56 overflow-y-auto space-y-1.5 mb-4">
        ${vendasDoUsuario.slice(0, 30).map((v) => `
          <div class="flex justify-between text-sm bg-slate-50 rounded-lg px-3 py-1.5">
            <span>${fmtDataHora(v.data)}</span>
            <span class="font-medium tabular-nums">${fmtBRL(v.total)}</span>
          </div>`).join('') || `<p class="text-sm text-slate-400 text-center py-4">Nenhuma venda registrada ainda</p>`}
      </div>

      <div class="flex gap-2">
        <button class="btn btn-ghost flex-1" onclick='abrirUsuarioModal(${JSON.stringify(u.id)})'>Editar</button>
        <button class="text-[--color-danger] hover:underline text-sm px-3" onclick='excluirUsuario(${JSON.stringify(u.id)})'>Excluir</button>
      </div>
    </div>
  `, true);
}
