@echo off
cd /d "C:\Projects\iphande\api"
call .venv\Scripts\activate.bat
uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
