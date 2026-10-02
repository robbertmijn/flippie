# Ancestor visualizations

Phase 5 adds two interactive SVG views on top of the canonical genealogy model. Neither view reads CSV columns directly.

## Tree

The ancestor tree displays every traversed slot, including gaps. Parents branch to the left of their children, repeated people use a highlighted border and a `↺` marker, and missing slots use dashed cards. The chart supports zoom, pointer panning, fit-to-view, reset, keyboard selection, and person details.

## Fan chart

The radial chart places the root at its centre and uses one complete ring per ancestor generation. Known, missing, and repeated slots use the same redundant shape and marker conventions as the tree, so colour is not the only distinction.

Labels use the full name, adapt their font size to the segment, rotate radially in outer generations, and reverse in the lower half. Birth and death information appears below the name and is reduced to years in outer rings. A movement threshold distinguishes panning from person selection even when dragging starts on a segment.

## Ahnentafel worksheet

The editable table includes every visible ancestor slot and highlights missing cells. Name, birth/death date, and birth/death place fields form a browser-session working copy; derived age-at-death and age-at-childbirth columns use available years and are explicitly approximate. The original imported file is never changed.

## Person details

Selecting a known person in either chart opens a local detail panel with their imported life events, resolved place names, notes, generation, and ancestor-slot number. Closing the panel does not change the selected root or chart viewport.

## Verification

Pure layout tests cover slot positioning, pedigree-collapse marking, and fan-segment paths. Application tests exercise tree rendering, switching to the fan chart, opening details, displaying an imported date, and closing the panel.
