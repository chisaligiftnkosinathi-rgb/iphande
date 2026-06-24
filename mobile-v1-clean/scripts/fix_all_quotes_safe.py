import os
import re
from pathlib import Path

BASE_DIR = Path(r"C:\Projects\iphande\mobile-v1-clean")

def fix_quotes(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
            
        # specifically target ''; or ""; or '', or "", or ''\n or ""\n
        # Regex to match two quotes followed by optional semicolon or comma and whitespace
        new_content = re.sub(r"''([;,]?\s*)$", r"'\g<1>", content, flags=re.MULTILINE)
        new_content = re.sub(r'""([;,]?\s*)$', r'"\g<1>', new_content, flags=re.MULTILINE)
        
        # also check for '' or "" followed immediately by newline
        new_content = re.sub(r"''\n", r"'\n", new_content)
        new_content = re.sub(r'""\n', r'"\n', new_content)

        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(new_content)
            print(f"Cleaned quotes in {file_path.relative_to(BASE_DIR)}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def main():
    target_dirs = [
        BASE_DIR / "app", 
        BASE_DIR / "src", 
        BASE_DIR / "config", 
        BASE_DIR / "assets"
    ]
    for root_file in BASE_DIR.glob("*.ts"):
        fix_quotes(root_file)
        
    for d in target_dirs:
        if not d.exists():
            continue
        for ext in ["*.ts", "*.tsx", "*.js", "*.jsx"]:
            for f in d.rglob(ext):
                fix_quotes(f)

if __name__ == "__main__":
    main()
