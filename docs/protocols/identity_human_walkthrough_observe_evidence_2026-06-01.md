# Identity Human Walkthrough Observe Evidence (2026-06-01)

## Stage B - Observe

### Event 001 - Runtime Boundary Reset

Command:
netstat -ano | findstr :8000

Observed:
TCP 127.0.0.1:8000 LISTENING PID 13172

Command:
tasklist /FI "PID eq 13172"

Observed:
python.exe PID 13172

Command:
taskkill /PID 13172 /F

Observed:
SUCCESS: The process with PID 13172 has been terminated.

Verification:
netstat -ano | findstr :8000

Observed:
(no output)

Conclusion:
Port 8000 cleared successfully.
Runtime returned to known clean state.

### Event 002 - API Startup From Clean Runtime

Command:
C:\Projects\iphande\api\.venv\Scripts\python.exe -m uvicorn src.main:app --app-dir C:\Projects\iphande\api --env-file C:\Projects\iphande\api\.env --reload --host 127.0.0.1 --port 8000

Observed:
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [10552] using WatchFiles
INFO:     Started server process [16452]
INFO:     Waiting for application startup.
INFO:     Application startup complete.

### Event 003 - Health Probe

Command:
curl http://127.0.0.1:8000/health

Observed:
StatusCode        : 200
StatusDescription : OK
Content           : {"status":"alive","app":"iPhande API","version":"0.1.0","environment":"development"}

Conclusion:
API responded healthy from the clean runtime start.
