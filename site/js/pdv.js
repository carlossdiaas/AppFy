/**
 * pdv.js — Frente de Caixa
 * Foco contínuo no leitor de código de barras + atalhos de teclado
 * F1 cliente (fiado) · F2 buscar nome · F3 qtd · F4 desconto item
 * F6 abrir/fechar caixa · F7 sangria/suprimento · F8 cancelar item
 * F9 cancelar venda · F10 finalizar venda · ESC fecha modal
 */

let cart = []; // { produtoId, codigo, nome, unidade, precoUnit, precoCusto, qtd, descontoItem }
let selectedRowIndex = null;
let clienteSelecionado = null; // para venda fiado
let modalAberto = null;

// ------------------------------------------------------------------
// RASCUNHO DA VENDA — a venda em andamento (carrinho + cliente
// vinculado) é salva automaticamente a cada mudança, pra não se perder
// se a pessoa sair pro cadastro de um cliente novo, checar o estoque
// etc. no meio de uma venda e depois voltar pro PDV.
// ------------------------------------------------------------------
function _chaveRascunhoVenda() {
  return (typeof DB !== 'undefined' && DB.chavePessoal) ? DB.chavePessoal('pdvbr_venda_rascunho') : 'pdvbr_venda_rascunho';
}
function salvarRascunhoVenda() {
  try {
    const chave = _chaveRascunhoVenda();
    if (cart.length === 0 && !clienteSelecionado) { localStorage.removeItem(chave); return; }
    localStorage.setItem(chave, JSON.stringify({ cart, clienteSelecionado }));
  } catch (e) { /* nunca trava a venda por causa disso */ }
}
function restaurarRascunhoVenda() {
  try {
    const raw = localStorage.getItem(_chaveRascunhoVenda());
    if (!raw) return;
    const rascunho = JSON.parse(raw);
    if (Array.isArray(rascunho.cart)) cart = rascunho.cart;
    if (rascunho.clienteSelecionado) clienteSelecionado = rascunho.clienteSelecionado;
  } catch (e) { /* ignora rascunho corrompido */ }
}

document.addEventListener('DOMContentLoaded', () => {
  protegerPagina(() => {
    restaurarRascunhoVenda();
    renderShell('index.html', 'PDV — Frente de Caixa');
    renderPage();
    bindGlobalKeys();
    focusScanner();
  });
});

function focusScanner() {
  const el = document.getElementById('scanner');
  if (el && !modalAberto) el.focus();
}

// mantém o foco no leitor mesmo se o operador clicar em outro lugar da tela
document.addEventListener('click', (e) => {
  if (modalAberto) return;
  const el = document.getElementById('scanner');
  if (!el) return;
  if (e.target.closest('.cart-row') || e.target.closest('button') || e.target.closest('input')) return;
  el.focus();
});

function renderPage() {
  salvarRascunhoVenda();
  const content = document.getElementById('page-content');
  const caixa = DB.getCaixaAberto();

  content.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 h-full">
      <!-- coluna esquerda: leitor + carrinho -->
      <div class="flex flex-col gap-3 min-h-0">
        <div class="card p-3">
          <label class="text-xs font-medium text-slate-500 mb-1 block">Código de barras / F2 para buscar por nome</label>
          <div class="flex gap-2">
            <input id="scanner" autocomplete="off" placeholder="Bipe o produto ou digite o código e pressione Enter…"
              class="input scanner-input flex-1" />
            <button class="btn btn-ghost" onclick="abrirBuscaModal()">🔍 Buscar (F2)</button>
          </div>
          ${clienteSelecionado ? `
            <div class="mt-2 flex items-center justify-between text-xs bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
              <span>Cliente vinculado: <strong>${clienteSelecionado.nome}</strong> · saldo devedor ${fmtBRL(clienteSelecionado.saldoDevedor)}</span>
              <button class="text-blue-700 underline" onclick="removerCliente()">remover</button>
            </div>` : ''}
        </div>

        <div class="card flex-1 min-h-0 flex flex-col overflow-hidden">
          <div class="px-4 py-2.5 border-b border-[--color-border] flex items-center justify-between">
            <span class="text-sm font-semibold">Carrinho</span>
            <span class="text-xs text-slate-500">${cart.length} item(ns)</span>
          </div>
          <div class="overflow-y-auto flex-1">
            ${cart.length === 0 ? `
              <div class="h-full flex flex-col items-center justify-center py-6 text-slate-400 text-sm gap-2 min-h-0">
                <img src="img/logo-mercadinho-lima.png" alt="Mercadinho Lima" class="w-72 h-72 max-w-full max-h-[32vh] object-contain opacity-[23%] select-none pointer-events-none" />
                <span>Nenhum item bipado ainda</span>
              </div>` : `
              <table class="data-table">
                <thead><tr>
                  <th>Produto</th><th>Qtd</th><th>Preço</th><th>Desc.</th><th>Subtotal</th><th></th>
                </tr></thead>
                <tbody>
                  ${cart.map((it, i) => rowHtml(it, i)).join('')}
                </tbody>
              </table>`}
          </div>
        </div>

        <div class="fkey-bar">
          ${fkey('F2', 'Buscar', 'abrirBuscaModal()')}
          ${fkey('F3', 'Qtd', 'abrirQtdModal()')}
          ${fkey('F4', 'Desconto', 'abrirDescontoModal()')}
          ${fkey('F1', 'Cliente', 'abrirClienteModal()')}
          ${fkey('F6', caixa ? 'Fechar caixa' : 'Abrir caixa', 'abrirCaixaModal()')}
          ${fkey('F7', 'Sangria/Suprim.', 'abrirMovimentoCaixaModal()')}
          ${fkey('F8', 'Cancelar item', 'cancelarItemSelecionado()')}
          ${fkey('F9', 'Cancelar venda', 'cancelarVenda()')}
          ${fkey('F10', 'Finalizar', 'abrirPagamentoModal()')}
          ${fkey('ESC', 'Fechar modal', 'fecharModal()')}
        </div>
      </div>

      <!-- coluna direita: totais -->
      <div class="flex flex-col gap-3">
        <div class="card p-4">
          <p class="text-xs text-slate-500 mb-1">Total da venda</p>
          <p class="text-6xl font-extrabold tabular-nums tracking-tight text-[--color-primary] leading-none">${fmtBRL(totalCarrinho())}</p>
          <div class="mt-3 space-y-1 text-sm text-slate-600">
            <div class="flex justify-between"><span>Subtotal</span><span class="tabular-nums">${fmtBRL(subtotalCarrinho())}</span></div>
            <div class="flex justify-between"><span>Descontos</span><span class="tabular-nums text-[--color-danger]">- ${fmtBRL(totalDescontos())}</span></div>
          </div>
          <button class="btn btn-success w-full mt-4 py-3 text-base" onclick="abrirPagamentoModal()">Finalizar venda (F10)</button>
        </div>
        <button class="btn btn-ghost w-full" onclick="abrirCestasBasicasModal()">🧺 Adicionar cesta básica em promoção</button>
        <div class="card p-4">
          <p class="text-xs font-semibold text-slate-500 mb-2">Status do caixa</p>
          ${caixa ? `
            <p class="text-sm">Aberto em <strong>${fmtDataHora(caixa.dataAbertura)}</strong></p>
            <p class="text-sm text-slate-500">Valor de abertura: ${fmtBRL(caixa.valorAbertura)}</p>` :
            `<p class="text-sm text-[--color-danger] font-medium">Nenhum caixa aberto. Abra o caixa (F6) antes de vender em dinheiro.</p>`}
        </div>
        <div class="card p-4 text-xs text-slate-500 leading-relaxed">
          Dica: o campo do leitor mantém foco automático. Use ↑/↓ para navegar entre os itens do carrinho e Enter para editar a quantidade do item selecionado — sem precisar do mouse.
        </div>
      </div>
    </div>
  `;

  const scanner = document.getElementById('scanner');
  if (scanner) {
    scanner.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const valor = scanner.value.trim();
        // Enter com o campo vazio e um item selecionado no carrinho = atalho
        // rápido para editar a quantidade daquele item (mesmo que F3)
        if (!valor && selectedRowIndex !== null) { abrirQtdModal(); return; }
        handleScanInput(valor);
        scanner.value = '';
      } else if (e.key === 'ArrowDown' && !scanner.value) {
        e.preventDefault();
        moverSelecaoCarrinho(1);
      } else if (e.key === 'ArrowUp' && !scanner.value) {
        e.preventDefault();
        moverSelecaoCarrinho(-1);
      }
    });
  }
  focusScanner();
}

function fkey(key, label, onclick) {
  return `<button class="fkey-btn" onclick="${onclick}"><span class="key">${key}</span><span class="label">${label}</span></button>`;
}

function rowHtml(it, i) {
  const subtotal = it.precoUnit * it.qtd - it.descontoItem;
  const selected = i === selectedRowIndex;
  const qtdDisplay = it.unidade === 'KG'
    ? `${Math.round(it.qtd * 1000)} g`
    : `${it.qtd % 1 === 0 ? it.qtd : it.qtd.toFixed(3)} ${it.unidade}`;
  return `
    <tr class="cart-row-tr ${selected ? 'bg-blue-50' : ''} animate-row-in" onclick="selecionarLinha(${i})">
      <td>
        <p class="font-medium">${it.nome}</p>
        <p class="text-xs text-slate-400">${it.codigo} · ${fmtBRL(it.precoUnit)}/${it.unidade}${it.fardoAplicado ? ' · <span class="text-[--color-primary]">🎁 preço de fardo</span>' : ''}${it.promocaoLeveId ? ` · <span class="text-[--color-success]">🔢 ${it.promocaoLeveDescricao}</span>` : ''}${it.promocaoProdutoId ? ' · <span class="text-[--color-success]">🏷️ promoção</span>' : ''}${it.cestaBasicaId ? ` · <span class="text-[--color-success]">🧺 ${it.cestaBasicaNome}</span>` : ''}</p>
      </td>
      <td class="tabular-nums">
        <button class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg border-2 border-emerald-500 text-emerald-700 font-semibold text-xs hover:bg-emerald-50" title="Clique para alterar a quantidade" onclick="event.stopPropagation(); selectedRowIndex=${i}; abrirQtdModal();">${qtdDisplay}</button>
      </td>
      <td class="tabular-nums">${fmtBRL(it.precoUnit)}</td>
      <td class="tabular-nums text-[--color-danger]">${it.descontoItem > 0 ? '- ' + fmtBRL(it.descontoItem) : '—'}</td>
      <td class="tabular-nums font-semibold">${fmtBRL(subtotal)}</td>
      <td><button class="text-slate-400 hover:text-[--color-danger]" onclick="event.stopPropagation(); removerLinha(${i})">✕</button></td>
    </tr>`;
}

function selecionarLinha(i) {
  selectedRowIndex = i;
  renderPage();
}

/** Move a seleção do carrinho com as setas ↑/↓ (mantém foco no leitor) */
function moverSelecaoCarrinho(delta) {
  if (cart.length === 0) return;
  if (selectedRowIndex === null) selectedRowIndex = delta > 0 ? 0 : cart.length - 1;
  else selectedRowIndex = Math.min(Math.max(selectedRowIndex + delta, 0), cart.length - 1);
  renderPage();
}

function removerLinha(i) {
  cart.splice(i, 1);
  selectedRowIndex = null;
  renderPage();
}

// ---------------- cálculo de totais ----------------
function subtotalCarrinho() { return cart.reduce((s, it) => s + it.precoUnit * it.qtd, 0); }
function totalDescontos() { return cart.reduce((s, it) => s + it.descontoItem, 0); }
function totalCarrinho() { return subtotalCarrinho() - totalDescontos(); }

// ---------------- cesta básica (promoções) ----------------
function abrirCestasBasicasModal() {
  const cestas = DB.list('promocoes').filter((p) => p.tipo === 'cesta' && promocaoEstaAtiva(p));
  abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">🧺 Cestas básicas em promoção</h3></div>
    <div class="p-4 space-y-2 max-h-96 overflow-y-auto">
      ${cestas.map((c) => {
        const itensValidos = (c.itens || []).map((it) => ({ ...it, produto: DB.get('produtos', it.produtoId) })).filter((it) => it.produto);
        const disponivel = itensValidos.length ? Math.min(...itensValidos.map((it) => Math.floor(it.produto.estoqueAtual / it.quantidade))) : 0;
        return `
        <div class="card p-3">
          <div class="flex justify-between items-center mb-1">
            <p class="font-medium">${c.nome}</p>
            <span class="font-bold text-[--color-success]">${fmtBRL(c.precoPromocional)}</span>
          </div>
          <p class="text-xs text-slate-400 mb-2">${itensValidos.map((it) => `${it.produto.nome} ×${it.quantidade}`).join(', ')}</p>
          <button class="btn btn-primary w-full text-xs" ${disponivel <= 0 ? 'disabled' : ''} onclick='adicionarCestaBasicaAoCarrinho(${JSON.stringify(c.id)})'>${disponivel <= 0 ? 'Sem estoque suficiente' : 'Adicionar ao carrinho'}</button>
        </div>`;
      }).join('') || `<p class="text-sm text-slate-400 text-center py-6">Nenhuma cesta básica em promoção no momento. Cadastre uma em Promoções.</p>`}
    </div>
  `);
}

function adicionarCestaBasicaAoCarrinho(cestaId) {
  const cesta = DB.get('promocoes', cestaId);
  if (!cesta || cesta.tipo !== 'cesta') return;
  const itensValidos = (cesta.itens || []).map((it) => ({ ...it, produto: DB.get('produtos', it.produtoId) })).filter((it) => it.produto);
  if (itensValidos.length === 0) { toast('Cesta sem produtos válidos', 'error'); return; }

  // divide o desconto necessário pra chegar no preço promocional
  // proporcionalmente entre os itens, de acordo com o peso de cada um
  const valorCheio = itensValidos.reduce((s, it) => s + it.produto.precoVenda * it.quantidade, 0);
  const descontoTotalCesta = Math.max(0, valorCheio - cesta.precoPromocional);

  itensValidos.forEach((it) => {
    const valorItemCheio = it.produto.precoVenda * it.quantidade;
    const proporcao = valorCheio > 0 ? valorItemCheio / valorCheio : 0;
    const descontoItem = Number((descontoTotalCesta * proporcao).toFixed(2));
    cart.push({
      produtoId: it.produto.id,
      codigo: it.produto.codigo,
      nome: it.produto.nome,
      unidade: it.produto.unidade,
      precoUnit: it.produto.precoVenda,
      precoCusto: it.produto.precoCusto,
      qtd: it.quantidade,
      descontoItem,
      cestaBasicaId: cesta.id,
      cestaBasicaNome: cesta.nome,
    });
  });

  fecharModal();
  toast(`Cesta "${cesta.nome}" adicionada ao carrinho`, 'success');
  renderPage();
}

// ---------------- leitura / adição de item ----------------
async function handleScanInput(value) {
  if (!value) return;
  const produtos = DB.list('produtos');
  let produto = produtos.find((p) => p.codigo === value);

  if (!produto) {
    // tenta por nome parcial (útil se o operador digitar em vez de bipar)
    const termo = value.toLowerCase();
    const encontrados = produtos.filter((p) => p.nome.toLowerCase().includes(termo));
    if (encontrados.length === 1) {
      produto = encontrados[0];
    } else if (encontrados.length > 1) {
      abrirBuscaModal(value);
      return;
    }
  }

  if (!produto) {
    // se parece um código de barras de verdade, tenta consultar uma API
    // pública para ao menos dizer que produto é esse (não cadastrado ainda
    // não dá pra vender sem preço/estoque, mas ajuda o operador a identificar)
    if (/^\d{8,14}$/.test(value)) {
      const info = await consultarCodigoBarrasExterno(value);
      if (info) {
        toast(`Não cadastrado. Código pertence a "${info.nome}" — cadastre em Estoque.`, 'warning');
      } else {
        toast(`Produto não encontrado para "${value}"`, 'error');
      }
    } else {
      toast(`Produto não encontrado para "${value}"`, 'error');
    }
    return;
  }
  adicionarProduto(produto);
}

/** Produtos vendidos por peso/volume pedem a quantidade assim que são lidos */
function isProdutoPesavel(produto) {
  return produto.unidade === 'KG' || produto.unidade === 'L';
}

function adicionarProduto(produto, qtdForcada = null) {
  if (qtdForcada === null && isProdutoPesavel(produto)) {
    abrirQtdRapidaModal(produto);
    return;
  }
  const qtd = qtdForcada !== null ? qtdForcada : 1;
  let item = cart.find((it) => it.produtoId === produto.id);
  if (item) {
    item.qtd += qtd;
  } else {
    item = {
      produtoId: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      unidade: produto.unidade,
      precoUnit: produto.precoVenda,
      precoCusto: produto.precoCusto,
      qtd,
      descontoItem: 0,
    };
    cart.push(item);
  }
  aplicarPrecoComPromocaoOuFardo(item, produto);
  toast(`${produto.nome} adicionado`, 'success');
  renderPage();
}

/**
 * Se o produto tem preço de fardo configurado (Estoque → editar produto)
 * e a quantidade desse item no carrinho bate ou passa o mínimo, aplica
 * automaticamente o preço proporcional do fardo em TODAS as unidades —
 * inclusive as que passarem do fardo fechado. Ex: fardo de 12 Bud a
 * R$55 (R$4,58/un). Se o cliente levar 15, as 15 saem a R$4,58 cada
 * (R$68,75 no total), não só as 12 primeiras.
 * Se a quantidade cair de novo abaixo do mínimo, desfaz esse desconto
 * automático (sem mexer em desconto manual aplicado por outro motivo).
 */
function aplicarPrecoFardo(item, produto) {
  if (!(produto.precoFardo > 0 && produto.qtdFardo > 0)) return;
  if (item.qtd < produto.qtdFardo) {
    if (item.fardoAplicado) { item.descontoItem = 0; item.fardoAplicado = false; }
    return;
  }
  const precoPorUnidadeFardo = produto.precoFardo / produto.qtdFardo;
  const totalComFardo = item.qtd * precoPorUnidadeFardo;
  const totalSemDesconto = item.qtd * item.precoUnit;
  item.descontoItem = Number(Math.max(0, totalSemDesconto - totalComFardo).toFixed(2));
  item.fardoAplicado = true;
}

/**
 * Verifica se o produto tem uma promoção de desconto ativa (cadastrada
 * em Promoções). Se tiver, ela tem prioridade sobre o preço de fardo —
 * são recursos separados, não fazem sentido combinados na mesma linha.
 */
function aplicarPrecoComPromocaoOuFardo(item, produto) {
  const promocoes = DB.list('promocoes');

  // 1) "Leve X por R$Y" tem prioridade — é uma promoção por tempo limitado
  const promoLeve = promocoes.find((p) => p.tipo === 'leve' && p.produtoId === produto.id && promocaoEstaAtiva(p));
  if (promoLeve) {
    if (item.qtd >= promoLeve.quantidadeMinima) {
      const precoPorUnidade = promoLeve.precoTotal / promoLeve.quantidadeMinima;
      const totalComPromo = item.qtd * precoPorUnidade;
      const totalSemDesconto = item.qtd * item.precoUnit;
      item.descontoItem = Number(Math.max(0, totalSemDesconto - totalComPromo).toFixed(2));
      item.promocaoLeveId = promoLeve.id;
      item.promocaoLeveDescricao = `Leve ${promoLeve.quantidadeMinima} por ${fmtBRL(promoLeve.precoTotal)}`;
      item.promocaoProdutoId = null;
      item.fardoAplicado = false;
      return;
    }
    if (item.promocaoLeveId) { item.descontoItem = 0; item.promocaoLeveId = null; }
  } else if (item.promocaoLeveId) {
    item.descontoItem = 0;
    item.promocaoLeveId = null;
  }

  // 2) desconto normal cadastrado no produto
  const promoAtiva = promocoes.find((p) => p.tipo === 'produto' && p.produtoId === produto.id && promocaoEstaAtiva(p));
  if (promoAtiva) {
    const descontoUnit = promoAtiva.tipoDesconto === 'percentual'
      ? item.precoUnit * (promoAtiva.valorDesconto / 100)
      : promoAtiva.valorDesconto;
    const totalSemDesconto = item.qtd * item.precoUnit;
    const descontoTotal = Math.min(totalSemDesconto, descontoUnit * item.qtd);
    item.descontoItem = Number(Math.max(0, descontoTotal).toFixed(2));
    item.promocaoProdutoId = promoAtiva.id;
    item.fardoAplicado = false;
    return;
  }
  item.promocaoProdutoId = null;

  // 3) preço de fardo fixo cadastrado no produto (Estoque)
  aplicarPrecoFardo(item, produto);
}

/** Modal rápido de quantidade — abre automaticamente para produtos por KG/L.
 * Para KG, o operador digita direto em GRAMAS (ex: 500 = meio quilo,
 * 1750 = um quilo e 750g), que é como as balanças de mercadinho funcionam. */
function abrirQtdRapidaModal(produto) {
  const emGramas = produto.unidade === 'KG';
  abrirModal(`
    <div class="p-4 border-b border-[--color-border]">
      <h3 class="font-semibold text-sm">${produto.nome}</h3>
      <p class="text-xs text-slate-400 mt-0.5">Produto vendido por ${emGramas ? 'peso' : 'volume'} — informe a quantidade${emGramas ? ' em gramas' : ''}</p>
    </div>
    <div class="p-4">
      <label class="text-xs text-slate-500">${emGramas ? 'Quantidade (gramas)' : `Quantidade (${produto.unidade})`} · ${fmtBRL(produto.precoVenda)}/${produto.unidade}</label>
      <input id="qtd-rapida" data-autofocus type="text" inputmode="decimal" class="input mt-1 text-lg text-center" placeholder="${emGramas ? '0' : '0,000'}" />
      ${emGramas ? `<p class="text-[11px] text-slate-400 mt-1 text-center">Ex: 500 = meio quilo · 1750 = 1kg e 750g</p>` : ''}
      <p id="qtd-rapida-subtotal" class="text-center text-2xl font-bold mt-3 text-[--color-primary]">${fmtBRL(0)}</p>
      <button class="btn btn-success w-full mt-4 py-3 text-base" onclick="confirmarQtdRapida(${JSON.stringify(produto.id)})">Adicionar ao carrinho</button>
    </div>
  `);
  const input = document.getElementById('qtd-rapida');
  input.addEventListener('input', () => {
    const digitado = parseMoeda(input.value);
    const qtdReal = emGramas ? digitado / 1000 : digitado;
    document.getElementById('qtd-rapida-subtotal').textContent = fmtBRL(qtdReal * produto.precoVenda);
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmarQtdRapida(produto.id); });
}
function confirmarQtdRapida(produtoId) {
  const produto = DB.get('produtos', produtoId);
  const digitado = parseMoeda(document.getElementById('qtd-rapida').value);
  if (digitado <= 0) { toast('Informe uma quantidade válida', 'error'); return; }
  const qtdReal = produto.unidade === 'KG' ? digitado / 1000 : digitado;
  fecharModal();
  adicionarProduto(produto, qtdReal);
}

// ---------------- atalhos de teclado globais ----------------
function bindGlobalKeys() {
  document.addEventListener('keydown', (e) => {
    if (['F1', 'F2', 'F3', 'F4', 'F6', 'F7', 'F8', 'F9', 'F10'].includes(e.key)) e.preventDefault();
    switch (e.key) {
      case 'F2': abrirBuscaModal(); break;
      case 'F3': abrirQtdModal(); break;
      case 'F4': abrirDescontoModal(); break;
      case 'F1': abrirClienteModal(); break;
      case 'F6': abrirCaixaModal(); break;
      case 'F7': abrirMovimentoCaixaModal(); break;
      case 'F8': cancelarItemSelecionado(); break;
      case 'F9': cancelarVenda(); break;
      case 'F10': abrirPagamentoModal(); break;
      case 'Escape': fecharModal(); break;
    }
  });
}

function cancelarItemSelecionado() {
  if (selectedRowIndex === null) {
    toast('Selecione um item do carrinho primeiro', 'warning');
    return;
  }
  removerLinha(selectedRowIndex);
}

function cancelarVenda() {
  if (cart.length === 0) return;
  if (confirmDialog('Cancelar toda a venda atual?')) {
    cart = [];
    clienteSelecionado = null;
    selectedRowIndex = null;
    renderPage();
    toast('Venda cancelada', 'warning');
  }
}

// ---------------- modais genéricos ----------------
function abrirModal(html) {
  fecharModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) fecharModal(); });
  document.body.appendChild(overlay);
  modalAberto = overlay;
  const first = overlay.querySelector('[data-autofocus]');
  if (first) setTimeout(() => first.focus(), 30);
  return overlay.querySelector('.modal-box');
}

function fecharModal() {
  if (modalAberto) {
    modalAberto.remove();
    modalAberto = null;
  }
  focusScanner();
}

// ---------------- F2 — busca por nome ----------------
function abrirBuscaModal(termoInicial = '') {
  const produtos = DB.list('produtos');
  abrirModal(`
    <div class="p-4 border-b border-[--color-border]">
      <h3 class="font-semibold text-sm">Buscar produto (F2)</h3>
    </div>
    <div class="p-4">
      <input id="busca-nome" data-autofocus class="input" placeholder="Digite o nome do produto…" value="${termoInicial}" />
      <div id="busca-resultados" class="mt-3 space-y-1 max-h-72 overflow-y-auto"></div>
    </div>
  `);
  const input = document.getElementById('busca-nome');
  const renderResultados = () => {
    const termo = input.value.toLowerCase();
    const results = produtos.filter((p) => p.nome.toLowerCase().includes(termo) || p.codigo.includes(termo)).slice(0, 20);
    document.getElementById('busca-resultados').innerHTML = results.map((p) => `
      <button class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center justify-between" onclick='selecionarBusca(${JSON.stringify(p.id)})'>
        <span>
          <span class="block text-sm font-medium">${p.nome}</span>
          <span class="block text-xs text-slate-400">${p.codigo} · estoque: ${p.estoqueAtual} ${p.unidade}</span>
        </span>
        <span class="text-sm font-semibold">${fmtBRL(p.precoVenda)}</span>
      </button>`).join('') || `<p class="text-sm text-slate-400 px-2 py-3">Nenhum produto encontrado</p>`;
  };
  input.addEventListener('input', renderResultados);
  renderResultados();
  ativarNavegacaoLista(input, 'busca-resultados', 'button');
}
function selecionarBusca(produtoId) {
  const produto = DB.get('produtos', produtoId);
  fecharModal();
  if (produto) adicionarProduto(produto);
}

// ---------------- F3 — alterar quantidade ----------------
function abrirQtdModal() {
  if (selectedRowIndex === null) { toast('Selecione um item do carrinho primeiro', 'warning'); return; }
  const it = cart[selectedRowIndex];
  const emGramas = it.unidade === 'KG';
  const atual = emGramas ? Math.round(it.qtd * 1000) : paraCampoQuantidade(it.qtd);
  abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Alterar quantidade — ${it.nome}</h3></div>
    <div class="p-4">
      <label class="text-xs text-slate-500">${emGramas ? 'Quantidade (gramas)' : `Quantidade (${it.unidade})`} · atual: ${atual}</label>
      <input id="qtd-input" data-autofocus type="text" inputmode="decimal" class="input mt-1" value="" placeholder="${atual}" />
      <button class="btn btn-primary w-full mt-4" onclick="confirmarQtd()">Confirmar</button>
    </div>
  `);
  document.getElementById('qtd-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmarQtd(); });
}
function confirmarQtd() {
  const it = cart[selectedRowIndex];
  const emGramas = it.unidade === 'KG';
  const digitado = parseMoeda(document.getElementById('qtd-input').value);
  if (digitado > 0) {
    it.qtd = emGramas ? digitado / 1000 : digitado;
    const produto = DB.get('produtos', it.produtoId);
    if (produto) aplicarPrecoComPromocaoOuFardo(it, produto);
  }
  fecharModal();
  renderPage();
}

// ---------------- F4 — desconto no item ----------------
function abrirDescontoModal() {
  if (selectedRowIndex === null) { toast('Selecione um item do carrinho primeiro', 'warning'); return; }
  const it = cart[selectedRowIndex];
  abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Desconto — ${it.nome}</h3></div>
    <div class="p-4">
      <label class="text-xs text-slate-500">Valor do desconto (R$) sobre a linha</label>
      <input id="desc-input" data-autofocus type="text" inputmode="decimal" class="input mt-1" value="${paraCampoDecimal(it.descontoItem)}" />
      <p class="text-xs text-slate-400 mt-1">Subtotal da linha sem desconto: ${fmtBRL(it.precoUnit * it.qtd)}</p>
      <button class="btn btn-primary w-full mt-4" onclick="confirmarDesconto()">Aplicar desconto</button>
    </div>
  `);
  document.getElementById('desc-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmarDesconto(); });
}
function confirmarDesconto() {
  const it = cart[selectedRowIndex];
  const val = parseMoeda(document.getElementById('desc-input').value);
  const max = it.precoUnit * it.qtd;
  it.descontoItem = Math.min(Math.max(val, 0), max);
  fecharModal();
  renderPage();
}

// ---------------- F1 — cliente / fiado ----------------
function abrirClienteModal() {
  const clientes = DB.list('clientes');
  abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Vincular cliente (fiado)</h3></div>
    <div class="p-4">
      <input id="cliente-busca" data-autofocus class="input" placeholder="Buscar cliente pelo nome…" />
      <div id="cliente-resultados" class="mt-3 space-y-1 max-h-72 overflow-y-auto"></div>
    </div>
  `);
  const input = document.getElementById('cliente-busca');
  const render = () => {
    const termo = input.value.toLowerCase();
    const results = clientes.filter((c) => c.nome.toLowerCase().includes(termo));
    document.getElementById('cliente-resultados').innerHTML = results.map((c) => `
      <button class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center justify-between" onclick='vincularCliente(${JSON.stringify(c.id)})'>
        <span>
          <span class="block text-sm font-medium">${c.nome}</span>
          <span class="block text-xs text-slate-400">Limite ${fmtBRL(c.limiteCredito)} · deve ${fmtBRL(c.saldoDevedor)}</span>
        </span>
      </button>`).join('') || `<p class="text-sm text-slate-400 px-2 py-3">Nenhum cliente encontrado. Cadastre em Clientes/Fiado.</p>`;
  };
  input.addEventListener('input', render);
  render();
  ativarNavegacaoLista(input, 'cliente-resultados', 'button');
}
function vincularCliente(id) {
  clienteSelecionado = DB.get('clientes', id);
  fecharModal();
  renderPage();
}
function removerCliente() { clienteSelecionado = null; renderPage(); }

// ---------------- F6 — caixa ----------------
function abrirCaixaModal() {
  const caixa = DB.getCaixaAberto();
  const cfg = DB.getConfig();
  const operadoresDatalist = `<datalist id="operadores-list">${(cfg.operadores || []).map((o) => `<option value="${o}">`).join('')}</datalist>`;
  const semUsuarios = DB.list('usuarios').length === 0
    ? `<p class="text-[11px] text-slate-400 mb-1">Dica: cadastre usuários em <strong>Usuários</strong> pra selecionar em vez de digitar toda vez.</p>` : '';
  let modalBox;
  if (caixa) {
    modalBox = abrirModal(`
      <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Fechar caixa</h3></div>
      <div class="p-4 space-y-3">
        <p class="text-sm text-slate-500">Aberto em ${fmtDataHora(caixa.dataAbertura)}${caixa.operadorAbertura ? ' por ' + caixa.operadorAbertura : ''}.</p>
        <p class="text-sm">Conferência cega: conte o dinheiro na gaveta e informe o valor abaixo. O sistema confere sozinho depois — o comparativo fica disponível em Financeiro → Fluxo de Caixa.</p>
        <label class="text-xs text-slate-500">Quem está fechando</label>
        ${seletorUsuariosHTML('operador-fechamento')}
        ${semUsuarios}
        <input id="operador-fechamento" data-autofocus list="operadores-list" class="input" placeholder="Seu nome" value="${caixa.operadorAbertura || ''}" />
        ${operadoresDatalist}
        <label class="text-xs text-slate-500">Valor contado agora na gaveta</label>
        <input id="valor-contado" type="text" inputmode="decimal" class="input" placeholder="0,00" />
        <button class="btn btn-danger w-full" onclick="confirmarFechamentoCaixa()">Fechar caixa</button>
      </div>`);
    ativarEnterSubmit(modalBox, () => confirmarFechamentoCaixa());
  } else {
    modalBox = abrirModal(`
      <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Abrir caixa</h3></div>
      <div class="p-4 space-y-3">
        <label class="text-xs text-slate-500">Quem está abrindo</label>
        ${seletorUsuariosHTML('operador-abertura')}
        ${semUsuarios}
        <input id="operador-abertura" data-autofocus list="operadores-list" class="input" placeholder="Seu nome" />
        ${operadoresDatalist}
        <label class="text-xs text-slate-500">Valor inicial (troco de abertura)</label>
        <input id="valor-abertura" type="text" inputmode="decimal" class="input" placeholder="0,00" />
        <button class="btn btn-success w-full" onclick="confirmarAberturaCaixa()">Abrir caixa</button>
      </div>`);
    ativarEnterSubmit(modalBox, () => confirmarAberturaCaixa());
  }
}
function confirmarAberturaCaixa() {
  const valor = parseMoeda(document.getElementById('valor-abertura').value);
  const operador = document.getElementById('operador-abertura').value.trim();
  if (!operador) { toast('Informe quem está abrindo o caixa', 'error'); return; }
  DB.insert('caixa', { dataAbertura: hojeISO(), valorAbertura: valor, movimentos: [], status: 'aberto', operadorAbertura: operador });
  lembrarOperador(operador);
  fecharModal();
  toast(`Caixa aberto por ${operador}`, 'success');
  atualizarBadgeCaixa();
  renderPage();
}
function confirmarFechamentoCaixa() {
  const caixa = DB.getCaixaAberto();
  const campoContado = document.getElementById('valor-contado');
  const contado = parseMoeda(campoContado.value);
  const operador = document.getElementById('operador-fechamento').value.trim();
  if (!operador) { toast('Informe quem está fechando o caixa', 'error'); return; }
  if (!campoContado.value.trim() || contado <= 0) {
    toast('Conte o dinheiro na gaveta e informe o valor — não é possível fechar o caixa com R$ 0,00', 'error');
    campoContado.focus();
    return;
  }
  const vendasCaixa = DB.list('vendas').filter((v) => v.caixaId === caixa.id && !v.estornada);
  // dinheiro líquido = valor pago em dinheiro MENOS o troco devolvido (o
  // troco não fica na gaveta) — se contasse o valor bruto, uma venda de
  // R$25 paga com nota de R$50 (com R$25 de troco) ia gerar uma "quebra"
  // fantasma de R$25 no fechamento
  const dinheiroVendas = vendasCaixa.reduce((s, v) => s + dinheiroLiquidoVenda(v), 0);
  const sangrias = caixa.movimentos.filter((m) => m.tipo === 'sangria').reduce((s, m) => s + m.valor, 0);
  const suprimentos = caixa.movimentos.filter((m) => m.tipo === 'suprimento').reduce((s, m) => s + m.valor, 0);
  const esperado = caixa.valorAbertura + dinheiroVendas + suprimentos - sangrias;
  const diferenca = contado - esperado;
  DB.update('caixa', caixa.id, { status: 'fechado', dataFechamento: hojeISO(), valorContado: contado, valorEsperado: esperado, diferenca, operadorFechamento: operador });
  lembrarOperador(operador);
  fecharModal();
  toast(diferenca === 0 ? 'Caixa fechado, conferência exata!' : `Caixa fechado. Diferença: ${fmtBRL(diferenca)}`, diferenca === 0 ? 'success' : 'warning');
  atualizarBadgeCaixa();
  renderPage();
  // fechamento de caixa é o momento mais natural do dia pra garantir um
  // backup — dispara sozinho, sem travar a tela (só funciona se tiver
  // uma pasta conectada em 📁 Dados; senão, não faz nada silenciosamente).
  // Isso é além do backup diário automático (a cada 24h) que roda mesmo
  // sem fechar o caixa — ver DataFolder.verificarBackupAutomatico em db.js
  if (typeof DataFolder !== 'undefined' && DataFolder.handle) {
    DataFolder.criarArquivoBackup().then((ok) => {
      if (ok) toast('📦 Backup do fechamento salvo na pasta', 'success');
    });
  }
}
/** Guarda o nome do operador na lista de sugestões (autocomplete) pra próxima vez */
function lembrarOperador(nome) {
  const cfg = DB.getConfig();
  const operadores = cfg.operadores || [];
  if (!operadores.includes(nome)) DB.setConfig({ ...cfg, operadores: [...operadores, nome] });
}

// ---------------- F7 — sangria / suprimento ----------------
function abrirMovimentoCaixaModal() {
  const caixa = DB.getCaixaAberto();
  if (!caixa) { toast('Abra o caixa primeiro (F6)', 'error'); return; }
  const cfg = DB.getConfig();
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Sangria / Suprimento</h3></div>
    <div class="p-4 space-y-3">
      <div id="tipo-mov-grupo" class="flex gap-2">
        <button id="tipo-sangria" class="btn btn-ghost flex-1" onclick="setTipoMov('sangria')">Sangria (retirada)</button>
        <button id="tipo-suprimento" class="btn btn-ghost flex-1" onclick="setTipoMov('suprimento')">Suprimento (entrada)</button>
      </div>
      <label class="text-xs text-slate-500">Quem está registrando</label>
      ${seletorUsuariosHTML('mov-operador')}
      <input id="mov-operador" data-autofocus list="operadores-list" class="input" placeholder="Seu nome" value="${caixa.operadorAbertura || ''}" />
      <datalist id="operadores-list">${(cfg.operadores || []).map((o) => `<option value="${o}">`).join('')}</datalist>
      <input id="mov-valor" type="text" inputmode="decimal" class="input" placeholder="Valor R$" />
      <input id="mov-motivo" type="text" class="input" placeholder="Motivo (opcional)" />
      <button class="btn btn-primary w-full" onclick="confirmarMovimento()">Registrar</button>
    </div>`);
  window.__tipoMov = 'sangria';
  setTipoMov('sangria');
  ativarNavegacaoGrade('tipo-mov-grupo');
  ativarEnterSubmit(modalBox, () => confirmarMovimento());
}
function setTipoMov(tipo) {
  window.__tipoMov = tipo;
  document.getElementById('tipo-sangria').classList.toggle('btn-primary', tipo === 'sangria');
  document.getElementById('tipo-suprimento').classList.toggle('btn-primary', tipo === 'suprimento');
}
function confirmarMovimento() {
  const caixa = DB.getCaixaAberto();
  const valor = parseMoeda(document.getElementById('mov-valor').value);
  const motivo = document.getElementById('mov-motivo').value;
  const operador = document.getElementById('mov-operador').value.trim();
  if (!operador) { toast('Informe quem está registrando esse movimento', 'error'); return; }
  if (valor <= 0) { toast('Informe um valor válido', 'error'); return; }
  const movimentos = [...caixa.movimentos, { tipo: window.__tipoMov, valor, motivo, operador, data: hojeISO() }];
  DB.update('caixa', caixa.id, { movimentos });
  lembrarOperador(operador);
  fecharModal();
  toast(`${window.__tipoMov === 'sangria' ? 'Sangria' : 'Suprimento'} registrado por ${operador}`, 'success');
}

// ---------------- F10 — pagamento / finalizar ----------------
let pagamentos = [];
let modoDinheiroAtivo = false;
function abrirPagamentoModal() {
  if (cart.length === 0) { toast('Carrinho vazio', 'warning'); return; }
  const caixa = DB.getCaixaAberto();
  if (!caixa) { toast('Abra o caixa antes de finalizar a venda (F6)', 'error'); return; }
  pagamentos = [];
  modoDinheiroAtivo = false;
  renderPagamentoModal();
}
function renderPagamentoModal() {
  const total = totalCarrinho();
  const pago = pagamentos.reduce((s, p) => s + p.valor, 0);
  const dinheiroTotal = pagamentos.filter((p) => p.forma === 'dinheiro').reduce((s, p) => s + p.valor, 0);
  const excedente = Math.max(0, pago - total);
  const troco = Math.min(dinheiroTotal, excedente);
  const restante = Math.max(0, total - pago);

  // Enquanto o operador digita o valor recebido em dinheiro, mostra um
  // formulário simples embutido no modal (em vez do prompt() padrão do
  // navegador). Débito/Crédito/Pix/Fiado não perguntam valor: são
  // sempre o valor restante da venda, então já entram direto ao clicar.
  const areaFormas = modoDinheiroAtivo ? `
    <div id="dinheiro-inline" class="space-y-2">
      <label class="text-xs text-slate-500">Valor recebido em dinheiro</label>
      <input id="dinheiro-valor" data-autofocus type="text" inputmode="decimal" class="input text-lg text-center"
        value="" placeholder="Ex: ${fmtBRL(restante)}" />
      <p id="dinheiro-troco-preview" class="text-center text-sm text-[--color-success] font-medium h-4"></p>
      <div class="flex gap-2">
        <button class="btn btn-success flex-1" onclick="confirmarValorDinheiro()">Adicionar</button>
        <button class="btn btn-ghost" onclick="cancelarValorDinheiro()">Cancelar</button>
      </div>
    </div>
  ` : `
    <div id="pagamento-formas" class="space-y-2">
      <div class="grid grid-cols-4 gap-2">
        <button class="btn btn-ghost text-xs py-2" onclick="abrirValorDinheiro()">💵 Dinheiro</button>
        ${payBtn('debito', '💳 Débito')}
        ${payBtn('credito', '💳 Crédito')}
        ${payBtn('pix', '🔁 Pix')}
      </div>
      <button class="btn btn-ghost w-full ${clienteSelecionado ? '' : 'opacity-50 pointer-events-none'}" ${clienteSelecionado ? '' : 'disabled'} onclick="addPagamentoForma('fiado')">
        📒 Fiado ${clienteSelecionado ? `— ${clienteSelecionado.nome}` : '(vincule um cliente com F1)'}
      </button>
      <p class="text-[11px] text-slate-400">Débito/Crédito/Pix/Fiado usam direto o valor restante. Use as setas ← → ↑ ↓ e Enter pra escolher.</p>
    </div>
  `;

  abrirModal(`
    <div class="p-4 border-b border-[--color-border] flex items-center justify-between">
      <h3 class="font-semibold text-sm">Finalizar venda (F10)</h3>
      <span class="text-lg font-bold text-[--color-primary]">${fmtBRL(total)}</span>
    </div>
    <div class="p-4 space-y-3">
      ${areaFormas}

      <div class="border-t border-[--color-border] pt-3 space-y-1.5 max-h-40 overflow-y-auto">
        ${pagamentos.length === 0 ? `<p class="text-xs text-slate-400">Nenhum pagamento adicionado ainda.</p>` :
          pagamentos.map((p, i) => `
            <div class="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-1.5">
              <span class="capitalize">${p.forma}</span>
              <span class="tabular-nums font-medium">${fmtBRL(p.valor)}</span>
              <button class="text-slate-400 hover:text-[--color-danger]" onclick="removerPagamento(${i})">✕</button>
            </div>`).join('')}
      </div>

      <div class="text-sm space-y-1 pt-2">
        <div class="flex justify-between"><span class="text-slate-500">Pago</span><span class="tabular-nums font-medium">${fmtBRL(pago)}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Restante</span><span class="tabular-nums font-medium ${restante > 0 ? 'text-[--color-danger]' : ''}">${fmtBRL(restante)}</span></div>
        ${troco > 0 ? `<div class="flex justify-between"><span class="text-slate-500">Troco</span><span class="tabular-nums font-bold text-[--color-success]">${fmtBRL(troco)}</span></div>` : ''}
      </div>

      <button id="btn-confirmar-venda" class="btn btn-success w-full py-3 text-base" ${restante > 0.001 ? 'disabled' : ''} onclick="confirmarVenda()">Confirmar venda</button>
    </div>
  `);

  if (modoDinheiroAtivo) {
    const campoValor = document.getElementById('dinheiro-valor');
    const atualizarTrocoPreview = () => {
      const v = parseMoeda(campoValor.value);
      const trocoPrev = Math.max(0, v - restante);
      document.getElementById('dinheiro-troco-preview').textContent = trocoPrev > 0 ? `Troco: ${fmtBRL(trocoPrev)}` : '';
    };
    campoValor.addEventListener('input', atualizarTrocoPreview);
    campoValor.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); confirmarValorDinheiro(); } });
    atualizarTrocoPreview();
  } else {
    ativarNavegacaoGrade('pagamento-formas');
  }

  // se o valor já cobre o total, joga o foco direto pro botão de
  // confirmar — assim um Enter a mais já finaliza a venda
  if (restante <= 0.001) {
    const btnConfirmar = document.getElementById('btn-confirmar-venda');
    if (btnConfirmar) setTimeout(() => btnConfirmar.focus(), 60);
  }
}
function payBtn(forma, label) {
  return `<button class="btn btn-ghost text-xs py-2" onclick="addPagamentoForma('${forma}')">${label}</button>`;
}
function abrirValorDinheiro() {
  modoDinheiroAtivo = true;
  renderPagamentoModal();
}
function cancelarValorDinheiro() {
  modoDinheiroAtivo = false;
  renderPagamentoModal();
}
function confirmarValorDinheiro() {
  const campo = document.getElementById('dinheiro-valor');
  const valor = parseMoeda(campo.value);
  if (valor <= 0) { toast('Informe um valor válido', 'error'); return; }
  pagamentos.push({ forma: 'dinheiro', valor });
  modoDinheiroAtivo = false;
  renderPagamentoModal();
}
// Débito, Crédito, Pix e Fiado não pedem valor: são sempre o valor
// restante da venda (limitado ao crédito disponível, no caso do fiado).
// Só o dinheiro pergunta o valor, porque é o único que pode gerar troco.
function addPagamentoForma(forma) {
  const total = totalCarrinho();
  const pago = pagamentos.reduce((s, p) => s + p.valor, 0);
  let valor = Math.max(total - pago, 0);
  if (valor <= 0) return;
  if (forma === 'fiado') {
    if (!clienteSelecionado) { toast('Vincule um cliente antes de usar fiado (F1)', 'error'); return; }
    const disponivel = clienteSelecionado.limiteCredito - clienteSelecionado.saldoDevedor;
    valor = Math.min(valor, Math.max(disponivel, 0));
    if (valor <= 0) { toast('Cliente sem limite de crédito disponível', 'error'); return; }
  }
  pagamentos.push({ forma, valor });
  renderPagamentoModal();
}
function removerPagamento(i) { pagamentos.splice(i, 1); renderPagamentoModal(); }

function confirmarVenda() {
  const caixa = DB.getCaixaAberto();
  const total = totalCarrinho();
  const valorFiado = pagamentos.filter((p) => p.forma === 'fiado').reduce((s, p) => s + p.valor, 0);
  const pago = pagamentos.reduce((s, p) => s + p.valor, 0);
  const dinheiroTotal = pagamentos.filter((p) => p.forma === 'dinheiro').reduce((s, p) => s + p.valor, 0);
  const troco = Math.min(dinheiroTotal, Math.max(0, pago - total));

  // baixa de estoque
  cart.forEach((it) => {
    const produto = DB.get('produtos', it.produtoId);
    if (produto) DB.update('produtos', produto.id, { estoqueAtual: Number((produto.estoqueAtual - it.qtd).toFixed(3)) });
  });

  const venda = DB.insert('vendas', {
    data: hojeISO(),
    caixaId: caixa.id,
    itens: cart.map((it) => ({ ...it })),
    pagamentos: [...pagamentos],
    total,
    troco, // valor devolvido em troco — NÃO fica na gaveta, precisa ser descontado no fechamento de caixa
    clienteId: clienteSelecionado ? clienteSelecionado.id : null,
  });

  if (valorFiado > 0 && clienteSelecionado) {
    DB.update('clientes', clienteSelecionado.id, { saldoDevedor: Number((clienteSelecionado.saldoDevedor + valorFiado).toFixed(2)) });
  }

  fecharModal();
  imprimirComprovante(venda);
  toast('Venda concluída com sucesso!', 'success');
  cart = [];
  clienteSelecionado = null;
  selectedRowIndex = null;
  pagamentos = [];
  modoDinheiroAtivo = false;
  renderPage();
}

// ---------------- impressão térmica 58/80mm ----------------
function imprimirComprovante(venda) {
  const cfg = DB.getConfig();
  const largura = cfg.larguraBobina === '58' ? '58mm' : '80mm';
  document.documentElement.style.setProperty('--receipt-width', largura);
  const linhas = venda.itens.map((it) => `
    <div style="display:flex;justify-content:space-between;">
      <span>${it.qtd}x ${it.nome.slice(0, 22)}</span>
      <span>${fmtBRL(it.precoUnit * it.qtd - it.descontoItem)}</span>
    </div>`).join('');
  const pags = venda.pagamentos.map((p) => `
    <div style="display:flex;justify-content:space-between;"><span>${p.forma}</span><span>${fmtBRL(p.valor)}</span></div>`).join('');

  document.getElementById('print-receipt').innerHTML = `
    <div style="text-align:center;">
      <strong>${cfg.nomeLoja}</strong><br/>
      ${cfg.endereco}<br/>
      ${cfg.cnpj ? 'CNPJ: ' + cfg.cnpj + '<br/>' : ''}
    </div>
    <div class="receipt-line"></div>
    <div>Data: ${fmtDataHora(venda.data)}</div>
    <div>Comprovante não fiscal — venda ${venda.id.slice(-6).toUpperCase()}</div>
    <div class="receipt-line"></div>
    ${linhas}
    <div class="receipt-line"></div>
    <div style="display:flex;justify-content:space-between;font-weight:bold;"><span>TOTAL</span><span>${fmtBRL(venda.total)}</span></div>
    <div class="receipt-line"></div>
    ${pags}
    <div class="receipt-line"></div>
    <div style="text-align:center;">Obrigado pela preferência!</div>
  `;
  setTimeout(() => window.print(), 150);
}
