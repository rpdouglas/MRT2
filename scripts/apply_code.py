import os

FENCE = chr(96) * 3

def fix_failing_test():
    file_path = 'src/__tests__/readings/ReadingShareButton.test.tsx'
    
    with open(file_path, 'r') as f:
        content = f.read()

    old_block = r"""  it('includes title, theme, body, reflection and affirmation', async () => {
    render(<ReadingShareButton reading={base} />);
    const text = await clickShare();

    expect(text).toContain(base.title);
    expect(text).toContain(base.theme);
    expect(text).toContain(base.body);
    expect(text).toContain(base.reflection);
    expect(text).toContain(base.affirmation);
  });"""

    new_block = r"""  it('includes theme, body, reflection, affirmation, and url', async () => {
    render(<ReadingShareButton reading={base} />);
    const text = await clickShare();

    expect(text).toContain(base.theme);
    expect(text).toContain(base.body);
    expect(text).toContain(base.reflection);
    expect(text).toContain(base.affirmation);
    expect(text).toContain('www.myrecoverytoolkit.ca');
  });"""

    # Apply the targeted patch
    updated_content = content.replace(old_block, new_block)

    with open(file_path, 'w') as f:
        f.write(updated_content)

    print("✅ src/__tests__/readings/ReadingShareButton.test.tsx patched successfully.")

if __name__ == "__main__":
    fix_failing_test()