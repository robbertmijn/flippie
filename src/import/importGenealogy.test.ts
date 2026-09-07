import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseMultiSectionCsv } from './csv'
import { importGenealogyCsv, normalizeId, parseGenealogyDate } from './importGenealogy'

const fixture = readFileSync('sample-data/fictional-family.csv', 'utf8')

describe('multi-section CSV parser', () => {
  it('parses different column counts, quoted commas, and quoted line breaks', () => {
    const parsed = parseMultiSectionCsv(fixture)
    expect(parsed.sections.map(({ name }) => name)).toEqual(['Place', 'Person', 'Marriage', 'Family'])
    expect(parsed.sections.find(({ name }) => name === 'Place')?.records[0].Name).toBe('Willow Creek, North')
    expect(parsed.sections.find(({ name }) => name === 'Person')?.records[0].Note).toContain('\n')
    expect(parsed.findings).toEqual([])
  })

  it('reports an unknown section without rejecting recognized sections', () => {
    const result = importGenealogyCsv(`${fixture}\n\nFutureThing,Value\n[X1],anything`)
    expect(result.stats.people).toBe(8)
    expect(result.findings).toContainEqual(expect.objectContaining({ level: 'information', code: 'unknown-section' }))
  })
})

describe('four-section genealogy adapter', () => {
  it('normalizes IDs while preserving imported values and date precision', () => {
    const result = importGenealogyCsv(fixture)
    expect(normalizeId('[I0001]')).toBe('I0001')
    expect(result.people[0]).toMatchObject({ id: 'I0001', importedId: '[I0001]' })
    expect(result.people.find(({ id }) => id === 'I0004')?.birth?.date).toMatchObject({ original: '1945', year: 1945, precision: 'year' })
    expect(parseGenealogyDate('about 1901')).toMatchObject({ year: 1901, qualifier: 'about' })
  })

  it('imports names, coordinates, missing values, and all life events', () => {
    const result = importGenealogyCsv(fixture)
    expect(result.places.find(({ id }) => id === 'P0001')).toMatchObject({ latitude: 52.1, longitude: 5.1 })
    expect(result.places.find(({ id }) => id === 'P0002')?.latitude).toBeUndefined()
    expect(result.people.find(({ id }) => id === 'I0002')?.name.displayName).toBe('Mara van Linden')
    expect(result.people.find(({ id }) => id === 'I0008')?.name.displayName).toBe('Sagefield')
    expect(result.people.find(({ id }) => id === 'I0001')?.baptism?.date?.precision).toBe('day')
  })

  it('supports missing parents, multiple children, and pedigree collapse input', () => {
    const result = importGenealogyCsv(fixture)
    expect(result.families.find(({ id }) => id === 'F0001')?.parent2Id).toBeUndefined()
    expect(result.families.find(({ id }) => id === 'F0003')?.parent1Id).toBeUndefined()
    expect(result.families.find(({ id }) => id === 'F0001')?.childIds).toEqual(['I0002', 'I0003'])
    expect(result.families.filter(({ parent1Id }) => parent1Id === 'I0006')).toHaveLength(2)
  })

  it('returns report statistics and unresolved-place information', () => {
    const result = importGenealogyCsv(fixture)
    expect(result.stats).toMatchObject({ people: 8, places: 2, families: 4, parentChildRelationships: 5, mappedPlaces: 1, unresolvedPlaces: 1 })
    expect(result.findings).toContainEqual(expect.objectContaining({ level: 'information', code: 'unresolved-coordinate' }))
    expect(result.findings.filter(({ level }) => level === 'error')).toEqual([])
  })

  it('warns about broken references in the malformed fixture', () => {
    const malformed = readFileSync('sample-data/malformed-references.csv', 'utf8')
    const result = importGenealogyCsv(malformed)
    expect(result.findings.map(({ code }) => code)).toEqual(expect.arrayContaining(['unknown-parent', 'unknown-child', 'unknown-family', 'unknown-place']))
  })
})
