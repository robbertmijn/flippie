import type { AncestorTraversal } from '../genealogy/model'
import type { GenealogyDate, Person } from '../import/types'

export type RecordField = 'birthDate' | 'birthPlace' | 'deathDate' | 'deathPlace'
export type DatePrecision = GenealogyDate['precision']

export interface GenerationCompleteness {
  generation: number
  expectedSlots: number
  filledSlots: number
  missingSlots: number
  uniquePeople: number
  completion: number
  recordAvailability: Record<RecordField, number>
}

export interface DateAnalysis {
  available: number
  missing: number
  approximate: number
  precision: Record<DatePrecision, number>
}

export interface CompletenessAnalysis {
  generations: GenerationCompleteness[]
  knownSlots: number
  uniquePeople: number
  recordAvailability: Record<RecordField, number>
  birthDates: DateAnalysis
  deathDates: DateAnalysis
}

const fields: RecordField[] = ['birthDate', 'birthPlace', 'deathDate', 'deathPlace']
const hasField = (person: Person, field: RecordField) => {
  if (field === 'birthDate') return Boolean(person.birth?.date)
  if (field === 'birthPlace') return Boolean(person.birth?.placeId)
  if (field === 'deathDate') return Boolean(person.death?.date)
  return Boolean(person.death?.placeId)
}

const availability = (people: Person[]) => Object.fromEntries(
  fields.map((field) => [field, people.length === 0 ? 0 : people.filter((person) => hasField(person, field)).length / people.length]),
) as Record<RecordField, number>

const analyzeDates = (people: Person[], event: 'birth' | 'death'): DateAnalysis => {
  const dates = people.flatMap((person) => person[event]?.date ?? [])
  return {
    available: dates.length,
    missing: people.length - dates.length,
    approximate: dates.filter(({ qualifier }) => qualifier !== 'exact' && qualifier !== 'unknown').length,
    precision: {
      day: dates.filter(({ precision }) => precision === 'day').length,
      month: dates.filter(({ precision }) => precision === 'month').length,
      year: dates.filter(({ precision }) => precision === 'year').length,
      unknown: dates.filter(({ precision }) => precision === 'unknown').length,
    },
  }
}

/** Analyze ancestor slots while keeping repeated people in coverage statistics. */
export function analyzeCompleteness(traversal: AncestorTraversal): CompletenessAnalysis {
  const knownSlots = traversal.slots.filter((slot) => slot.person)
  const uniquePeople = [...new Map(knownSlots.map(({ person }) => [person!.id, person!])).values()]
  const generations = [...traversal.slotsByGeneration.entries()].map(([generation, slots]) => {
    const people = slots.flatMap(({ person }) => person ?? [])
    const filledSlots = people.length
    return {
      generation,
      expectedSlots: 2 ** generation,
      filledSlots,
      missingSlots: slots.length - filledSlots,
      uniquePeople: new Set(people.map(({ id }) => id)).size,
      completion: filledSlots / slots.length,
      recordAvailability: availability(people),
    }
  })
  return {
    generations,
    knownSlots: knownSlots.length,
    uniquePeople: uniquePeople.length,
    recordAvailability: availability(uniquePeople),
    birthDates: analyzeDates(uniquePeople, 'birth'),
    deathDates: analyzeDates(uniquePeople, 'death'),
  }
}
