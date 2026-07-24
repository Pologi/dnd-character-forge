import { useId, useState } from 'react'
import type { RegistryContentItem } from '../types/privateContent'
import type { OfficialTermReference } from '../content/officialTermCatalog'

export function OfficialTermHelp({ item, label }: { item: RegistryContentItem | OfficialTermReference; label?: string }) {
  const [open, setOpen] = useState(false)
  const popoverId = useId()
  return (
    <span className="official-term-help">
      <button
        type="button"
        className="official-term-trigger"
        aria-label={`Informazioni ufficiali: ${label ?? item.nameIt}`}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((value) => !value)
        }}
      >?</button>
      {open && (
        <span id={popoverId} className="official-term-popover" role="dialog" aria-label={`Termine ufficiale ${item.nameIt}`}>
          <strong>{item.nameIt}</strong>
          <span lang="en">{item.nameEn}</span>
          <dl>
            <div><dt>Categoria</dt><dd>{item.category}</dd></div>
            <div><dt>Livello</dt><dd>{typeof item.mechanics.level === 'number' ? item.mechanics.level : 'Non applicabile'}</dd></div>
            <div><dt>Classe</dt><dd>{typeof item.mechanics.classId === 'string' ? item.mechanics.classId : 'Non applicabile'}</dd></div>
            {typeof item.mechanics.subclassId === 'string' && <div><dt>Sottoclasse</dt><dd>{item.mechanics.subclassId}</dd></div>}
            <div><dt>Manuale</dt><dd>{item.sourceTitle}</dd></div>
            <div><dt>Pagina</dt><dd>{item.page ?? 'Non indicata'}</dd></div>
            <div><dt>Edizione</dt><dd>{item.edition}</dd></div>
            <div><dt>Origine</dt><dd>{item.origin === 'private-pack' ? 'Pacchetto privato' : 'SRD'}</dd></div>
            <div><dt>Verifica</dt><dd>{verificationLabel(item.verificationStatus)}</dd></div>
          </dl>
        </span>
      )}
    </span>
  )
}

function verificationLabel(status: RegistryContentItem['verificationStatus']) {
  if (status === 'verified') return 'Verificato'
  if (status === 'transcribed') return 'Trascritto'
  if (status === 'incomplete') return 'Incompleto'
  return 'Non verificato'
}
