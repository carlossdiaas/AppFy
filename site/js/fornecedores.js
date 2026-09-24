/**
 * fornecedores.js — Cadastro de fornecedores e histórico de compras
 */
let filtroFornecedorTexto = '';
let modalAberto = null;

document.addEventListener('DOMContentLoaded', () => {
  protegerPagina(() => {
    renderShell('fornecedores.html', 'Fornecedores');
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
  const fornecedores = DB.list('fornecedores');
  const entradas = DB.list('entradas');
  const filtrados = fornecedores.filter((f) => f.nome.toLowerCase().includes(filtroFornecedorTexto.toLowerCase()));

  content.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      ${statCardIcon('users', 'blue', 'Fornecedores cadastrados', fornecedores.length)}
      ${statCardIcon('box', 'green', 'Entradas de mercadoria registradas', entradas.length)}
    </div>

    <div class="flex items-center gap-2 mb-3">
      <input class="input max-w-xs" placeholder="Buscar fornecedor…" value="${filtroFornecedorTexto}" oninput="filtroFornecedorTexto=this.value; renderPage()" />
      <div class="flex-1"></div>
      <button class="btn btn-success" onclick="abrirFornecedorModal()">+ Novo fornecedor</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${filtrados.map((f) => fornecedorCard(f, entradas)).join('') || `<p class="text-slate-400 text-sm col-span-full text-center py-10">Nenhum fornecedor cadastrado ainda.</p>`}
    </div>
  `;
}

function fornecedorCard(f, entradas) {
  const comprasDele = entradas.filter((e) => e.fornecedor === f.nome);
  const totalComprado = comprasDele.reduce((s, e) => s + e.quantidade * e.custoUnit, 0);
  return `
    <div class="card p-4 flex flex-col gap-2">
      <div class="min-w-0">
        <p class="font-medium truncate">${f.nome}</p>
        <p class="text-xs text-slate-400 truncate">${f.telefone || 'sem telefone'}${f.cnpj ? ' · ' + f.cnpj : ''}</p>
      </div>
      <p class="text-xs text-slate-500 line-clamp-2">${f.endereco || 'Endereço não informado'}</p>
      <div class="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-[--color-border]">
        <span>${comprasDele.length} entrada(s)</span>
        <span class="font-medium">${fmtBRL(totalComprado)}</span>
      </div>
      <div class="flex gap-2 pt-1">
        <button class="btn btn-ghost flex-1 text-xs" onclick='abrirHistoricoFornecedor(${JSON.stringify(f.id)})'>Histórico</button>
        <button class="btn btn-ghost text-xs" onclick='abrirFornecedorModal(${JSON.stringify(f.id)})'>Editar</button>
        <button class="text-slate-400 hover:text-[--color-danger] text-xs px-1" onclick='excluirFornecedor(${JSON.stringify(f.id)})'>✕</button>
      </div>
    </div>`;
}

function abrirFornecedorModal(id) {
  const f = id ? DB.get('fornecedores', id) : null;
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">${f ? 'Editar fornecedor' : 'Novo fornecedor'}</h3></div>
    <div class="p-4 space-y-3">
      <div><label class="text-xs text-slate-500">Nome / Razão social</label><input id="f-nome" data-autofocus class="input mt-1" value="${f?.nome || ''}" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Telefone</label><input id="f-telefone" class="input mt-1" value="${f?.telefone || ''}" /></div>
        <div><label class="text-xs text-slate-500">CNPJ</label><input id="f-cnpj" class="input mt-1" value="${f?.cnpj || ''}" /></div>
      </div>
      <div><label class="text-xs text-slate-500">Endereço</label>
        <textarea id="f-endereco" class="input mt-1" rows="2">${f?.endereco || ''}</textarea>
      </div>
      <div class="flex gap-2 pt-2">
        <button class="btn btn-primary flex-1" onclick='salvarFornecedor(${JSON.stringify(f?.id || null)})'>Salvar</button>
        <button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
      </div>
    </div>
  `);
  ativarEnterSubmit(modalBox, () => salvarFornecedor(f?.id || null));
}

function salvarFornecedor(id) {
  const nome = document.getElementById('f-nome').value.trim();
  const telefone = document.getElementById('f-telefone').value.trim();
  const cnpj = document.getElementById('f-cnpj').value.trim();
  const endereco = document.getElementById('f-endereco').value.trim();
  if (!nome) { toast('Informe o nome do fornecedor', 'error'); return; }

  const dados = { nome, telefone, cnpj, endereco };
  if (id) DB.update('fornecedores', id, dados);
  else DB.insert('fornecedores', dados);

  fecharModal();
  toast('Fornecedor salvo', 'success');
  renderPage();
}

function excluirFornecedor(id) {
  if (confirmDialog('Excluir este fornecedor? O histórico de entradas continua registrado, só o cadastro é removido.')) {
    DB.remove('fornecedores', id);
    renderPage();
    toast('Fornecedor excluído', 'warning');
  }
}

function abrirHistoricoFornecedor(id) {
  const f = DB.get('fornecedores', id);
  const produtos = DB.list('produtos');
  const entradas = DB.list('entradas').filter((e) => e.fornecedor === f.nome).sort((a, b) => new Date(b.data) - new Date(a.data));
  const total = entradas.reduce((s, e) => s + e.quantidade * e.custoUnit, 0);

  abrirModal(`
    <div class="p-4 border-b border-[--color-border] flex items-center justify-between">
      <h3 class="font-semibold text-sm">Histórico — ${f.nome}</h3>
      <span class="text-lg font-bold text-[--color-primary]">${fmtBRL(total)}</span>
    </div>
    <div class="p-4 max-h-96 overflow-y-auto space-y-1.5">
      ${entradas.length === 0 ? `<p class="text-sm text-slate-400 text-center py-6">Nenhuma entrada registrada com esse fornecedor ainda</p>` :
        entradas.map((e) => {
          const p = produtos.find((prod) => prod.id === e.produtoId);
          return `
            <div class="bg-slate-50 rounded-lg px-3 py-2 text-sm">
              <div class="flex justify-between">
                <span>${p ? p.nome : '—'}</span>
                <span class="font-medium tabular-nums">${fmtBRL(e.quantidade * e.custoUnit)}</span>
              </div>
              <div class="text-xs text-slate-400">${fmtDataHora(e.data)} · ${e.quantidade} un × ${fmtBRL(e.custoUnit)}</div>
            </div>`;
        }).join('')}
    </div>
  `, true);
}
