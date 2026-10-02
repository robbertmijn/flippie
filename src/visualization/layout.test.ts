import { describe, expect, it } from 'vitest'
import type { AncestorSlot } from '../genealogy/model'
import { fanSegmentPath, layoutAncestorTree } from './layout'

describe('visualization layout', () => {
  it('lays out every ancestor slot and marks later repeated people', () => {
    const slots = [
      { slot: 1, generation: 0, path: [], personId: 'root', cycle: false },
      { slot: 2, generation: 1, path: ['parent1'], personId: 'repeated', cycle: false },
      { slot: 3, generation: 1, path: ['parent2'], personId: 'repeated', cycle: false },
    ] as AncestorSlot[]
    const nodes = layoutAncestorTree(slots, 1)
    expect(nodes).toHaveLength(3)
    expect(nodes[1].repeated).toBe(false)
    expect(nodes[2].repeated).toBe(true)
    expect(nodes[1].y).not.toBe(nodes[2].y)
  })

  it('creates closed SVG paths for radial fan segments', () => {
    expect(fanSegmentPath(2, 1)).toMatch(/^M .* Z$/)
    expect(fanSegmentPath(2, 1)).not.toBe(fanSegmentPath(2, 2))
  })
})
