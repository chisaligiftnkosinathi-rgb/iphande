import os
import glob

path = r'C:\Projects\iphande\api\src\routes\*.py'
files = glob.glob(path)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    if 'src.auth.supabase_auth' in content:
        new_content = content.replace('from src.auth.supabase_auth import get_current_user', 'from src.core.security import get_current_user')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Updated {f}")
