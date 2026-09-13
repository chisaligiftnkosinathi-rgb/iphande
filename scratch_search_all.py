import os
import re

search_dirs = ["C:\\Projects\\iphande"]
patterns = re.compile(r'(?i)(SUPABASE_URL|SUPABASE_PROJECT|supabase\.co|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)')

for d in search_dirs:
    for root, dirs, files in os.walk(d):
        if 'node_modules' in dirs: dirs.remove('node_modules')
        if '.next' in dirs: dirs.remove('.next')
        if '.venv' in dirs: dirs.remove('.venv')
        if '.git' in dirs: dirs.remove('.git')
        if 'axis_clean' in dirs: dirs.remove('axis_clean') # maybe skip? it's large

        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.jsx', '.py', '.env', '.env.local', '.toml')):
                filepath = os.path.join(root, f)
                try:
                    with open(filepath, 'r', encoding='utf-8') as file:
                        for i, line in enumerate(file):
                            if patterns.search(line):
                                print(f"{filepath}:{i+1}: {line.strip()[:100]}") # Truncate to avoid printing full secrets
                except Exception:
                    pass
