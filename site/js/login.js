/**
 * login.js — tela de entrada. Usa Firebase Authentication (e-mail/senha).
 * Se já tiver alguém logado, manda direto pro PDV.
 */
let modoCadastro = false;

function mostrarErroLogin(msg) {
  const el = document.getElementById('login-erro');
  el.textContent = msg;
  el.classList.remove('hidden');
  document.getElementById('login-aviso').classList.add('hidden');
}
function mostrarAvisoLogin(msg) {
  const el = document.getElementById('login-aviso');
  el.textContent = msg;
  el.classList.remove('hidden');
  document.getElementById('login-erro').classList.add('hidden');
}
function esconderMensagens() {
  document.getElementById('login-erro').classList.add('hidden');
  document.getElementById('login-aviso').classList.add('hidden');
}

function alternarModoCadastro() {
  modoCadastro = !modoCadastro;
  document.getElementById('btn-entrar').textContent = modoCadastro ? 'Criar conta' : 'Entrar';
  document.getElementById('link-cadastro').textContent = modoCadastro ? 'Já tenho conta — entrar' : 'Criar uma conta nova';
  esconderMensagens();
}

function traduzErroFirebase(codigo) {
  const mapa = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Não existe conta com esse e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Tente entrar em vez de criar uma nova.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
  };
  return mapa[codigo] || ('Não foi possível entrar (' + codigo + ').');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!firebaseConfigValido) {
    mostrarErroLogin('O arquivo js/firebase-config.js ainda não foi configurado com as chaves do seu projeto Firebase. Veja o README-FIREBASE.md.');
    document.getElementById('form-login').querySelectorAll('input,button').forEach((el) => el.disabled = true);
    return;
  }

  // se já tiver sessão válida, pula direto pro sistema
  firebaseAuth.onAuthStateChanged((user) => {
    if (user) window.location.href = 'index.html';
  });

  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderMensagens();
    const email = document.getElementById('campo-email').value.trim();
    const senha = document.getElementById('campo-senha').value;
    const btn = document.getElementById('btn-entrar');
    btn.disabled = true;
    btn.textContent = modoCadastro ? 'Criando conta…' : 'Entrando…';
    try {
      if (modoCadastro) {
        await firebaseAuth.createUserWithEmailAndPassword(email, senha);
      } else {
        await firebaseAuth.signInWithEmailAndPassword(email, senha);
      }
      window.location.href = 'index.html';
    } catch (err) {
      mostrarErroLogin(traduzErroFirebase(err.code || ''));
      btn.disabled = false;
      btn.textContent = modoCadastro ? 'Criar conta' : 'Entrar';
    }
  });
});

function esqueciSenha() {
  esconderMensagens();
  const email = document.getElementById('campo-email').value.trim();
  if (!email) { mostrarErroLogin('Digite seu e-mail no campo acima primeiro.'); return; }
  firebaseAuth.sendPasswordResetEmail(email)
    .then(() => mostrarAvisoLogin('Enviamos um e-mail para ' + email + ' com um link para redefinir sua senha.'))
    .catch((err) => mostrarErroLogin(traduzErroFirebase(err.code || '')));
}
