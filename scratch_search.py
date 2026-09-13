import os
import re

search_dirs = [
    "iphande-v1-core-app",
    "app",
    "mobile-app"
]
patterns = re.compile(r'supabase\.auth\.signUp|supabase\.auth\.signInWithPassword|supabase\.auth\.getSession|supabase\.auth\.getUser|supabase\.auth\.onAuthStateChange|/api/v1/profiles/bootstrap|/api/v1/profiles|createClient|supabaseUrl|SUPABASE_URL|supabase\.co')

for d in search_dirs:
    if not os.path.exists(d): continue
    for root, dirs, files in os.walk(d):
        if 'node_modules' in dirs: dirs.remove('node_modules')
        if '.next' in dirs: dirs.remove('.next')
        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, f)
                try:
                    with open(filepath, 'r', encoding='utf-8') as file:
                        for i, line in enumerate(file):
                            if patterns.search(line):
                                print(f"{filepath}:{i+1}: {line.strip()}")
                except Exception:
                    pass
