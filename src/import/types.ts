export type FindingLevel = 'error' | 'warning' | 'information'

export interface ImportFinding {
  level: FindingLevel
  code: string
  message: string
  section?: string
  row?: number
}

export interface GenealogyDate {
  original: string
  year?: number
  month?: number
  day?: number
  precision: 'day' | 'month' | 'year' | 'unknown'
  qualifier: 'exact' | 'about' | 'before' | 'after' | 'between' | 'unknown'
}

export interface LifeEvent {
  date?: GenealogyDate
  placeId?: string
  source?: string
}

export interface Place {
  id: string
  importedId: string
  name: string
  latitude?: number
  longitude?: number
  title?: string
  type?: string
  code?: string
  enclosedById?: string
  date?: GenealogyDate
  raw: Record<string, string>
}

export interface Person {
  id: string
  importedId: string
  name: {
    given: string
    surname?: string
    prefix?: string
    callName?: string
    suffix?: string
    title?: string
    displayName: string
  }
  gender?: string
  birth?: LifeEvent
  baptism?: LifeEvent
  death?: LifeEvent
  burial?: LifeEvent
  notes?: string
  raw: Record<string, string>
}

export interface Family {
  id: string
  importedId: string
  parent1Id?: string
  parent2Id?: string
  importedParentRoles: { husbandId?: string; wifeId?: string }
  marriage?: LifeEvent
  childIds: string[]
  note?: string
  source?: string
  raw: Record<string, string>
}

export interface ImportStats {
  people: number
  places: number
  families: number
  parentChildRelationships: number
  birthDates: number
  birthPlaces: number
  deathDates: number
  deathPlaces: number
  mappedPlaces: number
  unresolvedPlaces: number
}

export interface ImportResult {
  people: Person[]
  places: Place[]
  families: Family[]
  findings: ImportFinding[]
  stats: ImportStats
}

