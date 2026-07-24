# D&D Character Forge

Web app responsive in italiano per accompagnare la creazione di personaggi fantasy. Questa prima versione contiene l'interfaccia iniziale, l'area dedicata ai personaggi e l'ingresso alla creazione guidata.

> Il progetto non implementa ancora regole di D&D, database, autenticazione o incantesimi.

## Tecnologie

- React
- TypeScript
- Vite
- npm

## Requisiti

- Node.js 20 o successivo
- npm 10 o successivo

## Avvio locale

```bash
npm install
npm run dev
```

Vite mostrerà nel terminale l'indirizzo locale da aprire nel browser.

## Controlli e build

```bash
npm run typecheck
npm run build
```

La build di produzione viene generata nella cartella `dist`.

Per provarla localmente:

```bash
npm run preview
```

## Pubblicazione su GitHub Pages

Il progetto è configurato per il repository `dnd-character-forge` con il base path `/dnd-character-forge/`.

1. Pubblica il repository su GitHub.
2. Apri **Settings → Pages**.
3. In **Build and deployment**, scegli **GitHub Actions** come sorgente.
4. Esegui il push sul branch `main`.

Il workflow `.github/workflows/deploy.yml` esegue automaticamente controllo TypeScript, build e deploy. La pagina sarà disponibile all'indirizzo:

`https://<nome-utente>.github.io/dnd-character-forge/`

Il deploy può essere avviato anche manualmente dalla sezione **Actions** di GitHub.

## Script npm

- `npm run dev` — avvia l'ambiente di sviluppo.
- `npm run typecheck` — verifica i tipi TypeScript senza generare file.
- `npm run build` — verifica TypeScript e crea la build di produzione.
- `npm run preview` — serve localmente la build di produzione.
