# AdoptIQ: instructions for Claude Code

## Design system (required)
All UI work must follow `docs/ADOPTIQ_DESIGN_SYSTEM.md` and the approved mockup `design-reference/adoptiq-approved-command-center.png`.
- Change colours, fonts and shared component styles in `css/system.css` only.
- Burnt orange is brand and primary action only, never a status. Status is teal / ochre / brick, always with a word and a shape.
- Do not add Command Center sections or new accent colours without approval.

## Product rules
- Preserve existing functionality: calculations, Supabase persistence, authentication, roles and view-only mode, exports, the demo flow, and the booking form.
- Never show fabricated metrics. Use real data or an empty state that says what is missing.
- Keep AI features off for live (non-demo) data unless the client approves.

## Working rules
- Build, then publish a preview. Push to GitHub only after LaKenya approves the preview.
- Stack: a single-page app (`index.html`, `js/adoptiq.js`), no build step. Run a syntax check with `node -e "new Function(require('fs').readFileSync('js/adoptiq.js','utf8'))"`.
