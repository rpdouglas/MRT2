"""
PROJ-108: Persona Asset Refresh — one-off processing of the pop-art reference
set in public/personas/Persona Headshots and Angles/ into web-ready WebPs.

Crops the ~20px white-margin+black-keyline frame common to all three source
angles, then produces per-persona:
  public/personas/<name>/headshot.webp     (square, matches old 250x250 convention)
  public/personas/<name>/full_body.webp    (square-ish, front-facing full body)
  public/personas/<name>/looking_left.webp (left third of the 360 turnaround sheet)

Run once: python3 scripts/process_persona_assets.py
Then regenerate the asset index: python3 scripts/generate_asset_index.py
"""
import os
from PIL import Image

SOURCE_DIR = "public/personas/Persona Headshots and Angles"
DEST_DIR = "public/personas"
PERSONAS = ["david", "ned", "lisa", "walt", "maya", "jordan"]
BORDER = 20  # px inset to trim the white margin + black keyline frame


def load_trimmed(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    return im.crop((BORDER, BORDER, w - BORDER, h - BORDER))


def save_webp(im, path, quality=82):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, "webp", quality=quality)
    print(f"  -> {path} ({os.path.getsize(path) / 1024:.1f}KB)")


def resize_to_max(im, max_dim):
    w, h = im.size
    scale = max_dim / max(w, h)
    return im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)


def process_persona(name):
    print(f"{name}:")

    headshot_src = f"{SOURCE_DIR}/mrt_{name}_headshot.png"
    headshot = load_trimmed(headshot_src).resize((250, 250), Image.LANCZOS)
    save_webp(headshot, f"{DEST_DIR}/{name}/headshot.webp")

    front_src = f"{SOURCE_DIR}/mrt_{name}_front_view.png"
    full_body = resize_to_max(load_trimmed(front_src), 500)
    save_webp(full_body, f"{DEST_DIR}/{name}/full_body.webp")

    sheet_src = f"{SOURCE_DIR}/mrt_{name}_360_view.png"
    sheet = load_trimmed(sheet_src)
    sw, sh = sheet.size
    third = sw // 3
    left_panel = sheet.crop((0, 0, third, sh))
    looking_left = resize_to_max(left_panel, 500)
    save_webp(looking_left, f"{DEST_DIR}/{name}/looking_left.webp")


if __name__ == "__main__":
    for persona in PERSONAS:
        process_persona(persona)
    print("\nDone. Now run: python3 scripts/generate_asset_index.py")
