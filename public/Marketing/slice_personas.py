import os
from PIL import Image

def slice_image_into_quadrants(image_path):
    """
    Slices a 2x2 grid image into 4 separate files.
    Assumes the input image is named '1000004496.jpg' based on user context.
    """
    
    if not os.path.exists(image_path):
        print(f"Error: Could not find file '{image_path}'")
        return

    try:
        print(f"Processing {image_path}...")
        original_img = Image.open(image_path)
        width, height = original_img.size
        
        # Calculate the midpoints to split the grid perfectly in half
        mid_x = width // 2
        mid_y = height // 2

        # Define the coordinates for the 4 cuts
        # Box format: (left, upper, right, lower)
        cuts = {
            "Ned_The_Pink_Cloud.jpg":  (0, 0, mid_x, mid_y),       # Top Left
            "Lisa_The_Service_Pro.jpg": (mid_x, 0, width, mid_y),   # Top Right
            "Walt_The_Zen_Master.jpg":  (0, mid_y, mid_x, height),  # Bottom Left
            "David_The_Fresh_Start.jpg": (mid_x, mid_y, width, height) # Bottom Right
        }

        # Process and save each cut
        for filename, crop_box in cuts.items():
            # Crop the image
            persona_img = original_img.crop(crop_box)
            
            # Save the file
            persona_img.save(filename, quality=95)
            print(f"✅ Created: {filename}")

        print("\nSuccess! All 4 personas have been extracted.")

    except Exception as e:
        print(f"An error occurred: {e}")

# --- Execution ---
if __name__ == "__main__":
    # Replace this filename if yours is different
    SOURCE_FILENAME = "1000004496.jpg" 
    slice_image_into_quadrants(SOURCE_FILENAME)