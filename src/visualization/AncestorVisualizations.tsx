import { useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { AncestorSlot, AncestorTraversal } from '../genealogy/model'
import { describeLifeSpan, fanSegmentPath, layoutAncestorTree, polarPoint } from './layout'

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
    if ((event.target as Element).closest('[role="button"]')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, originX: viewport.x, originY: viewport.y }
  }
  const moveDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag.current) return
    setViewport((current) => ({ ...current, x: drag.current!.originX + event.clientX - drag.current!.x, y: drag.current!.originY + event.clientY - drag.current!.y }))
  }

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
          {treeNodes.map((node) => <g key={node.slot.slot} className={`ancestor-node ${node.slot.person ? 'known' : 'missing'} ${node.repeated ? 'repeated' : ''}`} role={node.slot.person ? 'button' : undefined} tabIndex={node.slot.person ? 0 : undefined} aria-label={`${labelFor(node.slot)}, generation ${node.slot.generation}`} onClick={() => node.slot.person && onSelect(node.slot)} onKeyDown={(event) => { if (node.slot.person && (event.key === 'Enter' || event.key === ' ')) onSelect(node.slot) }} transform={`translate(${node.x} ${node.y})`}>
            <rect x="-80" y="-30" width="160" height="60" rx="4" /><text className="node-name" textAnchor="middle" y="-4">{labelFor(node.slot).slice(0, 23)}</text><text className="node-dates" textAnchor="middle" y="16">{describeLifeSpan(node.slot)}</text>{node.repeated && <text className="repeat-mark" x="64" y="-15">↺</text>}
          </g>)}
        </g>
      </svg> : <svg className="ancestor-chart fan-chart" viewBox="0 0 600 600" aria-label="Interactive radial ancestor fan chart" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = undefined }}>
        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`} style={{ transformOrigin: '300px 300px' }}>
          {traversal.slots.filter((slot) => slot.generation > 0).map((slot) => {
            const position = slot.slot - 2 ** slot.generation
            const angle = -Math.PI / 2 + ((position + .5) / 2 ** slot.generation) * Math.PI * 2
            const point = polarPoint(48 + (slot.generation - .5) * 58, angle)
            const repeated = !!slot.personId && repeatedIds.has(slot.personId)
            return <g key={slot.slot} className={`fan-segment ${slot.person ? 'known' : 'missing'} ${repeated ? 'repeated' : ''}`} role={slot.person ? 'button' : undefined} tabIndex={slot.person ? 0 : undefined} aria-label={`${labelFor(slot)}, generation ${slot.generation}`} onClick={() => slot.person && onSelect(slot)} onKeyDown={(event) => { if (slot.person && (event.key === 'Enter' || event.key === ' ')) onSelect(slot) }}><path d={fanSegmentPath(slot.generation, position)} /><text x={point.x} y={point.y} textAnchor="middle" transform={`rotate(${angle * 180 / Math.PI + 90} ${point.x} ${point.y})`}>{slot.person ? `${slot.person.name.displayName.slice(0, 12)}${repeated ? ' ↺' : ''}` : '?'}</text></g>
          })}
          {traversal.slots[0] && <g className="fan-centre known" role="button" tabIndex={0} aria-label={`${labelFor(traversal.slots[0])}, root person`} onClick={() => onSelect(traversal.slots[0])}><circle cx="300" cy="300" r="46" /><text x="300" y="296" textAnchor="middle">{labelFor(traversal.slots[0]).slice(0, 14)}</text><text x="300" y="314" textAnchor="middle">Root</text></g>}
        </g>
      </svg>}
    </div>
    <div className="chart-legend" aria-label="Chart legend"><span><i className="known" />Known person</span><span><i className="missing" />Missing ancestor</span><span><i className="repeated">↺</i>Repeated person</span></div>
  </section>
}
