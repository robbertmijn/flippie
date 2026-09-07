import Papa from 'papaparse'
import type { ImportFinding } from './types'

export interface CsvSection {
  name: string
  header: string[]
  records: Record<string, string>[]
  startRow: number
}

export interface ParsedSections {
  sections: CsvSection[]
  findings: ImportFinding[]
}

const isEmptyRow = (row: string[]) => row.every((value) => value.trim() === '')

export function parseMultiSectionCsv(source: string): ParsedSections {
  const parsed = Papa.parse<string[]>(source, { skipEmptyLines: false })
  const findings: ImportFinding[] = parsed.errors.map((error) => ({
    level: 'error', code: 'csv-parse', message: error.message, row: error.row === undefined ? undefined : error.row + 1,
  }))
  const groups: Array<{ rows: string[][]; startRow: number }> = []
  let current: string[][] = []
  let startRow = 1

  parsed.data.forEach((row, index) => {
    if (isEmptyRow(row)) {
      if (current.length) groups.push({ rows: current, startRow })
      current = []
      startRow = index + 2
    } else {
      if (!current.length) startRow = index + 1
      current.push(row)
    }
  })
  if (current.length) groups.push({ rows: current, startRow })

  const sections = groups.map(({ rows, startRow: sectionStart }) => {
    const header = rows[0].map((value) => value.trim())
    const name = header[0]
    const records = rows.slice(1).map((row, recordIndex) => {
      if (row.length !== header.length) {
        findings.push({
          level: 'error', code: 'column-count', section: name,
          row: sectionStart + recordIndex + 1,
          message: `Expected ${header.length} columns but found ${row.length}.`,
        })
      }
      return Object.fromEntries(header.map((key, index) => [key, row[index] ?? '']))
    })
    return { name, header, records, startRow: sectionStart }
  })

  return { sections, findings }
}
