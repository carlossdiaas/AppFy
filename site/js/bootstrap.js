/**
 * bootstrap.js — evita "tela branca" silenciosa.
 * Deve ser o PRIMEIRO script carregado em cada página.
 * Se qualquer erro de JavaScript acontecer, mostra uma mensagem
 * visível na tela em vez de deixar a página em branco.
 */
(function () {
  function mostrarErro(mensagem) {
    var box = document.getElementById('boot-error-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'boot-error-box';
      box.style.cssText = [
        'position:fixed', 'inset:0', 'background:#fff', 'z-index:99999',
        'display:flex', 'align-items:center', 'justify-content:center',
        'padding:24px', 'font-family:system-ui,sans-serif'
      ].join(';');
      document.body.appendChild(box);
    }
    box.innerHTML =
      '<div style="max-width:560px;border:1px solid #E3E6EB;border-radius:12px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.08)">' +
      '<h1 style="font-size:16px;font-weight:700;color:#C1352B;margin:0 0 8px">Não foi possível carregar a página</h1>' +
      '<p style="font-size:14px;color:#4B5563;line-height:1.5;margin:0 0 12px">' + mensagem + '</p>' +
      '<p style="font-size:13px;color:#4B5563;line-height:1.5;margin:0 0 4px"><strong>Solução mais comum:</strong> abrir o site com um servidor local em vez de dar duplo clique no arquivo.</p>' +
      '<pre style="background:#F5F6F8;border-radius:8px;padding:10px 12px;font-size:12.5px;overflow-x:auto;margin:8px 0">cd pasta-do-projeto\npython3 -m http.server 8000</pre>' +
      '<p style="font-size:13px;color:#4B5563;margin:0">Depois acesse <code>http://localhost:8000</code> no navegador.</p>' +
      '</div>';
  }

  window.addEventListener('error', function (e) {
    mostrarErro('Detalhe técnico: ' + (e.message || 'erro desconhecido') + (e.filename ? ' — em ' + e.filename.split('/').pop() + ':' + e.lineno : ''));
  });
  window.addEventListener('unhandledrejection', function (e) {
    mostrarErro('Detalhe técnico: ' + (e.reason && e.reason.message ? e.reason.message : e.reason));
  });

  if (location.protocol === 'file:') {
    // eslint-disable-next-line no-console
    console.warn('Executando via file:// — alguns navegadores restringem localStorage nesse modo. Se a tela ficar em branco, use um servidor local (veja o README).');
  }
})();
