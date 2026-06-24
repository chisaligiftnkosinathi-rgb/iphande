import os
import re
from pathlib import Path

BASE_DIR = Path(r"C:\Projects\iphande\mobile-v1-clean")

# Mapping of old absolute paths to new absolute paths
MAPPINGS = {
    "src/context": "src/state",
    "src/hooks": "src/state",
    "src/services": "src/api",
    "src/lib": "src/api",
    "src/components": "app/components",
    "src/config": "config",
    "src/data": "assets/data",
}

def resolve_import(file_path, import_str):
    if not import_str.startswith("."):
        return import_str # Not a relative import
    
    file_dir = file_path.parent
    parts = file_dir.parts
    import_parts = import_str.split("/")
    
    current_parts = list(parts)
    for p in import_parts:
        if p == ".":
            continue
        elif p == "..":
            if len(current_parts) > len(BASE_DIR.parts):
                current_parts.pop()
        else:
            current_parts.append(p)
            
    old_abs_path = Path(*current_parts)
    
    try:
        rel_to_base = old_abs_path.relative_to(BASE_DIR).as_posix()
    except ValueError:
        return import_str 
        
    for old_prefix, new_prefix in MAPPINGS.items():
        if rel_to_base == old_prefix or rel_to_base.startswith(old_prefix + "/"):
            new_rel_to_base = rel_to_base.replace(old_prefix, new_prefix, 1)
            new_abs_path = BASE_DIR / new_rel_to_base
            
            try:
                new_import = os.path.relpath(new_abs_path, file_dir)
                new_import = new_import.replace("\\", "/")
                if not new_import.startswith("."):
                    new_import = "./" + new_import
                return new_import
            except ValueError:
                pass
                
    return import_str

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    def replacer(match):
        prefix = match.group(1)
        quote = match.group(2)
        import_str = match.group(3)
        suffix = match.group(4)
        
        new_import_str = resolve_import(file_path, import_str)
        return f"{prefix}{quote}{new_import_str}{quote}{suffix}"
        
    pattern = re.compile(r"((?:from\s+|require\(|import\())\s*(['\"])(.*?)(['\"])")
    new_content = pattern.sub(replacer, content)
    
    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {file_path.relative_to(BASE_DIR)}")

def main():
    for ext in ["*.ts", "*.tsx", "*.js", "*.jsx"]:
        for f in BASE_DIR.rglob(ext):
            if "node_modules" in f.parts or ".expo" in f.parts:
                continue
            process_file(f)

if __name__ == "__main__":
    main()
