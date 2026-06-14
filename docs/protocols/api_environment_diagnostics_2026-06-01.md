# API Environment Diagnostics (2026-06-01)

Stage: Environment baseline capture
Scope: C:\Projects\iphande\api

## Commands Run

cd C:\Projects\iphande\api
python --version
py --version
where python
where py
pip show pytest
Get-ChildItem -Force
Get-ChildItem -Force .. | Where-Object {$_.Name -match "\\.venv|venv"}

Additional command for PowerShell path resolution:
where.exe python
where.exe py

## Raw Output

python --version
Python 3.11.9

py --version
Python 3.11.9

pip show pytest
Name: pytest
Version: 9.0.3
Summary: pytest: simple powerful testing with Python
Home-page: https://docs.pytest.org/en/latest/
Author: Holger Krekel, Bruno Oliveira, Ronny Pfannschmidt, Floris Bruynooghe, Brianna Laugher, Freya Bruhin, Others (See AUTHORS)
Author-email:
License-Expression: MIT
Location: C:\Projects\iphande\api\.venv\Lib\site-packages
Requires: colorama, iniconfig, packaging, pluggy, pygments
Required-by:

Get-ChildItem -Force
Directory: C:\Projects\iphande\api
- .pytest_cache
- .venv
- data
- src
- tests
- __pycache__
- .env.example
- api_tree.md
- iphande.db
- railway.toml
- requirements.txt
- run_api.bat
- test_reflection.json
- test_timeline.py
- __init__.py

where.exe python
C:\Projects\iphande\api\.venv\Scripts\python.exe
C:\Python314\python.exe

where.exe py
C:\Windows\py.exe

Get-ChildItem -Force .. | Where-Object {$_.Name -match "\\.venv|venv"}
No matching entries at parent level.

## Notes

- In PowerShell, `where` maps to `Where-Object`; use `where.exe` for executable path lookup.
- Active project interpreter resolves to C:\Projects\iphande\api\.venv\Scripts\python.exe.
