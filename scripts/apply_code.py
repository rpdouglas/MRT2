import os

FENCE = chr(96) * 3

def patch_share_button():
    file_path = 'src/components/readings/ReadingShareButton.tsx'
    
    with open(file_path, 'r') as f:
        content = f.read()

    old_build_func = """function buildShareText(reading: DailyReading): string {
  const lines: string[] = [
    reading.title,
    `Theme: ${reading.theme}`,
    '',
    reading.body,
    '',
    `Reflection: ${reading.reflection}`,
    '',
    reading.affirmation,
  ];
  if (reading.attribution) {
    lines.push('', reading.attribution);
  }
  if (reading.goDeeper) {
    lines.push('', `${reading.goDeeper.label}: ${reading.goDeeper.url}`);
  }
  return lines.join('\\n');
}"""

    new_build_func = """function buildShareText(reading: DailyReading): string {
  const lines: string[] = [
    reading.theme,
    reading.date,
    '',
    reading.body,
    '',
    `Reflection: ${reading.reflection}`,
    '',
    reading.affirmation,
  ];
  if (reading.attribution) {
    lines.push('', reading.attribution);
  }
  if (reading.goDeeper) {
    lines.push('', `${reading.goDeeper.label}: ${reading.goDeeper.url}`);
  }
  
  lines.push('', 'www.myrecoverytoolkit.ca');
  
  return lines.join('\\n');
}"""

    updated_content = content.replace(old_build_func, new_build_func)

    with open(file_path, 'w') as f:
        f.write(updated_content)

    print("✅ src/components/readings/ReadingShareButton.tsx patched successfully.")

if __name__ == "__main__":
    patch_share_button()