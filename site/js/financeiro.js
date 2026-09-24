/**
 * financeiro.js — Contas a Pagar, Pró-labore, Fluxo de Caixa, DRE Simplificado
 */
let finAba = 'contas';
let modalAberto = null;
let mesDRE = new Date().toISOString().slice(0, 7);
const SENHA_PAGINA_FINANCEIRO = '1234';
let paginaFinanceiroDesbloqueada = false;

document.addEventListener('DOMContentLoaded', () => {
  protegerPagina(() => {
    renderShell('financeiro.html', 'Financeiro');
    renderPage();
  });
});

function fecharModal() { if (modalAberto) { modalAberto.remove(); modalAberto = null; } }
function abrirModal(html, wide = false) {
  fecharModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box" style="${wide ? 'max-width:560px' : ''}">${html}</div>`;
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
  if (!paginaFinanceiroDesbloqueada) {
    content.innerHTML = paginaBloqueadaHTML('Financeiro', 'senha-pagina-financeiro', 'desbloquearPaginaFinanceiro');
    const campo = document.getElementById('senha-pagina-financeiro');
    if (campo) setTimeout(() => campo.focus(), 30);
    return;
  }
  content.innerHTML = `
    <div class="flex items-center gap-2 mb-4 flex-wrap">
      ${tabBtn('contas', 'Contas a Pagar')}
      ${tabBtn('boletos', 'Boletos')}
      ${tabBtn('prolabore', 'Pró-labore')}
      ${tabBtn('caixa', 'Fluxo de Caixa')}
      ${tabBtn('dre', 'DRE Simplificado')}
    </div>
    <div id="tab-content"></div>
  `;
  const tabContent = document.getElementById('tab-content');
  if (finAba === 'contas') tabContent.innerHTML = renderContas();
  if (finAba === 'boletos') tabContent.innerHTML = renderBoletos();
  if (finAba === 'prolabore') tabContent.innerHTML = renderProlabore();
  if (finAba === 'caixa') tabContent.innerHTML = renderCaixaHistorico();
  if (finAba === 'dre') tabContent.innerHTML = renderDRE();
}
function desbloquearPaginaFinanceiro() {
  const senha = document.getElementById('senha-pagina-financeiro').value;
  if (senha === SENHA_PAGINA_FINANCEIRO) { paginaFinanceiroDesbloqueada = true; renderPage(); }
  else toast('Senha incorreta', 'error');
}

function tabBtn(id, label) {
  return `<button class="btn ${finAba === id ? 'btn-primary' : 'btn-ghost'}" onclick="finAba='${id}'; renderPage()">${label}</button>`;
}

// ================= CONTAS A PAGAR =================
function renderContas() {
  const contas = DB.list('contasPagar').slice().sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
  const hoje = new Date().toISOString().slice(0, 10);
  const totalPendente = contas.filter((c) => c.status === 'pendente').reduce((s, c) => s + c.valor, 0);
  const vencidas = contas.filter((c) => c.status === 'pendente' && c.vencimento < hoje).length;

  return `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      ${statCardIcon('receipt', 'red', 'Total a pagar (pendente)', fmtBRL(totalPendente))}
      ${statCardIcon('warning', vencidas > 0 ? 'red' : 'slate', 'Contas vencidas', vencidas)}
      <div class="card p-4 flex items-center justify-end"><button class="btn btn-success" onclick="abrirContaModal()">+ Nova conta</button></div>
    </div>
    <div class="card">
      <table class="data-table">
        <thead><tr><th>Descrição</th><th>Categoria</th><th>Vencimento</th><th>Valor</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${contas.map((c) => {
            const venceu = c.status === 'pendente' && c.vencimento < hoje;
            const badge = c.status === 'pago'
              ? `<span class="badge badge-ok">Pago em ${fmtData(c.dataPagamento)}</span>`
              : venceu ? `<span class="badge badge-danger">Vencida</span>` : `<span class="badge badge-warn">Pendente</span>`;
            return `<tr>
              <td class="font-medium">${c.descricao}</td>
              <td><span class="badge badge-neutral">${c.categoria}</span></td>
              <td>${fmtData(c.vencimento)}</td>
              <td class="tabular-nums">${fmtBRL(c.valor)}</td>
              <td>${badge}</td>
              <td class="whitespace-nowrap">
                ${c.status === 'pendente' ? `<button class="text-[--color-success] font-medium mr-2" onclick='pagarConta(${JSON.stringify(c.id)})'>Marcar pago</button>` : ''}
                <button class="text-slate-400 hover:text-[--color-danger]" onclick='excluirConta(${JSON.stringify(c.id)})'>Excluir</button>
              </td>
            </tr>`;
          }).join('') || `<tr><td colspan="6" class="text-center text-slate-400 py-8">Nenhuma conta cadastrada</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function abrirContaModal() {
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Nova conta a pagar</h3></div>
    <div class="p-4 space-y-3">
      <div><label class="text-xs text-slate-500">Descrição</label><input id="c-desc" data-autofocus class="input mt-1" placeholder="Ex: Aluguel, Energia, Fornecedor X" /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Categoria</label><input id="c-cat" class="input mt-1" placeholder="Ex: Aluguel" /></div>
        <div><label class="text-xs text-slate-500">Valor</label><input id="c-valor" type="text" inputmode="decimal" class="input mt-1" placeholder="0,00" /></div>
      </div>
      <div><label class="text-xs text-slate-500">Vencimento</label><input id="c-venc" type="date" class="input mt-1" /></div>
      <button class="btn btn-primary w-full" onclick="salvarConta()">Salvar</button>
    </div>
  `);
  ativarEnterSubmit(modalBox, () => salvarConta());
}
function salvarConta() {
  const descricao = document.getElementById('c-desc').value.trim();
  const categoria = document.getElementById('c-cat').value.trim() || 'Geral';
  const valor = parseMoeda(document.getElementById('c-valor').value);
  const vencimento = document.getElementById('c-venc').value;
  if (!descricao || valor <= 0 || !vencimento) { toast('Preencha todos os campos corretamente', 'error'); return; }
  DB.insert('contasPagar', { descricao, categoria, valor, vencimento, status: 'pendente' });
  fecharModal();
  toast('Conta cadastrada', 'success');
  renderPage();
}
function pagarConta(id) {
  DB.update('contasPagar', id, { status: 'pago', dataPagamento: hojeISO() });
  toast('Conta marcada como paga', 'success');
  renderPage();
}
function excluirConta(id) {
  if (confirmDialog('Excluir esta conta?')) { DB.remove('contasPagar', id); renderPage(); }
}

// ================= BOLETOS =================
// Guarda o boleto como anexo (foto ou PDF) pra não precisar sair do
// sistema pra saber o que falta pagar — não lê o código de barras
// automaticamente (isso exigiria OCR), é preenchido manualmente.
let boletoAnexoTemp = '';
let boletoAnexoTipoTemp = '';

function renderBoletos() {
  const boletos = DB.list('boletos').slice().sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
  const hoje = new Date().toISOString().slice(0, 10);
  const totalPendente = boletos.filter((b) => b.status === 'pendente').reduce((s, b) => s + b.valor, 0);
  const vencidos = boletos.filter((b) => b.status === 'pendente' && b.vencimento < hoje).length;

  return `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      ${statCardIcon('receipt', 'red', 'Total em boletos (pendente)', fmtBRL(totalPendente))}
      ${statCardIcon('warning', vencidos > 0 ? 'red' : 'slate', 'Boletos vencidos', vencidos)}
      <div class="card p-4 flex items-center justify-end"><button class="btn btn-success" onclick="abrirBoletoModal()">+ Novo boleto</button></div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${boletos.map((b) => boletoCard(b, hoje)).join('') || `<p class="text-slate-400 text-sm col-span-full text-center py-10">Nenhum boleto guardado ainda. Anexe a foto ou o PDF do boleto pra ele ficar salvo aqui até você pagar.</p>`}
    </div>
  `;
}

function boletoCard(b, hoje) {
  const venceu = b.status === 'pendente' && b.vencimento < hoje;
  const statusBadge = b.status === 'pago'
    ? `<span class="badge badge-ok">Pago em ${fmtData(b.dataPagamento)}</span>`
    : venceu ? `<span class="badge badge-danger">Vencido</span>` : `<span class="badge badge-warn">Pendente</span>`;

  const preview = b.anexo
    ? (b.anexoTipo === 'pdf'
        ? `<div class="w-full h-24 rounded-lg bg-slate-100 border border-[--color-border] flex items-center justify-center cursor-pointer text-3xl" onclick="window.open(${JSON.stringify(b.anexo)}, '_blank')" title="Abrir PDF">📄</div>`
        : `<img src="${b.anexo}" class="w-full h-24 object-cover rounded-lg border border-[--color-border] cursor-pointer" onclick="abrirFotoTelaCheia(${JSON.stringify(b.anexo)})" />`)
    : `<div class="w-full h-24 rounded-lg bg-slate-100 border border-dashed border-[--color-border] flex items-center justify-center text-slate-400 text-xs">sem anexo</div>`;

  return `
    <div class="card p-3 flex flex-col gap-2">
      ${preview}
      <div class="min-w-0">
        <p class="font-medium truncate">${b.descricao}</p>
        <p class="text-xs text-slate-400">Vence em ${fmtData(b.vencimento)}</p>
      </div>
      <div class="flex items-center justify-between">
        <span class="font-semibold tabular-nums">${fmtBRL(b.valor)}</span>
        ${statusBadge}
      </div>
      <div class="flex gap-2 pt-1">
        ${b.status === 'pendente' ? `<button class="btn btn-success flex-1 text-xs" onclick='pagarBoleto(${JSON.stringify(b.id)})'>Marcar pago</button>` : ''}
        <button class="btn btn-ghost text-xs" onclick='abrirBoletoModal(${JSON.stringify(b.id)})'>Editar</button>
        <button class="text-slate-400 hover:text-[--color-danger] text-xs px-1" onclick='excluirBoleto(${JSON.stringify(b.id)})'>✕</button>
      </div>
    </div>`;
}

function abrirBoletoModal(id) {
  const b = id ? DB.get('boletos', id) : null;
  boletoAnexoTemp = b?.anexo || '';
  boletoAnexoTipoTemp = b?.anexoTipo || '';
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">${b ? 'Editar boleto' : 'Novo boleto'}</h3></div>
    <div class="p-4 space-y-3">
      <div>
        <label class="text-xs text-slate-500">Anexo (foto ou PDF do boleto)</label>
        <div id="boleto-anexo-preview" class="mt-1 ${b?.anexo ? '' : 'hidden'}">
          ${b?.anexo && b?.anexoTipo !== 'pdf' ? `<img src="${b.anexo}" class="w-full max-h-40 object-contain rounded-lg border border-[--color-border]" />` : ''}
          ${b?.anexo && b?.anexoTipo === 'pdf' ? `<div class="text-xs text-slate-500">📄 PDF anexado</div>` : ''}
        </div>
        <label class="btn btn-ghost text-xs cursor-pointer mt-1 inline-block">
          📎 Selecionar arquivo
          <input id="b-anexo" type="file" accept="image/*,.pdf" class="hidden" onchange="previewAnexoBoleto(event)" />
        </label>
      </div>
      <div><label class="text-xs text-slate-500">Descrição</label><input id="b-desc" data-autofocus class="input mt-1" value="${b?.descricao || ''}" placeholder="Ex: Fornecedor X, Energia..." /></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs text-slate-500">Valor</label><input id="b-valor" type="text" inputmode="decimal" class="input mt-1" value="${b ? paraCampoDecimal(b.valor) : ''}" placeholder="0,00" /></div>
        <div><label class="text-xs text-slate-500">Vencimento</label><input id="b-venc" type="date" class="input mt-1" value="${b?.vencimento || ''}" /></div>
      </div>
      <div><label class="text-xs text-slate-500">Linha digitável (opcional)</label><input id="b-codigo" class="input mt-1" value="${b?.codigoBarras || ''}" placeholder="00000.00000 00000.000000..." /></div>
      <button class="btn btn-primary w-full" onclick='salvarBoleto(${JSON.stringify(b?.id || null)})'>Salvar</button>
    </div>
  `);
  ativarEnterSubmit(modalBox, () => salvarBoleto(b?.id || null));
}

function previewAnexoBoleto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const ehPdf = file.type === 'application/pdf';
  const reader = new FileReader();
  reader.onload = () => {
    boletoAnexoTemp = reader.result;
    boletoAnexoTipoTemp = ehPdf ? 'pdf' : 'imagem';
    const preview = document.getElementById('boleto-anexo-preview');
    preview.classList.remove('hidden');
    preview.innerHTML = ehPdf
      ? `<div class="text-xs text-slate-500">📄 ${file.name}</div>`
      : `<img src="${boletoAnexoTemp}" class="w-full max-h-40 object-contain rounded-lg border border-[--color-border]" />`;
  };
  reader.readAsDataURL(file);
}

function salvarBoleto(id) {
  const descricao = document.getElementById('b-desc').value.trim();
  const valor = parseMoeda(document.getElementById('b-valor').value);
  const vencimento = document.getElementById('b-venc').value;
  const codigoBarras = document.getElementById('b-codigo').value.trim();
  if (!descricao || valor <= 0 || !vencimento) { toast('Preencha descrição, valor e vencimento', 'error'); return; }

  const dados = { descricao, valor, vencimento, codigoBarras, anexo: boletoAnexoTemp || '', anexoTipo: boletoAnexoTipoTemp || '' };
  if (id) DB.update('boletos', id, dados);
  else DB.insert('boletos', { ...dados, status: 'pendente' });

  boletoAnexoTemp = '';
  boletoAnexoTipoTemp = '';
  fecharModal();
  toast('Boleto salvo', 'success');
  renderPage();
}

function pagarBoleto(id) {
  DB.update('boletos', id, { status: 'pago', dataPagamento: hojeISO() });
  toast('Boleto marcado como pago', 'success');
  renderPage();
}

function excluirBoleto(id) {
  if (confirmDialog('Excluir este boleto?')) { DB.remove('boletos', id); renderPage(); toast('Boleto excluído', 'warning'); }
}

// ================= PRÓ-LABORE =================
function renderProlabore() {
  const registros = DB.list('prolabore').slice().sort((a, b) => new Date(b.data) - new Date(a.data));
  const totalMes = registros.filter((r) => r.data.slice(0, 7) === new Date().toISOString().slice(0, 7)).reduce((s, r) => s + r.valor, 0);
  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      ${statCardIcon('money', 'blue', 'Pró-labore retirado este mês', fmtBRL(totalMes))}
      <div class="card p-4 flex items-center justify-end"><button class="btn btn-success" onclick="abrirProlaboreModal()">+ Registrar retirada</button></div>
    </div>
    <div class="card">
      <table class="data-table">
        <thead><tr><th>Data</th><th>Sócio</th><th>Valor</th></tr></thead>
        <tbody>
          ${registros.map((r) => `<tr><td>${fmtData(r.data)}</td><td>${r.socio}</td><td class="tabular-nums font-medium">${fmtBRL(r.valor)}</td></tr>`).join('') || `<tr><td colspan="3" class="text-center text-slate-400 py-8">Nenhuma retirada registrada</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}
function abrirProlaboreModal() {
  const cfg = DB.getConfig();
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">Registrar pró-labore</h3></div>
    <div class="p-4 space-y-3">
      <div><label class="text-xs text-slate-500">Sócio / Proprietário</label>
        <input id="pl-socio" data-autofocus list="socios-list" class="input mt-1" value="${cfg.socios[0] || ''}" />
        <datalist id="socios-list">${cfg.socios.map((s) => `<option value="${s}">`).join('')}</datalist>
      </div>
      <div><label class="text-xs text-slate-500">Valor da retirada</label><input id="pl-valor" type="text" inputmode="decimal" class="input mt-1" placeholder="0,00" /></div>
      <button class="btn btn-primary w-full" onclick="salvarProlabore()">Registrar</button>
    </div>
  `);
  ativarEnterSubmit(modalBox, () => salvarProlabore());
}
function salvarProlabore() {
  const socio = document.getElementById('pl-socio').value.trim() || 'Proprietário';
  const valor = parseMoeda(document.getElementById('pl-valor').value);
  if (valor <= 0) { toast('Informe um valor válido', 'error'); return; }
  DB.insert('prolabore', { socio, valor, data: hojeISO() });
  const cfg = DB.getConfig();
  if (!cfg.socios.includes(socio)) DB.setConfig({ ...cfg, socios: [...cfg.socios, socio] });
  fecharModal();
  toast('Retirada registrada', 'success');
  renderPage();
}

// ================= FLUXO DE CAIXA =================
function renderCaixaHistorico() {
  const sessoes = DB.list('caixa').slice().sort((a, b) => new Date(b.dataAbertura) - new Date(a.dataAbertura));
  return `
    <div class="card">
      <table class="data-table">
        <thead><tr><th>Abertura</th><th>Operador</th><th>Fechamento</th><th>Valor inicial</th><th>Sangrias</th><th>Suprimentos</th><th>Contado</th><th>Diferença</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${sessoes.map((s) => {
            const sangrias = (s.movimentos || []).filter((m) => m.tipo === 'sangria').reduce((a, m) => a + m.valor, 0);
            const suprimentos = (s.movimentos || []).filter((m) => m.tipo === 'suprimento').reduce((a, m) => a + m.valor, 0);
            return `<tr>
              <td>${fmtDataHora(s.dataAbertura)}</td>
              <td class="text-xs">${s.operadorAbertura || '—'}${s.operadorFechamento && s.operadorFechamento !== s.operadorAbertura ? ` <span class="text-slate-400">(fechou: ${s.operadorFechamento})</span>` : ''}</td>
              <td>${s.dataFechamento ? fmtDataHora(s.dataFechamento) : '—'}</td>
              <td class="tabular-nums">${fmtBRL(s.valorAbertura)}</td>
              <td class="tabular-nums text-[--color-danger]">${fmtBRL(sangrias)}</td>
              <td class="tabular-nums text-[--color-success]">${fmtBRL(suprimentos)}</td>
              <td class="tabular-nums">${s.valorContado != null ? fmtBRL(s.valorContado) : '—'}</td>
              <td class="tabular-nums ${s.diferenca ? (s.diferenca < 0 ? 'text-[--color-danger]' : 'text-[--color-success]') : ''}">${s.diferenca != null ? fmtBRL(s.diferenca) : '—'}</td>
              <td>${s.status === 'aberto' ? '<span class="badge badge-ok">Aberto</span>' : '<span class="badge badge-neutral">Fechado</span>'}</td>
              <td><button class="btn btn-ghost text-xs py-1" onclick="abrirVendasDoCaixa('${s.id}')">Ver vendas</button></td>
            </tr>`;
          }).join('') || `<tr><td colspan="10" class="text-center text-slate-400 py-8">Nenhuma sessão de caixa registrada. Abra o caixa na tela do PDV.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

/** Lista todas as vendas de uma sessão de caixa (aberta ou já fechada) */
function abrirVendasDoCaixa(caixaId) {
  const caixa = DB.get('caixa', caixaId);
  const vendas = DB.list('vendas').filter((v) => v.caixaId === caixaId).sort((a, b) => new Date(b.data) - new Date(a.data));
  const vendasValidas = vendas.filter((v) => !v.estornada);
  const total = vendasValidas.reduce((s, v) => s + v.total, 0);
  const dinheiroVendas = vendasValidas.reduce((s, v) => s + dinheiroLiquidoVenda(v), 0);
  const outrasFormas = total - dinheiroVendas;
  const movimentos = (caixa.movimentos || []).slice().sort((a, b) => new Date(b.data) - new Date(a.data));

  abrirModal(`
    <div class="p-4 border-b border-[--color-border] flex items-center justify-between">
      <div>
        <h3 class="font-semibold text-sm">Vendas da sessão</h3>
        <p class="text-xs text-slate-400">
          Aberta em ${fmtDataHora(caixa.dataAbertura)}${caixa.operadorAbertura ? ' por ' + caixa.operadorAbertura : ''}
          ${caixa.dataFechamento ? ' · fechada em ' + fmtDataHora(caixa.dataFechamento) + (caixa.operadorFechamento ? ' por ' + caixa.operadorFechamento : '') : ''}
        </p>
      </div>
      <span class="text-lg font-bold text-[--color-primary]">${fmtBRL(total)}</span>
    </div>
    ${caixa.status === 'fechado' ? `
      <div class="px-4 pt-3">
        <div class="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
          <div class="flex justify-between"><span class="text-slate-500">Vendas em dinheiro (conta pra gaveta)</span><span class="tabular-nums">${fmtBRL(dinheiroVendas)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Débito/Crédito/Pix (não conta pra gaveta)</span><span class="tabular-nums">${fmtBRL(outrasFormas)}</span></div>
          <div class="border-t border-[--color-border] my-1"></div>
          <div class="flex justify-between"><span class="text-slate-500">Esperado na gaveta</span><span class="tabular-nums">${fmtBRL(caixa.valorEsperado ?? 0)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Contado na gaveta</span><span class="tabular-nums">${fmtBRL(caixa.valorContado ?? 0)}</span></div>
          <div class="flex justify-between font-semibold"><span>Diferença</span><span class="tabular-nums ${(caixa.diferenca || 0) < 0 ? 'text-[--color-danger]' : (caixa.diferenca || 0) > 0 ? 'text-[--color-success]' : ''}">${fmtBRL(caixa.diferenca ?? 0)}</span></div>
        </div>
      </div>` : ''}
    ${movimentos.length > 0 ? `
      <div class="px-4 pt-3">
        <p class="text-xs font-semibold text-slate-500 mb-1.5">Sangrias / Suprimentos dessa sessão</p>
        <div class="space-y-1">
          ${movimentos.map((m) => `
            <div class="flex justify-between text-xs bg-slate-50 rounded-lg px-3 py-1.5">
              <span>${fmtDataHora(m.data)} · ${m.tipo === 'sangria' ? '🔻 Sangria' : '🔺 Suprimento'} ${m.motivo ? '— ' + m.motivo : ''} <span class="text-slate-400">(${m.operador || 'sem operador'})</span></span>
              <span class="tabular-nums font-medium ${m.tipo === 'sangria' ? 'text-[--color-danger]' : 'text-[--color-success]'}">${fmtBRL(m.valor)}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}
    <div class="p-4 max-h-96 overflow-y-auto space-y-1.5">
      ${vendas.length === 0 ? `<p class="text-sm text-slate-400 text-center py-6">Nenhuma venda nessa sessão</p>` :
        vendas.map((v) => `
          <div class="bg-slate-50 rounded-lg px-3 py-2 text-sm ${v.estornada ? 'opacity-50' : ''}">
            <div class="flex justify-between items-center">
              <span>${fmtDataHora(v.data)} ${v.estornada ? '<span class="badge badge-danger">Estornada</span>' : ''}</span>
              <span class="font-semibold tabular-nums">${fmtBRL(v.total)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400">${v.itens.length} item(ns) · ${v.pagamentos.map((p) => p.forma).join(', ')}</span>
              ${!v.estornada ? `<button class="text-[11px] text-[--color-danger] hover:underline" onclick='estornarVenda(${JSON.stringify(v.id)}); abrirVendasDoCaixa(${JSON.stringify(caixaId)});'>Estornar</button>` : ''}
            </div>
          </div>`).join('')}
    </div>
  `, true);
}

// ================= DRE SIMPLIFICADO =================
const SENHA_DRE = '1234';
let dreDesbloqueado = false;

function renderDRE() {
  if (!dreDesbloqueado) {
    return `
      <div class="card max-w-sm p-4">
        <h3 class="font-semibold text-sm mb-2">🔒 DRE protegido por senha</h3>
        <p class="text-xs text-slate-400 mb-3">Informe a senha pra ver o Demonstrativo de Resultado do mês.</p>
        <div class="flex gap-2 items-center">
          <input id="senha-dre" type="password" inputmode="numeric" class="input" placeholder="Senha" onkeydown="if(event.key==='Enter')desbloquearDRE()" />
          <button class="btn btn-primary text-xs whitespace-nowrap" onclick="desbloquearDRE()">Ver DRE</button>
        </div>
      </div>
    `;
  }

  const vendas = DB.list('vendas').filter((v) => v.data.slice(0, 7) === mesDRE && !v.estornada);
  // regime de caixa: fiado só entra na receita quando é efetivamente pago —
  // até lá o custo do produto já saiu do estoque, mas a receita não conta
  const receitaImediata = vendas.reduce((s, v) => {
    const fiadoDaVenda = v.pagamentos.filter((p) => p.forma === 'fiado').reduce((a, p) => a + p.valor, 0);
    return s + (v.total - fiadoDaVenda); // total já exclui troco — evita contar troco como receita
  }, 0);
  const fiadoVendidoNoMes = vendas.reduce((s, v) => s + v.pagamentos.filter((p) => p.forma === 'fiado').reduce((a, p) => a + p.valor, 0), 0);
  const fiadoRecebidoNoMes = DB.list('pagamentosFiado').filter((p) => p.data.slice(0, 7) === mesDRE).reduce((s, p) => s + p.valor, 0);
  const receitaBruta = receitaImediata + fiadoRecebidoNoMes;
  const cpv = vendas.reduce((s, v) => s + v.itens.reduce((a, it) => a + it.precoCusto * it.qtd, 0), 0);
  const descontos = vendas.reduce((s, v) => s + v.itens.reduce((a, it) => a + it.descontoItem, 0), 0);
  const despesas = DB.list('contasPagar').filter((c) => c.vencimento.slice(0, 7) === mesDRE).reduce((s, c) => s + c.valor, 0);
  const prolabore = DB.list('prolabore').filter((p) => p.data.slice(0, 7) === mesDRE).reduce((s, p) => s + p.valor, 0);
  const lucroBruto = receitaBruta - cpv;
  const lucroLiquido = lucroBruto - despesas - prolabore;

  return `
    <div class="flex items-center gap-2 mb-4 flex-wrap">
      <label class="text-sm text-slate-500">Referência:</label>
      <input type="month" class="input max-w-[160px]" value="${mesDRE}" onchange="mesDRE=this.value; renderPage()" />
      <button class="text-xs text-slate-400 hover:text-[--color-danger] ml-auto" onclick="bloquearDRE()">🔒 Bloquear</button>
    </div>
    <div class="card max-w-xl">
      <div class="p-4 space-y-2">
        ${dreLine('Receita Bruta de Vendas (recebida no mês)', receitaBruta, 'font-semibold')}
        ${dreLine('(-) Descontos concedidos', -descontos, 'text-[--color-danger] text-xs')}
        ${dreLine('(-) Custo dos Produtos Vendidos (CPV)', -cpv, 'text-[--color-danger]')}
        <div class="border-t border-[--color-border] my-1"></div>
        ${dreLine('= Lucro Bruto', lucroBruto, 'font-semibold')}
        ${dreLine('(-) Despesas Operacionais', -despesas, 'text-[--color-danger]')}
        ${dreLine('(-) Pró-labore', -prolabore, 'text-[--color-danger]')}
        <div class="border-t border-[--color-border] my-1"></div>
        <div class="flex justify-between items-baseline pt-1">
          <span class="font-bold">= Lucro Líquido Real</span>
          <span class="text-xl font-extrabold ${lucroLiquido >= 0 ? 'text-[--color-success]' : 'text-[--color-danger]'} tabular-nums">${fmtBRL(lucroLiquido)}</span>
        </div>
      </div>
    </div>
    ${fiadoVendidoNoMes > 0 ? `<p class="text-xs text-[--color-warning] mt-3 max-w-xl">📒 ${fmtBRL(fiadoVendidoNoMes)} vendido fiado neste mês ainda não entra nessa receita — só conta quando o cliente pagar.</p>` : ''}
    <p class="text-xs text-slate-400 mt-2 max-w-xl">DRE em regime de caixa: a receita só conta quando o dinheiro realmente entra (fiado só quando pago). O custo do produto vendido é contado na hora da venda, mesmo se for fiado — por isso vendas muito fiadas podem reduzir o lucro do mês até serem pagas. Considera vendas e contas com vencimento dentro do mês selecionado. Não substitui uma apuração contábil formal.</p>
  `;
}
function desbloquearDRE() {
  const senha = document.getElementById('senha-dre').value;
  if (senha === SENHA_DRE) { dreDesbloqueado = true; renderPage(); }
  else toast('Senha incorreta', 'error');
}
function bloquearDRE() { dreDesbloqueado = false; renderPage(); }
function dreLine(label, valor, cls = '') {
  return `<div class="flex justify-between text-sm ${cls}"><span>${label}</span><span class="tabular-nums">${fmtBRL(valor)}</span></div>`;
}
