# AGASSU — The Rift

Superseded by the real-time game-based presentation. See `AGASSU-3D.md`. This document records the earlier rejected concept; its generated artwork is not used by the current pages.

Implemented in the existing Eterium Vue project.

## Artwork

Generated with the built-in image_gen tool. Promotional concept art, not a gameplay screenshot.

Source: `design/agassu-rift-source.png`.
Responsive delivery: `public/media/rift/agassu-rift-800.webp`, `public/media/rift/agassu-rift-1600.webp`.

### Final generation prompt

Use case: stylized-concept. Asset type: widescreen hero artwork for AGASSU cooperative roguelike horror website, cinematic promotional concept art. A vast dark rocky chasm and a towering thin vertical tear in reality glowing pale violet, subtly branching fractured stone suspended around the rift, ground-level fog, cold moonlit charcoal rock, distant silhouettes of two anonymous explorers for scale. Premium restrained dark horror art direction, realistic matte painting, tangible rock textures and atmospheric depth. Wide 16:9 composition, rift on the right third, left half dark quiet negative space for website text. Muted graphite, silver, very restrained lavender light, no pink neon, no rainbow, no UI, no lettering, no logos, no watermark. Ominous, beautiful, mysterious, not gory. Render as high resolution landscape image.

## Content decisions

The existing project describes AGASSU as a third-person cooperative roguelike horror with progression between sessions. No additional game mechanics, launch dates, player counts, or supported device claims were invented.

The previous game and support pages were placeholders. The new pages explain the concept, show current development status, answer access questions, and provide a working copy-link action. Demo, payment, reward, and playtest actions are not offered before those services exist.

## Performance changes

Responsive WebP hero (800px: about 28 KB; 1600px: about 79 KB), native lazy loading below the fold, lazy game route, removed unused nebula setup and full-screen portal transition from the application shell, and delayed geolocation lookup until the authentication dialog is opened.

English copy follows the original website language. Existing account pages and backend integration are retained.

## Verification

- `npm run build` and `npm run typecheck` passed.
- Browser checks at desktop width and mobile widths of 390px and 320px.
- Hero assets loaded; no horizontal page overflow at tested mobile widths.
- Mobile menu, cross-page development anchor, FAQ expansion, and copy-link feedback checked.
- Sign-in dialog opened, focused the email field, and displayed local validation errors for an empty submission. No credentials or registration requests were submitted.
- Sticky header stays at the viewport top after scrolling.

## Local preview

Run `npm run build`, then `node tools/preview.cjs`. Open `http://127.0.0.1:4173`.
For development with live updates, use the existing `npm run dev` command.

Image delivery exports can be regenerated from the source using `tools/prepare-rift.py` with Python and Pillow.
