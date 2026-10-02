import { useMemo, useState } from 'react'
import type { AncestorSlot, AncestorTraversal, GenealogyIndexes } from '../genealogy/model'

type EditableField = 'name' | 'birthDate' | 'birthPlace' | 'deathDate' | 'deathPlace'
type Drafts = Record<number, Partial<Record<EditableField, string>>>
const fieldLabels: Record<EditableField, string> = { name: 'Name', birthDate: 'Birth date', birthPlace: 'Birth place', deathDate: 'Death date', deathPlace: 'Death place' }

interface Props { traversal: AncestorTraversal; indexes: GenealogyIndexes }

function originalValue(slot: AncestorSlot, field: EditableField, indexes: GenealogyIndexes) {
  const person = slot.person
  if (!person) return ''
  if (field === 'name') return person.name.displayName
  const event = field.startsWith('birth') ? person.birth : person.death
  if (field.endsWith('Date')) return event?.date?.original ?? ''
  return event?.placeId ? indexes.placesById.get(event.placeId)?.name ?? event.placeId : ''
}

function year(value: string) {
  const match = value.match(/\b(\d{4})\b/)
  return match ? Number(match[1]) : undefined
}

export function AhnentafelTable({ traversal, indexes }: Props) {
  const [drafts, setDrafts] = useState<Drafts>({})
  const slotsByNumber = useMemo(() => new Map(traversal.slots.map((slot) => [slot.slot, slot])), [traversal])
  const value = (slot: AncestorSlot, field: EditableField) => drafts[slot.slot]?.[field] ?? originalValue(slot, field, indexes)
  const update = (slot: number, field: EditableField, next: string) => setDrafts((current) => ({ ...current, [slot]: { ...current[slot], [field]: next } }))
  const age = (later: string, earlier: string) => {
    const laterYear = year(later); const earlierYear = year(earlier)
    return laterYear !== undefined && earlierYear !== undefined && laterYear >= earlierYear ? `≈ ${laterYear - earlierYear}` : '—'
  }

  return <section className="ahnentafel" aria-labelledby="ahnentafel-title">
    <div className="ahnentafel-heading"><div><p className="eyebrow">Research worksheet</p><h3 id="ahnentafel-title">Ancestor ahnentafel</h3></div><p><strong>{traversal.slots.filter((slot) => slot.person).length}</strong> of {traversal.slots.length} slots identified</p></div>
    <p className="worksheet-note">Blank cells highlight missing information. Edits are a private working copy for this browser session and do not modify the imported file.</p>
    <div className="table-scroll"><table className="ahnentafel-table">
      <caption className="visually-hidden">Editable ancestor information by ahnentafel number</caption>
      <thead><tr><th scope="col">No.</th><th scope="col">Name</th><th scope="col">Birth date</th><th scope="col">Birth place</th><th scope="col">Death date</th><th scope="col">Death place</th><th scope="col">Age at death</th><th scope="col">Age when child born</th></tr></thead>
      <tbody>{traversal.slots.map((slot) => {
        const child = slotsByNumber.get(Math.floor(slot.slot / 2))
        const birthDate = value(slot, 'birthDate'); const deathDate = value(slot, 'deathDate')
        return <tr key={slot.slot} className={slot.person ? '' : 'unknown-row'}>
          <th scope="row">{slot.slot}</th>
          {(['name', 'birthDate', 'birthPlace', 'deathDate', 'deathPlace'] as EditableField[]).map((field) => <td className={value(slot, field) ? '' : 'missing-value'} key={field}><input aria-label={`${fieldLabels[field]} for ancestor ${slot.slot}`} value={value(slot, field)} placeholder={field === 'name' ? 'Unknown ancestor' : 'Missing'} onChange={(event) => update(slot.slot, field, event.target.value)} /></td>)}
          <td className="calculated-value">{age(deathDate, birthDate)}</td>
          <td className="calculated-value">{child ? age(value(child, 'birthDate'), birthDate) : '—'}</td>
        </tr>
      })}</tbody>
    </table></div>
  </section>
}
