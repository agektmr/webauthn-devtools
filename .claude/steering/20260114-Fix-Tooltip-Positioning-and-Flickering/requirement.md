# Requirement - Fix InfoLink Tooltip Positioning and Flickering

## Problem
The `InfoLink` tooltip had two main issues:
1. **Stacking Context**: The tooltip was being clipped or displayed under the left `.call-list` panel because it was absolutely positioned within `.call-detail`, which didn't have a higher stacking context than its sibling.
2. **Visual Jump/Flicker**: On initial hover, the tooltip would briefly appear at a default position (top-left) before jumping to its calculated position. This was caused by asynchronous position calculation in `useEffect` and conflicting CSS transforms in animations.

## Goals
- Ensure the tooltip always appears on top of all other UI elements.
- Eliminate the visual jump/flicker on initial display.
- Ensure the tooltip doesn't block mouse events for elements underneath.
