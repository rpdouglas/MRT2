import os
from PIL import Image

def generate_pwa_icons(source_file):
    # 1. Verification
    if not os.path.exists(source_file):
        print(f"❌ Error: Could not find '{source_file}' in this folder.")
        print("   Make sure the file is named exactly 'Logo.png' and is in the same folder as this script.")
        return

    try:
        # Open the source image
        img = Image.open(source_file).convert("RGBA")
        print(f"ℹ️  Source Image Size: {img.size[0]}x{img.size[1]}")
    except Exception as e:
        print(f"❌ Error opening image: {e}")
        return
    
    # 2. Define the required PWA sizes
    icons = [
        ("favicon.ico", 64),                    
        ("apple-touch-icon-180x180.png", 180), 
        ("pwa-192x192.png", 192),              
        ("pwa-512x512.png", 512),              
        ("maskable-icon-512x512.png", 512)     
    ]

    # 3. Create output directory
    output_dir = "pwa-assets"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"🚀 Generating Proportional Icons from {source_file}...")

    # 4. Loop, Resize, and Center
    for filename, size in icons:
        # A. Create a blank transparent square canvas
        canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        
        # B. Calculate aspect-safe resize dimensions
        # We want the logo to fit within the square but keep its shape
        img_ratio = img.width / img.height
        
        if img_ratio > 1:
            # Width is bigger (Landscape) -> Fit to width
            new_w = size
            new_h = int(size / img_ratio)
        else:
            # Height is bigger (Portrait) -> Fit to height
            new_h = size
            new_w = int(size * img_ratio)
            
        # Resize the logo using high-quality sampling
        resized_logo = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # C. Calculate center position
        # (Canvas Width - Logo Width) / 2
        x_pos = (size - new_w) // 2
        y_pos = (size - new_h) // 2
        
        # D. Paste the resized logo onto the center of the canvas
        canvas.paste(resized_logo, (x_pos, y_pos))
        
        # Save
        save_path = os.path.join(output_dir, filename)
        
        if filename.endswith(".ico"):
            canvas.save(save_path, format='ICO', sizes=[(size, size)])
        else:
            canvas.save(save_path, format='PNG', optimize=True)
            
        print(f"✅ Created: {filename} (Canvas: {size}x{size}, Logo: {new_w}x{new_h})")

    print("\n🎉 Done! The icons are now squares with your logo centered inside.")
    print("👉 Move the files from 'pwa-assets' to your 'public/' folder.")

# --- EXECUTION ---
if __name__ == "__main__":
    generate_pwa_icons("Logo.png")