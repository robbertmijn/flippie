import type { Family, ImportResult, Person, Place } from '../import/types'

export type ParentRole = 'parent1' | 'parent2'

export interface ParentRelationship {
  familyId: string
  parent1Id?: string
  parent2Id?: string
}

export interface GenealogyIndexes {
  peopleById: Map<string, Person>
  placesById: Map<string, Place>
  familiesById: Map<string, Family>
  parentsByChildId: Map<string, ParentRelationship>
  familiesByParentId: Map<string, string[]>
}

export interface AncestorSlot {
  /** Ahnentafel-style slot number: root = 1, parent 1 = 2, parent 2 = 3. */
  slot: number
  generation: number
  path: ParentRole[]
  personId?: string
  person?: Person
  familyId?: string
  /** True when following this branch would revisit somebody already in this path. */
  cycle: boolean
}

export interface AncestorTraversal {
  rootPersonId: string
  maxGeneration: number
  slots: AncestorSlot[]
  slotsByGeneration: Map<number, AncestorSlot[]>
  cyclePersonIds: Set<string>
}

/** Build all commonly used relationship lookups in a single pass over the import. */
export function buildGenealogyIndexes(data: Pick<ImportResult, 'people' | 'places' | 'families'>): GenealogyIndexes {
  const peopleById = new Map(data.people.map((person) => [person.id, person]))
  const placesById = new Map(data.places.map((place) => [place.id, place]))
  const familiesById = new Map(data.families.map((family) => [family.id, family]))
  const parentsByChildId = new Map<string, ParentRelationship>()
  const familiesByParentId = new Map<string, string[]>()

  for (const family of data.families) {
    for (const parentId of new Set([family.parent1Id, family.parent2Id])) {
      if (!parentId) continue
      const familyIds = familiesByParentId.get(parentId) ?? []
      familyIds.push(family.id)
      familiesByParentId.set(parentId, familyIds)
    }
    for (const childId of family.childIds) {
      // A second biological family is malformed input. Preserve the first definition
      // so traversal remains deterministic; import validation can report the conflict.
      if (!parentsByChildId.has(childId)) {
        parentsByChildId.set(childId, {
          familyId: family.id,
          parent1Id: family.parent1Id,
          parent2Id: family.parent2Id,
        })
      }
    }
  }

  return { peopleById, placesById, familiesById, parentsByChildId, familiesByParentId }
}

interface PendingSlot {
  slot: number
  generation: number
  path: ParentRole[]
  personId?: string
  familyId?: string
  ancestorsInPath: Set<string>
}

/**
 * Expand ancestry by slots rather than unique people. This intentionally emits two
 * children for every non-final slot, including missing ancestors, so generation
 * completeness and pedigree collapse can be calculated without reconstructing gaps.
 */
export function traverseAncestors(indexes: GenealogyIndexes, rootPersonId: string, maxGeneration: number): AncestorTraversal {
  if (!Number.isSafeInteger(maxGeneration) || maxGeneration < 0 || maxGeneration > 20) {
    throw new RangeError('maxGeneration must be an integer between 0 and 20.')
  }

  const slots: AncestorSlot[] = []
  const slotsByGeneration = new Map<number, AncestorSlot[]>()
  const cyclePersonIds = new Set<string>()
  const pending: PendingSlot[] = [{ slot: 1, generation: 0, path: [], personId: rootPersonId, ancestorsInPath: new Set() }]

  for (let cursor = 0; cursor < pending.length; cursor += 1) {
    const current = pending[cursor]
    const cycle = current.personId !== undefined && current.ancestorsInPath.has(current.personId)
    if (cycle && current.personId) cyclePersonIds.add(current.personId)
    const person = current.personId ? indexes.peopleById.get(current.personId) : undefined
    const ancestorSlot: AncestorSlot = {
      slot: current.slot,
      generation: current.generation,
      path: current.path,
      personId: current.personId,
      person,
      familyId: current.familyId,
      cycle,
    }
    slots.push(ancestorSlot)
    const generationSlots = slotsByGeneration.get(current.generation) ?? []
    generationSlots.push(ancestorSlot)
    slotsByGeneration.set(current.generation, generationSlots)

    if (current.generation === maxGeneration) continue
    const relationship = !cycle && person ? indexes.parentsByChildId.get(person.id) : undefined
    const nextAncestors = new Set(current.ancestorsInPath)
    if (current.personId) nextAncestors.add(current.personId)
    const parents: Array<[ParentRole, string | undefined]> = [
      ['parent1', relationship?.parent1Id],
      ['parent2', relationship?.parent2Id],
    ]
    for (const [role, personId] of parents) {
      pending.push({
        slot: current.slot * 2 + (role === 'parent2' ? 1 : 0),
        generation: current.generation + 1,
        path: [...current.path, role],
        personId,
        familyId: relationship?.familyId,
        ancestorsInPath: nextAncestors,
      })
    }
  }

  return { rootPersonId, maxGeneration, slots, slotsByGeneration, cyclePersonIds }
}

export function findAncestorCycles(indexes: GenealogyIndexes): Set<string> {
  const cyclePersonIds = new Set<string>()
  const finished = new Set<string>()

  for (const startId of indexes.peopleById.keys()) {
    if (finished.has(startId)) continue
    const activePath: string[] = []
    const activeIndexes = new Map<string, number>()
    const stack: Array<{ personId: string; parents?: string[]; nextParent: number }> = [{ personId: startId, nextParent: 0 }]

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]
      if (!frame.parents) {
        activeIndexes.set(frame.personId, activePath.length)
        activePath.push(frame.personId)
        const relationship = indexes.parentsByChildId.get(frame.personId)
        frame.parents = [relationship?.parent1Id, relationship?.parent2Id]
          .filter((parentId): parentId is string => parentId !== undefined && indexes.peopleById.has(parentId))
      }

      const parentId = frame.parents[frame.nextParent]
      frame.nextParent += 1
      if (parentId) {
        const cycleStart = activeIndexes.get(parentId)
        if (cycleStart !== undefined) {
          for (const cycleId of activePath.slice(cycleStart)) cyclePersonIds.add(cycleId)
        } else if (!finished.has(parentId)) {
          stack.push({ personId: parentId, nextParent: 0 })
        }
        continue
      }

      stack.pop()
      activePath.pop()
      activeIndexes.delete(frame.personId)
      finished.add(frame.personId)
    }
  }
  return cyclePersonIds
}
