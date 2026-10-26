# AGASSU — separate environments

The public pages are now English. The visual direction uses large neutral sans-serif typography, warm white and charcoal UI, with colour coming from the 3D environment.

## Game textures

The procedural canvas tile has been removed. Materials now use original AGASSU texture sets: `world/BACKROOMS/Tiles074_2K-JPG` for pool floors, walls, columns and coping; `Tiles140_4K-JPG` for the portal floor; `baza/pol_real/Metal010_1K-JPG` for the station's metal structure. All use Color, NormalGL and Roughness maps. Material parameters follow the game's `transitMaterials.ts` and `buildBasinEnvironment.ts`, with world-scaled UVs (three metres per texture repeat).

`tools/import-game-textures.py` reads originals from the game project and produces 1024px WebP copies, without repainting or recolouring. Colour uses quality 94; normal and roughness maps are encoded losslessly after resizing. `public/media/game/materials/sources.json` records source/output hashes and paths. Nine maps total approximately 4.2 MB, with only the pool's three maps requested initially. The portal maps load on first entry.

The default **Pool** environment is a dedicated website scene: recessed pool geometry, tiled deck, coping, metal ladder, columns, archways, animated water and reflections. It is not an imported copy of an existing game level. It has fixed indoor lighting and no weather effects or weather controls.

**Portal** switches to a separate industrial environment with the game's portal model, original portal shader, and animated character. The pool geometry is hidden entirely. Game GLB assets load only on first entry into this environment. Rain uses sparse short vertical streaks; thunderstorms use denser, faster wind-driven streaks, darkened lighting and lightning; snow uses slow particles. Weather state is retained for the portal but never applied to the pool.

Both environments share a renderer and lifecycle, with separate world groups. Offscreen rendering pauses; reduced motion starts paused. Light quality disables bloom and reflection rendering, retains an opaque water surface and reduces resolution. The game source project is read-only and has not been changed.

Validation: TypeScript and production build; desktop visual review of pool and portal, rain/storm distinction and scene switching. The interactive preview is a website presentation, not the full playable game.
