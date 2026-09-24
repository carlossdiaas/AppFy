/**
 * promocoes.js — Promoções: desconto em produto e cesta básica
 */
let modalAberto = null;
let filtroPromoTipo = 'todos'; // 'todos' | 'produto' | 'cesta'
let cestaItensTemp = [];

document.addEventListener('DOMContentLoaded', () => {
  protegerPagina(() => {
    renderShell('promocoes.html', 'Promoções');
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
  const promocoes = DB.list('promocoes');
  const ativas = promocoes.filter((p) => promocaoEstaAtiva(p));
  const cestas = promocoes.filter((p) => p.tipo === 'cesta');

  content.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      ${statCardIcon('tag', 'blue', 'Promoções cadastradas', promocoes.length)}
      ${statCardIcon('tag', 'green', 'Ativas agora', ativas.length)}
      ${statCardIcon('box', 'amber', 'Cestas básicas', cestas.length)}
    </div>

    <div class="flex items-center gap-2 mb-3 flex-wrap">
      <button class="btn ${filtroPromoTipo === 'todos' ? 'btn-primary' : 'btn-ghost'} text-xs" onclick="filtroPromoTipo='todos'; renderPage()">Todas</button>
      <button class="btn ${filtroPromoTipo === 'produto' ? 'btn-primary' : 'btn-ghost'} text-xs" onclick="filtroPromoTipo='produto'; renderPage()">🏷️ Desconto em produto</button>
      <button class="btn ${filtroPromoTipo === 'leve' ? 'btn-primary' : 'btn-ghost'} text-xs" onclick="filtroPromoTipo='leve'; renderPage()">🔢 Leve X por R$Y</button>
      <button class="btn ${filtroPromoTipo === 'cesta' ? 'btn-primary' : 'btn-ghost'} text-xs" onclick="filtroPromoTipo='cesta'; renderPage()">🧺 Cesta básica</button>
      <div class="flex-1"></div>
      <button class="btn btn-success" onclick="abrirEscolhaTipoPromo()">+ Nova promoção</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${promocoes.filter((p) => filtroPromoTipo === 'todos' || p.tipo === filtroPromoTipo).map((p) => promoCard(p)).join('') || `<p class="text-slate-400 text-sm col-span-full text-center py-10">Nenhuma promoção cadastrada ainda.</p>`}
    </div>
  `;
}

function promoCard(p) {
  const ativa = promocaoEstaAtiva(p);
  const statusBadge = ativa ? `<span class="badge badge-ok">Ativa</span>` : `<span class="badge badge-neutral">${p.ativo ? 'Fora do período' : 'Inativa'}</span>`;

  if (p.tipo === 'produto') {
    const produto = DB.get('produtos', p.produtoId);
    const descricaoDesconto = p.tipoDesconto === 'percentual' ? `${p.valorDesconto}% off` : `${fmtBRL(p.valorDesconto)} off`;
    return `
      <div class="card p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <p class="font-medium truncate">${produto ? produto.nome : '(produto removido)'}</p>
          ${statusBadge}
        </div>
        <p class="text-sm text-[--color-primary] font-semibold">🏷️ ${descricaoDesconto}</p>
        <p class="text-xs text-slate-400">${fmtData(p.dataInicio)} até ${fmtData(p.dataFim)}</p>
        <div class="flex gap-2 pt-1">
          <button class="btn btn-ghost flex-1 text-xs" onclick='abrirPromoProdutoModal(${JSON.stringify(p.id)})'>Editar</button>
          <button class="text-slate-400 hover:text-[--color-danger] text-xs px-1" onclick='excluirPromocao(${JSON.stringify(p.id)})'>✕</button>
        </div>
      </div>`;
  }

  if (p.tipo === 'leve') {
    const produto = DB.get('produtos', p.produtoId);
    const precoUnitPromo = p.precoTotal / p.quantidadeMinima;
    return `
      <div class="card p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <p class="font-medium truncate">${produto ? produto.nome : '(produto removido)'}</p>
          ${statusBadge}
        </div>
        <p class="text-sm text-[--color-primary] font-semibold">🔢 Leve ${p.quantidadeMinima} por ${fmtBRL(p.precoTotal)}</p>
        <p class="text-xs text-slate-400">${fmtBRL(precoUnitPromo)}/un. · ${fmtData(p.dataInicio)} até ${fmtData(p.dataFim)}</p>
        <div class="flex gap-2 pt-1">
          <button class="btn btn-ghost flex-1 text-xs" onclick='abrirPromoLeveModal(${JSON.stringify(p.id)})'>Editar</button>
          <button class="text-slate-400 hover:text-[--color-danger] text-xs px-1" onclick='excluirPromocao(${JSON.stringify(p.id)})'>✕</button>
        </div>
      </div>`;
  }

  const itensValidos = (p.itens || []).map((it) => ({ ...it, produto: DB.get('produtos', it.produtoId) })).filter((it) => it.produto);
  const valorCheio = itensValidos.reduce((s, it) => s + it.produto.precoVenda * it.quantidade, 0);
  const estoqueDisp = itensValidos.length ? Math.min(...itensValidos.map((it) => Math.floor(it.produto.estoqueAtual / it.quantidade))) : 0;
  return `
    <div class="card p-4 flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <p class="font-medium truncate">🧺 ${p.nome}</p>
        ${statusBadge}
      </div>
      <p class="text-xs text-slate-500">${itensValidos.length} produto(s) · ${fmtData(p.dataInicio)} até ${fmtData(p.dataFim)}</p>
      <div class="flex items-center justify-between text-sm">
        <span class="text-slate-400 line-through">${fmtBRL(valorCheio)}</span>
        <span class="font-bold text-[--color-success]">${fmtBRL(p.precoPromocional)}</span>
      </div>
      <p class="text-xs ${estoqueDisp <= 0 ? 'text-[--color-danger]' : 'text-slate-400'}">Dá pra montar: ${estoqueDisp} cesta(s) agora</p>
      <div class="flex gap-2 pt-1">
        <button class="btn btn-ghost flex-1 text-xs" onclick='abrirCestaModal(${JSON.stringify(p.id)})'>Editar</button>
        <button class="text-slate-400 hover:text-[--color-danger] text-xs px-1" onclick='excluirPromocao(${JSON.stringify(p.id)})'>✕</button>
      </div>
    </div>`;
}

function excluirPromocao(id) {
  if (confirmDialog('Excluir esta promoção?')) { DB.remove('promocoes', id); renderPage(); toast('Promoção excluída', 'warning'); }
}

// ---------------- escolher tipo ----------------
function abrirEscolhaTipoPromo() {
  abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Nova promoção</h3></div>
    <div class="p-4 space-y-2">
      <button class="btn btn-primary w-full justify-start" onclick="fecharModal(); abrirPromoProdutoModal();">🏷️ Desconto num produto</button>
      <button class="btn btn-primary w-full justify-start" onclick="fecharModal(); abrirPromoLeveModal();">🔢 Leve X por R$Y (ex: leve 3 por R$10)</button>
      <button class="btn btn-primary w-full justify-start" onclick="fecharModal(); abrirCestaModal();">🧺 Cesta básica (vários produtos juntos)</button>
    </div>
  `);
}

// ---------------- leve X por R$Y ----------------
function abrirPromoLeveModal(id) {
  const p = id ? DB.get('promocoes', id) : null;
  const produtos = DB.list('produtos');
  const hoje = hojeISO().slice(0, 10);
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">${p ? 'Editar' : 'Nova'} promoção — Leve X por R$Y</h3></div>
    <div class="p-4 space-y-3">
      <div>
        <label class="text-xs text-slate-500">Produto</label>
        <select id="pl-produto" data-autofocus class="input mt-1">
          ${produtos.map((prod) => `<option value="${prod.id}" ${p?.produtoId === prod.id ? 'selected' : ''}>${prod.nome} (${fmtBRL(prod.precoVenda)})</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Leve quantas unidades</label><input id="pl-qtd" type="text" inputmode="numeric" class="input mt-1" value="${p?.quantidadeMinima || ''}" placeholder="Ex: 3" /></div>
        <div><label class="text-xs text-slate-500">Por quanto (R$ total)</label><input id="pl-preco" type="text" inputmode="decimal" class="input mt-1" value="${p ? paraCampoDecimal(p.precoTotal) : ''}" placeholder="Ex: 10,00" /></div>
      </div>
      <p id="pl-resumo" class="text-xs text-slate-500"></p>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Início</label><input id="pl-inicio" type="date" class="input mt-1" value="${p?.dataInicio || hoje}" /></div>
        <div><label class="text-xs text-slate-500">Fim</label><input id="pl-fim" type="date" class="input mt-1" value="${p?.dataFim || hoje}" /></div>
      </div>
      <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input id="pl-ativo" type="checkbox" ${p ? (p.ativo ? 'checked' : '') : 'checked'} />
        Promoção ativa
      </label>
      <p class="text-[11px] text-slate-400">A partir da quantidade mínima, TODAS as unidades saem no preço proporcional — se o cliente levar mais que o mínimo, o preço por unidade continua o mesmo da promoção.</p>
      <button class="btn btn-primary w-full" onclick='salvarPromoLeve(${JSON.stringify(p?.id || null)})'>Salvar</button>
    </div>
  `);
  const atualizarResumo = () => {
    const produtoId = document.getElementById('pl-produto').value;
    const produto = produtos.find((prod) => prod.id === produtoId);
    const qtd = parseInt(document.getElementById('pl-qtd').value, 10) || 0;
    const precoTotal = parseMoeda(document.getElementById('pl-preco').value);
    const resumo = document.getElementById('pl-resumo');
    if (!produto || qtd <= 0 || precoTotal <= 0) { resumo.textContent = ''; return; }
    const precoNormal = produto.precoVenda * qtd;
    const economia = Math.max(0, precoNormal - precoTotal);
    resumo.innerHTML = `Preço normal de ${qtd} un.: <strong>${fmtBRL(precoNormal)}</strong> · Economia do cliente: <strong class="text-[--color-success]">${fmtBRL(economia)}</strong> (${fmtBRL(precoTotal / qtd)}/un.)`;
  };
  ['pl-produto', 'pl-qtd', 'pl-preco'].forEach((id2) => document.getElementById(id2).addEventListener('input', atualizarResumo));
  atualizarResumo();
  ativarEnterSubmit(modalBox, () => salvarPromoLeve(p?.id || null));
}

function salvarPromoLeve(id) {
  const produtoId = document.getElementById('pl-produto').value;
  const quantidadeMinima = parseInt(document.getElementById('pl-qtd').value, 10) || 0;
  const precoTotal = parseMoeda(document.getElementById('pl-preco').value);
  const dataInicio = document.getElementById('pl-inicio').value;
  const dataFim = document.getElementById('pl-fim').value;
  const ativo = document.getElementById('pl-ativo').checked;

  if (!produtoId || quantidadeMinima <= 0 || precoTotal <= 0 || !dataInicio || !dataFim) { toast('Preencha todos os campos corretamente', 'error'); return; }

  const dados = { tipo: 'leve', produtoId, quantidadeMinima, precoTotal, dataInicio, dataFim, ativo };
  if (id) DB.update('promocoes', id, dados);
  else DB.insert('promocoes', dados);

  fecharModal();
  toast('Promoção salva', 'success');
  renderPage();
}

// ---------------- desconto em produto ----------------
function abrirPromoProdutoModal(id) {
  const p = id ? DB.get('promocoes', id) : null;
  const produtos = DB.list('produtos');
  const hoje = hojeISO().slice(0, 10);
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">${p ? 'Editar' : 'Nova'} promoção — desconto em produto</h3></div>
    <div class="p-4 space-y-3">
      <div>
        <label class="text-xs text-slate-500">Produto</label>
        <select id="pp-produto" data-autofocus class="input mt-1">
          ${produtos.map((prod) => `<option value="${prod.id}" ${p?.produtoId === prod.id ? 'selected' : ''}>${prod.nome} (${fmtBRL(prod.precoVenda)})</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-slate-500">Tipo de desconto</label>
          <select id="pp-tipo" class="input mt-1">
            <option value="percentual" ${p?.tipoDesconto === 'percentual' ? 'selected' : ''}>Porcentagem (%)</option>
            <option value="valor" ${p?.tipoDesconto === 'valor' ? 'selected' : ''}>Valor fixo (R$)</option>
          </select>
        </div>
        <div><label class="text-xs text-slate-500">Valor do desconto</label><input id="pp-valor" type="text" inputmode="decimal" class="input mt-1" value="${p ? paraCampoDecimal(p.valorDesconto) : ''}" placeholder="Ex: 10" /></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Início</label><input id="pp-inicio" type="date" class="input mt-1" value="${p?.dataInicio || hoje}" /></div>
        <div><label class="text-xs text-slate-500">Fim</label><input id="pp-fim" type="date" class="input mt-1" value="${p?.dataFim || hoje}" /></div>
      </div>
      <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input id="pp-ativo" type="checkbox" ${p ? (p.ativo ? 'checked' : '') : 'checked'} />
        Promoção ativa
      </label>
      <button class="btn btn-primary w-full" onclick='salvarPromoProduto(${JSON.stringify(p?.id || null)})'>Salvar</button>
    </div>
  `);
  ativarEnterSubmit(modalBox, () => salvarPromoProduto(p?.id || null));
}

function salvarPromoProduto(id) {
  const produtoId = document.getElementById('pp-produto').value;
  const tipoDesconto = document.getElementById('pp-tipo').value;
  const valorDesconto = parseMoeda(document.getElementById('pp-valor').value);
  const dataInicio = document.getElementById('pp-inicio').value;
  const dataFim = document.getElementById('pp-fim').value;
  const ativo = document.getElementById('pp-ativo').checked;

  if (!produtoId || valorDesconto <= 0 || !dataInicio || !dataFim) { toast('Preencha todos os campos corretamente', 'error'); return; }
  if (tipoDesconto === 'percentual' && valorDesconto > 100) { toast('Desconto percentual não pode passar de 100%', 'error'); return; }

  const dados = { tipo: 'produto', produtoId, tipoDesconto, valorDesconto, dataInicio, dataFim, ativo };
  if (id) DB.update('promocoes', id, dados);
  else DB.insert('promocoes', dados);

  fecharModal();
  toast('Promoção salva', 'success');
  renderPage();
}

// ---------------- cesta básica ----------------
function abrirCestaModal(id) {
  const p = id ? DB.get('promocoes', id) : null;
  cestaItensTemp = p ? JSON.parse(JSON.stringify(p.itens || [])) : [];
  const hoje = hojeISO().slice(0, 10);
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">${p ? 'Editar' : 'Nova'} cesta básica</h3></div>
    <div class="p-4 space-y-3">
      <div><label class="text-xs text-slate-500">Nome da cesta</label><input id="cb-nome" data-autofocus class="input mt-1" value="${p?.nome || ''}" placeholder="Ex: Cesta Básica Setembro" /></div>

      <div>
        <label class="text-xs text-slate-500">Produtos da cesta</label>
        <div id="cb-itens-lista" class="space-y-1.5 mt-1"></div>
        <div class="flex gap-2 mt-2">
          <select id="cb-add-produto" class="input flex-1">
            ${DB.list('produtos').map((prod) => `<option value="${prod.id}">${prod.nome}</option>`).join('')}
          </select>
          <input id="cb-add-qtd" type="text" inputmode="decimal" class="input w-20" placeholder="Qtd" value="1" />
          <button type="button" class="btn btn-ghost text-xs whitespace-nowrap" onclick="adicionarItemCesta()">+ Add</button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Início</label><input id="cb-inicio" type="date" class="input mt-1" value="${p?.dataInicio || hoje}" /></div>
        <div><label class="text-xs text-slate-500">Fim</label><input id="cb-fim" type="date" class="input mt-1" value="${p?.dataFim || hoje}" /></div>
      </div>
      <div>
        <label class="text-xs text-slate-500">Preço promocional da cesta (o pacote inteiro)</label>
        <input id="cb-preco" type="text" inputmode="decimal" class="input mt-1" value="${p?.precoPromocional ? paraCampoDecimal(p.precoPromocional) : ''}" placeholder="0,00" />
      </div>
      <p id="cb-resumo" class="text-xs text-slate-500"></p>
      <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input id="cb-ativo" type="checkbox" ${p ? (p.ativo ? 'checked' : '') : 'checked'} />
        Promoção ativa
      </label>
      <button class="btn btn-primary w-full" onclick='salvarCesta(${JSON.stringify(p?.id || null)})'>Salvar</button>
    </div>
  `, true);
  renderItensCesta();
  document.getElementById('cb-preco').addEventListener('input', atualizarResumoCesta);
  ativarEnterSubmit(modalBox, () => salvarCesta(p?.id || null));
}

function renderItensCesta() {
  const lista = document.getElementById('cb-itens-lista');
  if (!lista) return;
  const produtos = DB.list('produtos');
  lista.innerHTML = cestaItensTemp.map((it, i) => {
    const produto = produtos.find((p) => p.id === it.produtoId);
    return `
      <div class="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-1.5">
        <span>${produto ? produto.nome : '?'} <span class="text-slate-400">× ${it.quantidade}</span></span>
        <button class="text-slate-400 hover:text-[--color-danger] text-xs" onclick="removerItemCesta(${i})">✕</button>
      </div>`;
  }).join('') || `<p class="text-xs text-slate-400">Nenhum produto adicionado ainda</p>`;
  atualizarResumoCesta();
}

function adicionarItemCesta() {
  const produtoId = document.getElementById('cb-add-produto').value;
  const quantidade = parseMoeda(document.getElementById('cb-add-qtd').value) || 1;
  if (!produtoId) return;
  const existente = cestaItensTemp.find((it) => it.produtoId === produtoId);
  if (existente) existente.quantidade += quantidade;
  else cestaItensTemp.push({ produtoId, quantidade });
  renderItensCesta();
}
function removerItemCesta(i) {
  cestaItensTemp.splice(i, 1);
  renderItensCesta();
}

function atualizarResumoCesta() {
  const resumo = document.getElementById('cb-resumo');
  if (!resumo) return;
  const produtos = DB.list('produtos');
  const valorCheio = cestaItensTemp.reduce((s, it) => {
    const produto = produtos.find((p) => p.id === it.produtoId);
    return s + (produto ? produto.precoVenda * it.quantidade : 0);
  }, 0);
  const campoPreco = document.getElementById('cb-preco');
  const precoPromo = campoPreco ? parseMoeda(campoPreco.value) : 0;
  const economia = Math.max(0, valorCheio - precoPromo);
  resumo.innerHTML = `Valor avulso somado: <strong>${fmtBRL(valorCheio)}</strong>${precoPromo > 0 ? ` · Economia do cliente: <strong class="text-[--color-success]">${fmtBRL(economia)}</strong>` : ''}`;
}

function salvarCesta(id) {
  const nome = document.getElementById('cb-nome').value.trim();
  const precoPromocional = parseMoeda(document.getElementById('cb-preco').value);
  const dataInicio = document.getElementById('cb-inicio').value;
  const dataFim = document.getElementById('cb-fim').value;
  const ativo = document.getElementById('cb-ativo').checked;

  if (!nome) { toast('Informe o nome da cesta', 'error'); return; }
  if (cestaItensTemp.length === 0) { toast('Adicione pelo menos um produto na cesta', 'error'); return; }
  if (precoPromocional <= 0) { toast('Informe o preço promocional da cesta', 'error'); return; }
  if (!dataInicio || !dataFim) { toast('Preencha o período de validade', 'error'); return; }

  const dados = { tipo: 'cesta', nome, itens: cestaItensTemp, precoPromocional, dataInicio, dataFim, ativo };
  if (id) DB.update('promocoes', id, dados);
  else DB.insert('promocoes', dados);

  cestaItensTemp = [];
  fecharModal();
  toast('Cesta básica salva', 'success');
  renderPage();
}
