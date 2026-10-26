"""Derive website texture maps only from the local AGASSU project's originals."""
from pathlib import Path
from PIL import Image
import hashlib, json

source = Path('C:/Users/Nikita/Desktop/eterium-game/3dGame/public/textures')
output = Path('public/media/game/materials')
output.mkdir(parents=True, exist_ok=True)
sets = {
    'backrooms': 'world/BACKROOMS/Tiles133D_2K-JPG',
    'transit': 'Tiles140_4K-JPG',
    'metal': 'baza/pol_real/Metal010_1K-JPG',
}
manifest = []
for name, prefix in sets.items():
    for channel in ['Color', 'NormalGL', 'Roughness']:
        original = source / (prefix + '_' + channel + '.jpg')
        image = Image.open(original).convert('RGB')
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        destination = output / (name + '-' + channel + '.webp')
        if channel == 'Color':
            image.save(destination, 'WEBP', quality=94, method=6)
        else:
            image.save(destination, 'WEBP', lossless=True, method=6)
        manifest.append({'source': str(original), 'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest(), 'output': str(destination), 'outputSha256': hashlib.sha256(destination.read_bytes()).hexdigest(), 'size': image.size, 'bytes': destination.stat().st_size})
        print(destination.name, destination.stat().st_size)
(output / 'sources.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
