import { useMemo, useRef, useState } from 'react'
import {
  CLASS_IDS,
  EDITOR_BUILD_MARKER,
  analyzeItems,
  coverageReport,
  parseImport,
  type AnalysisIssue,
} from '../../scripts/private-pack-tools.mjs'

type EditorItem = Record<string, unknown>
type ImportPreview = {
  items: EditorItem[]
  analysis: ReturnType<typeof analyzeItems>
}

const sections = [
  ['class', 'Classi'], ['progression-table', 'Progressioni di classe'], ['feature', 'Capacità'],
  ['resource', 'Risorse'], ['subclass', 'Sottoclassi'], ['subclass-progression', 'Progressioni sottoclassi'],
  ['species', 'Specie'], ['background', 'Background'], ['feat', 'Talenti'], ['spell', 'Incantesimi'],
  ['weapon', 'Armi'], ['armor', 'Armature'], ['equipment', 'Equipaggiamento'], ['tool', 'Strumenti'],
  ['language', 'Linguaggi'], ['weapon-property', 'Proprietà'], ['weapon-mastery', 'Maestrie'],
  ['multiclass-rule', 'Multiclasse'],
] as const

export default function PrivatePackEditor() {
  const [items, setItems] = useState<EditorItem[]>([])
  const [section, setSection] = useState<string>('progression-table')
  const [draft, setDraft] = useState(() => emptyItem('progression-table'))
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [query, setQuery] = useState('')
  const [spellLevel, setSpellLevel] = useState('all')
  const picker = useRef<HTMLInputElement>(null)
  const coverage = useMemo(() => coverageReport(items), [items])
  const filtered = items.filter((item) => item.category === section)
    .filter((item) => !query || `${item.officialNameIt} ${item.officialNameEn}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .filter((item) => section !== 'spell' || spellLevel === 'all' || String((item.mechanics as Record<string, unknown>)?.level) === spellLevel)

  const updateDraft = (path: string, value: unknown) => setDraft((current) => setPath(current, path, value))
  const saveDraft = () => {
    const analysis = analyzeItems([draft], items)
    if (!analysis.valid) {
      setPreview({ items: [draft], analysis })
      return
    }
    setItems((current) => [...current.filter((item) => !(item.category === draft.category && item.id === draft.id)), structuredClone(draft)])
    setDraft(emptyItem(section))
  }
  const importFile = async (file?: File) => {
    if (!file) return
    const extension = file.name.split('.').pop()?.toLocaleLowerCase()
    const format = extension === 'tsv' ? 'tsv' : extension === 'csv' ? 'csv' : 'json'
    try {
      const imported = parseImport(await file.text(), format)
      setPreview({ items: imported, analysis: analyzeItems(imported, items) })
    } catch {
      setPreview({ items: [], analysis: { valid: false, issues: [{ code: 'invalid-file', index: 0 }], recognizedFields: [], missingFields: [], replacements: [] } })
    }
  }
  const confirmImport = () => {
    if (!preview?.analysis.valid) return
    setItems((current) => {
      const replacements = new Set(preview.analysis.replacements)
      return [...current.filter((item) => !replacements.has(`${item.category}:${item.id}`)), ...preview.items]
    })
    setPreview(null)
  }

  return (
    <section className="private-editor" data-private-editor-marker={EDITOR_BUILD_MARKER}>
      <header className="private-editor-hero">
        <span className="kicker">Solo sviluppo locale</span>
        <h1>Editor Pacchetto Manuale</h1>
        <p>Registra fedelmente i dati della tua copia. Nessun dato viene inviato in rete o salvato automaticamente nel progetto.</p>
        <div className="privacy-ribbon">Offline · Nessuna telemetria · Conferma prima dell’importazione</div>
      </header>

      <CoverageMatrix coverage={coverage.classCoverage} />

      <div className="private-editor-layout">
        <nav className="editor-sections" aria-label="Categorie del pacchetto">
          {sections.map(([id, label]) => <button key={id} className={section === id ? 'active' : ''} onClick={() => {
            setSection(id)
            setDraft(emptyItem(id))
          }}>{label}<span>{items.filter((item) => item.category === id).length}</span></button>)}
        </nav>

        <main className="editor-workspace">
          <div className="editor-toolbar">
            <input placeholder="Cerca nome italiano o inglese" value={query} onChange={(event) => setQuery(event.target.value)} />
            {section === 'spell' && <select value={spellLevel} onChange={(event) => setSpellLevel(event.target.value)}><option value="all">Tutti i livelli</option>{Array.from({ length: 10 }, (_, index) => <option key={index} value={index}>{index}</option>)}</select>}
            <button className="button button-ghost" onClick={() => picker.current?.click()}>Importa JSON/CSV/TSV</button>
            <input ref={picker} className="visually-hidden" type="file" accept=".json,.csv,.tsv" onChange={(event) => void importFile(event.target.files?.[0])} />
            <button className="button button-ghost" onClick={() => download('elementi-manuale.json', JSON.stringify(items, null, 2))}>Esporta lavoro</button>
          </div>

          <EditorForm category={section} draft={draft} update={updateDraft} save={saveDraft} />

          <section className="editor-records">
            <h2>Elementi registrati</h2>
            {filtered.length === 0 ? <p>Nessun elemento in questa categoria.</p> : filtered.map((item) => <article key={`${item.category}:${item.id}`}><div><strong>{String(item.officialNameIt)}</strong><span lang="en">{String(item.officialNameEn)}</span></div><Status value={String(item.verificationStatus)} /><button onClick={() => setDraft(structuredClone(item))}>Modifica</button></article>)}
          </section>
        </main>
      </div>

      {preview && <ImportDialog preview={preview} cancel={() => setPreview(null)} confirm={confirmImport} />}
    </section>
  )
}

function EditorForm({ category, draft, update, save }: { category: string; draft: EditorItem; update: (path: string, value: unknown) => void; save: () => void }) {
  const mechanics = draft.mechanics as Record<string, unknown>
  return <section className="editor-form">
    <div className="editor-form-heading"><div><span className="kicker">Nuovo elemento</span><h2>{sections.find(([id]) => id === category)?.[1]}</h2></div><Status value={String(draft.verificationStatus)} /></div>
    <div className="editor-field-grid">
      <Field label="ID stabile"><input value={String(draft.id)} onChange={(event) => update('id', event.target.value)} /></Field>
      <Field label="Nome ufficiale italiano"><input value={String(draft.officialNameIt)} onChange={(event) => update('officialNameIt', event.target.value)} /></Field>
      <Field label="Nome ufficiale inglese"><input value={String(draft.officialNameEn)} onChange={(event) => update('officialNameEn', event.target.value)} /></Field>
      <Field label="Categoria"><input value={category} disabled /></Field>
      <Field label="Manuale"><input value="Manuale del Giocatore 2024" disabled /></Field>
      <Field label="Pagina italiana"><input type="number" min="1" value={String((draft.source as Record<string, unknown>).italianPage)} onChange={(event) => update('source.italianPage', Number(event.target.value))} /></Field>
      <Field label="Pagina inglese facoltativa"><input type="number" min="1" value={String((draft.source as Record<string, unknown>).englishPage ?? '')} onChange={(event) => update('source.englishPage', event.target.value ? Number(event.target.value) : undefined)} /></Field>
      <Field label="Sezione"><input value={String((draft.source as Record<string, unknown>).section)} onChange={(event) => update('source.section', event.target.value)} /></Field>
      <Field label="Data di verifica"><input type="date" value={String(draft.verifiedAt).slice(0, 10)} onChange={(event) => update('verifiedAt', `${event.target.value}T00:00:00.000Z`)} /></Field>
      <Field label="Stato"><select value={String(draft.verificationStatus)} onChange={(event) => update('verificationStatus', event.target.value)}><option value="incomplete">Incompleto</option><option value="transcribed">Trascritto</option><option value="verified">Verificato</option></select></Field>
      <Field label="Note di trascrizione" wide><textarea value={String(draft.transcriptionNotes)} onChange={(event) => update('transcriptionNotes', event.target.value)} /></Field>
    </div>
    {category === 'progression-table' && <ProgressionEditor mechanics={mechanics} update={update} />}
    {category === 'subclass' && <Field label="Classe collegata"><select value={String(mechanics.classId ?? '')} onChange={(event) => update('mechanics.classId', event.target.value)}><option value="">Scegli</option>{CLASS_IDS.map((id) => <option key={id}>{id}</option>)}</select></Field>}
    {category === 'spell' && <SpellEditor mechanics={mechanics} update={update} />}
    {!['progression-table', 'spell'].includes(category) && <Field label="Dati meccanici JSON" wide><textarea rows={10} value={JSON.stringify(mechanics, null, 2)} onChange={(event) => { try { update('mechanics', JSON.parse(event.target.value)) } catch { /* conserva l’ultimo JSON valido */ } }} /></Field>}
    <button className="button button-primary" onClick={save}>Valida e registra</button>
  </section>
}

function ProgressionEditor({ mechanics, update }: { mechanics: Record<string, unknown>; update: (path: string, value: unknown) => void }) {
  const levels = Array.isArray(mechanics.levels) ? mechanics.levels as Record<string, unknown>[] : makeLevels()
  return <section className="progression-table-editor"><label>Classe<select value={String(mechanics.classId ?? '')} onChange={(event) => update('mechanics.classId', event.target.value)}><option value="">Scegli</option>{CLASS_IDS.map((id) => <option key={id}>{id}</option>)}</select></label>
    <div className="table-scroll"><table><thead><tr><th>Liv.</th><th>Comp.</th><th>Capacità</th><th>Scelte</th><th>Maestrie</th><th>Risorse</th><th>Trucchetti</th><th>Preparati/conosciuti</th><th>Slot</th><th>Max inc.</th><th>Sottoclasse</th><th>Talento/ASI</th><th>Stato</th></tr></thead>
      <tbody>{levels.map((row, index) => <tr key={index}><td>{index + 1}</td>
        <Cell value={row.proficiencyBonus} onChange={(value) => updateLevel(levels, index, 'proficiencyBonus', Number(value), update)} />
        <Cell value={join(row.grantedFeatureIds)} onChange={(value) => updateLevel(levels, index, 'grantedFeatureIds', split(value), update)} />
        <Cell value={join(row.requiredChoiceIds)} onChange={(value) => updateLevel(levels, index, 'requiredChoiceIds', split(value), update)} />
        <Cell value={row.weaponMasteryCount} onChange={(value) => updateLevel(levels, index, 'weaponMasteryCount', Number(value), update)} />
        <Cell value={join(row.resourceIds)} onChange={(value) => updateLevel(levels, index, 'resourceIds', split(value), update)} />
        <Cell value={row.cantrips} onChange={(value) => updateLevel(levels, index, 'cantrips', Number(value), update)} />
        <Cell value={row.preparedOrKnown} onChange={(value) => updateLevel(levels, index, 'preparedOrKnown', Number(value), update)} />
        <Cell value={join(row.slots)} onChange={(value) => updateLevel(levels, index, 'slots', split(value).map(Number), update)} />
        <Cell value={row.maximumSpellLevel} onChange={(value) => updateLevel(levels, index, 'maximumSpellLevel', Number(value), update)} />
        <Cell value={String(row.subclassEvent ?? '')} onChange={(value) => updateLevel(levels, index, 'subclassEvent', value, update)} />
        <Cell value={String(row.featOrAsi ?? '')} onChange={(value) => updateLevel(levels, index, 'featOrAsi', value, update)} />
        <td><select value={String(row.verificationStatus)} onChange={(event) => updateLevel(levels, index, 'verificationStatus', event.target.value, update)}><option value="missing">Mancante</option><option value="incomplete">Incompleto</option><option value="transcribed">Trascritto</option><option value="verified">Verificato</option></select></td>
      </tr>)}</tbody>
    </table></div>
  </section>
}

function SpellEditor({ mechanics, update }: { mechanics: Record<string, unknown>; update: (path: string, value: unknown) => void }) {
  const fields = [['level', 'Livello'], ['school', 'Scuola'], ['castingTime', 'Tempo di lancio'], ['range', 'Gittata'], ['components', 'Componenti'], ['duration', 'Durata'], ['classListIds', 'Liste di classe']] as const
  return <div className="editor-field-grid">{fields.map(([key, label]) => <Field key={key} label={label}><input value={join(mechanics[key])} onChange={(event) => update(`mechanics.${key}`, key === 'level' ? Number(event.target.value) : key === 'classListIds' ? split(event.target.value) : event.target.value)} /></Field>)}
    <Field label="Concentrazione"><input type="checkbox" checked={mechanics.concentration === true} onChange={(event) => update('mechanics.concentration', event.target.checked)} /></Field>
    <Field label="Rituale"><input type="checkbox" checked={mechanics.ritual === true} onChange={(event) => update('mechanics.ritual', event.target.checked)} /></Field>
    <Field label="Descrizione meccanica" wide><textarea value={String(mechanics.description ?? '')} onChange={(event) => update('mechanics.description', event.target.value)} /></Field>
    <Field label="Effetti ai livelli superiori" wide><textarea value={String(mechanics.higherLevels ?? '')} onChange={(event) => update('mechanics.higherLevels', event.target.value)} /></Field>
  </div>
}

function CoverageMatrix({ coverage }: { coverage: Record<string, string[]> }) {
  return <section className="coverage-matrix"><div><h2>Matrice di copertura 1–10</h2><p>Una classe è pronta soltanto con dieci livelli completi e verificati.</p></div><div className="table-scroll"><table><thead><tr><th>Classe</th>{Array.from({ length: 10 }, (_, index) => <th key={index}>{index + 1}</th>)}</tr></thead><tbody>{CLASS_IDS.map((id) => <tr key={id}><th>{id}</th>{coverage[id].map((status, index) => <td key={index}><span className={`coverage-state ${status}`} title={status}>{status === 'missing' ? '—' : status === 'ready' ? '✓' : '•'}</span></td>)}</tr>)}</tbody></table></div></section>
}

function ImportDialog({ preview, cancel, confirm }: { preview: ImportPreview; cancel: () => void; confirm: () => void }) {
  return <div className="modal-backdrop"><section className="import-preview" role="dialog" aria-modal="true" aria-labelledby="import-title"><h2 id="import-title">Anteprima importazione</h2><dl><div><dt>Elementi</dt><dd>{preview.items.length}</dd></div><div><dt>Campi riconosciuti</dt><dd>{preview.analysis.recognizedFields.join(', ') || 'Nessuno'}</dd></div><div><dt>Campi mancanti</dt><dd>{preview.analysis.missingFields.join(', ') || 'Nessuno'}</dd></div><div><dt>Elementi sostituiti</dt><dd>{preview.analysis.replacements.length}</dd></div></dl><IssueList issues={preview.analysis.issues} /><div className="content-actions"><button className="button button-ghost" onClick={cancel}>Annulla</button><button className="button button-primary" disabled={!preview.analysis.valid} onClick={confirm}>Conferma importazione</button></div></section></div>
}
function IssueList({ issues }: { issues: AnalysisIssue[] }) { return issues.length ? <ul className="editor-issues">{issues.map((issue, index) => <li key={index}>Riga {issue.index + 1}: {issue.code}{issue.reference ? ` (${issue.reference})` : ''}</li>)}</ul> : <p className="notice notice-success">Nessun errore bloccante.</p> }
function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={wide ? 'editor-field wide' : 'editor-field'}><span>{label}</span>{children}</label> }
function Cell({ value, onChange }: { value: unknown; onChange: (value: string) => void }) { return <td><input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></td> }
function Status({ value }: { value: string }) { return <span className={`editor-status ${value}`}>{value}</span> }
function emptyItem(category: string): EditorItem { return { id: '', category, officialNameIt: '', officialNameEn: '', source: { manual: 'Manuale del Giocatore 2024', edition: '2024', italianPage: '', section: '' }, mechanics: category === 'progression-table' ? { classId: '', levels: makeLevels() } : {}, verifiedAt: '', verificationStatus: 'incomplete', active: false, transcriptionNotes: '' } }
function makeLevels() { return Array.from({ length: 10 }, (_, index) => ({ level: index + 1, proficiencyBonus: index < 4 ? 2 : index < 8 ? 3 : 4, grantedFeatureIds: [], requiredChoiceIds: [], weaponMasteryCount: 0, resourceIds: [], cantrips: 0, preparedOrKnown: 0, slots: [], maximumSpellLevel: 0, subclassEvent: '', featOrAsi: '', verificationStatus: 'missing', complete: false })) }
function updateLevel(levels: Record<string, unknown>[], index: number, key: string, value: unknown, update: (path: string, value: unknown) => void) { const next = structuredClone(levels); next[index][key] = value; next[index].complete = next[index].verificationStatus === 'verified'; update('mechanics.levels', next) }
function setPath(source: EditorItem, path: string, value: unknown) { const result = structuredClone(source); const keys = path.split('.'); let target: Record<string, unknown> = result; keys.slice(0, -1).forEach((key) => { if (!target[key] || typeof target[key] !== 'object') target[key] = {}; target = target[key] as Record<string, unknown> }); target[keys.at(-1)!] = value; return result }
function split(value: string) { return value.split(',').map((item) => item.trim()).filter(Boolean) }
function join(value: unknown) { return Array.isArray(value) ? value.join(', ') : String(value ?? '') }
function download(name: string, content: string) { const url = URL.createObjectURL(new Blob([content], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url) }
