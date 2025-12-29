import os
from PIL import Image, ImageDraw

def is_near_white(pixel, fuzz=50):
    """Returns True if the pixel is white or close to white."""
    # Pixel can be (R, G, B) or (R, G, B, A)
    r, g, b = pixel[:3]
    return r > (255 - fuzz) and g > (255 - fuzz) and b > (255 - fuzz)

def remove_background_and_inner_holes(img, fuzz=60):
    """
    1. Floods the outer background.
    2. Scans the top-center to find and remove the 'handle hole'.
    3. Trims the result.
    """
    img = img.convert("RGBA")
    width, height = img.size
    
    # --- STEP 1: REMOVE OUTER BACKGROUND ---
    # Flood from corners
    ImageDraw.floodfill(img, xy=(0, 0), value=(0, 0, 0, 0), thresh=fuzz)
    ImageDraw.floodfill(img, xy=(width-1, 0), value=(0, 0, 0, 0), thresh=fuzz)
    ImageDraw.floodfill(img, xy=(0, height-1), value=(0, 0, 0, 0), thresh=fuzz)
    ImageDraw.floodfill(img, xy=(width-1, height-1), value=(0, 0, 0, 0), thresh=fuzz)
    
    # --- STEP 2: REMOVE HANDLE HOLE (The "Hole Hunter") ---
    # We assume the handle is in the top 30% of the image and centered.
    # We scan down the center line. If we hit white, we zap it.
    center_x = width // 2
    scan_depth = int(height * 0.4) # Scan top 40% only (to avoid hitting the MRT text)
    
    for y in range(scan_depth):
        pixel = img.getpixel((center_x, y))
        
        # If the pixel is white (and not transparent already)
        if is_near_white(pixel, fuzz) and pixel[3] > 0:
            print(f"🎯 Found handle hole at ({center_x}, {y}). Zapping it!")
            ImageDraw.floodfill(img, xy=(center_x, y), value=(0, 0, 0, 0), thresh=fuzz)
            break # Stop after finding the first hole so we don't accidentally hit text below
            
    # --- STEP 3: TRIM ---
    bbox = img.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        return img.crop((left-1, top-1, right+1, bottom+1))
    
    return img

def generate_pwa_icons(source_file):
    if not os.path.exists(source_file):
        print(f"❌ Error: Could not find '{source_file}'.")
        return

    try:
        print(f"Opening {source_file}...")
        img = Image.open(source_file)
        
        # PROCESS: Remove Background -> Zap Handle -> Trim -> Ready
        img = remove_background_and_inner_holes(img, fuzz=60)
        print(f"✅ Background & Handle removed. New Size: {img.size}")
        
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return
    
    # Define sizes
    icons = [
        ("favicon.ico", 64, 0.0),                    
        ("apple-touch-icon-180x180.png", 180, 0.0), 
        ("pwa-192x192.png", 192, 0.0),              
        ("pwa-512x512.png", 512, 0.0),              
        ("maskable-icon-512x512.png", 512, 0.10) 
    ]

    output_dir = "pwa-assets"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"🚀 Generating Transparent Icons...")

    for filename, size, padding_pct in icons:
        # Create clear canvas
        canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        
        # Max size calculation
        max_dim = int(size * (1 - padding_pct * 2))
        
        # Aspect-Ratio Preserving Resize
        img_ratio = img.width / img.height
        if img_ratio > 1:
            new_w = max_dim
            new_h = int(max_dim / img_ratio)
        else:
            new_h = max_dim
            new_w = int(max_dim * img_ratio)
            
        resized_logo = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center Position
        x_pos = (size - new_w) // 2
        y_pos = (size - new_h) // 2
        
        canvas.paste(resized_logo, (x_pos, y_pos))
        
        save_path = os.path.join(output_dir, filename)
        if filename.endswith(".ico"):
            canvas.save(save_path, format='ICO', sizes=[(size, size)])
        else:
            canvas.save(save_path, format='PNG', optimize=True)
            
        print(f"✅ Created: {filename}")

    print("\n🎉 Done! The handle hole should now be transparent.")

if __name__ == "__main__":
    generate_pwa_icons("Logo.png")