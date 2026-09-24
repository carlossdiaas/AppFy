/**
 * ranking.js — Ranking de produtos mais vendidos, com filtro de período
 */
let rankingPeriodo = 'mes'; // 'hoje' | 'semana' | 'mes' | 'tudo'
let rankingOrdenarPor = 'qtd'; // 'qtd' | 'valor'
const SENHA_PAGINA_RANKING = '1234';
let paginaRankingDesbloqueada = false;

document.addEventListener('DOMContentLoaded', () => {
  protegerPagina(() => {
    renderShell('ranking.html', 'Ranking de Produtos');
    renderPage();
  });
});

const PERIODOS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Últimos 7 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: 'tudo', label: 'Desde o início' },
];

function vendasDoPeriodo() {
  const vendas = DB.list('vendas').filter((v) => !v.estornada);
  if (rankingPeriodo === 'tudo') return vendas;
  const hoje = new Date().toISOString().slice(0, 10);
  if (rankingPeriodo === 'hoje') return vendas.filter((v) => v.data.slice(0, 10) === hoje);
  if (rankingPeriodo === 'semana') {
    const seteDiasAtras = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return vendas.filter((v) => v.data.slice(0, 10) >= seteDiasAtras);
  }
  if (rankingPeriodo === 'mes') {
    const mesAtual = new Date().toISOString().slice(0, 7);
    return vendas.filter((v) => v.data.slice(0, 7) === mesAtual);
  }
  return vendas;
}

function calcularRanking(vendas) {
  const porProduto = {};
  vendas.forEach((v) => v.itens.forEach((it) => {
    if (!porProduto[it.produtoId]) porProduto[it.produtoId] = { nome: it.nome, unidade: it.unidade, qtd: 0, valor: 0, vendas: 0 };
    porProduto[it.produtoId].qtd += it.qtd;
    porProduto[it.produtoId].valor += it.precoUnit * it.qtd - it.descontoItem;
    porProduto[it.produtoId].vendas += 1;
  }));
  const lista = Object.values(porProduto);
  lista.sort((a, b) => (rankingOrdenarPor === 'valor' ? b.valor - a.valor : b.qtd - a.qtd));
  return lista;
}

function renderPage() {
  const content = document.getElementById('page-content');
  if (!paginaRankingDesbloqueada) {
    content.innerHTML = paginaBloqueadaHTML('Ranking', 'senha-pagina-ranking', 'desbloquearPaginaRanking');
    const campo = document.getElementById('senha-pagina-ranking');
    if (campo) setTimeout(() => campo.focus(), 30);
    return;
  }
  const vendas = vendasDoPeriodo();
  const ranking = calcularRanking(vendas);
  const totalUnidades = ranking.reduce((s, p) => s + p.qtd, 0);
  const totalFaturado = ranking.reduce((s, p) => s + p.valor, 0);

  content.innerHTML = `
    <div class="flex justify-end mb-2 no-print">
      <button class="btn btn-ghost text-xs" onclick="imprimirRelatorioAtual()">🖨️ Exportar / Imprimir (PDF)</button>
    </div>
    <div class="flex items-center gap-2 mb-4 flex-wrap">
      <div class="flex gap-2">
        ${PERIODOS.map((p) => `<button class="btn ${rankingPeriodo === p.id ? 'btn-primary' : 'btn-ghost'} text-xs" onclick="rankingPeriodo='${p.id}'; renderPage()">${p.label}</button>`).join('')}
      </div>
      <div class="flex gap-2 ml-auto">
        <button class="btn ${rankingOrdenarPor === 'qtd' ? 'btn-primary' : 'btn-ghost'} text-xs" onclick="rankingOrdenarPor='qtd'; renderPage()">Por quantidade</button>
        <button class="btn ${rankingOrdenarPor === 'valor' ? 'btn-primary' : 'btn-ghost'} text-xs" onclick="rankingOrdenarPor='valor'; renderPage()">Por faturamento</button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      ${statCardIcon('box', 'blue', 'Produtos diferentes vendidos', ranking.length)}
      ${statCardIcon('list', 'slate', 'Unidades vendidas no período', totalUnidades % 1 === 0 ? totalUnidades : totalUnidades.toFixed(2))}
      ${statCardIcon('money', 'green', 'Faturamento no período', fmtBRL(totalFaturado))}
    </div>

    ${ranking.length === 0 ? `
      <div class="card p-10 text-center text-slate-400 text-sm">Nenhuma venda registrada nesse período ainda.</div>
    ` : `
      <div class="card">
        <table class="data-table">
          <thead><tr><th></th><th>Produto</th><th>Qtd. vendida</th><th>Faturamento</th><th>Vendas</th></tr></thead>
          <tbody>
            ${ranking.map((p, i) => rankingRow(p, i)).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function desbloquearPaginaRanking() {
  const senha = document.getElementById('senha-pagina-ranking').value;
  if (senha === SENHA_PAGINA_RANKING) { paginaRankingDesbloqueada = true; renderPage(); }
  else toast('Senha incorreta', 'error');
}

function rankingRow(p, i) {
  const posicao = i + 1;
  const medalha = { 1: '🥇', 2: '🥈', 3: '🥉' }[posicao];
  const qtdFmt = p.qtd % 1 === 0 ? p.qtd : p.qtd.toFixed(3);
  return `
    <tr>
      <td class="text-center font-bold ${posicao <= 3 ? 'text-lg' : 'text-slate-400 text-sm'}">${medalha || posicao}</td>
      <td class="font-medium">${p.nome}</td>
      <td class="tabular-nums">${qtdFmt} ${p.unidade}</td>
      <td class="tabular-nums font-semibold">${fmtBRL(p.valor)}</td>
      <td class="tabular-nums text-slate-500">${p.vendas}</td>
    </tr>`;
}
