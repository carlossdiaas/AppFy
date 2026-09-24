   # Mercadinho Lima — PDV (versão site, com login e nuvem)

Este é o mesmo sistema de sempre, agora de volta ao formato de **site
normal** (o mesmo que existia antes de virar aplicativo de Windows),
mais três coisas novas:

1. **Login** — cada pessoa entra com e-mail e senha (Firebase Authentication).
2. **Dados na nuvem** — cada conta (cada login) tem os próprios produtos,
   clientes, vendas, caixa etc., guardados no Firestore. Se você usar o
   sistema em dois computadores diferentes com a mesma conta, os dados
   são os mesmos nos dois.
3. **Venda protegida ao navegar** — se você estiver no meio de uma venda
   e precisar ir cadastrar um cliente novo (ou checar o estoque, etc.),
   o carrinho fica guardado e volta do jeitinho que você deixou quando
   voltar pro PDV.

Todo o resto do sistema (PDV, estoque, clientes/fiado, financeiro,
relatórios, ranking, promoções, usuários/operadores) continua
**exatamente igual** — nada de layout, atalhos ou funções mudou.

## 1) Rodar localmente enquanto você mexe no código

Não precisa mais instalar nada tipo Electron. É só um site estático:

```bash
cd site           # a pasta onde estão os arquivos .html
python3 -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador. Qualquer alteração que
você (ou eu) fizer nos arquivos, é só salvar e recarregar a página —
sem precisar gerar instalador nem reinstalar nada.

> Abrir os arquivos direto com duplo clique (`file://`) **não funciona**
> — o navegador bloqueia recursos que o sistema precisa. Sempre use um
> servidor local como acima (ou o Live Server do VS Code, por exemplo).

## 2) Criar o projeto no Firebase (grátis)

1. Acesse **https://console.firebase.google.com** e crie um projeto novo.
2. No menu do projeto: **Authentication → Sign-in method → Ative "E-mail/senha"**.
3. **Firestore Database → Criar banco de dados** (pode escolher a região
   mais próxima, ex: `southamerica-east1`). Comece em **modo produção**.
4. Em **Firestore Database → Regras**, cole o conteúdo do arquivo
   `firestore.rules` (está na raiz deste projeto) e publique. Isso
   garante que cada conta só acessa os próprios dados — ninguém enxerga
   os dados de outra pessoa.
5. Ainda no console: **⚙️ Configurações do projeto → role até "Seus
   apps" → ícone `</>` (Web)** → registre um app (qualquer nome, não
   precisa marcar "Firebase Hosting").
6. O Firebase mostra um bloco `firebaseConfig = {...}`. Abra o arquivo
   `js/firebase-config.js` deste projeto e cole os valores no lugar dos
   textos `COLOQUE_AQUI...`.

Pronto — com isso o login e a nuvem já funcionam.

## 3) Colocar no ar pelo GitHub Pages

1. Crie um repositório no GitHub e suba o conteúdo desta pasta (`site/`)
   para ele (pode ser público ou privado, funciona nos dois).
2. No repositório: **Settings → Pages → Build and deployment → Source:
   "Deploy from a branch"** → escolha a branch (ex: `main`) e a pasta
   raiz (`/`) → Salvar.
3. Em alguns minutos o GitHub mostra o link do site (algo como
   `https://seu-usuario.github.io/nome-do-repositorio/`).
4. **Importante:** volte no Firebase → Authentication → Settings →
   **Authorized domains** → adicione o domínio do GitHub Pages
   (`seu-usuario.github.io`). Sem isso o login é bloqueado nesse endereço.

A partir daí, toda vez que você (ou eu) atualizar o código e enviar
(`git push`) pro GitHub, o site publicado atualiza sozinho.

## 4) Se você já tinha dados salvos antes do login existir

Na primeira vez que você entrar com a sua conta, se o navegador ainda
tiver dados antigos guardados (de antes de existir login), o sistema
pergunta se você quer importar tudo pra dentro da conta. Basta
confirmar — depois disso os dados ficam só na nuvem, ligados à sua conta.

## 5) Backup

O botão de "📁 Dados" (conectar uma pasta no computador) e o
Exportar/Importar backup continuam funcionando do jeito que sempre
funcionaram, como uma cópia extra além da nuvem — não são obrigatórios,
mas são uma boa prática ter de vez em quando.
