import { describe, expect, it } from 'vitest'
import { importGenealogyCsv } from '../import/importGenealogy'
import type { Family, ImportResult, Person } from '../import/types'
import { buildGenealogyIndexes, findAncestorCycles, traverseAncestors } from './model'

const person = (id: string): Person => ({
  id,
  importedId: `[${id}]`,
  name: { given: id, displayName: id },
  raw: {},
})

const family = (id: string, parent1Id: string | undefined, parent2Id: string | undefined, childIds: string[]): Family => ({
  id,
  importedId: `[${id}]`,
  parent1Id,
  parent2Id,
  importedParentRoles: { husbandId: parent1Id, wifeId: parent2Id },
  childIds,
  raw: {},
})

const data = (people: Person[], families: Family[]): ImportResult => ({
  people,
  families,
  places: [],
  findings: [],
  stats: { people: people.length, places: 0, families: families.length, parentChildRelationships: 0, birthDates: 0, birthPlaces: 0, deathDates: 0, deathPlaces: 0, mappedPlaces: 0, unresolvedPlaces: 0 },
})

describe('genealogy model', () => {
  it('builds canonical indexes from family membership', () => {
    const model = data([person('child'), person('p1'), person('p2')], [family('family', 'p1', 'p2', ['child'])])
    const indexes = buildGenealogyIndexes(model)

    expect(indexes.peopleById.get('child')?.name.displayName).toBe('child')
    expect(indexes.parentsByChildId.get('child')).toEqual({ familyId: 'family', parent1Id: 'p1', parent2Id: 'p2' })
    expect(indexes.familiesByParentId.get('p1')).toEqual(['family'])
    expect(indexes.familiesByParentId.get('p2')).toEqual(['family'])
  })

  it('keeps repeated people in separate slots for pedigree collapse', () => {
    const model = data(
      ['root', 'a', 'b', 'shared'].map(person),
      [family('root-family', 'a', 'b', ['root']), family('a-family', 'shared', undefined, ['a']), family('b-family', 'shared', undefined, ['b'])],
    )
    const traversal = traverseAncestors(buildGenealogyIndexes(model), 'root', 2)
    const grandparents = traversal.slotsByGeneration.get(2) ?? []

    expect(grandparents).toHaveLength(4)
    expect(grandparents.filter((slot) => slot.personId === 'shared').map((slot) => slot.slot)).toEqual([4, 6])
    expect(new Set(grandparents.flatMap((slot) => slot.personId ?? []))).toEqual(new Set(['shared']))
  })

  it('preserves missing slots through the requested generation', () => {
    const traversal = traverseAncestors(buildGenealogyIndexes(data([person('root'), person('p1')], [family('f', 'p1', undefined, ['root'])])), 'root', 3)

    expect(traversal.slotsByGeneration.get(0)).toHaveLength(1)
    expect(traversal.slotsByGeneration.get(1)).toHaveLength(2)
    expect(traversal.slotsByGeneration.get(2)).toHaveLength(4)
    expect(traversal.slotsByGeneration.get(3)).toHaveLength(8)
    expect(traversal.slotsByGeneration.get(1)?.[1].personId).toBeUndefined()
  })

  it('marks cycles and stops following the cyclic branch', () => {
    const model = data([person('a'), person('b')], [family('fa', 'b', undefined, ['a']), family('fb', 'a', undefined, ['b'])])
    const indexes = buildGenealogyIndexes(model)
    const traversal = traverseAncestors(indexes, 'a', 4)

    expect(traversal.slots.find((slot) => slot.slot === 4)).toMatchObject({ personId: 'a', cycle: true })
    expect(traversal.slots.find((slot) => slot.slot === 8)?.personId).toBeUndefined()
    expect(findAncestorCycles(indexes)).toEqual(new Set(['a', 'b']))
  })

  it('works with normalized imported data', () => {
    const csv = 'Place,Title,Name,Type,Latitude,Longitude,Code,Enclosed_by,Date\n\nPerson,Surname,Given,Call,Suffix,Prefix,Title,Gender,Birth date,Birth place,Birth source,Baptism date,Baptism place,Baptism source,Death date,Death place,Death source,Burial date,Burial place,Burial source,Note\n[I1],Root,,,,,,,,,,,,,,,,,,,,\n[I2],Parent,,,,,,,,,,,,,,,,,,,,\n\nMarriage,Husband,Wife,Date,Place,Source,Note\n[F1],[I2],,,,,\n\nFamily,Child\n[F1],[I1]'
    const indexes = buildGenealogyIndexes(importGenealogyCsv(csv))

    expect(traverseAncestors(indexes, 'I1', 1).slots.map((slot) => slot.personId)).toEqual(['I1', 'I2', undefined])
  })

  it('rejects unsafe traversal depths', () => {
    const indexes = buildGenealogyIndexes(data([], []))
    expect(() => traverseAncestors(indexes, 'root', -1)).toThrow(RangeError)
    expect(() => traverseAncestors(indexes, 'root', 21)).toThrow(RangeError)
  })
})
