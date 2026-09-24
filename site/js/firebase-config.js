/**
 * firebase-config.js — chaves do SEU projeto Firebase.
 *
 * Como pegar essas informações:
 *  1) Acesse https://console.firebase.google.com e crie um projeto (grátis).
 *  2) Dentro do projeto: ⚙️ Configurações do projeto → role até "Seus apps"
 *     → clique no ícone "</>" (Web) → registre um app (qualquer nome).
 *  3) O Firebase vai mostrar um bloco "firebaseConfig = {...}" — copie os
 *     valores dele para dentro do objeto abaixo, substituindo os textos
 *     "COLOQUE_AQUI...".
 *  4) Ainda no console, ative:
 *       - Authentication → Sign-in method → ative "E-mail/senha"
 *       - Firestore Database → Criar banco de dados (modo produção)
 *  5) Publique as regras de segurança do arquivo firestore.rules (veja o
 *     README-FIREBASE.md na raiz do projeto) na aba Firestore → Regras.
 *
 * Este arquivo não tem segredo nenhum: essas chaves são só o "endereço"
 * do seu projeto e são normais de ficarem visíveis no navegador. Quem
 * realmente protege os dados são as regras do Firestore (item 5 acima).
 */
const firebaseConfig = {
  apiKey: 'COLOQUE_AQUI_A_API_KEY',
  authDomain: 'COLOQUE_AQUI.firebaseapp.com',
  projectId: 'COLOQUE_AQUI_O_PROJECT_ID',
  storageBucket: 'COLOQUE_AQUI.appspot.com',
  messagingSenderId: 'COLOQUE_AQUI',
  appId: 'COLOQUE_AQUI',
};
