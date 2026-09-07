import { parseMultiSectionCsv } from './csv'
import type { Family, GenealogyDate, ImportFinding, ImportResult, LifeEvent, Person, Place } from './types'

const expectedHeaders: Record<string, string[]> = {
  Place: ['Place', 'Title', 'Name', 'Type', 'Latitude', 'Longitude', 'Code', 'Enclosed_by', 'Date'],
  Person: ['Person', 'Surname', 'Given', 'Call', 'Suffix', 'Prefix', 'Title', 'Gender', 'Birth date', 'Birth place', 'Birth source', 'Baptism date', 'Baptism place', 'Baptism source', 'Death date', 'Death place', 'Death source', 'Burial date', 'Burial place', 'Burial source', 'Note'],
  Marriage: ['Marriage', 'Husband', 'Wife', 'Date', 'Place', 'Source', 'Note'],
  Family: ['Family', 'Child'],
}

export const normalizeId = (value: string) => value.trim().replace(/^\[([^\]]+)]$/, '$1')
const value = (raw: Record<string, string>, key: string) => raw[key]?.trim() || undefined

export function parseGenealogyDate(originalValue: string | undefined, findings?: ImportFinding[], context?: string): GenealogyDate | undefined {
  if (!originalValue) return undefined
  const original = originalValue.trim()
  const qualifierMatch = original.match(/^(about|abt\.?|before|bef\.?|after|aft\.?)\s+(.+)$/i)
  const qualifierText = qualifierMatch?.[1].toLowerCase()
  const dateText = qualifierMatch?.[2] ?? original
  const qualifier = qualifierText?.startsWith('a') && !qualifierText.startsWith('af') ? 'about'
    : qualifierText?.startsWith('bef') ? 'before' : qualifierText?.startsWith('af') ? 'after' : 'exact'
  let match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return { original, year, month, day, precision: 'day', qualifier }
  }
  match = dateText.match(/^(\d{4})-(\d{2})$/)
  if (match && Number(match[2]) >= 1 && Number(match[2]) <= 12) return { original, year: Number(match[1]), month: Number(match[2]), precision: 'month', qualifier }
  match = dateText.match(/^(\d{4})$/)
  if (match) return { original, year: Number(match[1]), precision: 'year', qualifier }
  findings?.push({ level: 'warning', code: 'malformed-date', message: `Could not interpret date “${original}”${context ? ` for ${context}` : ''}.` })
  return { original, precision: 'unknown', qualifier: 'unknown' }
}

const event = (raw: Record<string, string>, label: string, findings: ImportFinding[], context: string): LifeEvent | undefined => {
  const date = parseGenealogyDate(value(raw, `${label} date`), findings, context)
  const placeId = value(raw, `${label} place`)
  const source = value(raw, `${label} source`)
  return date || placeId || source ? { date, placeId: placeId ? normalizeId(placeId) : undefined, source } : undefined
}

function createPlace(raw: Record<string, string>, findings: ImportFinding[]): Place | undefined {
  const importedId = value(raw, 'Place')
  if (!importedId) { findings.push({ level: 'error', code: 'missing-id', section: 'Place', message: 'A place record has no ID.' }); return }
  const parseCoordinate = (key: 'Latitude' | 'Longitude') => {
    const coordinate = value(raw, key)
    if (!coordinate) return undefined
    const parsed = Number(coordinate)
    if (!Number.isFinite(parsed)) findings.push({ level: 'warning', code: 'malformed-coordinate', section: 'Place', message: `${key} “${coordinate}” is not a number for ${importedId}.` })
    return Number.isFinite(parsed) ? parsed : undefined
  }
  const latitude = parseCoordinate('Latitude'); const longitude = parseCoordinate('Longitude')
  if (latitude === undefined || longitude === undefined) findings.push({ level: 'information', code: 'unresolved-coordinate', section: 'Place', message: `${value(raw, 'Name') ?? importedId} has no complete coordinates.` })
  return { id: normalizeId(importedId), importedId, name: value(raw, 'Name') ?? value(raw, 'Title') ?? importedId, latitude, longitude, title: value(raw, 'Title'), type: value(raw, 'Type'), code: value(raw, 'Code'), enclosedById: value(raw, 'Enclosed_by') ? normalizeId(raw.Enclosed_by) : undefined, date: parseGenealogyDate(value(raw, 'Date'), findings, importedId), raw }
}

function createPerson(raw: Record<string, string>, findings: ImportFinding[]): Person | undefined {
  const importedId = value(raw, 'Person')
  if (!importedId) { findings.push({ level: 'error', code: 'missing-id', section: 'Person', message: 'A person record has no ID.' }); return }
  const given = value(raw, 'Given') ?? ''
  const displayName = [given, value(raw, 'Prefix'), value(raw, 'Surname'), value(raw, 'Suffix')].filter(Boolean).join(' ') || value(raw, 'Call') || value(raw, 'Title') || importedId
  return { id: normalizeId(importedId), importedId, name: { given, surname: value(raw, 'Surname'), prefix: value(raw, 'Prefix'), callName: value(raw, 'Call'), suffix: value(raw, 'Suffix'), title: value(raw, 'Title'), displayName }, gender: value(raw, 'Gender'), birth: event(raw, 'Birth', findings, importedId), baptism: event(raw, 'Baptism', findings, importedId), death: event(raw, 'Death', findings, importedId), burial: event(raw, 'Burial', findings, importedId), notes: value(raw, 'Note'), raw }
}

function createFamily(raw: Record<string, string>, findings: ImportFinding[]): Family | undefined {
  const importedId = value(raw, 'Marriage')
  if (!importedId) { findings.push({ level: 'error', code: 'missing-id', section: 'Marriage', message: 'A family record has no ID.' }); return }
  const husbandId = value(raw, 'Husband') ? normalizeId(raw.Husband) : undefined
  const wifeId = value(raw, 'Wife') ? normalizeId(raw.Wife) : undefined
  const marriage = event({ 'Marriage date': raw.Date, 'Marriage place': raw.Place, 'Marriage source': raw.Source }, 'Marriage', findings, importedId)
  return { id: normalizeId(importedId), importedId, parent1Id: husbandId, parent2Id: wifeId, importedParentRoles: { husbandId, wifeId }, marriage, childIds: [], note: value(raw, 'Note'), source: value(raw, 'Source'), raw }
}

export function importGenealogyCsv(source: string): ImportResult {
  const parsed = parseMultiSectionCsv(source); const findings = [...parsed.findings]
  const byName = new Map(parsed.sections.map((section) => [section.name, section]))
  for (const section of parsed.sections) {
    const expected = expectedHeaders[section.name]
    if (!expected) findings.push({ level: 'information', code: 'unknown-section', section: section.name, message: `Ignored unsupported section “${section.name}”.` })
    else if (section.header.join('\0') !== expected.join('\0')) findings.push({ level: 'error', code: 'malformed-header', section: section.name, message: `${section.name} has an unexpected header.` })
  }
  for (const name of Object.keys(expectedHeaders)) if (!byName.has(name)) findings.push({ level: 'error', code: 'missing-section', section: name, message: `Required section “${name}” is missing.` })

  const places = (byName.get('Place')?.records ?? []).map((raw) => createPlace(raw, findings)).filter((item): item is Place => Boolean(item))
  const people = (byName.get('Person')?.records ?? []).map((raw) => createPerson(raw, findings)).filter((item): item is Person => Boolean(item))
  const families = (byName.get('Marriage')?.records ?? []).map((raw) => createFamily(raw, findings)).filter((item): item is Family => Boolean(item))
  const reportDuplicates = <T extends { id: string }>(items: T[], label: string) => { const seen = new Set<string>(); for (const item of items) { if (seen.has(item.id)) findings.push({ level: 'error', code: `duplicate-${label}`, message: `Duplicate ${label} ID ${item.id}.` }); seen.add(item.id) } }
  reportDuplicates(places, 'place'); reportDuplicates(people, 'person'); reportDuplicates(families, 'family')
  const peopleIds = new Set(people.map(({ id }) => id)); const placeIds = new Set(places.map(({ id }) => id)); const familiesById = new Map(families.map((family) => [family.id, family]))
  for (const raw of byName.get('Family')?.records ?? []) {
    const familyId = value(raw, 'Family'); const childId = value(raw, 'Child')
    if (!familyId || !childId) { findings.push({ level: 'error', code: 'missing-id', section: 'Family', message: 'A family-child link is missing an ID.' }); continue }
    const family = familiesById.get(normalizeId(familyId)); const normalizedChild = normalizeId(childId)
    if (!family) findings.push({ level: 'warning', code: 'unknown-family', section: 'Family', message: `Child link references unknown family ${familyId}.` })
    else family.childIds.push(normalizedChild)
    if (!peopleIds.has(normalizedChild)) findings.push({ level: 'warning', code: 'unknown-child', section: 'Family', message: `Child link references unknown person ${childId}.` })
  }
  for (const family of families) for (const parentId of [family.parent1Id, family.parent2Id]) {
    if (parentId && !peopleIds.has(parentId)) findings.push({ level: 'warning', code: 'unknown-parent', section: 'Marriage', message: `${family.importedId} references unknown parent ${parentId}.` })
    if (parentId && family.childIds.includes(parentId)) findings.push({ level: 'warning', code: 'self-parent', section: 'Marriage', message: `${parentId} is listed as their own parent.` })
  }
  for (const person of people) for (const lifeEvent of [person.birth, person.baptism, person.death, person.burial]) if (lifeEvent?.placeId && !placeIds.has(lifeEvent.placeId)) findings.push({ level: 'warning', code: 'unknown-place', section: 'Person', message: `${person.importedId} references unknown place ${lifeEvent.placeId}.` })
  for (const family of families) if (family.marriage?.placeId && !placeIds.has(family.marriage.placeId)) findings.push({ level: 'warning', code: 'unknown-place', section: 'Marriage', message: `${family.importedId} references unknown place ${family.marriage.placeId}.` })
  const stats = { people: people.length, places: places.length, families: families.length, parentChildRelationships: families.reduce((sum, family) => sum + family.childIds.length, 0), birthDates: people.filter((person) => person.birth?.date).length, birthPlaces: people.filter((person) => person.birth?.placeId).length, deathDates: people.filter((person) => person.death?.date).length, deathPlaces: people.filter((person) => person.death?.placeId).length, mappedPlaces: places.filter((place) => place.latitude !== undefined && place.longitude !== undefined).length, unresolvedPlaces: places.filter((place) => place.latitude === undefined || place.longitude === undefined).length }
  return { people, places, families, findings, stats }
}
