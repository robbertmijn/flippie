import { describe, expect, it } from 'vitest'
import { buildGenealogyIndexes, traverseAncestors } from '../genealogy/model'
import type { Family, Person } from '../import/types'
import { analyzeCompleteness } from './completeness'

const person = (id: string, details: Partial<Person> = {}): Person => ({
  id, importedId: `[${id}]`, name: { given: id, displayName: id }, raw: {}, ...details,
})
const family = (id: string, parent1Id: string | undefined, parent2Id: string | undefined, childIds: string[]): Family => ({
  id, importedId: `[${id}]`, parent1Id, parent2Id, childIds, importedParentRoles: {}, raw: {},
})

describe('completeness analysis', () => {
  it('separates slot coverage, unique people, and record availability', () => {
    const root = person('root', { birth: { date: { original: '1980', year: 1980, precision: 'year', qualifier: 'exact' }, placeId: 'p' } })
    const shared = person('shared', { birth: { date: { original: 'about 1950', year: 1950, precision: 'year', qualifier: 'about' } }, death: { date: { original: '2020-04', year: 2020, month: 4, precision: 'month', qualifier: 'exact' } } })
    const data = { people: [root, shared], places: [], families: [family('f', 'shared', 'shared', ['root'])] }
    const analysis = analyzeCompleteness(traverseAncestors(buildGenealogyIndexes(data), 'root', 2))

    expect(analysis.generations[1]).toMatchObject({ expectedSlots: 2, filledSlots: 2, missingSlots: 0, uniquePeople: 1, completion: 1 })
    expect(analysis.generations[2]).toMatchObject({ expectedSlots: 4, filledSlots: 0, missingSlots: 4 })
    expect(analysis.knownSlots).toBe(3)
    expect(analysis.uniquePeople).toBe(2)
    expect(analysis.recordAvailability).toEqual({ birthDate: 1, birthPlace: 0.5, deathDate: 0.5, deathPlace: 0 })
    expect(analysis.birthDates).toMatchObject({ available: 2, missing: 0, approximate: 1, precision: { day: 0, month: 0, year: 2, unknown: 0 } })
    expect(analysis.deathDates.precision.month).toBe(1)
  })

  it('does not treat unknown ancestor slots as incomplete person records', () => {
    const data = { people: [person('root')], places: [], families: [] }
    const analysis = analyzeCompleteness(traverseAncestors(buildGenealogyIndexes(data), 'root', 1))

    expect(analysis.generations[1].recordAvailability.birthDate).toBe(0)
    expect(analysis.birthDates).toMatchObject({ available: 0, missing: 1 })
  })
})
