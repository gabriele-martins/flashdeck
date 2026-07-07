# FlashDeck — Fase 2 (GitHub Pages + Google Drive)

App de repetição espaçada (estilo Anki) em um único arquivo `index.html`. Sem servidor, sem build, sem backend. Os dados ficam salvos no `localStorage` do dispositivo e, com login Google, sincronizam no seu Google Drive (pasta oculta `appDataFolder`, que só este app enxerga — não aparece no meio dos seus arquivos).

## 1. Publicar no GitHub Pages (5 minutos)

1. Crie um repositório no GitHub (ex.: `flashdeck`). Pode ser público ou privado (Pages em repositório privado exige plano pago; público é grátis).
2. Suba o `index.html` e este `README.md` para a raiz do repositório.
3. No repositório: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save**.
4. Em 1-2 minutos o app estará em `https://SEU_USUARIO.github.io/flashdeck/`.

O app já funciona nesse ponto, salvando localmente no dispositivo. O login Google precisa do passo 2.

## 2. Criar o Client ID do Google (10 minutos, uma vez só)

1. Acesse https://console.cloud.google.com e crie um projeto (ex.: "FlashDeck").
2. Menu **APIs e serviços → Biblioteca** → procure **Google Drive API** → **Ativar**.
3. Menu **APIs e serviços → Tela de permissão OAuth**:
   - Tipo de usuário: **Externo** → Criar.
   - Preencha nome do app ("FlashDeck") e seu e-mail. Salve.
   - Em **Público-alvo/Usuários de teste**, adicione o seu próprio Gmail (em modo "Teste", só os e-mails listados conseguem logar — para uso pessoal isso basta e você não precisa publicar o app para verificação do Google).
4. Menu **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo: **Aplicativo da Web**.
   - **Origens JavaScript autorizadas**: adicione
     - `https://SEU_USUARIO.github.io`
     - `http://localhost:8000` (opcional, para testar local)
   - Não precisa de URI de redirecionamento (o app usa token flow, sem redirect).
5. Copie o **Client ID** gerado (termina em `.apps.googleusercontent.com`).

## 3. Configurar o app

No `index.html`, logo no início do `<script>`, troque:

```js
const GOOGLE_CLIENT_ID = "COLE_SEU_CLIENT_ID_AQUI.apps.googleusercontent.com";
```

pelo seu Client ID. Suba a alteração no GitHub. Pronto.

> O Client ID não é segredo — ele é público por definição no fluxo OAuth de apps client-side. A segurança vem das "Origens JavaScript autorizadas": só o seu domínio do GitHub Pages consegue usá-lo.

## 4. Como funciona a sincronização

- Toda alteração salva imediatamente no `localStorage` (funciona offline).
- Logada, cada alteração é enviada ao Drive ~1,5s depois (debounce), no arquivo `flashdeck-data.json` dentro do `appDataFolder`.
- Ao logar em outro dispositivo, o app compara `updatedAt` local vs. Drive e carrega o mais recente (last-write-wins). Evite editar em dois dispositivos offline ao mesmo tempo.
- O indicador no topo mostra o estado: **Salvo neste dispositivo / Sincronizando / Salvo no Drive / Erro**.

## 5. Adicionando cards via Claude (sem MCP)

Em qualquer conversa com o Claude:

> "Gere 20 flashcards sobre change detection no Angular, em JSON, array de objetos com campos `front` e `back`, sem markdown."

Copie o JSON, abra o baralho → **Importar JSON** → cole → Importar.

## 6. Testar localmente (opcional)

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

(Abrir o arquivo direto com `file://` não funciona para o login Google — precisa de `http://`.)

## 7. Futuro app wrapper

O app é um site estático responsivo: um WebView (MAUI, Capacitor, React Native WebView) apontando para a URL do GitHub Pages já funciona. Toda a persistência está isolada nas funções `loadLocal/saveLocal` e `pullFromDrive/pushToDrive` — se um dia quiser trocar o backend, é só mexer nelas.
