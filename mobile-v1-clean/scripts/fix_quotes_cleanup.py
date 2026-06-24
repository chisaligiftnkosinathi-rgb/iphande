import os
import re
from pathlib import Path

BASE_DIR = Path(r"C:\Projects\iphande\mobile-v1-clean")

def fix_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        new_content = content
        # Fix triple quotes
        new_content = new_content.replace("'''", "''")
        new_content = new_content.replace('"""', '""')
        
        # Fix quadruples
        new_content = new_content.replace("''''", "''")
        new_content = new_content.replace('""""', '""')
        
        # Fix unneeded double-quotes before or after words (like ''city')
        new_content = re.sub(r"''(\w+)", r"'\1", new_content)
        new_content = re.sub(r'""(\w+)', r'"\1', new_content)
        
        new_content = re.sub(r"(\w+)''", r"\1'", new_content)
        new_content = re.sub(r'(\w+)""', r'\1"', new_content)
        
        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Cleaned over-replaced quotes in {file_path.relative_to(BASE_DIR)}")
    except Exception as e:
        print(f"Error: {e}")

def main():
    target_dirs = [BASE_DIR / "app", BASE_DIR / "src", BASE_DIR / "config"]
    for d in target_dirs:
        if d.exists():
            for ext in ["*.tsx", "*.ts"]:
                for f in d.rglob(ext):
                    fix_file(f)

if __name__ == "__main__":
    main()
