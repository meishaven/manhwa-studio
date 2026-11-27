# Manhwa Studio UI skills

Use Fluent 2 as the single active design system. Use Anthropic Frontend Design for visual quality, UI/UX Pro Max for design and UX decisions, Vercel React Best Practices for performance-sensitive React work, and Vercel Web Design Guidelines for final review. Carbon is a comparison-only alternative and must not be mixed into Fluent 2 screens.

## Project constraints
- Preserve Supabase, importing, OCR, translation, cleaning, lettering, image editing, exporting, persistence and keyboard shortcuts.
- Keep image-processing/data logic separate from visual-shell changes.
- Native cursor by default; custom cursor optional and opt-in.
- Target modest Windows hardware: avoid continuous blur, ambient animation, expensive shadows and pointer-driven rerenders.
- The image canvas is primary; keep left navigation for library/pages and right pane contextual.

## Sources
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/anthropics/skills/tree/main/skills/frontend-design
- https://github.com/hidekatsu-izuno/design-system-skills/tree/main/skills/fluent-2
- https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
- https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
