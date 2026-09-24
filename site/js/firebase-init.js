/**
 * firebase-init.js — inicializa o Firebase (Auth + Firestore) uma única vez.
 * Deve ser carregado DEPOIS dos SDKs do Firebase e do firebase-config.js.
 */
let firebaseAuth = null;
let firebaseDb = null;
let firebaseConfigValido = true;

try {
  if (!firebaseConfig || firebaseConfig.apiKey === 'COLOQUE_AQUI_A_API_KEY') {
    firebaseConfigValido = false;
  } else {
    firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();
    // deixa funcionando mesmo com internet instável / troca de aba
    firebaseDb.enablePersistence({ synchronizeTabs: true }).catch(() => {
      // ignora: alguns navegadores/abas não suportam, o app funciona
      // normalmente do mesmo jeito, só sem cache offline do Firestore
    });
  }
} catch (e) {
  console.error('Erro iniciando Firebase', e);
  firebaseConfigValido = false;
}
