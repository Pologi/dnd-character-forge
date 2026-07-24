# D&D Character Forge

Web app responsive in italiano per creare e gestire personaggi di livello 1 per **D&D 5e 2024**. Il builder visuale usa internamente il ruleset `srd-5.2.1-it`, salva le bozze localmente e supporta importazione ed esportazione JSON.

Le 12 classi base, i quattro Background e le nove specie SRD sono modellati con dati verificati nel **System Reference Document 5.2.1 italiano**, distribuito con licenza **CC BY 4.0**. Le opzioni non SRD, come l’Aasimar, restano bloccate finché l’utente non importa un proprio Pacchetto Manuale Privato completo e verificato.

> D&D Character Forge è un progetto non ufficiale e non è approvato né sponsorizzato da Wizards of the Coast.

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
npm test
npm run validate:official-content
npm run validate:private-pack
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
- `npm test` — esegue i test automatici della persistenza locale.
- `npm run validate:official-content` — verifica il catalogo SRD incorporato.
- `npm run validate:private-pack -- percorso/al/file.private-pack.json` — valida uno o più pacchetti senza importarli.
- `npm run private-pack:coverage` — mostra la copertura dei file privati locali senza stamparne il contenuto.
- `npm run private-pack:build` — valida e genera `private-content/phb-2024.private-pack.json`.
- `npm run build` — verifica TypeScript, crea la build e blocca eventuali file privati presenti in `dist`.
- `npm run preview` — serve localmente la build di produzione.

## Dati locali

Personaggi e bozza vengono salvati esclusivamente nel `localStorage` del browser in uso. I pacchetti manuale privati sono invece archiviati esclusivamente in **IndexedDB**, con database e flusso separati: non sono inviati in rete, inseriti nel repository o inclusi nella build. Dalla pagina **Contenuti e manuali** è possibile importarli, sostituirli, controllarne l’integrità, esportare soltanto la configurazione e rimuoverli completamente.

## Avanzamento dei personaggi

Il modello supporta livelli 1–10, XP o traguardi, cronologia atomica, snapshot e annullamento dell’ultimo avanzamento. Il `LevelUpWizard` legge esclusivamente progressioni strutturate e verificate: poiché il catalogo SRD incorporato contiene attualmente soltanto i dati di 1º livello, i livelli successivi restano intenzionalmente bloccati finché un Pacchetto Manuale Privato non fornisce la relativa tabella completa. Le fixture impiegate dai test non vengono incluse nella build.

## Pacchetto Manuale Privato

Il formato versionato è `phb-2024-private-pack`, schema `1`. Ogni elemento dichiara ID e categoria, nomi ufficiali italiano e inglese, manuale/edizione/pagine, meccaniche strutturate, stato e data di verifica. Classi, specie e background includono inoltre `mechanics.builderData`, una definizione completa utilizzabile dal builder senza valori di fallback.

La validazione rifiuta categorie o versioni sconosciute, ID duplicati, fonti e nomi mancanti, riferimenti interni interrotti, progressioni incomplete, placeholder, contenuti attivi non verificati e bonus di caratteristica provenienti dalla specie. I file privati sono esclusi tramite:

```gitignore
private-content/
*.private-pack.json
*.manual-pack.json
```

Durante `npm run dev` compare la modalità **Editor Pacchetto Manuale**. Consente compilazione guidata, matrice di copertura 1–10 e anteprima di importazioni JSON, CSV e TSV. La route viene eliminata dalla build di produzione; un controllo aggiuntivo blocca la build se rileva il marker dell’editor.

I file locali sono organizzati sotto `private-content/phb-2024/`:

```text
metadata.json
classes/             class-features/      subclasses/
species/             backgrounds/         feats/
spells/              equipment/           weapon-masteries/
multiclass/          mappings/
```

`metadata.json` deve contenere almeno `packId` e `title`. Ogni altro file JSON può contenere un singolo elemento o un elenco di elementi. L’editor esporta dati da collocare manualmente in queste cartelle: il browser non scrive nel filesystem senza un’azione esplicita dell’utente.

## Fonti e licenza

Quest’opera include materiale tratto dal System Reference Document 5.2.1 ("SRD 5.2.1") di Wizards of the Coast LLC, disponibile all’indirizzo https://www.dndbeyond.com/srd. Il SRD 5.2.1 è concesso in licenza ai sensi della licenza di attribuzione 4.0 Internazionale di Creative Commons, disponibile all’indirizzo https://creativecommons.org/licenses/by/4.0/legalcode.

Ogni classe e specie SRD contiene metadati puntuali di fonte, sezione e pagina del PDF italiano. Non vengono usati dati 2014, homebrew, loghi o immagini ufficiali.

## Struttura delle regole

- `src/data/srd-5.2.1-it/` contiene il catalogo SRD 5.2.1 verificato e separato dalla UI.
- `src/rules/2024/` contiene calcoli e vincoli tecnici del builder.
- `src/components/character-builder/` contiene l'interfaccia guidata.
- `src/storage/` gestisce esclusivamente la persistenza locale.
- `src/content/` contiene schema, validazione, IndexedDB e `ContentRegistry`.
- `src/types/` definisce il modello dati e i riferimenti alla fonte.
