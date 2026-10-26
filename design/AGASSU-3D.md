# AGASSU — Game-based 3D presentation

Implemented in the existing `eterium-site` project. `eterium-game/3dGame` was read only; the game project was not modified.

## Actual game assets used

Copied into `public/media/game/`:

- `portal.glb`: `public/models/assets/portal_frame_ktx2.glb`.
- `hero.glb`: the actual player, `public/models/base/JENNI.glb`.
- `idle.glb`: `public/models/base/animations/Idle.glb`.
- Tile color, normal, and roughness maps: the game's `Tiles140` maps, resized to 1024px WebP.
- Game captures: THE BASIN, start room, weather hall, entity encounter, exterior false sun.
- Local KTX2 transcoder files from the site's installed Three.js package.

`src/lib/game-showcase/portal.ts` contains the game's `makePortalSurfaceGeometry` and `makePortalVisual` functions extracted from `buildBaseArenaPortalWorld.ts`. The original energy shader is reused. The website's presentation hall and camera are composed separately, not presented as the full playable game.

## Interaction

Pointer motion and dragging change the camera. Weather buttons select rain, storm lighting, or snow. Explore mode removes the text overlay; Escape returns to the website. High/light quality and animation pause are explicit controls.

## Performance

Three.js and the presentation code are dynamically imported. Compressed GLB textures use KTX2 and meshopt. Narrow screens skip the 7 MB character and start without bloom/reflection. Pixel ratio is capped, rendering is limited to 50/30 fps, and rendering stops outside the viewport or in a hidden tab. Pause renders only when controls/assets/size change. Disposal releases GPU assets, workers, observers, and event listeners.

## Verification

Production build and Vue/TypeScript checks passed. Browser checks covered the 1280px desktop and 390px mobile layouts, actual WebGL canvas creation, portal/player rendering, weather switching, explore/return, mobile quality, and location gallery. No credentials or account mutations were used. Public game launch is not configured; this is a 3D presentation of the existing game.

## Preview

`npm run build`, then `node tools/preview.cjs`; open `http://127.0.0.1:4173`.

`npm run dev` provides the normal Vite development workflow.
