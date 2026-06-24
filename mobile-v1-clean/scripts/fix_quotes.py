import os
import re
from pathlib import Path

BASE_DIR = Path(r"C:\Projects\iphande\mobile-v1-clean")

def process_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return
        
    # Replace '' with ' and "" with " at the end of import strings
    # This specifically targets the mistake where {quote}{suffix} was used where both were quotes.
    # Since it only happened on import lines, we can safely just do a regex replace on import lines.
    
    lines = content.split('\n')
    new_lines = []
    changed = False
    
    for line in lines:
        if line.strip().startswith("import ") or line.strip().startswith("export ") or "require(" in line:
            # Fix double single quotes
            if "''" in line:
                line = line.replace("''", "'")
                changed = True
            # Fix double double quotes
            if '""' in line:
                line = line.replace('""', '"')
                changed = True
        new_lines.append(line)
        
    if changed:
        new_content = '\n'.join(new_lines)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Fixed quotes in {Path(file_path).relative_to(BASE_DIR)}")

def main():
    target_dirs = [BASE_DIR / "app", BASE_DIR / "src"]
    for d in target_dirs:
        if not d.exists():
            continue
        for ext in ["*.ts", "*.tsx", "*.js", "*.jsx"]:
            for f in d.rglob(ext):
                process_file(f)

if __name__ == "__main__":
    main()
