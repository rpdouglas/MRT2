import os
from PIL import Image
import glob

FENCE = chr(96) * 3

def optimize_images():
    print(f"[{FENCE}] Initiating PROJ-24: WebP Asset Compression Engine [{FENCE}]")
    
    # Define source and destination directories
    source_dir = "public/raw_assets"
    dest_dir = "public/Marketing"
    
    if not os.path.exists(source_dir):
        print(f"⚠️ Error: {source_dir} not found. Please create it and add your images.")
        return

    os.makedirs(dest_dir, exist_ok=True)
    os.makedirs(os.path.join(dest_dir, "Screenshots"), exist_ok=True)

    # Grab all PNGs and JPGs
    search_patterns = [os.path.join(source_dir, "*.png"), os.path.join(source_dir, "*.jpg"), os.path.join(source_dir, "*.jpeg")]
    image_files = []
    for pattern in search_patterns:
        image_files.extend(glob.glob(pattern))

    if not image_files:
        print("⚠️ No images found to compress.")
        return

    for img_path in image_files:
        filename = os.path.basename(img_path)
        name, _ = os.path.splitext(filename)
        
        # Route screenshots vs standard marketing assets
        if "scn_" in name.lower():
            output_path = os.path.join(dest_dir, "Screenshots", f"{name}.webp")
        else:
            output_path = os.path.join(dest_dir, f"{name}.webp")

        try:
            with Image.open(img_path) as img:
                # Convert RGBA to RGB for JPEG compatibility before WebP compression
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                
                # Compress to WebP at 80% quality (Massive size reduction, indistinguishable visually)
                img.save(output_path, "webp", quality=80)
                
            original_size = os.path.getsize(img_path) / 1024
            new_size = os.path.getsize(output_path) / 1024
            print(f"✅ Compressed {filename}: {original_size:.1f}KB -> {new_size:.1f}KB")
        except Exception as e:
            print(f"❌ Failed to process {filename}: {e}")

    print("\n🚀 Asset Engine Compression Complete.")

if __name__ == "__main__":
    optimize_images()