import os

FENCE = chr(96) * 3

FILES = {
    "public/.well-known/assetlinks.json": r"""[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "ca.myrecoverytoolkit.app",
    "sha256_cert_fingerprints": [
      "19:DD:6D:9D:6D:1A:E5:79:18:31:D6:66:3F:EB:F9:FE:34:A1:88:AB:A2:A2:98:B7:68:CC:A6:14:38:6F:78:E0"
    ]
  }
}]""",

    "firebase.json": r"""{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "headers": [
      {
        "source": "/index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "/.well-known/assetlinks.json",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}"""
}

def apply_twa_setup():
    if not os.path.exists("package.json"):
        print("⚠️  Warning: Make sure you are running this from the project root directory.")
        
    for filepath, raw_content in FILES.items():
        content = raw_content.replace('__FENCE__', FENCE)
        
        dir_path = os.path.dirname(filepath)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Created/Updated: {filepath}")

if __name__ == "__main__":
    print("🚀 Initiating TWA Cryptographic Handshake Setup...")
    apply_twa_setup()
    print("✨ Done. Ready for deployment.")