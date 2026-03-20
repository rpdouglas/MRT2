import os
from PIL import Image

def generate_pwa_icons(source_file, output_dir):
    if not os.path.exists(source_file):
        print(f"❌ Error: Could not find '{source_file}'.")
        print("Please ensure you have placed your master image at public/pwa-512x512.png")
        return

    try:
        print(f"Opening master asset: {source_file}...")
        # Load the image and ensure it has an alpha channel
        img = Image.open(source_file).convert("RGBA")
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return
    
    # Define sizes based on standard PWA manifests and your index.html
    icons = [
        ("favicon.ico", 64, 0.0),                    
        ("favicon-16x16.png", 16, 0.0),              
        ("favicon-32x32.png", 32, 0.0),              
        ("apple-touch-icon.png", 180, 0.0),          
        ("apple-touch-icon-180x180.png", 180, 0.0),  
        ("pwa-192x192.png", 192, 0.0),              
        ("pwa-512x512.png", 512, 0.0),              
        ("maskable-icon-512x512.png", 512, 0.10) # 10% padding for Android adaptive icons
    ]

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"🚀 Generating Transparent Icons into '{output_dir}/'...")

    for filename, size, padding_pct in icons:
        # Create clear canvas
        canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        
        # Max size calculation based on padding
        max_dim = int(size * (1 - padding_pct * 2))
        
        # Aspect-Ratio Preserving Resize
        img_ratio = img.width / img.height
        if img_ratio > 1:
            new_w = max_dim
            new_h = int(max_dim / img_ratio)
        else:
            new_h = max_dim
            new_w = int(max_dim * img_ratio)
            
        # Use LANCZOS for high-quality downsampling
        resized_logo = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center Position on the canvas
        x_pos = (size - new_w) // 2
        y_pos = (size - new_h) // 2
        
        canvas.paste(resized_logo, (x_pos, y_pos))
        
        save_path = os.path.join(output_dir, filename)
        
        # Save based on extension
        if filename.endswith(".ico"):
            canvas.save(save_path, format='ICO', sizes=[(size, size)])
        else:
            canvas.save(save_path, format='PNG', optimize=True)
            
        print(f"✅ Created: {filename}")

    print("\n🎉 Done! All standard PWA and favicon assets are ready for production.")

if __name__ == "__main__":
    # Pointing to your public directory
    SOURCE_IMAGE = "public/pwa-512x512.png"
    OUTPUT_DIRECTORY = "public"
    
    generate_pwa_icons(SOURCE_IMAGE, OUTPUT_DIRECTORY)