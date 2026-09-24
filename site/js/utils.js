/**
 * utils.js — helpers compartilhados entre todas as páginas
 */

const fmtBRL = (v) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
};

const fmtDataHora = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const hojeISO = () => new Date().toISOString();

const NAV_GROUPS = [
  {
    label: 'Operações',
    items: [
      { href: 'index.html', label: 'PDV', icon: 'pdv' },
      { href: 'estoque.html', label: 'Estoque', icon: 'estoque' },
      { href: 'clientes.html', label: 'Clientes / Fiado', icon: 'clientes' },
      { href: 'fornecedores.html', label: 'Fornecedores', icon: 'fornecedores' },
      { href: 'promocoes.html', label: 'Promoções', icon: 'promocoes' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: 'financeiro.html', label: 'Financeiro', icon: 'financeiro' },
      { href: 'relatorios.html', label: 'Relatórios', icon: 'relatorios' },
      { href: 'ranking.html', label: 'Ranking de Produtos', icon: 'ranking' },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { href: 'usuarios.html', label: 'Usuários', icon: 'usuarios' },
    ],
  },
];

const ICONS = {
  pdv: '<path d="M3 9h18M7 3v4M17 3v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>',
  estoque: '<path d="M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5M3 8l9 5m-9-5v9l9 5m0-9v9"/>',
  clientes: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  financeiro: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  relatorios: '<path d="M3 3v18h18M7 16v-4M12 16V8M17 16v-7"/>',
  ranking: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4a2 2 0 0 0 0 4h1M17 6h3a2 2 0 0 1 0 4h-1"/>',
  usuarios: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
  fornecedores: '<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8Z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  promocoes: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="4"/>',
};

/** Ícones usados nos cards de estatística com chip colorido (statCardIcon) */
const STAT_ICONS = {
  money: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  tag: '<path d="M20.59 13.41 12 22l-9-9V4a1 1 0 0 1 1-1h9l7.59 7.59a2 2 0 0 1 0 2.82Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  chart: '<path d="M3 3v18h18M7 16v-4M12 16V8M17 16v-7"/>',
  box: '<path d="M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5M3 8l9 5m-9-5v9l9 5m0-9v9"/>',
  warning: '<path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4a2 2 0 0 0 0 4h1M17 6h3a2 2 0 0 1 0 4h-1"/>',
  receipt: '<path d="M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 2V2Z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
};

/**
 * Card de estatística com ícone colorido (chip), no padrão usado no topo
 * de Estoque, Clientes, Relatórios e Ranking.
 *   icon: chave de STAT_ICONS (ex: 'money', 'box', 'warning'...)
 *   cor: 'blue' | 'green' | 'amber' | 'red' | 'slate'
 *   sub: opcional — texto pequeno abaixo do valor, ou uma classe 'text-...' pra colorir o valor
 */
function statCardIcon(icon, cor, label, value, sub) {
  const subEhClasse = sub && sub.startsWith('text-');
  return `
    <div class="card p-4 stat-card-v2">
      <div class="icon-chip icon-chip-${cor}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${STAT_ICONS[icon] || ''}</svg>
      </div>
      <div class="min-w-0">
        <p class="text-xs text-slate-500 truncate">${label}</p>
        <p class="text-xl font-bold leading-tight ${subEhClasse ? sub : ''}">${value}</p>
        ${sub && !subEhClasse ? `<p class="text-[11px] text-slate-400 truncate">${sub}</p>` : ''}
      </div>
    </div>`;
}

/** Injeta sidebar + topbar em qualquer página que tenha #app-shell */
function renderShell(activeHref, pageTitle) {
  const shell = document.getElementById('app-shell');
  if (!shell) return;

  // lembra se o menu tava fechado (por padrão já começa fechado em telas
  // estreitas, e aberto em telas largas, se a pessoa nunca mexeu nisso)
  let sidebarFechado;
  try {
    const salvo = localStorage.getItem('pdvbr_sidebar_fechado');
    sidebarFechado = salvo !== null ? salvo === '1' : window.innerWidth < 900;
  } catch (e) { sidebarFechado = false; }
  shell.classList.toggle('sidebar-fechado', sidebarFechado);
  shell.classList.remove('sidebar-aberto');

  const caixa = DB.getCaixaAberto();
  const caixaBadge = caixa
    ? `<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-medium"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Caixa aberto</span>`
    : `<span class="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 px-3 py-1 text-xs font-medium"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Caixa fechado</span>`;
  const pastaBadge = pastaBadgeHTML();

  // alerta de estoque baixo/zerado/vencendo, mostrado como bolinha vermelha
  // no item "Estoque" do menu — visível de qualquer tela, sem precisar entrar lá
  const alertaEstoque = DB.list('produtos').filter((p) =>
    p.estoqueAtual <= p.estoqueMinimo || (p.validade && diasParaValidade(p.validade) <= 7)
  ).length;

  const navGrupo = (item) => {
    const isActive = item.href === activeHref;
    const mostrarAlerta = item.href === 'estoque.html' && alertaEstoque > 0;
    return `
      <a href="${item.href}" class="nav-link ${isActive ? 'nav-link-active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 shrink-0">${ICONS[item.icon]}</svg>
        <span class="flex-1">${item.label}</span>
        ${mostrarAlerta ? `<span class="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">${alertaEstoque}</span>` : ''}
      </a>`;
  };
  const nav = NAV_GROUPS.map((grupo) => `
    <p class="nav-section-label">${grupo.label}</p>
    ${grupo.items.map(navGrupo).join('')}
  `).join('');

  // status real do armazenamento (não é "servidor online", é se o
  // localStorage tá disponível nesse navegador ou se caiu no modo
  // temporário — informação de verdade, não decorativa)
  const statusArmazenamento = (typeof storageDisponivel !== 'undefined' && storageDisponivel)
    ? `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Dados salvos`
    : `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Modo temporário`;

  shell.innerHTML = `
    <aside class="pdv-sidebar">
      <div class="px-5 py-5 border-b border-white/10">
        <div class="flex items-center gap-2.5">
          <img src="img/logo-mercadinho-lima.png" alt="Mercadinho Lima" class="w-[60px] h-[60px] rounded-md object-cover bg-white/5 border border-white/10 shrink-0" />
          <div class="leading-tight">
            <p class="text-sm font-semibold text-white truncate max-w-[100px]">${DB.getConfig().nomeLoja}</p>
            <p class="text-[11px] text-white/50">Gestão Comercial</p>
          </div>
        </div>
      </div>
      <nav class="flex-1 px-3 py-1 space-y-1 overflow-y-auto">${nav}</nav>
      <div class="px-3 pb-2 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-white/45">
        ${statusArmazenamento}
      </div>
      <div class="px-3 pb-4 flex items-center justify-between gap-2">
        <span class="text-[11px] text-white/40 truncate" title="${(typeof DB !== 'undefined' && DB.usuarioAtualEmail) ? DB.usuarioAtualEmail() : ''}">${(typeof DB !== 'undefined' && DB.usuarioAtualEmail) ? DB.usuarioAtualEmail() : ''}</span>
        <button class="text-[11px] text-white/60 hover:text-white shrink-0" onclick="pdvSair()" title="Sair da conta">⏻ Sair</button>
      </div>
    </aside>
    <div class="pdv-main">
      <header class="pdv-topbar">
        <div class="flex items-center gap-3">
          <button class="hamburger-btn" title="Mostrar/esconder menu" onclick="alternarSidebar()">☰</button>
          <h1 class="text-[15px] font-semibold text-[--color-ink]">${pageTitle}</h1>
        </div>
        <div class="flex items-center gap-3">
          <span id="caixa-badge">${caixaBadge}</span>
          <span id="pasta-badge">${pastaBadge}</span>
          <span id="clock" class="text-xs text-slate-500 font-mono tabular-nums"></span>
        </div>
      </header>
      <main class="pdv-content" id="page-content"></main>
    </div>
    <div id="toast-root" class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"></div>
  `;

  const clock = document.getElementById('clock');
  const tick = () => {
    if (clock) clock.textContent = new Date().toLocaleString('pt-BR');
  };
  tick();
  setInterval(tick, 1000);
}

/**
 * Atualiza só o badge "Caixa aberto/fechado" no topo, sem redesenhar o
 * resto do shell (evita empilhar o setInterval do relógio e é bem mais
 * rápido). Chame isso sempre que abrir/fechar o caixa.
 */
function atualizarBadgeCaixa() {
  const el = document.getElementById('caixa-badge');
  if (!el) return;
  const caixa = DB.getCaixaAberto();
  el.innerHTML = caixa
    ? `<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-medium"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Caixa aberto</span>`
    : `<span class="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 px-3 py-1 text-xs font-medium"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Caixa fechado</span>`;
}

/**
 * Monta o HTML do badge de pasta no topo, com 3 estados possíveis:
 *  - conectada (verde): tudo certo, salvando na pasta normalmente
 *  - pendente (amarelo, pisca): já teve uma pasta escolhida antes, mas o
 *    app perdeu a permissão de escrita ao reabrir (acontece sempre que o
 *    programa é fechado e aberto de novo — ver nota em db.js). 1 clique
 *    aqui já resolve, sem precisar escolher a pasta de novo.
 *  - nenhuma (cinza): nunca conectou pasta nenhuma.
 */
function pastaBadgeHTML() {
  if (typeof DataFolder === 'undefined') {
    return `<button class="text-xs text-slate-500 hover:text-[--color-primary] flex items-center gap-1" onclick="abrirPastaDadosModal()">📁 Dados</button>`;
  }
  if (DataFolder.handle) {
    return `<button class="text-xs text-slate-500 hover:text-[--color-primary] flex items-center gap-1" onclick="abrirPastaDadosModal()" title="Pasta conectada: ${DataFolder.nome}">📁 ${DataFolder.nome}</button>`;
  }
  if (DataFolder.handlePendente) {
    return `<button class="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded-full px-2.5 py-1 hover:bg-amber-100 flex items-center gap-1 animate-pulse" onclick="DataFolder.reconectarPastaPendente()" title="A pasta '${DataFolder.nomePendente}' precisa de 1 clique pra voltar a salvar nela">🔓 Reconectar pasta</button>`;
  }
  return `<button class="text-xs text-slate-500 hover:text-[--color-primary] flex items-center gap-1" onclick="abrirPastaDadosModal()">📁 Dados</button>`;
}

/** Atualiza só o badge da pasta no topo, sem redesenhar o resto do shell. */
function atualizarBadgePasta() {
  const el = document.getElementById('pasta-badge');
  if (!el) return;
  el.innerHTML = pastaBadgeHTML();
}

function toast(msg, type = 'info') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const colors = {
    info: 'bg-slate-800',
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
  };
  const el = document.createElement('div');
  el.className = `${colors[type] || colors.info} text-white text-sm px-4 py-2.5 rounded-lg shadow-lg animate-toast-in`;
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(4px)';
    setTimeout(() => el.remove(), 200);
  }, 2600);
}

function confirmDialog(message) {
  return window.confirm(message);
}

/**
 * ATENÇÃO: propositalmente SEM aviso de "beforeunload" aqui.
 *
 * Esse app é de páginas múltiplas (cada link do menu — Estoque, Clientes,
 * Financeiro etc. — é uma navegação de página de verdade, não uma troca
 * dentro da mesma página). O navegador dispara o evento "beforeunload"
 * tanto ao FECHAR a aba/janela quanto ao NAVEGAR para outra página do
 * próprio site — não tem como diferenciar os dois só com JavaScript.
 *
 * Por isso, um listener de beforeunload que travasse com o caixa aberto
 * acabava travando também o simples ato de clicar em "Estoque" ou
 * "Clientes" no menu, o que não é o comportamento desejado (o caixa
 * aberto não deveria impedir de navegar pelo sistema, só de FECHAR o
 * programa sem fechar o caixa antes).
 *
 * A proteção de verdade contra fechar o app com o caixa aberto já existe
 * em outro lugar, de um jeito melhor: o main.js (processo principal do
 * Electron) intercepta o fechamento real da janela, checa se o caixa tá
 * aberto e mostra um aviso nativo do Windows perguntando se quer sair
 * mesmo assim — isso sim é só quando a pessoa tenta fechar o programa de
 * verdade, nunca ao trocar de página dentro do sistema.
 */

/** Mostra/esconde o menu lateral (hambúrguer) e lembra a escolha pra próxima tela */
function alternarSidebar() {
  const shell = document.getElementById('app-shell');
  if (!shell) return;
  if (window.innerWidth < 900) {
    // telas estreitas: o menu sobrepõe o conteúdo (igual um "drawer")
    shell.classList.toggle('sidebar-aberto');
  } else {
    // telas largas: o menu encolhe/expande, empurrando o conteúdo
    const fechado = shell.classList.toggle('sidebar-fechado');
    try { localStorage.setItem('pdvbr_sidebar_fechado', fechado ? '1' : '0'); } catch (e) { /* ignora */ }
  }
}

/** Imprime (ou exporta como PDF, via o "Salvar como PDF" da caixa de impressão do navegador) a página atual, escondendo menu lateral e botões */
function imprimirRelatorioAtual() {
  document.body.classList.add('modo-impressao-relatorio');
  window.print();
  setTimeout(() => document.body.classList.remove('modo-impressao-relatorio'), 500);
}

/**
 * Estorna uma venda já finalizada: devolve os itens pro estoque, devolve
 * o saldo devedor do cliente (se teve parte fiado) e marca a venda como
 * estornada (sem apagar — fica no histórico, só passa a não contar mais
 * em lucro/DRE/ranking/relatórios).
 */
function estornarVenda(vendaId) {
  const venda = DB.get('vendas', vendaId);
  if (!venda) { toast('Venda não encontrada', 'error'); return; }
  if (venda.estornada) { toast('Essa venda já foi estornada', 'warning'); return; }
  if (!confirmDialog(`Estornar essa venda de ${fmtBRL(venda.total)}? O estoque volta e ela deixa de contar nos relatórios. Essa ação não pode ser desfeita.`)) return;

  venda.itens.forEach((it) => {
    const produto = DB.get('produtos', it.produtoId);
    if (produto) DB.update('produtos', produto.id, { estoqueAtual: Number((produto.estoqueAtual + it.qtd).toFixed(3)) });
  });

  const valorFiado = (venda.pagamentos || []).filter((p) => p.forma === 'fiado').reduce((s, p) => s + p.valor, 0);
  if (valorFiado > 0 && venda.clienteId) {
    const cliente = DB.get('clientes', venda.clienteId);
    if (cliente) DB.update('clientes', cliente.id, { saldoDevedor: Number(Math.max(0, cliente.saldoDevedor - valorFiado).toFixed(2)) });
  }

  DB.update('vendas', vendaId, { estornada: true, dataEstorno: hojeISO() });
  toast('Venda estornada — estoque devolvido', 'success');
}

/**
 * HTML de uma tela de bloqueio por senha pra página inteira (usada em
 * Financeiro, Relatórios, Ranking e Usuários — grupos "Gestão" e
 * "Configurações" do menu). Cada página chama isso no lugar do conteúdo
 * normal enquanto não for desbloqueada.
 */
function paginaBloqueadaHTML(tituloPagina, campoSenhaId, fnDesbloquear) {
  return `
    <div class="flex items-center justify-center py-24">
      <div class="card p-6 max-w-xs w-full text-center">
        <div class="icon-chip icon-chip-slate mx-auto mb-3" style="width:48px;height:48px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h3 class="font-semibold text-sm mb-1">${tituloPagina} protegido</h3>
        <p class="text-xs text-slate-400 mb-3">Digite a senha pra continuar.</p>
        <div class="flex gap-2">
          <input id="${campoSenhaId}" data-autofocus type="password" inputmode="numeric" class="input" placeholder="Senha" onkeydown="if(event.key==='Enter')${fnDesbloquear}()" />
          <button class="btn btn-primary whitespace-nowrap" onclick="${fnDesbloquear}()">Entrar</button>
        </div>
      </div>
    </div>`;
}

/** Escapa texto pra ser embutido com segurança dentro de um atributo HTML */
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Fileira de avatares clicáveis pra selecionar rapidamente um usuário já
 * cadastrado (em vez de digitar o nome toda vez) — clicar preenche o campo
 * de texto indicado por inputId com o nome dele. Se não houver nenhum
 * usuário cadastrado ainda, retorna vazio (o campo de texto continua
 * funcionando normalmente como alternativa).
 */
function seletorUsuariosHTML(inputId) {
  const usuarios = DB.list('usuarios');
  if (usuarios.length === 0) return '';
  return `
    <div class="flex gap-2 flex-wrap mb-2">
      ${usuarios.map((u) => `
        <button type="button" class="flex flex-col items-center gap-1 w-14" title="${escapeAttr(u.nome)}" data-nome="${escapeAttr(u.nome)}" onclick="document.getElementById('${inputId}').value=this.dataset.nome">
          ${u.foto
            ? `<img src="${u.foto}" class="w-10 h-10 rounded-full object-cover border-2 border-transparent hover:border-[--color-primary]" />`
            : `<div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-semibold hover:ring-2 hover:ring-[--color-primary]">${escapeAttr(u.nome[0].toUpperCase())}</div>`}
          <span class="text-[10px] text-slate-500 truncate w-full text-center">${escapeAttr(u.nome)}</span>
        </button>`).join('')}
    </div>`;
}

/**
 * Quanto de dinheiro uma venda realmente deixou na gaveta — o valor pago
 * em dinheiro MENOS o troco devolvido (o troco não fica na gaveta).
 * Funciona mesmo com vendas antigas que não tinham o campo "troco"
 * salvo: recalcula na hora a partir dos pagamentos e do total.
 */
function dinheiroLiquidoVenda(v) {
  const dinheiroTotal = (v.pagamentos || []).filter((p) => p.forma === 'dinheiro').reduce((s, p) => s + p.valor, 0);
  let troco = v.troco;
  if (troco === undefined || troco === null) {
    const pago = (v.pagamentos || []).reduce((s, p) => s + p.valor, 0);
    const excedente = Math.max(0, pago - v.total);
    troco = Math.min(dinheiroTotal, excedente);
  }
  return dinheiroTotal - troco;
}

/**
 * Se o preço de venda não foi informado (ficou 0), aplica um markup
 * automático de 25% em cima do custo — evita produto salvo sem preço de
 * venda por esquecimento. Se já tiver um valor de venda, respeita ele.
 */
function aplicarMarkupSeVazio(custo, venda, markup = 1.25) {
  if (venda > 0) return venda;
  if (custo > 0) return Number((custo * markup).toFixed(2));
  return 0;
}

/** Quantos dias faltam pra um produto vencer (negativo = já venceu, null = sem validade cadastrada) */
function diasParaValidade(validade) {
  if (!validade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataValidade = new Date(`${validade}T00:00:00`);
  return Math.round((dataValidade - hoje) / (1000 * 60 * 60 * 24));
}

/** Diz se uma promoção (desconto em produto ou cesta básica) está dentro
 * do período de validade E marcada como ativa */
function promocaoEstaAtiva(promo) {
  if (!promo || !promo.ativo) return false;
  const hoje = new Date().toISOString().slice(0, 10);
  if (promo.dataInicio && hoje < promo.dataInicio) return false;
  if (promo.dataFim && hoje > promo.dataFim) return false;
  return true;
}

/**
 * Fileira de botões de markup rápido (20/25/30/35%) pra colocar logo
 * abaixo de um campo "Preço de venda" — calcula em cima do campo de
 * custo indicado e preenche a venda sozinho, sem precisar de calculadora.
 * O preenchimento manual continua funcionando normal, é só um atalho.
 */
function botoesMarkupHTML(idCusto, idVenda) {
  return `
    <div class="flex gap-1.5 mt-1.5">
      ${[20, 25, 30].map((pct) => `<button type="button" class="btn btn-ghost text-xs flex-1" onclick="aplicarMarkupRapido('${idCusto}','${idVenda}',${pct})">+${pct}%</button>`).join('')}
    </div>`;
}

function aplicarMarkupRapido(idCusto, idVenda, pct) {
  const campoCusto = document.getElementById(idCusto);
  const campoVenda = document.getElementById(idVenda);
  if (!campoCusto || !campoVenda) return;
  const custo = parseMoeda(campoCusto.value);
  if (custo <= 0) { toast('Informe o preço de custo primeiro', 'warning'); return; }
  const venda = Number((custo * (1 + pct / 100)).toFixed(2));
  campoVenda.value = paraCampoDecimal(venda);
  campoVenda.dispatchEvent(new Event('input', { bubbles: true }));
}

/** util para inputs numéricos monetários em texto -> número */
function parseMoeda(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return Number(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

/**
 * Converte um número JS pra string pronta pra colocar num input decimal
 * (vírgula como separador, do jeito brasileiro) — usar SEMPRE que for
 * pré-preencher o value="" de um campo que depois é lido com parseMoeda().
 * Nunca usar número.toFixed(2) direto num value="", porque o toFixed usa
 * ponto, e o parseMoeda entende ponto como separador de milhar — um preço
 * de R$16,66 viraria 1666 se o campo fosse resalvo sem alteração.
 */
function paraCampoDecimal(n, casas = 2) {
  if (n === null || n === undefined || n === '') return '';
  const num = Number(n);
  if (Number.isNaN(num)) return '';
  return num.toFixed(casas).replace('.', ',');
}

/**
 * Mesma ideia do paraCampoDecimal, mas pra campos de quantidade: mostra
 * número inteiro sem casas decimais (10, não 10,000) e só usa casas
 * decimais quando o valor realmente tem fração (1,75 kg).
 */
function paraCampoQuantidade(n) {
  if (n === null || n === undefined || n === '') return '';
  const num = Number(n);
  if (Number.isNaN(num)) return '';
  if (Number.isInteger(num)) return String(num);
  const semZerosSobrando = num.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return semZerosSobrando.replace('.', ',');
}

/* ==========================================================================
   PASTA DE DADOS / BACKUP — modal compartilhado por todas as páginas
   ========================================================================== */
const SENHAS_DADOS = ['K1k2e3c4@', '14632010'];
let dadosDesbloqueado = false;

function abrirPastaDadosModal() {
  fecharPastaDadosModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'pasta-dados-overlay';

  if (!dadosDesbloqueado) {
    overlay.innerHTML = `<div class="modal-box">
      <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">🔒 Pasta de dados / Backup</h3></div>
      <div class="p-4 space-y-3">
        <p class="text-xs text-slate-500">Essa área mexe com backup e apagar dados do sistema — precisa de senha.</p>
        <input id="senha-dados" data-autofocus type="password" class="input" placeholder="Senha" />
        <button class="btn btn-primary w-full" onclick="desbloquearDados()">Entrar</button>
        <button class="btn btn-ghost w-full" onclick="fecharPastaDadosModal()">Cancelar</button>
      </div>
    </div>`;
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) fecharPastaDadosModal(); });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', _escFechaPastaDados);
    const campoSenha = document.getElementById('senha-dados');
    if (campoSenha) {
      setTimeout(() => campoSenha.focus(), 30);
      campoSenha.addEventListener('keydown', (e) => { if (e.key === 'Enter') desbloquearDados(); });
    }
    return;
  }

  const ultimoBackupISO = DB.getConfig().ultimoBackupAutomatico;
  const secaoPasta = DataFolder.handle
    ? `<div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
         <p class="text-sm text-emerald-700 font-medium">📁 Pasta conectada: ${DataFolder.nome}</p>
         <p class="text-xs text-emerald-600 mt-1">Todo dado salvo aqui também é gravado automaticamente em <code>pdvbr_dados.json</code> nessa pasta.</p>
         <p class="text-xs text-emerald-600 mt-1">📦 Um backup datado é salvo sozinho: 1) toda vez que o caixa é fechado, e 2) pelo menos uma vez por dia (a cada 24h) mesmo que o caixa não seja fechado — dentro de uma subpasta <code>backup/</code>.</p>
         <p class="text-xs text-slate-500 mt-2">Último backup automático: <strong>${ultimoBackupISO ? fmtDataHora(ultimoBackupISO) : 'ainda não rodou'}</strong></p>
         ${DataFolder.ultimoErroBackup ? `<p class="text-xs text-[--color-danger] mt-2">⚠️ Último salvamento/backup falhou: ${DataFolder.ultimoErroBackup}</p>` : ''}
         <button class="btn btn-ghost w-full mt-2 text-xs" onclick="fazerBackupAgora()">📦 Fazer backup agora</button>
         <button class="btn btn-ghost w-full mt-2 text-xs" onclick="DataFolder.desconectar(); abrirPastaDadosModal();">Desconectar pasta</button>
       </div>`
    : DataFolder.handlePendente
      ? `<div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
           <p class="text-sm text-amber-700 font-medium">🔓 Pasta "${DataFolder.nomePendente}" precisa reconectar</p>
           <p class="text-xs text-amber-600 mt-1">O sistema lembra qual pasta você escolheu, mas o navegador esquece a permissão de escrita toda vez que o programa é fechado — isso é uma trava de segurança do próprio navegador, não um defeito. Clique abaixo pra reconectar essa mesma pasta (não precisa escolher de novo).</p>
           <button class="btn btn-primary w-full mt-2 text-xs" onclick="DataFolder.reconectarPastaPendente().then(() => abrirPastaDadosModal())">🔓 Reconectar pasta "${DataFolder.nomePendente}"</button>
           <button class="btn btn-ghost w-full mt-2 text-xs" onclick="DataFolder.desconectar(); abrirPastaDadosModal();">Esquecer essa pasta e escolher outra</button>
         </div>`
      : DataFolder.suportado
      ? `<button class="btn btn-primary w-full" onclick="DataFolder.conectar().then(() => abrirPastaDadosModal())">📁 Escolher pasta no computador</button>
         <p class="text-xs text-slate-400 mt-1">Os dados passam a ser salvos automaticamente em um arquivo <code>pdvbr_dados.json</code> dentro da pasta escolhida — além do navegador.</p>
         <p class="text-[11px] text-blue-600 mt-1.5">💡 Dica pra trocar de computador: escolha a própria pasta do projeto (a que tem o <code>index.html</code>). O <code>pdvbr_dados.json</code> fica salvo ali dentro, então zipando essa pasta inteira e abrindo no outro PC (com servidor local), o sistema já carrega os dados sozinho.</p>`
      : `<p class="text-xs text-slate-400">Este navegador não permite conectar uma pasta diretamente (funciona no Chrome/Edge). Use o backup manual abaixo — ele cumpre o mesmo papel.</p>`;

  overlay.innerHTML = `<div class="modal-box">
    <div class="p-4 border-b border-[--color-border] flex items-center justify-between">
      <h3 class="font-semibold text-sm">Pasta de dados / Backup</h3>
      <button class="text-xs text-slate-400 hover:text-[--color-danger]" onclick="bloquearDados()">🔒 Bloquear</button>
    </div>
    <div class="p-4 space-y-3">
      ${secaoPasta}
      <div class="border-t border-[--color-border] pt-3">
        <p class="text-xs text-slate-500 mb-2">Backup manual em arquivo (funciona em qualquer navegador)</p>
        <button class="btn btn-ghost w-full mb-2" onclick="baixarBackupJSON()">⬇️ Baixar backup (.json)</button>
        <label class="btn btn-ghost w-full cursor-pointer flex items-center justify-center">
          ⬆️ Importar backup (.json)
          <input type="file" accept="application/json" class="hidden" onchange="importarBackupArquivo(event)" />
        </label>
      </div>
      <div class="border-t border-[--color-border] pt-3">
        <button class="btn btn-danger w-full text-xs" onclick="apagarTodosOsDadosAgora()">🗑️ Apagar todos os dados deste navegador</button>
        <p class="text-[11px] text-slate-400 mt-1">Remove produtos, clientes, vendas, caixa e financeiro salvos aqui. Não pode ser desfeito — faça um backup antes se quiser guardar algo.</p>
      </div>
      <button class="btn btn-ghost w-full" onclick="fecharPastaDadosModal()">Fechar</button>
    </div>
  </div>`;
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) fecharPastaDadosModal(); });
  document.body.appendChild(overlay);
  document.addEventListener('keydown', _escFechaPastaDados);
}
function desbloquearDados() {
  const campo = document.getElementById('senha-dados');
  const senha = campo ? campo.value : '';
  if (SENHAS_DADOS.includes(senha)) {
    dadosDesbloqueado = true;
    abrirPastaDadosModal();
  } else {
    toast('Senha incorreta', 'error');
  }
}
function bloquearDados() {
  dadosDesbloqueado = false;
  fecharPastaDadosModal();
}
function fecharPastaDadosModal() {
  document.getElementById('pasta-dados-overlay')?.remove();
  document.removeEventListener('keydown', _escFechaPastaDados);
}
function _escFechaPastaDados(e) { if (e.key === 'Escape') fecharPastaDadosModal(); }

/**
 * Mostra um aviso GRANDE, no meio da tela, assim que o app abre — pra
 * quando a pasta de backup precisa reconectar (perdeu permissão ao
 * fechar o programa, ver nota em db.js). O badge no topo é discreto
 * demais e passa despercebido; isso aqui não tem como não ver.
 *
 * Aparece só 1 vez por abertura do app (guardado em sessionStorage), pra
 * não ficar reabrindo esse aviso toda vez que a pessoa troca de página
 * dentro do sistema — só reconectar OU clicar em "Lembrar depois" já
 * fecha e não volta a aparecer até fechar e abrir o app de novo.
 */
function mostrarLembretePastaSeNecessario() {
  if (typeof DataFolder === 'undefined' || !DataFolder.handlePendente) return;
  try {
    if (sessionStorage.getItem('pdvbr_lembrete_pasta_feito') === '1') return;
    sessionStorage.setItem('pdvbr_lembrete_pasta_feito', '1');
  } catch (e) { /* se sessionStorage falhar, mostra mesmo assim, só não lembra da próxima vez */ }

  document.getElementById('lembrete-pasta-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'lembrete-pasta-overlay';
  overlay.innerHTML = `<div class="modal-box max-w-sm">
    <div class="p-6 space-y-3 text-center">
      <p class="text-4xl">🔓</p>
      <h3 class="font-semibold text-base text-[--color-ink]">Reconecte a pasta de backup</h3>
      <p class="text-sm text-slate-500">O programa foi fechado e o navegador esqueceu a permissão de escrever na pasta <strong>"${DataFolder.nomePendente}"</strong> — é uma trava de segurança dele, não um defeito daqui. Clique abaixo pra reconectar a mesma pasta de antes (não precisa escolher de novo).</p>
      <button class="btn btn-primary w-full" onclick="DataFolder.reconectarPastaPendente().then((ok) => { if (ok) document.getElementById('lembrete-pasta-overlay')?.remove(); })">🔓 Reconectar agora</button>
      <button class="btn btn-ghost w-full text-xs" onclick="document.getElementById('lembrete-pasta-overlay')?.remove();">Lembrar depois</button>
    </div>
  </div>`;
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

/** Dispara um backup datado na hora, sem esperar o fechamento de caixa
 * ou as 24h do backup diário — útil pra quem quer garantir um backup
 * antes de fazer alguma alteração grande, por exemplo. */
function fazerBackupAgora() {
  if (typeof DataFolder === 'undefined' || !DataFolder.handle) {
    toast('Conecte uma pasta primeiro para poder fazer backup nela.', 'warning');
    return;
  }
  toast('Salvando backup…', 'info');
  DataFolder.criarArquivoBackup().then((ok) => {
    if (ok) {
      toast('📦 Backup salvo na pasta', 'success');
      abrirPastaDadosModal();
    } else {
      toast('Não foi possível salvar o backup agora. ' + (DataFolder.ultimoErroBackup || ''), 'error');
    }
  });
}

function importarBackupArquivo(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!confirmDialog('Importar este backup vai SUBSTITUIR os dados atuais. Deseja continuar?')) return;
  importarBackupJSON(file, (ok) => {
    if (ok) {
      toast('Backup importado com sucesso. Recarregando…', 'success');
      setTimeout(() => location.reload(), 800);
    } else {
      toast('Não foi possível ler esse arquivo. Verifique se é um backup válido.', 'error');
    }
  });
}

/** Pede a senha DE NOVO antes de apagar tudo — mesmo já tendo passado pela
 * senha de entrar em "Dados", uma ação destrutiva como essa merece uma
 * segunda confirmação com senha, não só um "tem certeza?" clicável. */
function apagarTodosOsDadosAgora() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'confirmar-apagar-overlay';
  overlay.innerHTML = `<div class="modal-box">
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm text-[--color-danger]">⚠️ Confirmar exclusão de todos os dados</h3></div>
    <div class="p-4 space-y-3">
      <p class="text-sm text-slate-600">Isso vai apagar produtos, clientes, vendas, caixa e financeiro deste navegador. Não pode ser desfeito. Digite a senha de novo pra confirmar.</p>
      <input id="senha-confirmar-apagar" data-autofocus type="password" class="input" placeholder="Senha" onkeydown="if(event.key==='Enter')confirmarApagarComSenha()" />
      <div class="flex gap-2">
        <button class="btn btn-danger flex-1" onclick="confirmarApagarComSenha()">Apagar tudo</button>
        <button class="btn btn-ghost" onclick="document.getElementById('confirmar-apagar-overlay')?.remove()">Cancelar</button>
      </div>
    </div>
  </div>`;
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('senha-confirmar-apagar')?.focus(), 30);
}

function confirmarApagarComSenha() {
  const campo = document.getElementById('senha-confirmar-apagar');
  const senha = campo ? campo.value : '';
  if (!SENHAS_DADOS.includes(senha)) { toast('Senha incorreta', 'error'); return; }
  document.getElementById('confirmar-apagar-overlay')?.remove();
  apagarTodosDadosLocais();
  toast('Todos os dados foram apagados.', 'warning');
  setTimeout(() => location.reload(), 600);
}

/* ==========================================================================
   NAVEGAÇÃO POR TECLADO (setas + Enter) em listas de resultado
   ========================================================================== */
/**
 * Liga as setas ↑/↓ e Enter a uma lista de itens clicáveis, para navegar
 * sem precisar do mouse. Uso típico: campo de busca + lista de resultados
 * renderizada dinamicamente abaixo dele.
 *   inputEl        — campo onde o usuário digita (pode ser null p/ ligar no document)
 *   listContainerId — id do elemento que envolve os itens da lista
 *   itemSelector   — seletor CSS dos itens clicáveis (padrão: 'button')
 * Retorna uma função para desligar o listener quando o modal fechar.
 */
function ativarNavegacaoLista(inputEl, listContainerId, itemSelector = 'button') {
  let ativo = -1;
  const container = () => document.getElementById(listContainerId);
  const itens = () => (container() ? Array.from(container().querySelectorAll(itemSelector)) : []);

  const marcar = () => {
    const lista = itens();
    lista.forEach((el, i) => el.classList.toggle('bg-slate-100', i === ativo));
    if (lista[ativo]) lista[ativo].scrollIntoView({ block: 'nearest' });
  };

  const handler = (e) => {
    const lista = itens();
    if (!lista.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      ativo = ativo < lista.length - 1 ? ativo + 1 : 0;
      marcar();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      ativo = ativo > 0 ? ativo - 1 : lista.length - 1;
      marcar();
    } else if (e.key === 'Enter' && ativo >= 0 && lista[ativo]) {
      e.preventDefault();
      lista[ativo].click();
    }
  };

  const alvo = inputEl || document;
  alvo.addEventListener('keydown', handler);
  // sempre que a lista muda (nova digitação filtrando resultados), zera a seleção
  let observer = null;
  if (container()) {
    observer = new MutationObserver(() => { ativo = -1; });
    observer.observe(container(), { childList: true });
  }
  return () => { alvo.removeEventListener('keydown', handler); if (observer) observer.disconnect(); };
}

/**
 * Liga as setas (↑/↓/←/→) para mover o FOCO do navegador entre botões de
 * uma grade — ex: as formas de pagamento no PDV. Como o foco vai de
 * verdade para o botão, o Enter (ou Espaço) já ativa ele sozinho, é o
 * comportamento nativo do navegador — não precisa reimplementar nada.
 *   containerId  — id do elemento que envolve os botões
 *   itemSelector — seletor CSS dos botões (padrão: 'button')
 */
function ativarNavegacaoGrade(containerId, itemSelector = 'button') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const itens = () => Array.from(container.querySelectorAll(itemSelector)).filter((el) => !el.disabled);

  container.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const lista = itens();
    if (!lista.length) return;
    const atualIdx = lista.indexOf(document.activeElement);
    let prox;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      prox = atualIdx === -1 ? 0 : (atualIdx + 1) % lista.length;
    } else {
      prox = atualIdx === -1 ? lista.length - 1 : (atualIdx - 1 + lista.length) % lista.length;
    }
    e.preventDefault();
    lista[prox].focus();
  });

  // foca o primeiro item automaticamente ao abrir, se nada mais tiver foco no container
  setTimeout(() => {
    if (!container.contains(document.activeElement)) {
      const l = itens();
      if (l[0]) l[0].focus();
    }
  }, 30);
}

/**
 * Faz o Enter, digitado em qualquer campo de um modal, disparar a mesma
 * ação do botão principal (Salvar/Confirmar/Registrar) — como um "submit"
 * de formulário, sem precisar clicar com o mouse. Ignora <textarea> (pra
 * não atrapalhar quebra de linha) e campos de arquivo.
 *   modalBoxEl — elemento retornado por abrirModal(); se omitido, usa o
 *                primeiro ".modal-box" encontrado na página
 *   onSubmit   — função a chamar quando Enter for pressionado
 */
function ativarEnterSubmit(modalBoxEl, onSubmit) {
  const modalBox = modalBoxEl || document.querySelector('.modal-box');
  if (!modalBox) return;
  modalBox.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const alvo = e.target;
    if (alvo.tagName === 'TEXTAREA' || alvo.tagName === 'BUTTON') return;
    if (alvo.type === 'file') return;
    e.preventDefault();
    onSubmit();
  });
}

/* ==========================================================================
   CONSULTA DE CÓDIGO DE BARRAS EM API PÚBLICA
   ========================================================================== */
/**
 * Quando um código de barras não está cadastrado no sistema, tenta
 * descobrir o nome do produto consultando a Open Food Facts (API pública
 * e gratuita, sem necessidade de chave). Se não houver internet, o
 * produto não existir na base, ou qualquer outro erro acontecer, apenas
 * retorna null silenciosamente — o fluxo do PDV/Estoque segue normal.
 */
async function consultarCodigoBarrasExterno(codigo) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=product_name,brands,quantity`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.status !== 1 || !data.product) return null;
    const nome = [data.product.product_name, data.product.brands].filter(Boolean).join(' — ');
    if (!nome) return null;
    return { nome, quantidade: data.product.quantity || '' };
  } catch (e) {
    // sem internet, CORS, timeout, produto inexistente etc. — só pula
    return null;
  }
}
