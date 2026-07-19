# FlashDeck

App de repetição espaçada (estilo Anki) que roda como site estático no GitHub Pages, com sincronização opcional no Google Drive. Sem servidor, sem etapa de build: os arquivos são módulos ES nativos, carregados direto pelo navegador.

**App online:** https://gabriele-martins.github.io/flashdeck/

## A ideia

Nasceu de um problema simples: usar o Anki de verdade, mas conseguir gerar cards em conversa direto com uma IA, sem precisar de servidor próprio, MCP, ou copiar e colar entre um app e outro. A solução foi guardar os dados no Google Drive do próprio usuário — um lugar que tanto o app quanto a IA conseguem ler e escrever — e construir a interface de estudo por cima disso: decks, repetição espaçada (SM-2), estatísticas, modo cram, tempo de sessão, tudo pensado pra caber num único app leve, instalável como PWA e preparado para virar um wrapper mobile no futuro.

## Feito inteiramente por IA

Todo o código deste repositório — da primeira versão em um único arquivo até a arquitetura modular atual — foi escrito pelo Claude (Anthropic), incluindo decisões de arquitetura, algoritmo de repetição espaçada, integração com Google Drive, testes automatizados e o próprio deploy no GitHub Pages. A autora acompanhou, direcionou os requisitos e revisou o resultado a cada etapa, mas não escreveu código diretamente.

## Recursos

- Decks e cards com CRUD completo, tags e busca
- Repetição espaçada (SM-2) com previsão de intervalos
- Estudo por um deck, vários ou todos; modo Cram; limite de tempo por sessão
- Swipe no mobile e atalhos de teclado no desktop
- Suspender, resetar e detecção automática de cards problemáticos (leech)
- Estatísticas: streak, heatmap de atividade, retenção e previsão
- Tema claro/escuro/sistema
- Importação por JSON (lista de cards, deck completo, vários decks ou backup) e via arquivos no Drive
- PWA instalável, com cache offline

## Estrutura

```
index.html                 shell + carregamento dos módulos
manifest.webmanifest       metadados PWA
service-worker.js          cache offline
assets/
  styles/tokens.css        variáveis de tema (cores, claro/escuro)
  styles/app.css           estilos dos componentes
  icons/                   ícones do app
src/
  config.js                constantes (Client ID, escopos, chaves)
  main.js                  boot, roteador e namespace global FD
  core/                    lógica pura (sem DOM)
    state.js               estado central + commit
    storage.js             localStorage + migração
    srs.js                 algoritmo SM-2
    stats.js               cálculos de estatística
    importer.js            interpretação dos formatos de importação
  platform/                dependências externas isoláveis
    auth.js                login Google (GIS)
    drive.js               sincronização com o Drive
  ui/
    router.js              navegação por hash
    components.js           topbar, drawer, modal, toast
    theme.js                aplicação de tema
    actions.js              handlers de CRUD e import/export
    session.js               sessão de estudo (fila, swipe, teclado, timer)
    screens/                 uma tela por arquivo
tests/
  flow.test.js              suíte funcional (jsdom)
```

O diretório `platform/` isola tudo que dependeria de mudança num wrapper mobile nativo (auth e Drive). Para trocar o backend de sincronização, altera-se apenas `platform/drive.js`.

## Configuração do Google (para sincronização)

1. Google Cloud Console: crie um projeto e ative a **Google Drive API**.
2. Tela de permissão OAuth: tipo Externo; adicione seu e-mail como usuário de teste.
3. Credenciais → ID do cliente OAuth → Aplicativo da Web. Em origens JavaScript autorizadas, adicione `https://SEU_USUARIO.github.io`.
4. Cole o Client ID em `src/config.js` (`GOOGLE_CLIENT_ID`). Ele é público por natureza; a segurança vem das origens autorizadas.

Sem essa configuração, o app funciona salvando apenas no dispositivo.

## Desenvolvimento

Por usar módulos ES, precisa ser servido por HTTP (não abra via `file://`):

```
python3 -m http.server 8000
# http://localhost:8000
```

Testes: `node tests/flow.test.js` (requer `jsdom`).

## Deploy

Qualquer push na branch `main` é publicado pelo GitHub Pages automaticamente.
