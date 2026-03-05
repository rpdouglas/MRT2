# scripts/optimize_screenshots.py
import os
from PIL import Image

# Setup paths
INPUT_DIR = "_raw_screenshots"
# Let's put them in the docs-site public folder for the user guide
OUTPUT_DIR = "docs-site/public/screenshots"
TARGET_WIDTH = 800 # Perfect width for reading in a documentation site

def optimize_images():
    if not os.path.exists(INPUT_DIR):
        print(f"❌ Error: Please create a '{INPUT_DIR}' folder and put your raw images in it.")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    processed_count = 0

    for filename in os.listdir(INPUT_DIR):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.heic')):
            input_path = os.path.join(INPUT_DIR, filename)
            
            # Change extension to .webp
            name_without_ext = os.path.splitext(filename)[0]
            # Replace spaces with hyphens for web-safe URLs
            safe_name = name_without_ext.replace(" ", "-").lower()
            output_path = os.path.join(OUTPUT_DIR, f"{safe_name}.webp")

            try:
                with Image.open(input_path) as img:
                    # Convert to RGB if necessary (e.g., PNG with alpha)
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")

                    # Resize proportionally if it's larger than our target width
                    if img.width > TARGET_WIDTH:
                        ratio = TARGET_WIDTH / float(img.width)
                        new_height = int(float(img.height) * float(ratio))
                        img = img.resize((TARGET_WIDTH, new_height), Image.Resampling.LANCZOS)

                    # Save as WebP with 80% quality (massive file size reduction, invisible to human eye)
                    img.save(output_path, "webp", quality=80)
                    
                    # Calculate savings
                    orig_size = os.path.getsize(input_path) / 1024
                    new_size = os.path.getsize(output_path) / 1024
                    print(f"✅ {safe_name}.webp | {orig_size:.1f}KB -> {new_size:.1f}KB")
                    
                    processed_count += 1
            except Exception as e:
                print(f"❌ Failed to process {filename}: {e}")

    print(f"\n✨ Done! {processed_count} screenshots optimized and moved to {OUTPUT_DIR}")

if __name__ == "__main__":
    # Ensure Pillow is installed
    try:
        import PIL
    except ImportError:
        print("Please install the Pillow library first: pip install Pillow")
        exit(1)
        
    optimize_images()