import { useMemo, useRef, useState } from 'react'
import { analyzeCompleteness } from './analysis/completeness'
import { buildGenealogyIndexes, traverseAncestors } from './genealogy/model'
import { importGenealogyCsv } from './import/importGenealogy'
import type { ImportResult } from './import/types'

const features = [
  ['Branching paths', 'Explore ancestors in trees and radial fan charts.'],
  ['Clearer records', 'See gaps in dates, places, and generations at a glance.'],
  ['Print-ready', 'Create considered charts for sharing and publication.'],
]

function TreeMark() {
  return (
    <svg aria-hidden="true" className="tree-mark" viewBox="0 0 56 56">
      <path d="M28 47V25M28 31 15 20M28 31l13-11M15 20V10M15 20H7M41 20V10M41 20h8" />
      <circle cx="28" cy="47" r="4" /><circle cx="15" cy="10" r="4" />
      <circle cx="7" cy="20" r="4" /><circle cx="41" cy="10" r="4" />
      <circle cx="49" cy="20" r="4" />
    </svg>
  )
}

export function App() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<ImportResult>()
  const [fileName, setFileName] = useState('')
  const [rootPersonId, setRootPersonId] = useState('')
  const [personSearch, setPersonSearch] = useState('')
  const [generationCount, setGenerationCount] = useState(4)

  const matchingPeople = useMemo(() => {
    const query = personSearch.trim().toLocaleLowerCase()
    return (result?.people ?? [])
      .filter((person) => !query || person.name.displayName.toLocaleLowerCase().includes(query))
      .sort((left, right) => left.name.displayName.localeCompare(right.name.displayName))
      .slice(0, 20)
  }, [personSearch, result])
  const analysis = useMemo(() => {
    if (!result || !rootPersonId) return undefined
    return analyzeCompleteness(traverseAncestors(buildGenealogyIndexes(result), rootPersonId, generationCount))
  }, [generationCount, result, rootPersonId])

  const loadFile = async (file: File | undefined) => {
    if (!file) return
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
    setResult(importGenealogyCsv(source))
    setFileName(file.name)
    setRootPersonId('')
    setPersonSearch('')
  }

  const clearData = () => {
    setResult(undefined)
    setFileName('')
    setRootPersonId('')
    setPersonSearch('')
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Flippie home"><TreeMark />Flippie</a>
        <span className="privacy-chip"><span /> Private by design</span>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Your history · Your device</p>
            <h1>Every family has<br />a story worth <em>seeing.</em></h1>
            <p className="intro">Turn your genealogy records into meaningful trees, maps, and insights—without your family data ever leaving your browser.</p>
            <input ref={fileInput} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={(event) => void loadFile(event.target.files?.[0])} />
            <button className="load-button" type="button" onClick={() => fileInput.current?.click()} aria-describedby="local-file-note">
              <span>Load a genealogy CSV</span><b aria-hidden="true">→</b>
            </button>
            <p id="local-file-note" className="foundation-note">Your file is read locally and never uploaded.</p>
          </div>

          <div className="hero-art" aria-label="An abstract family tree illustration">
            <span className="leaf leaf-one" /><span className="leaf leaf-two" /><span className="leaf leaf-three" />
            <svg viewBox="0 0 560 500" role="img">
              <title>An abstract tree connecting family generations</title>
              <g className="branches">
                <path d="M280 448V330M280 365C235 320 205 291 170 230M280 355c53-42 79-75 113-134M170 230c-30-27-48-57-61-94M170 230c1-51 14-88 37-122M393 221c-3-45-22-77-50-105M393 221c31-31 52-59 60-92" />
              </g>
              <g className="portrait-nodes">
                <g transform="translate(280 335)"><circle r="42"/><path d="M-18 19c5-16 31-16 36 0M-11-5a11 11 0 1 0 22 0 11 11 0 0 0-22 0"/></g>
                <g transform="translate(170 230)"><circle r="35"/><path d="M-15 16c5-13 25-13 30 0M-9-4a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/></g>
                <g transform="translate(393 221)"><circle r="35"/><path d="M-15 16c5-13 25-13 30 0M-9-4a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/></g>
                <g transform="translate(109 136)"><circle r="28"/><path d="M-12 13c4-11 20-11 24 0M-8-3a8 8 0 1 0 16 0 8 8 0 0 0-16 0"/></g>
                <g transform="translate(207 108)"><circle r="28"/><path d="M-12 13c4-11 20-11 24 0M-8-3a8 8 0 1 0 16 0 8 8 0 0 0-16 0"/></g>
                <g transform="translate(343 116)"><circle r="28"/><path d="M-12 13c4-11 20-11 24 0M-8-3a8 8 0 1 0 16 0 8 8 0 0 0-16 0"/></g>
                <g transform="translate(453 129)"><circle r="28"/><path d="M-12 13c4-11 20-11 24 0M-8-3a8 8 0 1 0 16 0 8 8 0 0 0-16 0"/></g>
              </g>
            </svg>
          </div>
        </section>

        {result && <section className="import-report" aria-labelledby="import-title" aria-live="polite">
          <div className="report-heading">
            <div><p className="eyebrow">Import complete</p><h2 id="import-title">Your file is ready</h2><p><strong>{fileName}</strong> was processed on this device.</p></div>
            <div className="report-actions"><button type="button" onClick={() => fileInput.current?.click()}>Replace file</button><button type="button" onClick={clearData}>Clear data</button></div>
          </div>
          <dl className="stats-grid">
            {Object.entries({ People: result.stats.people, Places: result.stats.places, Families: result.stats.families, 'Parent–child links': result.stats.parentChildRelationships, 'Birth dates': result.stats.birthDates, 'Birth places': result.stats.birthPlaces, 'Death dates': result.stats.deathDates, 'Death places': result.stats.deathPlaces, 'Mapped places': result.stats.mappedPlaces, 'Unresolved places': result.stats.unresolvedPlaces }).map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}
          </dl>
          <div className="finding-summary">
            {(['error', 'warning', 'information'] as const).map((level) => <span className={`finding-${level}`} key={level}><b>{result.findings.filter((finding) => finding.level === level).length}</b> {level === 'information' ? 'notes' : `${level}s`}</span>)}
          </div>
          {result.findings.length > 0 && <details><summary>View import messages</summary><ul>{result.findings.map((finding, index) => <li key={`${finding.code}-${index}`}><strong>{finding.level}:</strong> {finding.message}</li>)}</ul></details>}
        </section>}

        {result && <section className="analysis-workspace" aria-labelledby="analysis-title">
          <div className="analysis-heading">
            <div><p className="eyebrow">Core analysis</p><h2 id="analysis-title">Choose whose ancestry to explore</h2></div>
            {analysis && <label className="generation-control">Generations
              <select value={generationCount} onChange={(event) => setGenerationCount(Number(event.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count}</option>)}
              </select>
            </label>}
          </div>
          <label className="person-search">Search people
            <input type="search" value={personSearch} onChange={(event) => setPersonSearch(event.target.value)} placeholder="Type a name" />
          </label>
          <div className="person-results" aria-label="People matching search">
            {matchingPeople.map((person) => <button className={person.id === rootPersonId ? 'selected' : ''} type="button" key={person.id} onClick={() => { setRootPersonId(person.id); setPersonSearch(person.name.displayName) }} aria-pressed={person.id === rootPersonId}>{person.name.displayName}</button>)}
            {matchingPeople.length === 0 && <p>No matching people found.</p>}
          </div>

          {analysis && <div className="completeness-dashboard">
            <div className="dashboard-summary"><div><span>Known ancestor slots</span><strong>{analysis.knownSlots}</strong></div><div><span>Unique people</span><strong>{analysis.uniquePeople}</strong></div><div><span>Birth dates</span><strong>{Math.round(analysis.recordAvailability.birthDate * 100)}%</strong></div><div><span>Death places</span><strong>{Math.round(analysis.recordAvailability.deathPlace * 100)}%</strong></div></div>
            <div className="table-scroll"><table>
              <caption>Ancestor coverage by generation</caption>
              <thead><tr><th>Generation</th><th>Expected</th><th>Known slots</th><th>Missing</th><th>Unique people</th><th>Coverage</th></tr></thead>
              <tbody>{analysis.generations.map((generation) => <tr key={generation.generation}><th>{generation.generation}</th><td>{generation.expectedSlots}</td><td>{generation.filledSlots}</td><td>{generation.missingSlots}</td><td>{generation.uniquePeople}</td><td><span className="coverage-bar"><i style={{ width: `${generation.completion * 100}%` }} /></span> {Math.round(generation.completion * 100)}%</td></tr>)}</tbody>
            </table></div>
            <div className="table-scroll"><table>
              <caption>Record completeness by generation</caption>
              <thead><tr><th>Generation</th><th>Birth date</th><th>Birth place</th><th>Death date</th><th>Death place</th></tr></thead>
              <tbody>{analysis.generations.map((generation) => <tr key={generation.generation}><th>{generation.generation}</th>{(['birthDate', 'birthPlace', 'deathDate', 'deathPlace'] as const).map((field) => <td key={field}>{Math.round(generation.recordAvailability[field] * 100)}%</td>)}</tr>)}</tbody>
            </table></div>
            <div className="date-precision"><h3>Date precision across unique people</h3>{([['Birth', analysis.birthDates], ['Death', analysis.deathDates]] as const).map(([label, dates]) => <article key={label}><h4>{label} dates</h4><p>{dates.available} available · {dates.missing} missing · {dates.approximate} approximate</p><dl><div><dt>Full date</dt><dd>{dates.precision.day}</dd></div><div><dt>Month/year</dt><dd>{dates.precision.month}</dd></div><div><dt>Year only</dt><dd>{dates.precision.year}</dd></div><div><dt>Unrecognized</dt><dd>{dates.precision.unknown}</dd></div></dl></article>)}</div>
          </div>}
        </section>}

        <section className="privacy-card" aria-labelledby="privacy-title">
          <div className="lock-icon" aria-hidden="true">⌂</div>
          <div><h2 id="privacy-title">What stays in the family, stays on your device.</h2>
            <p>Your genealogy file is processed locally in your browser. It is not uploaded to this website or stored in an online genealogy database.</p></div>
        </section>

        <section className="feature-grid" aria-label="What you will be able to do">
          {features.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{copy}</p></article>)}
        </section>
      </main>

      <footer><span>Built for curious families.</span><span>No accounts · No tracking · No uploads</span></footer>
    </div>
  )
}
