import os
import shutil
from pathlib import Path

def move_all(src_dir, dst_dir):
    if not os.path.exists(src_dir):
        return
    os.makedirs(dst_dir, exist_ok=True)
    for item in os.listdir(src_dir):
        s = os.path.join(src_dir, item)
        d = os.path.join(dst_dir, item)
        if not os.path.exists(d):
            shutil.move(s, d)
    shutil.rmtree(src_dir)

def move_file(src_file, dst_dir):
    if not os.path.exists(src_file):
        return
    os.makedirs(dst_dir, exist_ok=True)
    dst_file = os.path.join(dst_dir, os.path.basename(src_file))
    if not os.path.exists(dst_file):
        shutil.move(src_file, dst_dir)

def main():
    base_dir = Path(r"C:\Projects\iphande\mobile-v1-clean")
    
    # 1. Purge stray domain files
    move_file(base_dir / "src" / "domain" / "tradeArchetypeTree.ts", r"C:\Projects\sanas-backend\app\ontology")
    if os.path.exists(base_dir / "src" / "domain"):
        shutil.rmtree(base_dir / "src" / "domain", ignore_errors=True)

    # 2. API Layer
    move_all(base_dir / "src" / "services", base_dir / "src" / "api")
    move_file(base_dir / "src" / "lib" / "supabase.ts", base_dir / "src" / "api")
    move_file(base_dir / "src" / "lib" / "mediaUpload.ts", base_dir / "src" / "api")
    if os.path.exists(base_dir / "src" / "lib"):
        shutil.rmtree(base_dir / "src" / "lib", ignore_errors=True)

    # 3. State Layer
    move_all(base_dir / "src" / "context", base_dir / "src" / "state")
    move_all(base_dir / "src" / "hooks", base_dir / "src" / "state")

    # 4. Components
    move_all(base_dir / "src" / "components", base_dir / "app" / "components")

    # 5. Config & Assets
    move_all(base_dir / "src" / "config", base_dir / "config")
    move_all(base_dir / "src" / "data", base_dir / "assets" / "data")

if __name__ == "__main__":
    main()
