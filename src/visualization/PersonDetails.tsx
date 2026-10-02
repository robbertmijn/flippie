import type { AncestorSlot, GenealogyIndexes } from '../genealogy/model'
import type { LifeEvent } from '../import/types'

interface Props { slot: AncestorSlot; indexes: GenealogyIndexes; onClose: () => void }

function EventRow({ label, event, indexes }: { label: string; event: LifeEvent | undefined; indexes: GenealogyIndexes }) {
  if (!event) return <div><dt>{label}</dt><dd>Not recorded</dd></div>
  const place = event.placeId ? indexes.placesById.get(event.placeId)?.name : undefined
  return <div><dt>{label}</dt><dd>{[event.date?.original, place].filter(Boolean).join(' · ') || 'Not recorded'}</dd></div>
}

export function PersonDetails({ slot, indexes, onClose }: Props) {
  if (!slot.person) return null
  const person = slot.person
  return <div className="detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="person-detail" role="dialog" aria-modal="true" aria-labelledby="person-detail-title">
      <button className="detail-close" type="button" onClick={onClose} aria-label="Close person details">×</button>
      <p className="eyebrow">Generation {slot.generation} · Ancestor slot {slot.slot}</p>
      <h3 id="person-detail-title">{person.name.displayName}</h3>
      {person.gender && <p className="detail-meta">{person.gender}</p>}
      <dl><EventRow label="Birth" event={person.birth} indexes={indexes} /><EventRow label="Baptism" event={person.baptism} indexes={indexes} /><EventRow label="Death" event={person.death} indexes={indexes} /><EventRow label="Burial" event={person.burial} indexes={indexes} /></dl>
      {person.notes && <div className="person-notes"><h4>Notes</h4><p>{person.notes}</p></div>}
    </section>
  </div>
}
