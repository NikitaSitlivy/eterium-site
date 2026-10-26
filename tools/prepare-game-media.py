from PIL import Image
from pathlib import Path
root=Path('C:/Users/Nikita/Desktop/eterium-game/3dGame')
out=Path('public/media/game')
sources={
 'basin': 'artifacts/agassu-02/exterior.png',
 'station': 'artifacts/agassu-02/room-idle.png',
 'weather': 'artifacts/weather-hall/clouds.png',
 'entity': 'artifacts/horror/agassu.png',
 'exterior': 'artifacts/weather-hall/false-sun-exterior.png',
 'tile-color': 'public/textures/Tiles140_4K-JPG_Color.jpg',
 'tile-normal': 'public/textures/Tiles140_4K-JPG_NormalGL.jpg',
 'tile-roughness': 'public/textures/Tiles140_4K-JPG_Roughness.jpg',
}
for name,file in sources.items():
 im=Image.open(root/file).convert('RGB')
 im.thumbnail((1280,800) if not name.startswith('tile') else (1024,1024))
 im.save(out/(name+'.webp'),'WEBP',quality=86)
 print(name,im.size)
