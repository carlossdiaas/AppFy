/**
 * estoque.js — Controle de Estoque
 */
let estoqueAba = 'produtos';
let filtroCategoria = '';
let filtroTexto = '';
let modalAberto = null;
let xmlItensParseados = [];

document.addEventListener('DOMContentLoaded', () => {
  protegerPagina(() => {
    renderShell('estoque.html', 'Controle de Estoque');
    renderPage();
  });
});

function fecharModal() { if (modalAberto) { modalAberto.remove(); modalAberto = null; } }
function abrirModal(html) {
  fecharModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
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
  const produtos = DB.list('produtos');
  const zerados = produtos.filter((p) => p.estoqueAtual <= 0).length;
  const baixos = produtos.filter((p) => p.estoqueAtual > 0 && p.estoqueAtual <= p.estoqueMinimo).length;
  const vencendoOuVencido = produtos.filter((p) => p.validade && diasParaValidade(p.validade) <= 7).length;

  content.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
      ${statCardIcon('box', 'blue', 'Produtos cadastrados', produtos.length)}
      ${statCardIcon('warning', baixos > 0 ? 'amber' : 'slate', 'Estoque baixo', baixos)}
      ${statCardIcon('warning', zerados > 0 ? 'red' : 'slate', 'Sem estoque', zerados)}
      ${statCardIcon('warning', vencendoOuVencido > 0 ? 'amber' : 'slate', 'Vencendo/vencido', vencendoOuVencido, 'próximos 7 dias')}
    </div>

    <div class="flex items-center gap-2 mb-3">
      <button class="btn ${estoqueAba === 'produtos' ? 'btn-primary' : 'btn-ghost'}" onclick="setAba('produtos')">Produtos</button>
      <button class="btn ${estoqueAba === 'entrada' ? 'btn-primary' : 'btn-ghost'}" onclick="setAba('entrada')">Entrada de Mercadoria</button>
      <button class="btn ${estoqueAba === 'xml' ? 'btn-primary' : 'btn-ghost'}" onclick="setAba('xml')">Importar XML</button>
      <div class="flex-1"></div>
      ${estoqueAba === 'produtos' ? `<button class="btn btn-success" onclick="abrirProdutoModal()">+ Novo produto</button>` : ''}
    </div>

    ${estoqueAba === 'produtos' ? renderProdutosTab(produtos) : estoqueAba === 'entrada' ? renderEntradaTab(produtos) : renderXmlTab()}
  `;
}

function setAba(aba) {
  estoqueAba = aba;
  renderPage();
  if (aba === 'entrada') {
    const campo = document.getElementById('e-busca-codigo');
    if (campo) setTimeout(() => campo.focus(), 30);
  }
}

/** Bipa/digita o código (ou nome) do produto e já seleciona ele no combo de entrada */
function buscarProdutoEntradaPorCodigo() {
  const campo = document.getElementById('e-busca-codigo');
  const valor = campo.value.trim();
  if (!valor) return;

  const produtos = DB.list('produtos');
  let produto = produtos.find((p) => p.codigo === valor);
  if (!produto) {
    const termo = valor.toLowerCase();
    const encontrados = produtos.filter((p) => p.nome.toLowerCase().includes(termo));
    if (encontrados.length === 1) {
      produto = encontrados[0];
    } else if (encontrados.length > 1) {
      toast(`${encontrados.length} produtos encontrados — refine a busca ou selecione na lista abaixo`, 'warning');
      return;
    }
  }
  if (!produto) { toast(`Produto não encontrado para "${valor}"`, 'error'); return; }

  const select = document.getElementById('e-produto');
  if (select) select.value = produto.id;
  campo.value = '';
  toast(`${produto.nome} selecionado`, 'success');
  const campoQtd = document.getElementById('e-qtd');
  if (campoQtd) campoQtd.focus();
}

function renderProdutosTab(produtos) {
  const categorias = DB.list('categorias');
  const filtrados = produtos.filter((p) =>
    (!filtroCategoria || p.categoria === filtroCategoria) &&
    (!filtroTexto || p.nome.toLowerCase().includes(filtroTexto.toLowerCase()) || p.codigo.includes(filtroTexto))
  );

  return `
    <div class="card">
      <div class="p-3 border-b border-[--color-border] flex flex-wrap gap-2 items-center">
        <input class="input max-w-xs" placeholder="Buscar por nome ou código…" value="${filtroTexto}" oninput="filtroTexto=this.value; renderPage()" />
        <select class="input max-w-[180px]" onchange="filtroCategoria=this.value; renderPage()">
          <option value="">Todas categorias</option>
          ${categorias.map((c) => `<option value="${c}" ${filtroCategoria === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <span class="text-xs text-slate-400 ml-auto">${filtrados.length} produto(s)</span>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead><tr>
            <th>Produto</th><th>Categoria</th><th>Custo</th><th>Venda</th><th>Margem</th><th>Estoque</th><th></th>
          </tr></thead>
          <tbody>
            ${filtrados.map((p) => produtoRow(p)).join('') || `<tr><td colspan="7" class="text-center text-slate-400 py-8">Nenhum produto encontrado</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function produtoRow(p) {
  let estoqueBadge = `<span class="badge badge-ok">${p.estoqueAtual} ${p.unidade}</span>`;
  if (p.estoqueAtual <= 0) estoqueBadge = `<span class="badge badge-danger">Zerado</span>`;
  else if (p.estoqueAtual <= p.estoqueMinimo) estoqueBadge = `<span class="badge badge-warn">${p.estoqueAtual} ${p.unidade} · baixo</span>`;

  const fardoInfo = (p.precoFardo > 0 && p.qtdFardo > 0)
    ? `<p class="text-[11px] text-[--color-primary]">🎁 ${fmtBRL(p.precoFardo)} a partir de ${p.qtdFardo} un.</p>`
    : '';

  let validadeInfo = '';
  if (p.validade) {
    const dias = diasParaValidade(p.validade);
    if (dias < 0) validadeInfo = `<p class="text-[11px] text-[--color-danger]">⏰ Venceu em ${fmtData(p.validade)}</p>`;
    else if (dias <= 7) validadeInfo = `<p class="text-[11px] text-[--color-warning]">⏰ Vence em ${dias === 0 ? 'hoje' : dias + ' dia(s)'}</p>`;
    else validadeInfo = `<p class="text-[11px] text-slate-400">Validade: ${fmtData(p.validade)}</p>`;
  }

  return `
    <tr>
      <td><p class="font-medium">${p.nome}</p><p class="text-xs text-slate-400">${p.codigo}</p>${fardoInfo}${validadeInfo}</td>
      <td><span class="badge badge-neutral">${p.categoria}</span></td>
      <td class="tabular-nums">${fmtBRL(p.precoCusto)}</td>
      <td class="tabular-nums font-medium">${fmtBRL(p.precoVenda)}</td>
      <td class="tabular-nums">${p.margem}%</td>
      <td>${estoqueBadge}</td>
      <td class="whitespace-nowrap">
        <button class="text-slate-400 hover:text-[--color-primary] mr-2" onclick='abrirProdutoModal(${JSON.stringify(p.id)})'>Editar</button>
        <button class="text-slate-400 hover:text-[--color-primary] mr-2" onclick='imprimirEtiquetaProduto(${JSON.stringify(p.id)})' title="Imprimir etiqueta de preço">🏷️</button>
        <button class="text-slate-400 hover:text-[--color-danger]" onclick='excluirProduto(${JSON.stringify(p.id)})'>Excluir</button>
      </td>
    </tr>`;
}

function abrirProdutoModal(id) {
  const p = id ? DB.get('produtos', id) : null;
  const categorias = DB.list('categorias');
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">${p ? 'Editar produto' : 'Novo produto'}</h3></div>
    <div class="p-4 space-y-3">
      <div>
        <label class="text-xs text-slate-500">Código de barras</label>
        <div class="flex gap-2 mt-1">
          <input id="f-codigo" data-autofocus class="input flex-1" value="${p?.codigo || ''}" />
          ${!p ? `<button type="button" class="btn btn-ghost text-xs whitespace-nowrap" onclick="buscarNomePorCodigo()">🔎 Buscar nome</button>` : ''}
        </div>
        ${!p ? `<p class="text-[11px] text-slate-400 mt-1">Consulta uma base pública pelo código de barras para preencher o nome. Se não encontrar (ou sem internet), é só preencher manualmente.</p>` : ''}
      </div>
      <div><label class="text-xs text-slate-500">Nome</label><input id="f-nome" class="input mt-1" value="${p?.nome || ''}" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-slate-500">Categoria</label>
          <input id="f-categoria" list="cat-list" class="input mt-1" value="${p?.categoria || ''}" />
          <datalist id="cat-list">${categorias.map((c) => `<option value="${c}">`).join('')}</datalist>
        </div>
        <div>
          <label class="text-xs text-slate-500">Unidade</label>
          <select id="f-unidade" class="input mt-1">
            ${['UN', 'KG', 'CX', 'FD', 'L'].map((u) => `<option ${p?.unidade === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Preço de custo</label><input id="f-custo" type="text" inputmode="decimal" class="input mt-1" value="${p ? paraCampoDecimal(p.precoCusto) : ''}" /></div>
        <div><label class="text-xs text-slate-500">Preço de venda</label><input id="f-venda" type="text" inputmode="decimal" class="input mt-1" value="${p ? paraCampoDecimal(p.precoVenda) : ''}" />${botoesMarkupHTML('f-custo', 'f-venda')}</div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Estoque atual</label><input id="f-estoque" type="text" inputmode="decimal" class="input mt-1" value="${p ? paraCampoQuantidade(p.estoqueAtual) : '0'}" /></div>
        <div><label class="text-xs text-slate-500">Estoque mínimo</label><input id="f-minimo" type="text" inputmode="decimal" class="input mt-1" value="${p ? paraCampoQuantidade(p.estoqueMinimo) : '0'}" /></div>
      </div>
      <div><label class="text-xs text-slate-500">Validade (opcional — pra produtos perecíveis: padaria, hortifruti...)</label><input id="f-validade" type="date" class="input mt-1" value="${p?.validade || ''}" /></div>

      <div class="border-t border-[--color-border] pt-3">
        <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input id="f-tem-fardo" type="checkbox" ${p?.qtdFardo > 0 ? 'checked' : ''} onchange="alternarBlocoFardo()" />
          🎁 Esse produto tem preço de fardo/pacote (opcional)
        </label>
        <div id="bloco-fardo" class="mt-2 ${p?.qtdFardo > 0 ? '' : 'hidden'}">
          <p class="text-[11px] text-slate-400 mb-2">Ao bipar esse produto e a quantidade no carrinho bater o número abaixo, o sistema troca automaticamente pro preço do fardo.</p>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs text-slate-500">A partir de quantas unidades</label><input id="f-qtd-fardo" type="text" inputmode="numeric" class="input mt-1" value="${p?.qtdFardo || ''}" placeholder="Ex: 12" /></div>
            <div><label class="text-xs text-slate-500">Preço do fardo (o pacote inteiro)</label><input id="f-preco-fardo" type="text" inputmode="decimal" class="input mt-1" value="${p?.precoFardo ? paraCampoDecimal(p.precoFardo) : ''}" placeholder="Ex: 45,00" /></div>
          </div>
        </div>
      </div>

      <p id="f-margem-preview" class="text-xs text-slate-400"></p>
      <div class="flex gap-2 pt-2">
        <button class="btn btn-primary flex-1" onclick='salvarProduto(${JSON.stringify(p?.id || null)})'>Salvar</button>
        <button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
      </div>
    </div>
  `);
  const atualizarPreview = () => {
    const custo = parseMoeda(document.getElementById('f-custo').value);
    const venda = parseMoeda(document.getElementById('f-venda').value);
    const margem = custo > 0 ? (((venda - custo) / custo) * 100).toFixed(1) : '0.0';
    document.getElementById('f-margem-preview').textContent = `Margem de lucro estimada: ${margem}%`;
  };
  ['f-custo', 'f-venda'].forEach((id) => document.getElementById(id).addEventListener('input', atualizarPreview));
  atualizarPreview();
  ativarEnterSubmit(modalBox, () => salvarProduto(p?.id || null));
}

function alternarBlocoFardo() {
  const ligado = document.getElementById('f-tem-fardo').checked;
  document.getElementById('bloco-fardo').classList.toggle('hidden', !ligado);
}

async function buscarNomePorCodigo() {
  const campoCodigo = document.getElementById('f-codigo');
  const codigo = campoCodigo.value.trim();
  if (!codigo) { toast('Digite o código de barras primeiro', 'warning'); return; }
  toast('Consultando código de barras…', 'info');
  const info = await consultarCodigoBarrasExterno(codigo);
  if (info) {
    const campoNome = document.getElementById('f-nome');
    if (campoNome) campoNome.value = info.nome;
    toast('Nome preenchido a partir do código de barras', 'success');
  } else {
    toast('Não encontrado (ou sem internet). Preencha o nome manualmente.', 'warning');
  }
}

function salvarProduto(id) {
  const codigo = document.getElementById('f-codigo').value.trim();
  const nome = document.getElementById('f-nome').value.trim();
  const categoria = document.getElementById('f-categoria').value.trim() || 'Geral';
  const unidade = document.getElementById('f-unidade').value;
  const precoCusto = parseMoeda(document.getElementById('f-custo').value);
  const precoVendaDigitado = parseMoeda(document.getElementById('f-venda').value);
  const estoqueAtual = parseMoeda(document.getElementById('f-estoque').value);
  const estoqueMinimo = parseMoeda(document.getElementById('f-minimo').value);
  const qtdFardo = parseInt(document.getElementById('f-qtd-fardo').value, 10) || 0;
  const precoFardo = parseMoeda(document.getElementById('f-preco-fardo').value);

  if (!codigo || !nome) { toast('Preencha código e nome do produto', 'error'); return; }
  if ((qtdFardo > 0) !== (precoFardo > 0)) {
    toast('Pra usar preço de fardo, preencha os dois campos: quantidade e preço', 'error');
    return;
  }

  const precoVenda = aplicarMarkupSeVazio(precoCusto, precoVendaDigitado);
  if (precoVendaDigitado <= 0 && precoVenda > 0) {
    toast(`Preço de venda não informado — aplicado markup automático de 25% (${fmtBRL(precoVenda)})`, 'info');
  }

  const margem = precoCusto > 0 ? (((precoVenda - precoCusto) / precoCusto) * 100).toFixed(1) : '0.0';
  const validade = document.getElementById('f-validade').value || null;
  const dados = { codigo, nome, categoria, unidade, precoCusto, precoVenda, estoqueAtual, estoqueMinimo, margem, qtdFardo, precoFardo, validade };

  if (id) DB.update('produtos', id, dados);
  else DB.insert('produtos', dados);

  const categorias = DB.list('categorias');
  if (!categorias.includes(categoria)) DB.replaceAll('categorias', [...categorias, categoria]);

  fecharModal();
  toast('Produto salvo', 'success');
  renderPage();
}

function excluirProduto(id) {
  if (confirmDialog('Excluir este produto do cadastro?')) {
    DB.remove('produtos', id);
    renderPage();
    toast('Produto excluído', 'warning');
  }
}

/** Imprime uma etiqueta simples de preço pra colar no produto (nome, código, preço) */
function imprimirEtiquetaProduto(id) {
  const p = DB.get('produtos', id);
  if (!p) return;
  let el = document.getElementById('print-label');
  if (!el) {
    el = document.createElement('div');
    el.id = 'print-label';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div style="text-align:center;font-weight:bold;font-size:12px;line-height:1.3;">${p.nome}</div>
    <div style="text-align:center;font-size:9px;color:#333;margin:2px 0;">${p.codigo}</div>
    <div style="text-align:center;font-size:20px;font-weight:bold;margin:3px 0;">${fmtBRL(p.precoVenda)}</div>
    ${p.precoFardo > 0 && p.qtdFardo > 0 ? `<div style="text-align:center;font-size:9px;">Fardo (${p.qtdFardo} un): ${fmtBRL(p.precoFardo)}</div>` : ''}
  `;
  setTimeout(() => window.print(), 150);
}

// ---------------- entrada de mercadorias ----------------
function renderEntradaTab(produtos) {
  const entradas = DB.list('entradas').slice().reverse().slice(0, 30);
  return `
    <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
      <div class="card p-4">
        <h3 class="font-semibold text-sm mb-3">Registrar entrada de mercadoria</h3>
        <label class="text-xs text-slate-500">Bipar código de barras (ou digitar o nome)</label>
        <input id="e-busca-codigo" type="text" class="input mt-1 mb-3 scanner-input" placeholder="Bipe o produto ou digite pra buscar…" autocomplete="off"
          onkeydown="if(event.key==='Enter'){event.preventDefault();buscarProdutoEntradaPorCodigo();}" />
        <label class="text-xs text-slate-500">Produto</label>
        <select id="e-produto" class="input mt-1 mb-3">
          ${produtos.map((p) => `<option value="${p.id}">${p.nome} (${p.codigo})</option>`).join('')}
        </select>
        <label class="text-xs text-slate-500">Quantidade recebida</label>
        <input id="e-qtd" type="text" inputmode="decimal" class="input mt-1 mb-3" placeholder="0" onkeydown="if(event.key==='Enter'){event.preventDefault();registrarEntrada();}" />
        <label class="text-xs text-slate-500">Custo unitário desta compra</label>
        <input id="e-custo" type="text" inputmode="decimal" class="input mt-1 mb-3" placeholder="0,00" onkeydown="if(event.key==='Enter'){event.preventDefault();registrarEntrada();}" />
        <label class="text-xs text-slate-500">Fornecedor</label>
        <input id="e-fornecedor" type="text" list="fornecedores-list" class="input mt-1 mb-3" placeholder="Opcional" onkeydown="if(event.key==='Enter'){event.preventDefault();registrarEntrada();}" />
        <datalist id="fornecedores-list">${DB.list('fornecedores').map((f) => `<option value="${f.nome}">`).join('')}</datalist>
        <button class="btn btn-success w-full" onclick="registrarEntrada()">Registrar entrada</button>
        <p class="text-xs text-slate-400 mt-2">O custo médio do produto é recalculado automaticamente pela quantidade recebida.</p>
      </div>
      <div class="card">
        <div class="p-3 border-b border-[--color-border] text-sm font-semibold">Últimas entradas</div>
        <table class="data-table">
          <thead><tr><th>Data</th><th>Produto</th><th>Qtd</th><th>Custo unit.</th><th>Fornecedor</th></tr></thead>
          <tbody>
            ${entradas.map((e) => {
              const p = DB.get('produtos', e.produtoId);
              return `<tr><td>${fmtDataHora(e.data)}</td><td>${p ? p.nome : '—'}</td><td class="tabular-nums">${e.quantidade}</td><td class="tabular-nums">${fmtBRL(e.custoUnit)}</td><td>${e.fornecedor || '—'}</td></tr>`;
            }).join('') || `<tr><td colspan="5" class="text-center text-slate-400 py-8">Nenhuma entrada registrada</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function registrarEntrada() {
  const produtoId = document.getElementById('e-produto').value;
  const qtd = parseMoeda(document.getElementById('e-qtd').value);
  const custoUnit = parseMoeda(document.getElementById('e-custo').value);
  const fornecedor = document.getElementById('e-fornecedor').value.trim();
  if (!produtoId || qtd <= 0 || custoUnit <= 0) { toast('Informe produto, quantidade e custo válidos', 'error'); return; }

  const produto = DB.get('produtos', produtoId);
  const novoEstoque = Number((produto.estoqueAtual + qtd).toFixed(3));
  const custoMedio = novoEstoque > 0
    ? Number(((produto.estoqueAtual * produto.precoCusto + qtd * custoUnit) / novoEstoque).toFixed(4))
    : custoUnit;

  // se por algum motivo o produto ainda estava sem preço de venda definido,
  // aproveita a entrada (que já tem o custo) pra aplicar o markup automático
  const dadosAtualizados = { estoqueAtual: novoEstoque, precoCusto: custoMedio };
  if (produto.precoVenda <= 0) {
    dadosAtualizados.precoVenda = aplicarMarkupSeVazio(custoMedio, 0);
    toast(`Produto estava sem preço de venda — aplicado markup automático de 25% (${fmtBRL(dadosAtualizados.precoVenda)})`, 'info');
  }
  dadosAtualizados.margem = custoMedio > 0
    ? (((dadosAtualizados.precoVenda ?? produto.precoVenda) - custoMedio) / custoMedio * 100).toFixed(1)
    : produto.margem;

  DB.update('produtos', produtoId, dadosAtualizados);
  DB.insert('entradas', { produtoId, quantidade: qtd, custoUnit, fornecedor, data: hojeISO() });

  toast('Entrada registrada e custo médio atualizado', 'success');
  document.getElementById('e-qtd').value = '';
  document.getElementById('e-custo').value = '';
  document.getElementById('e-fornecedor').value = '';
  renderPage();
}

// ---------------- importação de XML (NF-e) para entrada em lote ----------------
function renderXmlTab() {
  return `
    <div class="card p-4">
      <h3 class="font-semibold text-sm mb-1">Importar XML de nota fiscal (NF-e)</h3>
      <p class="text-xs text-slate-400 mb-3">
        Envie o arquivo XML da nota de compra do fornecedor. Para produtos já cadastrados, o sistema
        mostra o <strong>preço que já está no seu estoque</strong> lado a lado com o
        <strong>preço que chegou na nota</strong>, com um aviso ▲/▼ se subiu ou baixou — e você pode
        ajustar o valor antes de confirmar. Produtos que ainda não existem no seu cadastro ganham um
        botão para cadastrar rapidamente, já com nome, unidade e custo preenchidos.
      </p>
      <p class="text-xs text-slate-400 mb-3">
        📦 <strong>Vem em caixa (CX12, CX24...)?</strong> Quando o produto no seu cadastro usa uma unidade
        diferente da nota, o sistema tenta descobrir sozinho quantas unidades tem em cada caixa (pela
        própria nota, ou pelo texto "CX12", "C/24" etc.) e já converte a entrada pra unidade — mas
        sempre mostra o campo pra você conferir e corrigir se precisar.
      </p>
      <label class="btn btn-primary inline-flex cursor-pointer w-fit">
        📄 Selecionar arquivo XML
        <input type="file" accept=".xml,text/xml" class="hidden" onchange="lerArquivoXML(event)" />
      </label>
      <div id="xml-preview" class="mt-4"></div>
    </div>
  `;
}

function lerArquivoXML(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      xmlItensParseados = parseNFeXML(reader.result);
      if (xmlItensParseados.length === 0) toast('Nenhum item de produto foi encontrado nesse XML', 'warning');
      renderXmlPreview();
    } catch (err) {
      console.error(err);
      toast('Não foi possível ler este arquivo. Verifique se é um XML de NF-e válido.', 'error');
    }
  };
  reader.onerror = () => toast('Erro ao ler o arquivo', 'error');
  reader.readAsText(file);
}

/**
 * Busca o produto cadastrado que corresponde a um item da nota, em
 * camadas de confiança (para quando a caixa e a unidade têm códigos de
 * barras diferentes, muito comum em notas de distribuidor):
 *  1) código interno do fornecedor (cProd)
 *  2) EAN da unidade comercial da nota (cEAN — pode ser o EAN da caixa)
 *  3) EAN da unidade tributável (cEANTrib — geralmente o EAN da unidade individual)
 *  4) vínculo manual salvo numa importação anterior (💾 "🔗 Vincular")
 */
function buscarProdutoPorCodigosNF({ cProd, cEAN, cEANTrib }, produtosLocais) {
  let p = produtosLocais.find((prod) => prod.codigo === cProd);
  if (p) return p;
  if (cEAN && cEAN !== 'SEM GTIN') {
    p = produtosLocais.find((prod) => prod.codigo === cEAN);
    if (p) return p;
  }
  if (cEANTrib && cEANTrib !== 'SEM GTIN') {
    p = produtosLocais.find((prod) => prod.codigo === cEANTrib);
    if (p) return p;
  }
  const chaves = [cProd, cEAN, cEANTrib].filter((c) => c && c !== 'SEM GTIN');
  if (chaves.length === 0) return null;
  const mapeamentos = DB.list('mapeamentosCodigoNF');
  const mapa = mapeamentos.find((m) => chaves.includes(m.codigoNF));
  if (mapa) return produtosLocais.find((prod) => prod.id === mapa.produtoId) || null;
  return null;
}

function parseNFeXML(texto) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(texto, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('XML inválido');

  const pegar = (el, tag) => el.getElementsByTagName(tag)[0]?.textContent?.trim() || '';
  const dets = Array.from(doc.getElementsByTagName('det'));
  const produtosLocais = DB.list('produtos');

  return dets.map((det) => {
    const prod = det.getElementsByTagName('prod')[0];
    if (!prod) return null;
    const cProd = pegar(prod, 'cProd');
    const cEAN = pegar(prod, 'cEAN');
    const cEANTrib = pegar(prod, 'cEANTrib'); // GTIN da unidade tributável — costuma ser o EAN da unidade individual, diferente do EAN da caixa
    const xProd = pegar(prod, 'xProd');
    const uCom = pegar(prod, 'uCom') || 'UN';
    const qCom = Number((pegar(prod, 'qCom') || '0').replace(',', '.'));
    const vUnCom = Number((pegar(prod, 'vUnCom') || '0').replace(',', '.'));
    // uTrib/qTrib: muitas notas de distribuidor já declaram a "unidade
    // tributável" na unidade individual (ex: vende por CX mas tributa por
    // UN) — quando isso existe, é a forma mais confiável de saber quantas
    // unidades tem dentro da caixa, sem precisar adivinhar.
    const uTrib = pegar(prod, 'uTrib') || uCom;
    const qTrib = Number((pegar(prod, 'qTrib') || pegar(prod, 'qCom') || '0').replace(',', '.'));

    // busca em camadas: código interno do fornecedor -> EAN da caixa ->
    // EAN da unidade (cEANTrib, frequentemente diferente do EAN da caixa)
    // -> vínculo manual salvo de uma importação anterior
    const match = buscarProdutoPorCodigosNF({ cProd, cEAN, cEANTrib }, produtosLocais);

    // só sugere conversão de caixa->unidade quando o produto já cadastrado
    // usa uma unidade diferente da que veio na nota (ex: nota em "CX",
    // cadastro em "UN") — se for igual, não tem nada pra converter
    const precisaConversao = !!match && match.unidade !== uCom;
    const multiplicador = precisaConversao ? detectarMultiplicadorCaixa({ uCom, xProd, qCom, uTrib, qTrib }) : 1;

    return {
      cProd, cEAN, cEANTrib, xProd, uCom, qCom, vUnCom, uTrib, qTrib,
      produtoId: match ? match.id : null,
      nomeAtual: match ? match.nome : null,
      unidadeLocal: match ? match.unidade : null,
      custoAtual: match ? match.precoCusto : null,
      custoEditavel: vUnCom, // valor por ${uCom} (ex: por caixa); é convertido por unidade só na hora de aplicar
      multiplicador, // quantas unidades do estoque cabem em 1 ${uCom} da nota
      incluir: !!match,
    };
  }).filter(Boolean);
}

/**
 * Tenta descobrir quantas unidades individuais tem dentro de 1 caixa/fardo
 * da nota, em ordem de confiança:
 *  1) uTrib/qTrib da própria nota (o distribuidor já declarou a conversão)
 *  2) um número no texto da unidade ou da descrição (CX12, C/12, FD24...)
 *  3) se não achar nada, assume 1 (sem conversão) e deixa o campo editável
 *     pro operador digitar manualmente.
 */
function detectarMultiplicadorCaixa({ uCom, xProd, qCom, uTrib, qTrib }) {
  if (uTrib && uTrib !== uCom && qCom > 0 && qTrib > 0) {
    const fator = qTrib / qCom;
    if (Number.isFinite(fator) && fator > 1 && Math.abs(fator - Math.round(fator)) < 0.02) {
      return Math.round(fator);
    }
  }
  const texto = `${uCom} ${xProd}`.toUpperCase();
  const padroes = [/C\s*\/\s*(\d{1,3})/, /CX\s*[-\s]?\s*(\d{1,3})\b/, /FD\s*[-\s]?\s*(\d{1,3})\b/, /(\d{1,3})\s*UN\b/, /(\d{1,3})\s*X\s*1\b/];
  for (const re of padroes) {
    const m = texto.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > 1 && n <= 200) return n;
    }
  }
  return 1;
}

/** Tenta traduzir a unidade comercial da NF-e para as unidades do sistema */
function mapearUnidadeXML(uCom) {
  const u = (uCom || '').toUpperCase();
  if (u.startsWith('KG')) return 'KG';
  if (u.startsWith('LT') || u === 'L') return 'L';
  if (u.startsWith('CX')) return 'CX';
  if (u.startsWith('FD')) return 'FD';
  return 'UN';
}

function renderXmlPreview() {
  const el = document.getElementById('xml-preview');
  if (!el) return;
  if (xmlItensParseados.length === 0) { el.innerHTML = ''; return; }

  const casados = xmlItensParseados.filter((i) => i.produtoId);
  const naoCasados = xmlItensParseados.filter((i) => !i.produtoId);

  el.innerHTML = `
    <div class="card">
      <div class="p-3 border-b border-[--color-border] flex items-center justify-between flex-wrap gap-2">
        <span class="text-sm font-semibold">${xmlItensParseados.length} item(ns) no XML · ${casados.length} reconhecido(s) no cadastro${naoCasados.length ? ` · ${naoCasados.length} pendente(s) de cadastro` : ''}</span>
        <button class="btn btn-success text-xs" ${casados.length === 0 ? 'disabled' : ''} onclick="aplicarEntradaXML()">Dar entrada em estoque</button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead><tr><th></th><th>Cód. NF / EAN</th><th>Descrição na NF</th><th>Produto no sistema</th><th>Qtd na nota</th><th>Conversão</th><th>Preço no estoque</th><th>Preço que chegou</th><th></th></tr></thead>
          <tbody>
            ${xmlItensParseados.map((it, i) => it.produtoId ? linhaXmlCadastrado(it, i) : linhaXmlNaoCadastrado(it, i)).join('')}
          </tbody>
        </table>
      </div>
      ${naoCasados.length > 0 ? `<p class="text-xs text-slate-400 p-3">Itens marcados como "não cadastrado" não batem com nenhum código já existente. Clique em "Cadastrar" na linha pra criar o produto (já vem com nome, unidade e custo preenchidos a partir da nota) e incluí-lo na entrada.</p>` : ''}
    </div>
  `;
}

function linhaXmlCadastrado(it, i) {
  const custoNaNotaPorUnidade = it.multiplicador > 1 ? it.custoEditavel / it.multiplicador : it.custoEditavel;
  const diffBase = it.multiplicador > 1 ? custoNaNotaPorUnidade : it.vUnCom;
  const diff = it.custoAtual > 0 ? ((diffBase - it.custoAtual) / it.custoAtual) * 100 : 0;
  let diffBadge = '';
  if (it.custoAtual > 0 && Math.abs(diff) >= 0.5) {
    const subiu = diff > 0;
    diffBadge = `<span class="badge ${subiu ? 'badge-danger' : 'badge-ok'} ml-1.5">${subiu ? '▲' : '▼'} ${Math.abs(diff).toFixed(1)}%</span>`;
  }
  const precisaConversao = it.unidadeLocal && it.unidadeLocal !== it.uCom;
  const qtdConvertida = it.qCom * it.multiplicador;

  const celulaConversao = precisaConversao ? `
    <div class="flex items-center gap-1">
      <span class="text-[11px] text-slate-500">1 ${it.uCom} =</span>
      <input type="text" inputmode="numeric" class="input py-1 px-1.5 text-xs w-12 inline-block text-center"
        value="${it.multiplicador}"
        onchange="xmlItensParseados[${i}].multiplicador = Math.max(1, parseInt(this.value, 10) || 1); renderXmlPreview();" />
      <span class="text-[11px] text-slate-500">${it.unidadeLocal}</span>
    </div>
    <p class="text-[11px] text-slate-400 mt-0.5">Entra: <strong>${qtdConvertida % 1 === 0 ? qtdConvertida : qtdConvertida.toFixed(2)} ${it.unidadeLocal}</strong></p>
  ` : `<span class="text-xs text-slate-300">—</span>`;

  return `
    <tr>
      <td><input type="checkbox" ${it.incluir ? 'checked' : ''} onchange="xmlItensParseados[${i}].incluir = this.checked" /></td>
      <td class="text-xs">${it.cProd}${it.cEAN ? ' / ' + it.cEAN : ''}</td>
      <td class="text-xs">${it.xProd}</td>
      <td class="text-xs"><span class="badge badge-ok">${it.nomeAtual}</span></td>
      <td class="tabular-nums text-xs whitespace-nowrap">${it.qCom} ${it.uCom}</td>
      <td class="whitespace-nowrap">${celulaConversao}</td>
      <td class="tabular-nums text-xs whitespace-nowrap">${fmtBRL(it.custoAtual)}</td>
      <td class="whitespace-nowrap">
        <input type="text" inputmode="decimal" class="input py-1 px-2 text-xs w-24 inline-block" value="${paraCampoDecimal(it.custoEditavel)}"
          onchange="xmlItensParseados[${i}].custoEditavel = parseMoeda(this.value); renderXmlPreview();" />
        ${precisaConversao ? `<p class="text-[11px] text-slate-400 mt-0.5">= ${fmtBRL(custoNaNotaPorUnidade)}/${it.unidadeLocal}</p>` : ''}
        ${diffBadge}
      </td>
      <td class="whitespace-nowrap"><button class="btn btn-ghost text-xs py-1" onclick="abrirEdicaoProdutoXML(${i})">✏️ Editar</button></td>
    </tr>`;
}

function linhaXmlNaoCadastrado(it, i) {
  return `
    <tr>
      <td><input type="checkbox" disabled /></td>
      <td class="text-xs">${it.cProd}${it.cEAN ? ' / ' + it.cEAN : ''}${it.cEANTrib && it.cEANTrib !== it.cEAN ? ' / ' + it.cEANTrib : ''}</td>
      <td class="text-xs">${it.xProd}</td>
      <td class="text-xs"><span class="badge badge-warn">não cadastrado</span></td>
      <td class="tabular-nums text-xs whitespace-nowrap">${it.qCom} ${it.uCom}</td>
      <td class="text-xs text-slate-300">—</td>
      <td class="text-xs text-slate-400">—</td>
      <td class="tabular-nums text-xs whitespace-nowrap">${fmtBRL(it.vUnCom)}</td>
      <td class="whitespace-nowrap flex gap-1">
        <button class="btn btn-primary text-xs py-1" onclick="abrirCadastroRapidoXML(${i})">+ Cadastrar</button>
        <button class="btn btn-ghost text-xs py-1" onclick="abrirVincularProdutoXML(${i})">🔗 Vincular</button>
      </td>
    </tr>`;
}

// ---------------- vincular manualmente a um produto já cadastrado ----------------
// Útil quando a caixa e a unidade têm códigos de barras diferentes e o
// sistema não conseguiu casar sozinho. Depois de vincular uma vez, o
// sistema lembra esse código pras próximas notas do mesmo fornecedor.
function abrirVincularProdutoXML(index) {
  const it = xmlItensParseados[index];
  const produtos = DB.list('produtos');
  abrirModal(`
    <div class="p-4 border-b border-[--color-border]">
      <h3 class="font-semibold text-sm">Vincular a um produto já cadastrado</h3>
      <p class="text-xs text-slate-400 mt-0.5">Descrição na nota: <strong>${it.xProd}</strong> (${it.qCom} ${it.uCom})</p>
    </div>
    <div class="p-4">
      <input id="vinc-busca" data-autofocus class="input" placeholder="Buscar produto pelo nome ou código…" />
      <div id="vinc-resultados" class="mt-3 space-y-1 max-h-72 overflow-y-auto"></div>
    </div>
  `);
  const input = document.getElementById('vinc-busca');
  const render = () => {
    const termo = input.value.toLowerCase();
    const results = produtos.filter((p) => p.nome.toLowerCase().includes(termo) || p.codigo.includes(termo)).slice(0, 30);
    document.getElementById('vinc-resultados').innerHTML = results.map((p) => `
      <button class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center justify-between" onclick='confirmarVinculoXML(${index}, ${JSON.stringify(p.id)})'>
        <span>
          <span class="block text-sm font-medium">${p.nome}</span>
          <span class="block text-xs text-slate-400">${p.codigo} · unidade ${p.unidade}</span>
        </span>
      </button>`).join('') || `<p class="text-sm text-slate-400 px-2 py-3">Nenhum produto encontrado</p>`;
  };
  input.addEventListener('input', render);
  render();
  ativarNavegacaoLista(input, 'vinc-resultados', 'button');
}

function confirmarVinculoXML(index, produtoId) {
  const produto = DB.get('produtos', produtoId);
  const it = xmlItensParseados[index];
  if (!produto) return;

  const multiplicador = produto.unidade !== it.uCom
    ? detectarMultiplicadorCaixa({ uCom: it.uCom, xProd: it.xProd, qCom: it.qCom, uTrib: it.uTrib, qTrib: it.qTrib })
    : 1;

  // salva o vínculo pra próximas notas do mesmo fornecedor reconhecerem sozinhas
  const chave = it.cProd || it.cEAN || it.cEANTrib;
  if (chave) {
    const mapeamentos = DB.list('mapeamentosCodigoNF');
    if (!mapeamentos.some((m) => m.codigoNF === chave)) {
      DB.insert('mapeamentosCodigoNF', { codigoNF: chave, produtoId: produto.id, criadoEm: hojeISO() });
    }
  }

  xmlItensParseados[index] = {
    ...it,
    produtoId: produto.id,
    nomeAtual: produto.nome,
    unidadeLocal: produto.unidade,
    custoAtual: produto.precoCusto,
    multiplicador,
    incluir: true,
  };

  fecharModal();
  toast('Produto vinculado — próximas notas com esse código já reconhecem sozinhas', 'success');
  renderXmlPreview();
}

// ---------------- cadastro rápido de produto direto da linha do XML ----------------
function abrirCadastroRapidoXML(index) {
  const it = xmlItensParseados[index];
  const categorias = DB.list('categorias');
  const unidadeSugerida = mapearUnidadeXML(it.uCom);
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Cadastrar produto da nota</h3></div>
    <div class="p-4 space-y-3">
      <div><label class="text-xs text-slate-500">Código de barras</label><input id="fx-codigo" data-autofocus class="input mt-1" value="${it.cEAN && it.cEAN !== 'SEM GTIN' ? it.cEAN : it.cProd}" /></div>
      <div><label class="text-xs text-slate-500">Nome</label><input id="fx-nome" class="input mt-1" value="${it.xProd}" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-slate-500">Categoria</label>
          <input id="fx-categoria" list="cat-list-xml" class="input mt-1" placeholder="Ex: Mercearia" />
          <datalist id="cat-list-xml">${categorias.map((c) => `<option value="${c}">`).join('')}</datalist>
        </div>
        <div>
          <label class="text-xs text-slate-500">Unidade</label>
          <select id="fx-unidade" class="input mt-1">
            ${['UN', 'KG', 'CX', 'FD', 'L'].map((u) => `<option ${unidadeSugerida === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Preço de custo (da nota)</label><input id="fx-custo" type="text" inputmode="decimal" class="input mt-1" value="${paraCampoDecimal(it.vUnCom)}" /></div>
        <div><label class="text-xs text-slate-500">Preço de venda</label><input id="fx-venda" type="text" inputmode="decimal" class="input mt-1" placeholder="0,00" />${botoesMarkupHTML('fx-custo', 'fx-venda')}</div>
      </div>
      <div><label class="text-xs text-slate-500">Estoque mínimo</label><input id="fx-minimo" type="text" inputmode="decimal" class="input mt-1" value="0" /></div>
      <button class="btn btn-primary w-full" onclick="salvarCadastroRapidoXML(${index})">Cadastrar e incluir na entrada</button>
    </div>
  `);
  ativarEnterSubmit(modalBox, () => salvarCadastroRapidoXML(index));
}

function salvarCadastroRapidoXML(index) {
  const it = xmlItensParseados[index];
  const codigo = document.getElementById('fx-codigo').value.trim();
  const nome = document.getElementById('fx-nome').value.trim();
  const categoria = document.getElementById('fx-categoria').value.trim() || 'Geral';
  const unidade = document.getElementById('fx-unidade').value;
  const precoCusto = parseMoeda(document.getElementById('fx-custo').value);
  const precoVendaDigitado = parseMoeda(document.getElementById('fx-venda').value);
  const precoVenda = aplicarMarkupSeVazio(precoCusto, precoVendaDigitado);
  const estoqueMinimo = parseMoeda(document.getElementById('fx-minimo').value);
  if (!codigo || !nome) { toast('Preencha código e nome do produto', 'error'); return; }
  if (precoVendaDigitado <= 0 && precoVenda > 0) {
    toast(`Preço de venda não informado — aplicado markup automático de 25% (${fmtBRL(precoVenda)})`, 'info');
  }

  const margem = precoCusto > 0 ? (((precoVenda - precoCusto) / precoCusto) * 100).toFixed(1) : '0.0';
  const novoProduto = DB.insert('produtos', {
    codigo, nome, categoria, unidade, precoCusto, precoVenda,
    estoqueAtual: 0, estoqueMinimo, margem,
  });

  const categorias = DB.list('categorias');
  if (!categorias.includes(categoria)) DB.replaceAll('categorias', [...categorias, categoria]);

  // vincula esse item do XML ao produto recém-cadastrado, já pronto pra entrada
  xmlItensParseados[index] = {
    ...it,
    produtoId: novoProduto.id,
    nomeAtual: novoProduto.nome,
    custoAtual: novoProduto.precoCusto,
    custoEditavel: it.vUnCom,
    incluir: true,
  };

  fecharModal();
  toast('Produto cadastrado e incluído na entrada', 'success');
  renderXmlPreview();
}

// ---------------- editar produto direto na tela de importação de XML ----------------
// Útil quando o preço de custo subiu na nota: dá pra já corrigir o preço de
// venda do produto (pra manter a margem) sem sair da conferência do XML.
function abrirEdicaoProdutoXML(index) {
  const it = xmlItensParseados[index];
  const produto = DB.get('produtos', it.produtoId);
  if (!produto) { toast('Produto não encontrado', 'error'); return; }
  const categorias = DB.list('categorias');
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Editar produto — ${produto.nome}</h3></div>
    <div class="p-4 space-y-3">
      <div><label class="text-xs text-slate-500">Nome</label><input id="ex-nome" data-autofocus class="input mt-1" value="${produto.nome}" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-slate-500">Categoria</label>
          <input id="ex-categoria" list="cat-list-exml" class="input mt-1" value="${produto.categoria}" />
          <datalist id="cat-list-exml">${categorias.map((c) => `<option value="${c}">`).join('')}</datalist>
        </div>
        <div>
          <label class="text-xs text-slate-500">Unidade</label>
          <select id="ex-unidade" class="input mt-1">
            ${['UN', 'KG', 'CX', 'FD', 'L'].map((u) => `<option ${produto.unidade === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Preço de custo</label><input id="ex-custo" type="text" inputmode="decimal" class="input mt-1" value="${paraCampoDecimal(produto.precoCusto)}" /></div>
        <div><label class="text-xs text-slate-500">Preço de venda</label><input id="ex-venda" type="text" inputmode="decimal" class="input mt-1" value="${paraCampoDecimal(produto.precoVenda)}" />${botoesMarkupHTML('ex-custo', 'ex-venda')}</div>
      </div>
      <p id="ex-margem-preview" class="text-xs text-slate-400"></p>
      <button class="btn btn-primary w-full" onclick="salvarEdicaoProdutoXML(${index})">Salvar alterações</button>
    </div>
  `);
  const atualizarPreview = () => {
    const custo = parseMoeda(document.getElementById('ex-custo').value);
    const venda = parseMoeda(document.getElementById('ex-venda').value);
    const margem = custo > 0 ? (((venda - custo) / custo) * 100).toFixed(1) : '0.0';
    document.getElementById('ex-margem-preview').textContent = `Margem de lucro estimada: ${margem}%`;
  };
  ['ex-custo', 'ex-venda'].forEach((id) => document.getElementById(id).addEventListener('input', atualizarPreview));
  atualizarPreview();
  ativarEnterSubmit(modalBox, () => salvarEdicaoProdutoXML(index));
}

function salvarEdicaoProdutoXML(index) {
  const it = xmlItensParseados[index];
  const produto = DB.get('produtos', it.produtoId);
  if (!produto) return;
  const nome = document.getElementById('ex-nome').value.trim();
  const categoria = document.getElementById('ex-categoria').value.trim() || 'Geral';
  const unidade = document.getElementById('ex-unidade').value;
  const precoCusto = parseMoeda(document.getElementById('ex-custo').value);
  const precoVendaDigitado = parseMoeda(document.getElementById('ex-venda').value);
  if (!nome) { toast('Informe o nome do produto', 'error'); return; }
  const precoVenda = aplicarMarkupSeVazio(precoCusto, precoVendaDigitado);
  if (precoVendaDigitado <= 0 && precoVenda > 0) {
    toast(`Preço de venda não informado — aplicado markup automático de 25% (${fmtBRL(precoVenda)})`, 'info');
  }
  const margem = precoCusto > 0 ? (((precoVenda - precoCusto) / precoCusto) * 100).toFixed(1) : '0.0';

  const atualizado = DB.update('produtos', produto.id, { nome, categoria, unidade, precoCusto, precoVenda, margem });

  const categorias = DB.list('categorias');
  if (!categorias.includes(categoria)) DB.replaceAll('categorias', [...categorias, categoria]);

  // atualiza a linha do XML pra refletir o produto editado, sem perder a
  // conferência da importação em andamento
  xmlItensParseados[index] = {
    ...it,
    nomeAtual: atualizado.nome,
    custoAtual: atualizado.precoCusto,
  };

  fecharModal();
  toast('Produto atualizado', 'success');
  renderXmlPreview();
}

function aplicarEntradaXML() {
  const itens = xmlItensParseados.filter((i) => i.produtoId && i.incluir && i.qCom > 0);
  if (itens.length === 0) { toast('Nenhum item pronto para dar entrada', 'warning'); return; }

  itens.forEach((it) => {
    const produto = DB.get('produtos', it.produtoId);
    if (!produto) return;
    const multiplicador = it.multiplicador > 0 ? it.multiplicador : 1;
    // converte de "por caixa/fardo da nota" pra "por unidade do estoque"
    // quando o produto é cadastrado numa unidade diferente da que veio na NF
    const qtd = it.qCom * multiplicador;
    const custoUnitNaNota = it.custoEditavel > 0 ? it.custoEditavel : produto.precoCusto;
    const custoUnit = multiplicador > 1 ? custoUnitNaNota / multiplicador : custoUnitNaNota;
    const novoEstoque = Number((produto.estoqueAtual + qtd).toFixed(3));
    const custoMedio = novoEstoque > 0
      ? Number(((produto.estoqueAtual * produto.precoCusto + qtd * custoUnit) / novoEstoque).toFixed(4))
      : custoUnit;
    const margem = custoMedio > 0 ? (((produto.precoVenda - custoMedio) / custoMedio) * 100).toFixed(1) : produto.margem;

    DB.update('produtos', produto.id, { estoqueAtual: novoEstoque, precoCusto: custoMedio, margem });
    DB.insert('entradas', {
      produtoId: produto.id,
      quantidade: qtd,
      custoUnit,
      fornecedor: multiplicador > 1 ? `Importação XML (NF-e) — ${it.qCom} ${it.uCom} × ${multiplicador}` : 'Importação XML (NF-e)',
      data: hojeISO(),
    });
  });

  toast(`Entrada aplicada para ${itens.length} produto(s)`, 'success');
  xmlItensParseados = [];
  renderPage();
}
