# Design - Fix InfoLink Tooltip Positioning and Flickering

## Approach

### 1. Escape Stacking Context with `position: fixed`
Instead of `position: absolute`, the tooltip now uses `position: fixed`. This allows it to be positioned relative to the viewport, escaping any `overflow: hidden` or stacking context limitations of its parent containers.

### 2. Synchronous Position Calculation
Replaced `React.useEffect` with `React.useLayoutEffect` in `InfoLink.tsx`. `useLayoutEffect` runs synchronously after all DOM mutations but before the browser paints, ensuring the position is calculated and applied before the tooltip is visually rendered.

### 3. Conditional Rendering
The tooltip is only rendered (`showTooltip`) when its position has been calculated (`tooltipStyle !== null`). This prevents it from appearing at a default position (0,0) before the calculation completes.

### 4. Animation Fix
Removed `transform: translateX(-50%)` from the CSS animations (`@keyframes tooltipFadeIn` and `tooltipFadeInAbove`). Since the horizontal position is now explicitly set via the `left` property in `position: fixed`, the transform was causing an incorrect offset during the animation.

## Files Modified

### `src/devtools/panel/components/InfoLink.tsx`
- Replaced `useEffect` with `useLayoutEffect`.
- Initialized `tooltipStyle` to `null`.
- Added logic to reset `tooltipStyle` on hide.
- Conditional rendering based on `tooltipStyle` presence.

### `src/devtools/panel/index.css`
- Updated `.info-tooltip` to remove absolute positioning and centering transforms.
- Increased `z-index` to `10000`.
- Added `pointer-events: none`.
- Updated keyframe animations to remove horizontal transforms.
