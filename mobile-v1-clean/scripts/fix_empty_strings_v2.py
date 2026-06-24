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
    # Double quotes
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
    
    # Single quotes
    line = line.replace("useState(')", "useState('')")
    line = line.replace("=== '", "=== ''")
    line = line.replace("!== '", "!== ''")
    line = line.replace("== '", "== ''")
    line = line.replace("!= '", "!= ''")
    line = line.replace("? ' :", "? '' :")
    line = line.replace(": '", ": ''")
    line = line.replace("= ';", "= '';")
    line = line.replace("= ',", "= '',")
    line = line.replace(": ',", ": '',")
    line = line.replace(" || ',", " || '',")
    line = line.replace(" || '", " || ''")
    
    return line

def main():
    for rel_path, lines in FIXES.items():
        file_path = BASE_DIR / rel_path
        if not file_path.exists():
            print(f"Skipping {file_path}")
            continue
            
        with open(file_path, "r", encoding="utf-8") as file:
            content_lines = file.read().split('\n')
            
        changed = False
        for line_num in lines:
            idx = line_num - 1 # 0-indexed
            if idx < len(content_lines):
                original = content_lines[idx]
                content_lines[idx] = fix_line(original)
                if content_lines[idx] == original:
                    # Generic aggressive fix for the end of the line if simple replacements failed
                    # Single quotes
                    if original.count("'") % 2 != 0:
                        content_lines[idx] = original.replace("',", "'',").replace("';", "'';").replace("')", "'')").replace("']", "'']")
                    # Double quotes
                    if original.count('"') % 2 != 0:
                        content_lines[idx] = original.replace('",', '"",').replace('";', '"";').replace('")', '"")').replace('"]', '""]')
                
                if content_lines[idx] != original:
                    changed = True
                    
        if changed:
            with open(file_path, "w", encoding="utf-8") as file:
                file.write('\n'.join(content_lines))
            print(f"Fixed broken empty strings in {rel_path}")

if __name__ == "__main__":
    main()
