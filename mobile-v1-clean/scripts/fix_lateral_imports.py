import os
import re
from pathlib import Path

BASE_DIR = Path(r"C:\Projects\iphande\mobile-v1-clean")

def fix_components():
    comp_dir = BASE_DIR / "app" / "components"
    if not comp_dir.exists():
        return
        
    for f in comp_dir.rglob("*.tsx"):
        with open(f, "r", encoding="utf-8") as file:
            content = file.read()
            
        # Fix ../config -> ../../config
        new_content = re.sub(r"(['\"])\.\./config/", r"\g<1>../../config/", content)
        # Fix ../data -> ../../assets/data
        new_content = re.sub(r"(['\"])\.\./data/", r"\g<1>../../assets/data/", new_content)
        # Fix ../lib -> ../../src/api
        new_content = re.sub(r"(['\"])\.\./lib/", r"\g<1>../../src/api/", new_content)
        # Fix ../services -> ../../src/api
        new_content = re.sub(r"(['\"])\.\./services/", r"\g<1>../../src/api/", new_content)
        # Fix ../context -> ../../src/state
        new_content = re.sub(r"(['\"])\.\./context/", r"\g<1>../../src/state/", new_content)
        # Fix ../hooks -> ../../src/state
        new_content = re.sub(r"(['\"])\.\./hooks/", r"\g<1>../../src/state/", new_content)

        if new_content != content:
            with open(f, "w", encoding="utf-8") as file:
                file.write(new_content)
            print(f"Fixed lateral imports in {f.relative_to(BASE_DIR)}")

def fix_config():
    # Fix internal config imports that might have become ../config/api instead of ./api
    config_dir = BASE_DIR / "config"
    if not config_dir.exists():
        return
        
    for f in config_dir.rglob("*.ts"):
        with open(f, "r", encoding="utf-8") as file:
            content = file.read()
            
        new_content = re.sub(r"(['\"])\.\./config/", r"\g<1>./", content)
        
        if new_content != content:
            with open(f, "w", encoding="utf-8") as file:
                file.write(new_content)
            print(f"Fixed lateral imports in {f.relative_to(BASE_DIR)}")

if __name__ == "__main__":
    fix_components()
    fix_config()
