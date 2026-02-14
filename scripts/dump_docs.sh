#!/bin/bash

# ==========================================
# 📄 DOCS DUMP GENERATOR
# ==========================================
# This script walks through the 'docs' directory (recursively)
# and dumps the content of every file found into a single text file.

OUTPUT_FILE="docs_dump.txt"
SOURCE_DIR="docs"

# Clear or create the output file
echo "# DOCS DIRECTORY DUMP" > "$OUTPUT_FILE"
echo "**Generated on:** $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Check if docs directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Directory '$SOURCE_DIR' not found."
    exit 1
fi

echo "🔄 Scanning '$SOURCE_DIR' and dumping contents..."

# Use find to list all files in docs/, handling spaces correctly
find "$SOURCE_DIR" -type f | sort | while read -r filepath; do
    echo "Processing: $filepath"
    
    # Write File Header
    echo "================================================================================" >> "$OUTPUT_FILE"
    echo "FILE: $filepath" >> "$OUTPUT_FILE"
    echo "================================================================================" >> "$OUTPUT_FILE"
    
    # Dump File Content
    cat "$filepath" >> "$OUTPUT_FILE"
    
    # Add spacing between files
    echo "" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done

echo "✅ Dump complete! Output saved to: $OUTPUT_FILE"