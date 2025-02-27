#!/bin/bash

# Set the root directory of your project
ROOT_DIR="/Users/rahultamatta/Documents/GitHub/smitoxProduction/client/src"

# Find all .js files and rename them to .jsx
find "$ROOT_DIR" -type f -name "*.js" | while read -r file; do
    mv "$file" "${file%.js}.jsx"
done

# Update import statements in all .js and .jsx files
find "$ROOT_DIR" -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r file; do
    sed -i '' 's/\(import.*from.*\)\(\.js\)\(".*\)/\1.jsx\3/g' "$file"
    sed -i '' 's/\(require(.*\)\(\.js\)\()\)/\1.jsx\3/g' "$file"
done

