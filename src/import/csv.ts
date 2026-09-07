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

function parseCsvRows(source: string): { rows: string[][]; findings: ImportFinding[] } {
  const rows: string[][] = []
  const findings: ImportFinding[] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let afterQuote = false
  let line = 1

  const finishField = () => { row.push(field); field = ''; afterQuote = false }
  const finishRow = () => { finishField(); rows.push(row); row = [] }

  for (let index = source.charCodeAt(0) === 0xfeff ? 1 : 0; index < source.length; index += 1) {
    const character = source[index]
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') { field += '"'; index += 1 }
        else { quoted = false; afterQuote = true }
      } else {
        field += character
        if (character === '\n') line += 1
      }
      continue
    }
    if (character === '"' && field === '' && !afterQuote) { quoted = true; continue }
    if (character === ',') { finishField(); continue }
    if (character === '\n' || character === '\r') {
      if (character === '\r' && source[index + 1] === '\n') index += 1
      finishRow(); line += 1; continue
    }
    if (afterQuote && character !== ' ' && character !== '\t') {
      findings.push({ level: 'error', code: 'csv-parse', row: line, message: 'Unexpected character after a closing quote.' })
    }
    field += character
  }
  if (quoted) findings.push({ level: 'error', code: 'csv-parse', row: line, message: 'Quoted field was not closed.' })
  if (field !== '' || row.length > 0 || (source.length > 0 && !/[\r\n]$/.test(source))) finishRow()
  return { rows, findings }
}

export function parseMultiSectionCsv(source: string): ParsedSections {
  const parsed = parseCsvRows(source)
  const findings = [...parsed.findings]
  const groups: Array<{ rows: string[][]; startRow: number }> = []
  let current: string[][] = []
  let startRow = 1

  parsed.rows.forEach((row, index) => {
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
