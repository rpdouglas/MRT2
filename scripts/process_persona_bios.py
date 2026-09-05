"""
PROJ-108 follow-up: Persona Bio Cards — one-off processing of the 6 persona
bio graphics dropped in .inspirational_raw/ into web-ready WebPs.

Unlike process_persona_assets.py's headshot/full_body/looking_left sources
(a bordered pop-art reference sheet needing margin-trimming), these bio
PNGs are already finished, full-bleed 1254x1254 graphics with baked-in text
(name, tagline, quote, story, icon list) — no cropping needed, just resize
+ recompress. Resized to max 1000px (down from 1254) to cut file size while
keeping the smallest body text legible.

Source: .inspirational_raw/bio_<name>.png (gitignored, user-provided)
Output: public/personas/<name>/bio.webp

Run once: python3 scripts/process_persona_bios.py
Then regenerate the asset index: python3 scripts/generate_asset_index.py
"""
import os
from PIL import Image

SOURCE_DIR = ".inspirational_raw"
DEST_DIR = "public/personas"
PERSONAS = ["david", "ned", "lisa", "walt", "maya", "jordan"]
MAX_DIM = 1000
QUALITY = 85


def resize_to_max(im, max_dim):
    w, h = im.size
    if max(w, h) <= max_dim:
        return im
    scale = max_dim / max(w, h)
    return im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)


def process_persona(name):
    src = f"{SOURCE_DIR}/bio_{name}.png"
    if not os.path.exists(src):
        print(f"{name}: SKIPPED — {src} not found")
        return

    im = Image.open(src).convert("RGB")
    im = resize_to_max(im, MAX_DIM)

    dest_path = f"{DEST_DIR}/{name}/bio.webp"
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    im.save(dest_path, "webp", quality=QUALITY)
    print(f"{name}: {src} -> {dest_path} ({os.path.getsize(dest_path) / 1024:.1f}KB)")


if __name__ == "__main__":
    for persona in PERSONAS:
        process_persona(persona)
    print("\nDone. Now run: python3 scripts/generate_asset_index.py")
