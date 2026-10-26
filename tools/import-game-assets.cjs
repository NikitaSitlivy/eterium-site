const fs=require('fs'),path=require('path'),ts=require('typescript');
const base='C:/Users/Nikita/Desktop/eterium-game/3dGame';
fs.mkdirSync('public/media/game',{recursive:true});fs.mkdirSync('src/lib/game-showcase',{recursive:true});
const assets={
 'public/models/assets/portal_frame_ktx2.glb':'portal.glb',
 'public/models/base/JENNI.glb':'hero.glb',
 'public/models/base/animations/Idle.glb':'idle.glb',
};
for(const [src,dst] of Object.entries(assets)) fs.copyFileSync(base+'/'+src,'public/media/game/'+dst);
for(const name of ['basis_transcoder.js','basis_transcoder.wasm']) fs.copyFileSync('node_modules/three/examples/jsm/libs/basis/'+name,'public/media/game/'+name);
const portal=fs.readFileSync(base+'/src/level/buildBaseArenaPortalWorld.ts','utf8'),ast=ts.createSourceFile('portal.ts',portal,ts.ScriptTarget.Latest,true);
const extracts=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&['makePortalSurfaceGeometry','makePortalVisual'].includes(n.name?.text)).map(n=>n.getText(ast));
fs.writeFileSync('src/lib/game-showcase/portal.ts', "// Extracted from AGASSU's buildBaseArenaPortalWorld.ts. Game logic is not included.\nimport * as THREE from 'three'\n\n"+extracts.join('\n\n'));
for(const name of ['hero.glb','portal.glb']) {
 const b=fs.readFileSync('public/media/game/'+name),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
 console.log(name, JSON.stringify({extensions:j.extensionsUsed,meshes:j.meshes?.map(m=>m.name),nodes:j.nodes?.slice(0,6).map(n=>({name:n.name,rotation:n.rotation})),anims:j.animations?.map(a=>a.name)}));
}
const player=fs.readFileSync(base+'/src/game/Player.ts','utf8');console.log(player.split('\n').filter(s=>/\.glb|rotation/.test(s)).slice(0,25).join('\n'));
