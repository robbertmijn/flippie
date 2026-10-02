import { useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { AncestorSlot, AncestorTraversal } from '../genealogy/model'
import { describeFanDates, describeLifeSpan, fanLabelWidth, fanNameFontSize, fanRingWidth, fanSegmentPath, fanTextRotation, layoutAncestorTree, polarPoint } from './layout'

type ViewKind = 'tree' | 'fan'

interface Props {
  traversal: AncestorTraversal
  onSelect: (slot: AncestorSlot) => void
}

interface Viewport { x: number; y: number; scale: number }

const initialViewport: Viewport = { x: 0, y: 0, scale: 1 }

function labelFor(slot: AncestorSlot) {
  return slot.person?.name.displayName ?? 'Missing ancestor'
}

export function AncestorVisualizations({ traversal, onSelect }: Props) {
  const [view, setView] = useState<ViewKind>('tree')
  const [viewport, setViewport] = useState(initialViewport)
  const drag = useRef<{ x: number; y: number; originX: number; originY: number } | undefined>(undefined)
  const dragged = useRef(false)
  const repeatedIds = useMemo(() => {
    const counts = new Map<string, number>()
    traversal.slots.forEach((slot) => { if (slot.personId) counts.set(slot.personId, (counts.get(slot.personId) ?? 0) + 1) })
    return new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id))
  }, [traversal])
  const treeNodes = useMemo(() => layoutAncestorTree(traversal.slots, traversal.maxGeneration), [traversal])
  const treeHeight = Math.max(470, 2 ** traversal.maxGeneration * 82 + 110)

  const changeZoom = (factor: number) => setViewport((current) => ({ ...current, scale: Math.min(2.5, Math.max(.45, current.scale * factor)) }))
  const fit = () => setViewport({ x: 0, y: 0, scale: view === 'tree' ? Math.min(1, 820 / treeHeight) : 1 })
  const startDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragged.current = false
    drag.current = { x: event.clientX, y: event.clientY, originX: viewport.x, originY: viewport.y }
  }
  const moveDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag.current) return
    if (Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 5) dragged.current = true
    setViewport((current) => ({ ...current, x: drag.current!.originX + event.clientX - drag.current!.x, y: drag.current!.originY + event.clientY - drag.current!.y }))
  }
  const selectUnlessDragged = (slot: AncestorSlot) => {
    if (!dragged.current) onSelect(slot)
    dragged.current = false
  }
  const ringWidth = fanRingWidth(traversal.maxGeneration)

  return <section className="visualization" aria-labelledby="visualization-title">
    <div className="visualization-heading">
      <div><p className="eyebrow">Visualization</p><h3 id="visualization-title">Explore the ancestor paths</h3></div>
      <div className="view-tabs" role="group" aria-label="Visualization type">
        <button type="button" aria-pressed={view === 'tree'} onClick={() => { setView('tree'); setViewport(initialViewport) }}>Tree</button>
        <button type="button" aria-pressed={view === 'fan'} onClick={() => { setView('fan'); setViewport(initialViewport) }}>Fan chart</button>
      </div>
    </div>
    <div className="chart-toolbar" aria-label="Chart controls">
      <button type="button" onClick={() => changeZoom(1.2)} aria-label="Zoom in">＋</button>
      <button type="button" onClick={() => changeZoom(1 / 1.2)} aria-label="Zoom out">−</button>
      <button type="button" onClick={fit}>Fit to view</button>
      <button type="button" onClick={() => setViewport(initialViewport)}>Reset view</button>
      <span>Drag the chart to pan · Select a person for details</span>
    </div>
    <div className="chart-frame">
      {view === 'tree' ? <svg className="ancestor-chart tree-chart" viewBox={`0 0 ${140 + traversal.maxGeneration * 230} ${treeHeight}`} aria-label="Interactive ancestor tree" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = undefined }}>
        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
          {treeNodes.filter((node) => node.slot.generation > 0).map((node) => {
            const child = treeNodes.find((candidate) => candidate.slot.slot === Math.floor(node.slot.slot / 2))
            return child && <path className="tree-connector" key={`line-${node.slot.slot}`} d={`M ${node.x - 80} ${node.y} C ${node.x - 120} ${node.y}, ${child.x + 120} ${child.y}, ${child.x + 80} ${child.y}`} />
          })}
          {treeNodes.map((node) => <g key={node.slot.slot} className={`ancestor-node ${node.slot.person ? 'known' : 'missing'} ${node.repeated ? 'repeated' : ''}`} role={node.slot.person ? 'button' : undefined} tabIndex={node.slot.person ? 0 : undefined} aria-label={`${labelFor(node.slot)}, generation ${node.slot.generation}`} onClick={() => node.slot.person && selectUnlessDragged(node.slot)} onKeyDown={(event) => { if (node.slot.person && (event.key === 'Enter' || event.key === ' ')) onSelect(node.slot) }} transform={`translate(${node.x} ${node.y})`}>
            <rect x="-80" y="-30" width="160" height="60" rx="4" /><text className="node-name" textAnchor="middle" y="-4">{labelFor(node.slot).slice(0, 23)}</text><text className="node-dates" textAnchor="middle" y="16">{describeLifeSpan(node.slot)}</text>{node.repeated && <text className="repeat-mark" x="64" y="-15">↺</text>}
          </g>)}
        </g>
      </svg> : <svg className="ancestor-chart fan-chart" viewBox="0 0 600 600" aria-label="Interactive radial ancestor fan chart" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = undefined }}>
        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`} style={{ transformOrigin: '300px 300px' }}>
          {traversal.slots.filter((slot) => slot.generation > 0).map((slot) => {
            const position = slot.slot - 2 ** slot.generation
            const angle = -Math.PI / 2 + ((position + .5) / 2 ** slot.generation) * Math.PI * 2
            const radius = 48 + (slot.generation - .5) * ringWidth
            const point = polarPoint(radius, angle)
            const repeated = !!slot.personId && repeatedIds.has(slot.personId)
            const name = slot.person?.name.displayName ?? '?'
            const displayName = `${name}${repeated ? ' ↺' : ''}`
            const fontSize = fanNameFontSize(displayName, slot.generation, radius)
            const labelWidth = fanLabelWidth(slot.generation, radius)
            const dates = describeFanDates(slot, slot.generation > 2)
            const rotation = fanTextRotation(slot.generation, angle)
            return <g key={slot.slot} className={`fan-segment ${slot.person ? 'known' : 'missing'} ${repeated ? 'repeated' : ''}`} role={slot.person ? 'button' : undefined} tabIndex={slot.person ? 0 : undefined} aria-label={`${labelFor(slot)}, generation ${slot.generation}`} onClick={() => slot.person && selectUnlessDragged(slot)} onKeyDown={(event) => { if (slot.person && (event.key === 'Enter' || event.key === ' ')) onSelect(slot) }}><path d={fanSegmentPath(slot.generation, position, traversal.maxGeneration)} /><text x={point.x} y={point.y - fontSize * .35} fontSize={fontSize} textAnchor="middle" transform={`rotate(${rotation} ${point.x} ${point.y})`}><tspan x={point.x} textLength={displayName.length * fontSize * .56 > labelWidth ? labelWidth : undefined} lengthAdjust="spacingAndGlyphs">{displayName}</tspan><tspan className="fan-dates" x={point.x} dy={fontSize * 1.25}>{dates}</tspan></text></g>
          })}
          {traversal.slots[0] && <g className="fan-centre known" role="button" tabIndex={0} aria-label={`${labelFor(traversal.slots[0])}, root person`} onClick={() => selectUnlessDragged(traversal.slots[0])}><circle cx="300" cy="300" r="46" /><text x="300" y="292" textAnchor="middle" textLength={labelFor(traversal.slots[0]).length > 13 ? 72 : undefined} lengthAdjust="spacingAndGlyphs">{labelFor(traversal.slots[0])}</text><text className="fan-dates" x="300" y="307" textAnchor="middle">{describeFanDates(traversal.slots[0], false)}</text><text x="300" y="321" textAnchor="middle">Root</text></g>}
        </g>
      </svg>}
    </div>
    <div className="chart-legend" aria-label="Chart legend"><span><i className="known" />Known person</span><span><i className="missing" />Missing ancestor</span><span><i className="repeated">↺</i>Repeated person</span></div>
  </section>
}
