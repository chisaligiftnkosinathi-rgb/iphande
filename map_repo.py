import os
import sys

def map_repo(root_dir, out_file):
    exclude_dirs = {'.git', '.venv', 'node_modules', '__pycache__', '.pytest_cache', '.next'}
    
    with open(out_file, 'w', encoding='utf-8') as f:
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                # exclude common compiled files
                if file.endswith(('.pyc', '.pyo', '.pyd', '.so', '.dll', '.class')):
                    continue
                path = os.path.relpath(os.path.join(root, file), root_dir)
                f.write(path + '\n')

if __name__ == "__main__":
    map_repo(".", "repo_map.txt")
