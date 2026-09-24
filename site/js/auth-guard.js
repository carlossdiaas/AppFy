/**
 * auth-guard.js — protege as páginas do sistema.
 *
 * Cada página protegida chama:
 *
 *   document.addEventListener('DOMContentLoaded', () => {
 *     protegerPagina(() => {
 *       renderShell(...);
 *       renderPage();
 *     });
 *   });
 *
 * O que acontece:
 *  1) mostra uma tela de carregamento (a página fica escondida até aqui);
 *  2) espera o Firebase confirmar se tem alguém logado;
 *     - se não tem, manda pra login.html;
 *     - se tem, baixa os dados DESSA pessoa (e só dela) do Firestore pra
 *       dentro do cache local (localStorage), usando o UID como "gaveta";
 *  3) só depois disso chama o callback da página (que aí já pode usar
 *     DB.list/DB.get normalmente, do jeito que sempre funcionou).
 */

function _authOverlayEl() {
  let el = document.getElementById('auth-loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'auth-loading-overlay';
    el.style.cssText = [
      'position:fixed', 'inset:0', 'background:#F5F6F8', 'z-index:99998',
      'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
      'gap:14px', 'font-family:system-ui,sans-serif',
    ].join(';');
    el.innerHTML = `
      <img src="img/logo-mercadinho-lima.png" style="width:64px;height:64px;border-radius:10px;object-fit:cover" />
      <div style="width:28px;height:28px;border:3px solid #E3E6EB;border-top-color:#1B8354;border-radius:50%;animation:auth-spin 0.8s linear infinite"></div>
      <p style="font-size:13px;color:#6B7280">Carregando seus dados…</p>
      <style>@keyframes auth-spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(el);
  }
  return el;
}

function _authOverlayErro(msg) {
  const el = _authOverlayEl();
  el.innerHTML = `
    <div style="max-width:480px;text-align:center;padding:0 20px">
      <p style="font-size:15px;font-weight:700;color:#C1352B;margin:0 0 8px">Não foi possível entrar</p>
      <p style="font-size:13px;color:#4B5563;line-height:1.5;margin:0 0 14px">${msg}</p>
      <a href="login.html" style="font-size:13px;color:#1B8354;font-weight:600">Voltar para a tela de login</a>
    </div>`;
}

/** Ponto de entrada usado por cada página protegida. */
function protegerPagina(callback) {
  document.body.style.visibility = 'hidden';
  _authOverlayEl();

  if (!firebaseConfigValido) {
    document.body.style.visibility = 'visible';
    _authOverlayErro(
      'O arquivo <code>js/firebase-config.js</code> ainda não foi preenchido com as chaves do seu projeto Firebase. ' +
      'Veja o README-FIREBASE.md na raiz do projeto para o passo a passo.'
    );
    return;
  }

  firebaseAuth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    try {
      DB.definirUsuarioAtual(user.uid, user.email || '');
      await DB.carregarDaNuvem();
      try { DB.migrarDadosAntigosSeNecessario(); } catch (e) { /* nunca trava o boot por causa disso */ }
      document.body.style.visibility = 'visible';
      const overlay = document.getElementById('auth-loading-overlay');
      if (overlay) overlay.remove();
      callback();
    } catch (e) {
      console.error('Erro carregando dados da nuvem', e);
      document.body.style.visibility = 'visible';
      _authOverlayErro(
        'Você está logado, mas não deu pra carregar seus dados do Firestore agora. ' +
        'Verifique sua internet e as regras do Firestore (README-FIREBASE.md). Detalhe técnico: ' + (e && e.message ? e.message : e)
      );
    }
  });
}

/** Botão "Sair" do menu — encerra a sessão e volta pro login. */
function pdvSair() {
  if (!confirmDialog('Sair da sua conta?')) return;
  if (firebaseAuth) firebaseAuth.signOut().finally(() => { window.location.href = 'login.html'; });
  else window.location.href = 'login.html';
}
