"""
PROJ-113 (Daily Inspirational Image) — raw-to-staged conversion.

Converts newly-dropped PNGs in .inspirational_raw/ to WebP (same
quality-80 convention as optimize_assets.py's marketing-asset pipeline) and
moves the source PNGs aside so a rerun only processes new drops.

This does NOT touch Firebase — the app already has a purpose-built Admin
Dashboard tab ("Inspirational Images", src/components/admin/
InspirationalImagesTab.tsx) that uploads to Storage and writes the
image_library Firestore doc itself, with caption/attribution/tags entered
at upload time. This script's only job is to hand that tab
appropriately-sized WebP files. Everything under .inspirational_raw/ is
gitignored (see .gitignore), so none of these directories are ever committed.

Usage:
    python3 scripts/process_inspirational_images.py [--quality 80]

Layout:
    .inspirational_raw/                 <- drop new PNG exports directly here
    .inspirational_raw/converted/       <- WebP output, ready to upload via the Admin tab
    .inspirational_raw/originals_done/  <- source PNGs moved here after a successful convert
"""
import argparse
import glob
import os
import shutil

from PIL import Image

FENCE = chr(96) * 3

RAW_DIR = ".inspirational_raw"
CONVERTED_DIR = os.path.join(RAW_DIR, "converted")
DONE_DIR = os.path.join(RAW_DIR, "originals_done")


def process_images(quality: int) -> None:
    print(f"[{FENCE}] PROJ-113: Daily Inspirational Image — raw-to-staged conversion [{FENCE}]")

    if not os.path.isdir(RAW_DIR):
        print(f"⚠️  {RAW_DIR}/ not found. Create it and drop your PNG exports there first.")
        return

    os.makedirs(CONVERTED_DIR, exist_ok=True)
    os.makedirs(DONE_DIR, exist_ok=True)

    # Only the top level — never re-descend into converted/ or originals_done/,
    # or a rerun would reprocess its own output.
    image_files = sorted(glob.glob(os.path.join(RAW_DIR, "*.png")))

    if not image_files:
        print(f"⚠️  No new PNGs found directly in {RAW_DIR}/ (already-processed files live in "
              f"{CONVERTED_DIR}/ and {DONE_DIR}/ — drop new exports at the top level to convert them).")
        return

    converted = 0
    failed = 0

    for img_path in image_files:
        filename = os.path.basename(img_path)
        name, _ = os.path.splitext(filename)
        output_path = os.path.join(CONVERTED_DIR, f"{name}.webp")

        if os.path.exists(output_path):
            print(f"⏭️  Skipping {filename} — {output_path} already exists.")
            continue

        try:
            with Image.open(img_path) as img:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(output_path, "webp", quality=quality)

            original_size = os.path.getsize(img_path) / 1024
            new_size = os.path.getsize(output_path) / 1024
            print(f"✅ {filename}: {original_size:.0f}KB -> {os.path.basename(output_path)} ({new_size:.0f}KB)")

            shutil.move(img_path, os.path.join(DONE_DIR, filename))
            converted += 1
        except Exception as e:
            print(f"❌ Failed to process {filename}: {e}")
            failed += 1

    print(f"\n🚀 Done — {converted} converted, {failed} failed.")
    if converted:
        print(f"   Upload the files in {CONVERTED_DIR}/ via the Admin Dashboard's "
              f"'Inspirational Images' tab (caption/attribution/tags optional).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quality", type=int, default=80, help="WebP quality, 0-100 (default: 80, matches optimize_assets.py)")
    args = parser.parse_args()
    process_images(args.quality)
