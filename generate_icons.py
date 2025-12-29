import os
from PIL import Image

def generate_pwa_icons(source_file):
    if not os.path.exists(source_file):
        print(f"❌ Error: Could not find '{source_file}'.")
        return

    try:
        # 1. Open and convert to RGBA (Transparency support)
        img = Image.open(source_file).convert("RGBA")
        
        # 2. AUTO-TRIM: Remove transparent whitespace around the logo
        # This gets the bounding box of the non-zero regions
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            print("✂️  Trimmed transparent whitespace from source image.")
        
        print(f"ℹ️  Focused Logo Size: {img.size[0]}x{img.size[1]}")

    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return
    
    # 3. Define sizes
    # Format: (Filename, Size, Padding_Percentage)
    # We use 0.0 (0%) padding for standard icons to make them HUGE.
    # We use 0.1 (10%) for maskable to ensure it's "Safe Zone" compliant on Android.
    icons = [
        ("favicon.ico", 64, 0.0),                    
        ("apple-touch-icon-180x180.png", 180, 0.0), 
        ("pwa-192x192.png", 192, 0.0),              
        ("pwa-512x512.png", 512, 0.0),              
        ("maskable-icon-512x512.png", 512, 0.15) # Maskable needs ~15% padding to not be cut off
    ]

    output_dir = "pwa-assets"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"🚀 Generating Maximized Icons...")

    for filename, size, padding_pct in icons:
        # Create clear canvas
        canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        
        # Calculate max allowable size inside the canvas (accounting for padding)
        max_dim = int(size * (1 - padding_pct * 2))
        
        # Calculate aspect-safe resize
        img_ratio = img.width / img.height
        
        if img_ratio > 1:
            # Width is bigger (Landscape)
            new_w = max_dim
            new_h = int(max_dim / img_ratio)
        else:
            # Height is bigger (Portrait)
            new_h = max_dim
            new_w = int(max_dim * img_ratio)
            
        # Resize trimmed logo
        resized_logo = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center Position
        x_pos = (size - new_w) // 2
        y_pos = (size - new_h) // 2
        
        # Paste
        canvas.paste(resized_logo, (x_pos, y_pos))
        
        save_path = os.path.join(output_dir, filename)
        if filename.endswith(".ico"):
            canvas.save(save_path, format='ICO', sizes=[(size, size)])
        else:
            canvas.save(save_path, format='PNG', optimize=True)
            
        print(f"✅ Created: {filename}")

    print("\n🎉 Done! Icons are now maximized (trimmed of whitespace).")

if __name__ == "__main__":
    generate_pwa_icons("Logo.png")