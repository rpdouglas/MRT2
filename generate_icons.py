import os
from PIL import Image

def generate_pwa_icons(source_file):
    # 1. Verification
    if not os.path.exists(source_file):
        print(f"❌ Error: Could not find '{source_file}' in this folder.")
        print("   Make sure the file is named exactly 'Logo.png' and is in the same folder as this script.")
        return

    # 2. Open the source image
    # .convert("RGBA") ensures we keep the transparent background if it exists
    try:
        img = Image.open(source_file).convert("RGBA")
    except Exception as e:
        print(f"❌ Error opening image: {e}")
        return
    
    # 3. Define the required PWA sizes for your Vite config
    icons = [
        ("favicon.ico", 64, 64),                    # Browser Tab
        ("apple-touch-icon-180x180.png", 180, 180), # iPhone Home Screen
        ("pwa-192x192.png", 192, 192),              # Android / Windows Taskbar
        ("pwa-512x512.png", 512, 512),              # Splash Screen
        ("maskable-icon-512x512.png", 512, 512)     # Android Adaptive (Safe Area)
    ]

    # 4. Create output directory
    output_dir = "pwa-assets"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"🚀 Generating icons from {source_file}...")

    # 5. Loop and Resize
    for filename, w, h in icons:
        # Resize using LANCZOS for high-quality downscaling
        resized_img = img.resize((w, h), Image.Resampling.LANCZOS)
        
        save_path = os.path.join(output_dir, filename)
        
        if filename.endswith(".ico"):
            resized_img.save(save_path, format='ICO', sizes=[(w, h)])
        else:
            resized_img.save(save_path, format='PNG', optimize=True)
            
        print(f"✅ Created: {filename}")

    print("\n🎉 Done! Copy the files inside 'pwa-assets' into your project's 'public/' folder.")

# --- EXECUTION ---
if __name__ == "__main__":
    # Updated to look for your specific file
    generate_pwa_icons("Logo.png")