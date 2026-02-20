import os

def update_file(filepath):
    if not os.path.exists(filepath):
        print(f"⚠️ File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    old_tagline = """<h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.5rem] font-bold leading-tight xl:whitespace-nowrap">
                    Recovery is a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-emerald-200">High-Performance</span> Lifestyle.
                </h2>"""

    new_tagline = """<h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.5rem] font-bold leading-tight lg:whitespace-nowrap tracking-tight">
                    The safest place to do the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Hardest Work.</span>
                </h2>"""

    if old_tagline in content:
        content = content.replace(old_tagline, new_tagline)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Successfully updated tagline in: {filepath}")
    else:
        print(f"⚠️ Could not find the old tagline in {filepath}. It may have already been updated.")

if __name__ == "__main__":
    update_file("src/pages/Login.tsx")