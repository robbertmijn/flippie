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
            <button className="load-button" type="button" disabled aria-describedby="foundation-note">
              <span>Load a genealogy CSV</span><b aria-hidden="true">→</b>
            </button>
            <p id="foundation-note" className="foundation-note">File import is coming in the next development phase.</p>
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
