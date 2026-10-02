import type { AncestorSlot } from '../genealogy/model'

export interface TreeNodeLayout {
  slot: AncestorSlot
  x: number
  y: number
  repeated: boolean
}

export function layoutAncestorTree(slots: AncestorSlot[], maxGeneration: number): TreeNodeLayout[] {
  const occurrences = new Map<string, number>()
  return slots.map((slot) => {
    const position = slot.slot - 2 ** slot.generation
    const columns = 2 ** slot.generation
    const seen = slot.personId ? occurrences.get(slot.personId) ?? 0 : 0
    if (slot.personId) occurrences.set(slot.personId, seen + 1)
    return {
      slot,
      x: 100 + (maxGeneration - slot.generation) * 230,
      y: 55 + ((position + 0.5) / columns) * Math.max(360, columns * 82),
      repeated: seen > 0,
    }
  })
}

export function describeLifeSpan(slot: AncestorSlot): string {
  if (!slot.person) return 'Unknown ancestor'
  const birth = slot.person.birth?.date?.year
  const death = slot.person.death?.date?.year
  if (!birth && !death) return 'Dates unknown'
  return `${birth ?? '?'} – ${death ?? '?'}`
}

export function polarPoint(radius: number, angle: number) {
  return { x: 300 + radius * Math.cos(angle), y: 300 + radius * Math.sin(angle) }
}

export function fanSegmentPath(generation: number, position: number): string {
  const inner = 48 + (generation - 1) * 58
  const outer = inner + 56
  const count = 2 ** generation
  const start = -Math.PI / 2 + (position / count) * Math.PI * 2
  const end = -Math.PI / 2 + ((position + 1) / count) * Math.PI * 2
  const a = polarPoint(inner, start)
  const b = polarPoint(outer, start)
  const c = polarPoint(outer, end)
  const d = polarPoint(inner, end)
  const large = end - start > Math.PI ? 1 : 0
  return `M ${a.x} ${a.y} L ${b.x} ${b.y} A ${outer} ${outer} 0 ${large} 1 ${c.x} ${c.y} L ${d.x} ${d.y} A ${inner} ${inner} 0 ${large} 0 ${a.x} ${a.y} Z`
}
