import os

FENCE = chr(96) * 3

def patch_reading_modal():
    file_path = 'src/components/readings/ReadingModal.tsx'
    
    with open(file_path, 'r') as f:
        content = f.read()

    # 1. Update Wrapper, Panel, and Header
    old_wrapper = """  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg overflow-hidden animate-slideUp">

        {/* Header */}
        <div className="bg-gradient-to-br from-sky-400 to-blue-600 px-5 pt-4 pb-4 relative">"""

    new_wrapper = """  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl sm:max-w-lg overflow-hidden flex flex-col animate-slideUp">

        {/* Header */}
        <div className="shrink-0 bg-gradient-to-br from-sky-400 to-blue-600 px-5 pt-8 sm:pt-4 pb-4 relative">"""

    # 2. Update Body container for flex-1 scrolling
    old_body = """        {/* Body */}
        <div className="px-5 py-4 max-h-[65vh] overflow-y-auto space-y-5">"""

    new_body = """        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 space-y-5">"""

    # Apply patches
    updated_content = content.replace(old_wrapper, new_wrapper)
    updated_content = updated_content.replace(old_body, new_body)

    with open(file_path, 'w') as f:
        f.write(updated_content)

    print("✅ ReadingModal.tsx patched for 100dvh full-screen mobile optimization.")

if __name__ == "__main__":
    patch_reading_modal()