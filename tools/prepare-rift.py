from PIL import Image
from pathlib import Path
image = Image.open('design/agassu-rift-source.png').convert('RGB')
print('Original:', image.size)
for width in (800, 1600):
    # Preserve the full generated composition; no crop or artistic edits.
    height = round(image.height * width / image.width)
    output = Path(f'public/media/rift/agassu-rift-{width}.webp')
    image.resize((width, height), Image.Resampling.LANCZOS).save(output, 'WEBP', quality=82, method=6)
    print(output, output.stat().st_size)
