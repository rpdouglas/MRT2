import os
import subprocess

# FENCE protection for writing markdown backticks within a Python script
FENCE = chr(96) * 3

def sync_functions_lockfile():
    functions_dir = 'functions'
    
    if not os.path.exists(functions_dir):
        print(f"❌ Directory '{functions_dir}' not found.")
        return

    print("🔄 Running 'npm install' in functions/ to synchronize package-lock.json...")
    
    try:
        # Executes npm install strictly within the functions directory
        subprocess.run(['npm', 'install'], cwd=functions_dir, check=True)
        print("✅ functions/package-lock.json synced successfully.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to run npm install: {e}")

if __name__ == "__main__":
    sync_functions_lockfile()
