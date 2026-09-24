/**
 * relatorios.js — Dashboard e relatórios gerenciais
 */
document.addEventListener('DOMContentLoaded', () => {
  protegerPagina(() => {
    renderShell('relatorios.html', 'Relatórios');
    renderPage();
  });
});

const FORMAS_LABEL = { dinheiro: 'Dinheiro', debito: 'Cartão de Débito', credito: 'Cartão de Crédito', pix: 'Pix', fiado: 'Fiado' };
const FORMAS_COR = { dinheiro: '#1B8354', debito: '#1E4E8C', credito: '#5B3FA0', pix: '#0E9488', fiado: '#B5720E' };
const SENHA_LUCRO = '1234';
let lucroDesbloqueado = false;
let lucroMostrarTodasVendas = false;
const SENHA_PAGINA_RELATORIOS = '1234';
let paginaRelatoriosDesbloqueada = false;

function renderPage() {
  const content = document.getElementById('page-content');
  if (!paginaRelatoriosDesbloqueada) {
    content.innerHTML = paginaBloqueadaHTML('Relatórios', 'senha-pagina-relatorios', 'desbloquearPaginaRelatorios');
    const campo = document.getElementById('senha-pagina-relatorios');
    if (campo) setTimeout(() => campo.focus(), 30);
    return;
  }
  const vendas = DB.list('vendas').filter((v) => !v.estornada);
  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = new Date().toISOString().slice(0, 7);

  const vendasHoje = vendas.filter((v) => v.data.slice(0, 10) === hoje);
  const vendasMes = vendas.filter((v) => v.data.slice(0, 7) === mesAtual);
  const totalHoje = vendasHoje.reduce((s, v) => s + v.total, 0);
  const totalMes = vendasMes.reduce((s, v) => s + v.total, 0);

  const clientes = DB.list('clientes');
  const totalReceber = clientes.reduce((s, c) => s + c.saldoDevedor, 0);
  const contasPendentes = DB.list('contasPagar').filter((c) => c.status === 'pendente');
  const totalPagarMes = contasPendentes.filter((c) => c.vencimento.slice(0, 7) === mesAtual).reduce((s, c) => s + c.valor, 0);

  content.innerHTML = `
    <div class="flex justify-end mb-2 no-print">
      <button class="btn btn-ghost text-xs" onclick="imprimirRelatorioAtual()">🖨️ Exportar / Imprimir (PDF)</button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      ${statCardIcon('receipt', 'blue', 'Vendido hoje', fmtBRL(totalHoje), `${vendasHoje.length} venda(s)`)}
      ${statCardIcon('money', 'green', 'Vendido no mês', fmtBRL(totalMes), `${vendasMes.length} venda(s)`)}
      ${statCardIcon('card', 'red', 'A receber (fiado)', fmtBRL(totalReceber))}
      ${statCardIcon('warning', 'amber', 'A pagar este mês', fmtBRL(totalPagarMes))}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <div class="card p-4">
        <h3 class="text-sm font-semibold mb-3">Vendas de hoje por forma de pagamento</h3>
        ${renderFormasPagamento(vendasHoje)}
      </div>
      <div class="card p-4">
        <h3 class="text-sm font-semibold mb-3">Vendas do mês por forma de pagamento</h3>
        ${renderFormasPagamento(vendasMes)}
      </div>
    </div>

    <div class="card p-4 mb-4">
      <h3 class="text-sm font-semibold mb-1">Ranking de produtos mais vendidos (Curva ABC)</h3>
      <p class="text-xs text-slate-400 mb-3">Classe A: até 80% do faturamento · Classe B: até 95% · Classe C: restante</p>
      ${renderCurvaABC(vendas)}
    </div>

    <div class="card p-4 mb-4">
      <h3 class="text-sm font-semibold mb-1">👤 Relatório por operador</h3>
      <p class="text-xs text-slate-400 mb-3">Quem abriu/fechou cada caixa e registrou cada sangria — ajuda a saber quem foi se der uma diferença errada.</p>
      ${renderPorOperador()}
    </div>

    <div class="card p-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold">🔒 Lucro (protegido por senha)</h3>
        ${lucroDesbloqueado ? `<button class="text-xs text-slate-400 hover:text-[--color-danger]" onclick="bloquearLucro()">Bloquear</button>` : ''}
      </div>
      ${lucroDesbloqueado ? renderLucroDetalhado(vendas) : `
        <div class="flex gap-2 items-center max-w-xs">
          <input id="senha-lucro" type="password" inputmode="numeric" class="input" placeholder="Senha" />
          <button class="btn btn-primary text-xs whitespace-nowrap" onclick="desbloquearLucro()">Ver lucro</button>
        </div>
      `}
    </div>
  `;

  if (!lucroDesbloqueado) {
    const campo = document.getElementById('senha-lucro');
    if (campo) campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') desbloquearLucro(); });
  }
}

function desbloquearPaginaRelatorios() {
  const senha = document.getElementById('senha-pagina-relatorios').value;
  if (senha === SENHA_PAGINA_RELATORIOS) { paginaRelatoriosDesbloqueada = true; renderPage(); }
  else toast('Senha incorreta', 'error');
}

/** Receita já recebida de uma venda (tudo, exceto a parte que ficou fiado) */
function receitaRecebidaVenda(v) {
  // total já exclui o troco (troco é o excedente pago além do total); então
  // "recebido de verdade" é simplesmente o total menos a parte que ficou
  // fiado — evita contar o troco como se fosse receita (mesmo bug do
  // fechamento de caixa, só que aqui inflava o lucro em vez da gaveta)
  return v.total - valorFiadoVenda(v);
}
/** Quanto dessa venda ficou fiado (ainda a receber) */
function valorFiadoVenda(v) {
  return v.pagamentos.filter((p) => p.forma === 'fiado').reduce((s, p) => s + p.valor, 0);
}
/** Custo dos produtos vendidos — sai do estoque na hora, então conta na hora, mesmo se for fiado */
function custoVenda(v) {
  return v.itens.reduce((s, it) => s + it.precoCusto * it.qtd, 0);
}
/**
 * Lucro no regime de caixa: fiado NÃO é lucro enquanto não é pago — o
 * custo do produto já saiu do estoque na hora da venda, mas a receita só
 * entra de verdade quando o cliente paga. Por isso, uma venda 100% fiado
 * aparece como prejuízo (custo sem receita) até o pagamento acontecer —
 * quando o cliente paga, esse valor vira lucro no dia em que foi recebido.
 */
function calcularLucroCaixa(vendas, pagamentosFiado, dentroDoPeriodo) {
  const vendasNoPeriodo = vendas.filter((v) => dentroDoPeriodo(v.data));
  const receita = vendasNoPeriodo.reduce((s, v) => s + receitaRecebidaVenda(v), 0);
  const custo = vendasNoPeriodo.reduce((s, v) => s + custoVenda(v), 0);
  const fiadoRecebido = pagamentosFiado.filter((p) => dentroDoPeriodo(p.data)).reduce((s, p) => s + p.valor, 0);
  return receita + fiadoRecebido - custo;
}

function desbloquearLucro() {
  const senha = document.getElementById('senha-lucro').value;
  if (senha === SENHA_LUCRO) { lucroDesbloqueado = true; renderPage(); }
  else toast('Senha incorreta', 'error');
}
function bloquearLucro() { lucroDesbloqueado = false; renderPage(); }

function renderLucroDetalhado(vendas) {
  const pagamentosFiado = DB.list('pagamentosFiado');
  const hoje = new Date().toISOString().slice(0, 10);
  const seteDiasAtras = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const mesAtual = new Date().toISOString().slice(0, 7);

  const lucroHoje = calcularLucroCaixa(vendas, pagamentosFiado, (d) => d.slice(0, 10) === hoje);
  const lucroSemana = calcularLucroCaixa(vendas, pagamentosFiado, (d) => d.slice(0, 10) >= seteDiasAtras);
  const lucroMes = calcularLucroCaixa(vendas, pagamentosFiado, (d) => d.slice(0, 7) === mesAtual);
  const lucroTotal = calcularLucroCaixa(vendas, pagamentosFiado, () => true);
  const fiadoEmAberto = DB.list('clientes').reduce((s, c) => s + c.saldoDevedor, 0);

  // lucro por dia: soma o que entrou de caixa naquele dia (vendas à vista +
  // pagamentos de fiado recebidos naquele dia) menos o custo do que foi
  // vendido naquele dia (mesmo que uma parte tenha ficado fiado)
  const diasSet = new Set([...vendas.map((v) => v.data.slice(0, 10)), ...pagamentosFiado.map((p) => p.data.slice(0, 10))]);
  const dias = Array.from(diasSet).sort((a, b) => new Date(b) - new Date(a)).slice(0, 30);
  const porDia = {};
  dias.forEach((d) => { porDia[d] = calcularLucroCaixa(vendas, pagamentosFiado, (data) => data.slice(0, 10) === d); });

  const corLucro = (v) => (v >= 0 ? 'text-[--color-success]' : 'text-[--color-danger]');

  return `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
      <div class="card p-3"><p class="text-xs text-slate-500">Lucro hoje</p><p class="text-xl font-bold ${corLucro(lucroHoje)}">${fmtBRL(lucroHoje)}</p></div>
      <div class="card p-3"><p class="text-xs text-slate-500">Lucro últimos 7 dias</p><p class="text-xl font-bold ${corLucro(lucroSemana)}">${fmtBRL(lucroSemana)}</p></div>
      <div class="card p-3"><p class="text-xs text-slate-500">Lucro no mês</p><p class="text-xl font-bold ${corLucro(lucroMes)}">${fmtBRL(lucroMes)}</p></div>
    </div>
    <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
      <p class="text-xs text-slate-500">Lucro total (desde o início): <strong class="${corLucro(lucroTotal)}">${fmtBRL(lucroTotal)}</strong></p>
      ${fiadoEmAberto > 0 ? `<p class="text-xs text-[--color-warning]">📒 ${fmtBRL(fiadoEmAberto)} em fiado ainda não recebido (não contam nesse lucro)</p>` : ''}
    </div>
    <p class="text-[11px] text-slate-400 mb-3">Vendas fiadas só entram no lucro quando o cliente paga — até lá, o custo do produto já saiu mas a receita ainda não entrou, então contam como prejuízo temporário.</p>
    ${dias.length ? `
      <div class="overflow-x-auto max-h-72 overflow-y-auto">
        <table class="data-table">
          <thead><tr><th>Data</th><th>Lucro no dia (caixa)</th></tr></thead>
          <tbody>
            ${dias.map((d) => `<tr><td>${fmtData(d)}</td><td class="tabular-nums ${corLucro(porDia[d])}">${fmtBRL(porDia[d])}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>` : `<p class="text-sm text-slate-400 text-center py-6">Nenhuma venda registrada ainda</p>`}

    <div class="border-t border-[--color-border] mt-4 pt-3">
      <button class="btn btn-ghost text-xs w-full" onclick="alternarTodasVendasLucro()">
        ${lucroMostrarTodasVendas ? '▲ Esconder todas as vendas' : `▼ Ver todas as vendas (${vendas.length})`}
      </button>
      ${lucroMostrarTodasVendas ? renderTodasAsVendas(vendas) : ''}
    </div>

    <div class="border-t border-[--color-border] mt-4 pt-3">
      <h4 class="text-sm font-semibold mb-2">🏷️ Lucro das promoções</h4>
      ${renderLucroPromocoes(vendas)}
    </div>
  `;
}

/** Um item do carrinho veio de alguma promoção se tiver qualquer uma dessas marcações */
function itemEhPromocional(it) {
  return !!(it.fardoAplicado || it.promocaoProdutoId || it.promocaoLeveId || it.cestaBasicaId);
}
function tipoPromocaoItem(it) {
  if (it.cestaBasicaId) return 'cesta';
  if (it.promocaoLeveId) return 'leve';
  if (it.promocaoProdutoId) return 'produto';
  return 'fardo';
}

/** Lucro específico das vendas que envolveram alguma promoção (fardo,
 * desconto de produto ou cesta básica) — cada linha do carrinho marcada
 * é somada separadamente do resto da venda, pra medir o quanto as
 * promoções realmente contribuem (ou custam) pro lucro. */
function renderLucroPromocoes(vendas) {
  const linhas = [];
  vendas.forEach((v) => {
    (v.itens || []).forEach((it) => {
      if (itemEhPromocional(it)) linhas.push({ venda: v, item: it });
    });
  });

  if (linhas.length === 0) {
    return `<p class="text-sm text-slate-400 text-center py-6">Nenhuma venda com promoção (fardo, desconto de produto ou cesta básica) registrada ainda.</p>`;
  }

  const corLucro = (v) => (v >= 0 ? 'text-[--color-success]' : 'text-[--color-danger]');
  const receitaLinha = (it) => it.precoUnit * it.qtd - it.descontoItem;
  const custoLinha = (it) => it.precoCusto * it.qtd;

  const totalVendido = linhas.reduce((s, l) => s + receitaLinha(l.item), 0);
  const totalDesconto = linhas.reduce((s, l) => s + l.item.descontoItem, 0);
  const totalCusto = linhas.reduce((s, l) => s + custoLinha(l.item), 0);
  const lucroTotal = totalVendido - totalCusto;

  const porTipo = { fardo: { vendido: 0, lucro: 0, qtdLinhas: 0 }, leve: { vendido: 0, lucro: 0, qtdLinhas: 0 }, produto: { vendido: 0, lucro: 0, qtdLinhas: 0 }, cesta: { vendido: 0, lucro: 0, qtdLinhas: 0 } };
  linhas.forEach((l) => {
    const tipo = tipoPromocaoItem(l.item);
    porTipo[tipo].vendido += receitaLinha(l.item);
    porTipo[tipo].lucro += receitaLinha(l.item) - custoLinha(l.item);
    porTipo[tipo].qtdLinhas += 1;
  });

  const labelTipo = { fardo: '🎁 Preço de fardo', leve: '🔢 Leve X por R$Y', produto: '🏷️ Desconto em produto', cesta: '🧺 Cesta básica' };

  return `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
      <div class="card p-3"><p class="text-xs text-slate-500">Vendido em promoção</p><p class="text-lg font-bold">${fmtBRL(totalVendido)}</p></div>
      <div class="card p-3"><p class="text-xs text-slate-500">Descontos concedidos</p><p class="text-lg font-bold text-[--color-danger]">${fmtBRL(totalDesconto)}</p></div>
      <div class="card p-3"><p class="text-xs text-slate-500">Lucro das promoções</p><p class="text-lg font-bold ${corLucro(lucroTotal)}">${fmtBRL(lucroTotal)}</p></div>
    </div>
    <table class="data-table">
      <thead><tr><th>Tipo de promoção</th><th>Linhas vendidas</th><th>Vendido</th><th>Lucro</th></tr></thead>
      <tbody>
        ${Object.keys(porTipo).filter((t) => porTipo[t].qtdLinhas > 0).map((t) => `
          <tr>
            <td>${labelTipo[t]}</td>
            <td class="tabular-nums">${porTipo[t].qtdLinhas}</td>
            <td class="tabular-nums">${fmtBRL(porTipo[t].vendido)}</td>
            <td class="tabular-nums ${corLucro(porTipo[t].lucro)}">${fmtBRL(porTipo[t].lucro)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <p class="text-[11px] text-slate-400 mt-2">*Esse cálculo considera o valor total da linha (já com o desconto da promoção aplicado), sem separar por forma de pagamento — é uma medida direta de quanto cada tipo de promoção rendeu de lucro bruto.</p>
  `;
}

function alternarTodasVendasLucro() {
  lucroMostrarTodasVendas = !lucroMostrarTodasVendas;
  renderPage();
}


/** Lista completa de vendas, mais recente primeiro, com o lucro de cada uma */
function renderTodasAsVendas(vendas) {
  const ordenadas = vendas.slice().sort((a, b) => new Date(b.data) - new Date(a.data));
  const corLucro = (v) => (v >= 0 ? 'text-[--color-success]' : 'text-[--color-danger]');
  return `
    <div class="overflow-x-auto max-h-96 overflow-y-auto mt-2">
      <table class="data-table">
        <thead><tr><th>Data/hora</th><th>Itens</th><th>Forma(s)</th><th>Total</th><th>Lucro imediato*</th><th></th></tr></thead>
        <tbody>
          ${ordenadas.map((v) => {
            const temFiado = valorFiadoVenda(v) > 0;
            const lucroImediato = receitaRecebidaVenda(v) - custoVenda(v);
            return `
            <tr>
              <td>${fmtDataHora(v.data)}</td>
              <td class="tabular-nums">${v.itens.length}</td>
              <td class="text-xs capitalize">${v.pagamentos.map((p) => p.forma).join(', ')} ${temFiado ? '<span class="badge badge-warn">fiado</span>' : ''}</td>
              <td class="tabular-nums font-medium">${fmtBRL(v.total)}</td>
              <td class="tabular-nums ${corLucro(lucroImediato)}">${fmtBRL(lucroImediato)}</td>
              <td><button class="text-[11px] text-[--color-danger] hover:underline whitespace-nowrap" onclick='estornarVenda(${JSON.stringify(v.id)}); renderPage();'>Estornar</button></td>
            </tr>`;
          }).join('') || `<tr><td colspan="6" class="text-center text-slate-400 py-6">Nenhuma venda registrada</td></tr>`}
        </tbody>
      </table>
    </div>
    <p class="text-[11px] text-slate-400 mt-1">*Vendas com fiado mostram só a parte já recebida na hora — o restante entra no lucro quando o cliente pagar (aparece separado no extrato de pagamentos de fiado).</p>
  `;
}

function renderFormasPagamento(vendas) {
  const totais = {};
  vendas.forEach((v) => v.pagamentos.forEach((p) => { totais[p.forma] = (totais[p.forma] || 0) + p.valor; }));
  const total = Object.values(totais).reduce((s, v) => s + v, 0);
  const formas = Object.keys(FORMAS_LABEL);

  if (total === 0) return `<p class="text-sm text-slate-400 py-6 text-center">Sem vendas no período</p>`;

  return `<div class="space-y-2.5">
    ${formas.filter((f) => totais[f] > 0).map((f) => {
      const pct = (totais[f] / total) * 100;
      return `
        <div>
          <div class="flex justify-between text-xs mb-1"><span>${FORMAS_LABEL[f]}</span><span class="tabular-nums font-medium">${fmtBRL(totais[f])} · ${pct.toFixed(0)}%</span></div>
          <div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div style="width:${pct}%; background:${FORMAS_COR[f]}" class="h-full rounded-full"></div></div>
        </div>`;
    }).join('')}
  </div>`;
}

/** Consolida a atividade de cada operador: caixas abertos/fechados, vendas, sangrias, diferenças */
function renderPorOperador() {
  const caixas = DB.list('caixa');
  const vendas = DB.list('vendas').filter((v) => !v.estornada);
  const operadoresSet = new Set();
  caixas.forEach((c) => {
    if (c.operadorAbertura) operadoresSet.add(c.operadorAbertura);
    if (c.operadorFechamento) operadoresSet.add(c.operadorFechamento);
    (c.movimentos || []).forEach((m) => { if (m.operador) operadoresSet.add(m.operador); });
  });
  const operadores = Array.from(operadoresSet).sort();

  if (operadores.length === 0) {
    return `<p class="text-sm text-slate-400 text-center py-6">Nenhum operador registrado ainda — informe seu nome ao abrir o caixa (F6) ou registrar sangria/suprimento (F7).</p>`;
  }

  const linhas = operadores.map((nome) => {
    const caixasAbertos = caixas.filter((c) => c.operadorAbertura === nome);
    const caixaIds = caixasAbertos.map((c) => c.id);
    const vendasDoOperador = vendas.filter((v) => caixaIds.includes(v.caixaId));
    const totalVendido = vendasDoOperador.reduce((s, v) => s + v.total, 0);
    const sangriasDoOperador = caixas.flatMap((c) => c.movimentos || []).filter((m) => m.operador === nome && m.tipo === 'sangria');
    const totalSangrias = sangriasDoOperador.reduce((s, m) => s + m.valor, 0);
    const fechamentosDoOperador = caixas.filter((c) => c.operadorFechamento === nome && c.diferenca != null);
    const diferencaAcumulada = fechamentosDoOperador.reduce((s, c) => s + c.diferenca, 0);
    return { nome, caixasAbertos: caixasAbertos.length, vendasCount: vendasDoOperador.length, totalVendido, sangriasCount: sangriasDoOperador.length, totalSangrias, fechamentosCount: fechamentosDoOperador.length, diferencaAcumulada };
  });

  return `
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead><tr><th>Operador</th><th>Caixas abertos</th><th>Vendas realizadas</th><th>Total vendido</th><th>Sangrias registradas</th><th>Fechamentos</th><th>Diferença acumulada</th></tr></thead>
        <tbody>
          ${linhas.map((l) => `
            <tr>
              <td class="font-medium">${l.nome}</td>
              <td class="tabular-nums">${l.caixasAbertos}</td>
              <td class="tabular-nums">${l.vendasCount}</td>
              <td class="tabular-nums font-medium">${fmtBRL(l.totalVendido)}</td>
              <td class="tabular-nums">${l.sangriasCount} (${fmtBRL(l.totalSangrias)})</td>
              <td class="tabular-nums">${l.fechamentosCount}</td>
              <td class="tabular-nums ${l.diferencaAcumulada < 0 ? 'text-[--color-danger]' : l.diferencaAcumulada > 0 ? 'text-[--color-success]' : ''}">${fmtBRL(l.diferencaAcumulada)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="text-[11px] text-slate-400 mt-2">"Diferença acumulada" soma as diferenças de caixa (contado − esperado) dos fechamentos feitos por esse operador — ajuda a ver se o problema se repete sempre com a mesma pessoa.</p>
  `;
}

function renderCurvaABC(vendas) {
  const porProduto = {};
  vendas.forEach((v) => v.itens.forEach((it) => {
    if (!porProduto[it.produtoId]) porProduto[it.produtoId] = { nome: it.nome, qtd: 0, valor: 0 };
    porProduto[it.produtoId].qtd += it.qtd;
    porProduto[it.produtoId].valor += it.precoUnit * it.qtd - it.descontoItem;
  }));
  const lista = Object.values(porProduto).sort((a, b) => b.valor - a.valor);
  const totalGeral = lista.reduce((s, p) => s + p.valor, 0);
  if (totalGeral === 0) return `<p class="text-sm text-slate-400 py-6 text-center">Nenhuma venda registrada ainda</p>`;

  let acumulado = 0;
  const linhas = lista.map((p) => {
    acumulado += p.valor;
    const pctAcumulado = (acumulado / totalGeral) * 100;
    const classe = pctAcumulado <= 80 ? 'A' : pctAcumulado <= 95 ? 'B' : 'C';
    const classeCor = { A: 'badge-ok', B: 'badge-warn', C: 'badge-neutral' }[classe];
    return { ...p, pctAcumulado, classe, classeCor };
  });

  return `
    <table class="data-table">
      <thead><tr><th>Produto</th><th>Qtd. vendida</th><th>Faturamento</th><th>% Acumulado</th><th>Classe</th></tr></thead>
      <tbody>
        ${linhas.map((l) => `
          <tr>
            <td class="font-medium">${l.nome}</td>
            <td class="tabular-nums">${l.qtd % 1 === 0 ? l.qtd : l.qtd.toFixed(3)}</td>
            <td class="tabular-nums">${fmtBRL(l.valor)}</td>
            <td class="tabular-nums">${l.pctAcumulado.toFixed(1)}%</td>
            <td><span class="badge ${l.classeCor}">${l.classe}</span></td>
          </tr>`).join('')}
      </tbody>
    </table>
  `;
}
