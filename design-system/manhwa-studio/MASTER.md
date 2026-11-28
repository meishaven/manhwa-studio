# Manhwa Studio design system

## Direction
Quiet Fluent-inspired desktop creative workspace. Default dark graphite surfaces, neutral text/borders, one restrained slate-blue accent. Avoid neon red/cyan pairings, gradients, glow, halftone textures, clipped corners, glass blur and decorative animation. Sentence case, system sans-serif, moderate consistent corners.

## Layout
Top navigation: Library / Clean / Translate / Edit / Export. Left pane: series, chapters, page list and import. Center: dominant selected-page canvas. Right pane: only settings and actions for the current task. Footer: page position, processing and save state. Advanced options use contextual disclosure.

## Interaction
Clear action labels, visible keyboard focus, tooltips and accessible names for icon-only buttons. Essential actions cannot depend on hover. Show progress and preserve cancellation. Native cursor by default; optional custom cursor disabled by default.

## Performance
Target modest Windows hardware. Avoid pointer-following DOM effects, continuous backdrop filters, ambient animations, animated gradients, unbounded image rendering and layout-triggering animations. Preserve virtualization and lazy loading. Avoid rerendering the dashboard for transient pointer movement. Respect reduced motion.

## Preservation
This is a visual redesign, not a rewrite of data or processing. Preserve Supabase connection and storage, import/download, OCR/translation providers, cleaner, lettering, editor history, source files, export paths and saved projects.

## Delivery
Implement incrementally. Run tests, type checks and production builds. Review actual Windows screenshots before calling any screen complete.
