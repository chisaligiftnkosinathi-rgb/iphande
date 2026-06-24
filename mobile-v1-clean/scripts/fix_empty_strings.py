import os
from pathlib import Path

BASE_DIR = Path(r"C:\Projects\iphande\mobile-v1-clean")

# Format: filepath: [list of 1-indexed lines that need an extra quote added where there's an unmatched quote]
FIXES = {
    "app/profile/settings.tsx": [25, 26, 27, 28, 29, 73, 74],
    "app/public/[slug].tsx": [107, 115],
    "app/quotes/new.tsx": [36, 37],
    "app/tabs/leads.tsx": [295],
    "app/tabs/timeline.tsx": [230],
    "app/tools/calculator.tsx": [69, 70, 145, 146, 147, 186, 187, 215, 216, 324],
    "config/documentTemplates.ts": [101],
    "src/api/opportunityApi.ts": [34],
    "src/api/supabase.ts": [4, 5],
}

def fix_line(line):
    # Simply find the lonely quote and make it a double quote pair.
    # Since these are places where "" was replaced by ", we just replace " with ""
    # We will do a generic replace of `"` to `""` where it makes sense, or just replace the specific broken syntax.
    
    # Common patterns: 
    # useState(") -> useState("")
    # === " -> === ""
    # !== " -> !== ""
    # : ", -> : "",
    # = "; -> = "";
    
    line = line.replace('useState(")', 'useState("")')
    line = line.replace('=== "', '=== ""')
    line = line.replace('!== "', '!== ""')
    line = line.replace('== "', '== ""')
    line = line.replace('!= "', '!= ""')
    line = line.replace('? " :', '? "" :')
    line = line.replace(': "', ': ""')
    line = line.replace('= ";', '= "";')
    line = line.replace('= ",', '= "",')
    line = line.replace(': ",', ': "",')
    line = line.replace(' || "', ' || ""')
    
    return line

def main():
    for rel_path, lines in FIXES.items():
        file_path = BASE_DIR / rel_path
        if not file_path.exists():
            continue
            
        with open(file_path, "r", encoding="utf-8") as file:
            content_lines = file.read().split('\n')
            
        changed = False
        for line_num in lines:
            idx = line_num - 1 # 0-indexed
            if idx < len(content_lines):
                original = content_lines[idx]
                content_lines[idx] = fix_line(original)
                # If basic fix_line didn't change it, we just aggressively replace " with "" if there's only one quote
                if content_lines[idx] == original:
                    if original.count('"') % 2 != 0: # Unmatched quotes
                        # Find the lonely quote (usually right before a closing parenthesis, bracket, comma, or semicolon)
                        # This is a bit hacky but it's surgically targeted to these 20 lines.
                        content_lines[idx] = original.replace('";', '"";').replace('",', '"",').replace('")', '"")').replace('"]', '""]')
                
                if content_lines[idx] != original:
                    changed = True
                    
        if changed:
            with open(file_path, "w", encoding="utf-8") as file:
                file.write('\n'.join(content_lines))
            print(f"Fixed broken empty strings in {rel_path}")

if __name__ == "__main__":
    main()
