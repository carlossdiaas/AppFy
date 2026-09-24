/**
 * clientes.js — Cadastro de clientes e módulo de Fiado/Crediário
 */
let filtroClienteTexto = '';
let modalAberto = null;

document.addEventListener('DOMContentLoaded', () => {
  protegerPagina(() => {
    renderShell('clientes.html', 'Clientes / Fiado');
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

/** Abre a foto do cliente em tela cheia (clique ou ESC pra fechar) */
function abrirFotoTelaCheia(url) {
  if (!url) return;
  const overlay = document.createElement('div');
  overlay.id = 'foto-cheia-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,14,20,.92);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;cursor:zoom-out;';
  overlay.innerHTML = `<img src="${url}" style="max-width:100%;max-height:100%;border-radius:10px;object-fit:contain;box-shadow:0 20px 60px rgba(0,0,0,.4);" />`;
  overlay.addEventListener('click', fecharFotoTelaCheia);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', _escFechaFotoCheia);
}
function fecharFotoTelaCheia() {
  document.getElementById('foto-cheia-overlay')?.remove();
  document.removeEventListener('keydown', _escFechaFotoCheia);
}
function _escFechaFotoCheia(e) { if (e.key === 'Escape') fecharFotoTelaCheia(); }

function renderPage() {
  const content = document.getElementById('page-content');
  const clientes = DB.list('clientes');
  const filtrados = clientes.filter((c) => c.nome.toLowerCase().includes(filtroClienteTexto.toLowerCase()));

  content.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      ${statCardIcon('users', 'blue', 'Clientes cadastrados', clientes.length)}
      ${statCardIcon('warning', 'amber', 'Clientes com saldo em aberto', clientes.filter((c) => c.saldoDevedor > 0).length)}
    </div>

    <div class="flex items-center gap-2 mb-3">
      <input class="input max-w-xs" placeholder="Buscar cliente…" value="${filtroClienteTexto}" oninput="filtroClienteTexto=this.value; renderPage()" />
      <div class="flex-1"></div>
      <button class="btn btn-success" onclick="abrirClienteModal()">+ Novo cliente</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${filtrados.map((c) => clienteCard(c)).join('') || `<p class="text-slate-400 text-sm col-span-full text-center py-10">Nenhum cliente encontrado</p>`}
    </div>
  `;
}

function clienteCard(c) {
  const foto = c.foto
    ? `<img src="${c.foto}" class="w-12 h-12 rounded-full object-cover border border-[--color-border] cursor-pointer" onclick="abrirFotoTelaCheia('${c.foto}')" title="Ver foto em tela cheia" />`
    : `<div class="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold">${c.nome[0]}</div>`;
  const status = c.saldoDevedor > 0
    ? `<span class="badge badge-danger">Deve ${fmtBRL(c.saldoDevedor)}</span>`
    : `<span class="badge badge-ok">Em dia</span>`;
  return `
    <div class="card p-4 flex flex-col gap-2">
      <div class="flex items-center gap-3">
        ${foto}
        <div class="min-w-0">
          <p class="font-medium truncate">${c.nome}</p>
          <p class="text-xs text-slate-400 truncate">${c.telefone || 'sem telefone'}${c.documento ? ' · ' + c.documento : ''}</p>
        </div>
      </div>
      <p class="text-xs text-slate-500 line-clamp-2">${c.endereco || 'Endereço não informado'}</p>
      <div class="flex items-center justify-between text-xs text-slate-500">
        <span>Limite: ${fmtBRL(c.limiteCredito)}</span>
        ${status}
      </div>
      <div class="flex gap-2 pt-1">
        <button class="btn btn-ghost flex-1 text-xs" onclick='abrirExtratoModal(${JSON.stringify(c.id)})'>Extrato</button>
        <button class="btn btn-ghost text-xs" onclick='abrirClienteModal(${JSON.stringify(c.id)})'>Editar</button>
        <button class="text-slate-400 hover:text-[--color-danger] text-xs px-1" onclick='excluirCliente(${JSON.stringify(c.id)})'>✕</button>
      </div>
    </div>`;
}

// ---------------- cadastro de cliente (com endereço e foto) ----------------
function abrirClienteModal(id) {
  const c = id ? DB.get('clientes', id) : null;
  const modalBox = abrirModal(`
    <div class="p-4 border-b border-[--color-border]"><h3 class="font-semibold text-sm">${c ? 'Editar cliente' : 'Novo cliente'}</h3></div>
    <div class="p-4 space-y-3">
      <div class="flex items-center gap-3">
        <img id="foto-preview" src="${c?.foto || ''}" class="w-16 h-16 rounded-full object-cover bg-slate-100 border border-[--color-border] ${c?.foto ? 'cursor-pointer' : ''} ${c?.foto ? '' : 'hidden'}" onclick="if(this.src) abrirFotoTelaCheia(this.src)" />
        <div id="foto-placeholder" class="w-16 h-16 rounded-full bg-slate-100 border border-dashed border-[--color-border] flex items-center justify-center text-slate-400 text-xs ${c?.foto ? 'hidden' : ''}">foto</div>
        <div>
          <label class="btn btn-ghost text-xs cursor-pointer">
            Enviar foto
            <input id="f-foto" type="file" accept="image/*" class="hidden" onchange="previewFoto(event)" />
          </label>
          <p class="text-[11px] text-slate-400 mt-1">Opcional. JPG/PNG.</p>
        </div>
      </div>
      <div><label class="text-xs text-slate-500">Nome completo</label><input id="f-nome" data-autofocus class="input mt-1" value="${c?.nome || ''}" /></div>
      <div><label class="text-xs text-slate-500">Telefone</label><input id="f-telefone" class="input mt-1" value="${c?.telefone || ''}" /></div>
      <div><label class="text-xs text-slate-500">CPF / CNPJ (opcional)</label><input id="f-documento" class="input mt-1" value="${c?.documento || ''}" /></div>
      <div><label class="text-xs text-slate-500">Endereço completo</label>
        <textarea id="f-endereco" class="input mt-1" rows="2" placeholder="Rua, número, bairro, cidade/UF">${c?.endereco || ''}</textarea>
      </div>
      <div><label class="text-xs text-slate-500">Limite de crédito (fiado)</label><input id="f-limite" type="text" inputmode="decimal" class="input mt-1" value="${c ? paraCampoDecimal(c.limiteCredito) : '0,00'}" /></div>
      <div class="flex gap-2 pt-2">
        <button class="btn btn-primary flex-1" onclick='salvarCliente(${JSON.stringify(c?.id || null)})'>Salvar</button>
        <button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
      </div>
    </div>
  `);
  ativarEnterSubmit(modalBox, () => salvarCliente(c?.id || null));
}

let fotoBase64Temp = '';
function previewFoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    fotoBase64Temp = reader.result;
    const img = document.getElementById('foto-preview');
    img.src = fotoBase64Temp;
    img.classList.remove('hidden');
    document.getElementById('foto-placeholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

function salvarCliente(id) {
  const nome = document.getElementById('f-nome').value.trim();
  const telefone = document.getElementById('f-telefone').value.trim();
  const documento = document.getElementById('f-documento').value.trim();
  const endereco = document.getElementById('f-endereco').value.trim();
  const limiteCredito = parseMoeda(document.getElementById('f-limite').value);
  if (!nome) { toast('Informe o nome do cliente', 'error'); return; }

  const dados = { nome, telefone, documento, endereco, limiteCredito };
  if (fotoBase64Temp) dados.foto = fotoBase64Temp;

  if (id) DB.update('clientes', id, dados);
  else DB.insert('clientes', { ...dados, foto: fotoBase64Temp || '', saldoDevedor: 0 });

  fotoBase64Temp = '';
  fecharModal();
  toast('Cliente salvo', 'success');
  renderPage();
}

function excluirCliente(id) {
  const c = DB.get('clientes', id);
  if (c.saldoDevedor > 0) { toast('Não é possível excluir cliente com saldo devedor em aberto', 'error'); return; }
  if (confirmDialog(`Excluir o cliente ${c.nome}?`)) {
    DB.remove('clientes', id);
    renderPage();
    toast('Cliente excluído', 'warning');
  }
}

// ---------------- extrato do cliente ----------------
function abrirExtratoModal(id) {
  const c = DB.get('clientes', id);
  const vendas = DB.list('vendas').filter((v) => v.clienteId === id && !v.estornada);
  const pagamentos = DB.list('pagamentosFiado').filter((p) => p.clienteId === id);
  const movimentos = [
    ...vendas.map((v) => ({ data: v.data, tipo: 'Compra fiado', valor: v.pagamentos.filter((p) => p.forma === 'fiado').reduce((s, p) => s + p.valor, 0) })),
    ...pagamentos.map((p) => ({ data: p.data, tipo: p.tipo === 'total' ? 'Pagamento total' : 'Pagamento parcial', valor: -p.valor })),
  ].filter((m) => m.valor !== 0).sort((a, b) => new Date(b.data) - new Date(a.data));

  abrirModal(`
    <div class="p-4 border-b border-[--color-border] flex items-center justify-between">
      <h3 class="font-semibold text-sm">Extrato — ${c.nome}</h3>
      <span class="text-lg font-bold ${c.saldoDevedor > 0 ? 'text-[--color-danger]' : 'text-[--color-success]'}">${fmtBRL(c.saldoDevedor)}</span>
    </div>
    <div class="p-4">
      <div class="max-h-64 overflow-y-auto space-y-1.5 mb-4">
        ${movimentos.map((m) => `
          <div class="flex justify-between text-sm bg-slate-50 rounded-lg px-3 py-1.5">
            <span>${fmtData(m.data)} · ${m.tipo}</span>
            <span class="tabular-nums font-medium ${m.valor > 0 ? 'text-[--color-danger]' : 'text-[--color-success]'}">${m.valor > 0 ? '+' : ''}${fmtBRL(m.valor)}</span>
          </div>`).join('') || `<p class="text-sm text-slate-400 text-center py-6">Sem movimentações</p>`}
      </div>
      ${c.saldoDevedor > 0 ? `
        <div class="border-t border-[--color-border] pt-3">
          <label class="text-xs text-slate-500">Registrar pagamento (abatimento)</label>
          <div class="flex gap-2 mt-1">
            <input id="pg-valor" type="text" inputmode="decimal" class="input" placeholder="0,00" value="${paraCampoDecimal(c.saldoDevedor)}" />
            <button class="btn btn-success" onclick='registrarPagamentoFiado(${JSON.stringify(c.id)})'>Receber</button>
          </div>
        </div>` : ''}
    </div>
  `, true);
  const campoPg = document.getElementById('pg-valor');
  if (campoPg) campoPg.addEventListener('keydown', (e) => { if (e.key === 'Enter') registrarPagamentoFiado(c.id); });
}

function registrarPagamentoFiado(clienteId) {
  const c = DB.get('clientes', clienteId);
  const valor = parseMoeda(document.getElementById('pg-valor').value);
  if (valor <= 0 || valor > c.saldoDevedor + 0.01) { toast('Informe um valor válido (até o saldo devedor)', 'error'); return; }
  const novoSaldo = Number((c.saldoDevedor - valor).toFixed(2));
  DB.update('clientes', clienteId, { saldoDevedor: novoSaldo });
  const pagamento = DB.insert('pagamentosFiado', { clienteId, valor, tipo: novoSaldo <= 0.01 ? 'total' : 'parcial', data: hojeISO() });
  fecharModal();
  toast('Pagamento registrado', 'success');
  imprimirReciboFiado(c, pagamento);
  renderPage();
}

function imprimirReciboFiado(cliente, pagamento) {
  const cfg = DB.getConfig();
  document.documentElement.style.setProperty('--receipt-width', cfg.larguraBobina === '58' ? '58mm' : '80mm');
  let el = document.getElementById('print-receipt');
  if (!el) {
    el = document.createElement('div');
    el.id = 'print-receipt';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div style="text-align:center;"><strong>${cfg.nomeLoja}</strong><br/>Recibo de pagamento — fiado</div>
    <div class="receipt-line"></div>
    <div>Cliente: ${cliente.nome}</div>
    <div>Data: ${fmtDataHora(pagamento.data)}</div>
    <div class="receipt-line"></div>
    <div style="display:flex;justify-content:space-between;"><span>Valor recebido</span><span>${fmtBRL(pagamento.valor)}</span></div>
    <div style="display:flex;justify-content:space-between;"><span>Saldo restante</span><span>${fmtBRL(cliente.saldoDevedor - pagamento.valor)}</span></div>
    <div class="receipt-line"></div>
    <div style="text-align:center;">Obrigado!</div>
  `;
  setTimeout(() => window.print(), 150);
}
