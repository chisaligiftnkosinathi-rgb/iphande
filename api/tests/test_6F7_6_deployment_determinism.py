import os
import subprocess
import tempfile
import time
import pytest
import sys

def get_base_env():
    """Reads the current .env and constructs a baseline environment dict."""
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    # Read the local .env to inject into subprocesses, so we don't rely on implicit Pydantic loading
    # We want to strictly control what the subprocess sees.
    env_file = os.path.join(env["PYTHONPATH"], ".env")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    # Strip surrounding quotes if they exist
                    if val.startswith("'") and val.endswith("'"):
                        val = val[1:-1]
                    elif val.startswith('"') and val.endswith('"'):
                        val = val[1:-1]
                    env[key.strip()] = val.strip()
    return env

def test_missing_keys_fails_closed():
    """Test that missing GLOBAL_IT_PUBLIC_KEYS prevents the application from starting."""
    env = get_base_env()
    # Explicitly remove it if it exists
    env.pop("GLOBAL_IT_PUBLIC_KEYS", None)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Try to start the app, it should fail with ValidationError
        result = subprocess.run(
            [sys.executable, "-c", "import src.main"],
            env=env,
            capture_output=True,
            text=True,
            cwd=tmpdir
        )
        assert result.returncode != 0, f"App should have crashed but didn't! Stdout:\n{result.stdout}\nStderr:\n{result.stderr}"
        assert "GLOBAL_IT_PUBLIC_KEYS" in result.stderr or "GLOBAL_IT_PUBLIC_KEYS" in result.stdout, f"Missing key error not found. Stdout:\n{result.stdout}\nStderr:\n{result.stderr}"

def test_missing_jwt_fails_closed():
    """Test that missing JWT_SECRET prevents the application from starting."""
    env = get_base_env()
    env.pop("JWT_SECRET", None)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        result = subprocess.run(
            [sys.executable, "-c", "import src.main"],
            env=env,
            capture_output=True,
            text=True,
            cwd=tmpdir
        )
        assert result.returncode != 0, f"App should have crashed but didn't! Stdout:\n{result.stdout}\nStderr:\n{result.stderr}"
        assert "JWT_SECRET" in result.stderr or "JWT_SECRET" in result.stdout, f"Missing key error not found. Stdout:\n{result.stdout}\nStderr:\n{result.stderr}"

def test_clean_bootstrap_and_suite_run():
    """
    Test the complete deterministic bootstrap sequence:
    1. Clean database
    2. Alembic upgrade head
    3. Application boots cleanly
    4. Run 6F.6 and 6F.7 suites
    """
    env = get_base_env()
    
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, "bootstrap.db")
        db_url = f"sqlite:///{db_path}"
        env["DATABASE_URL"] = db_url
        
        # 1. Empty database (it doesn't exist yet)
        assert not os.path.exists(db_path)
        
        # 2. Alembic upgrade head
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            env=env,
            capture_output=True,
            text=True,
            cwd=env["PYTHONPATH"]
        )
        assert result.returncode == 0, f"Alembic upgrade failed: {result.stderr}"
        assert os.path.exists(db_path)
        
        # Take fingerprint A
        def get_schema_fingerprint(path):
            import sqlite3
            conn = sqlite3.connect(path)
            cursor = conn.cursor()
            cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name")
            schema = cursor.fetchall()
            conn.close()
            import hashlib
            return hashlib.sha256(str(schema).encode()).hexdigest()
            
        fingerprint_A = get_schema_fingerprint(db_path)
        
        # 3. Application boots and doesn't crash
        # We start uvicorn in a subprocess, wait a moment, then shut it down
        proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "src.main:app", "--port", "9999"],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=env["PYTHONPATH"]
        )
        
        try:
            # Wait for it to boot (we check if it crashes immediately)
            time.sleep(3)
            # Check if process is still running
            assert proc.poll() is None, "Application crashed during startup"
            
            import urllib.request
            try:
                resp = urllib.request.urlopen("http://127.0.0.1:9999/health")
                assert resp.status == 200
            except Exception as e:
                # Read whatever output uvicorn produced
                out, err = proc.communicate(timeout=2)
                pytest.fail(f"Health check failed: {e}\nStdout:\n{out}\nStderr:\n{err}")
        finally:
            proc.terminate()
            proc.wait()
            
        # Take fingerprint B
        fingerprint_B = get_schema_fingerprint(db_path)
        
        # A == B ?
        assert fingerprint_A == fingerprint_B, "Application startup mutated the database schema!"
        
        # 4. Run certification suites against isolated fresh environments
        suites = [
            "tests/test_payment_allocation_e2e.py",
            "tests/test_6F7_3_concurrency.py",
            "tests/test_6F7_4_failure_recovery.py",
            "tests/test_6F7_5_observability.py"
        ]
        
        for suite in suites:
            # Use a completely isolated DB for each test suite to avoid cross-contamination
            with tempfile.TemporaryDirectory() as suite_tmpdir:
                suite_db = os.path.join(suite_tmpdir, f"{os.path.basename(suite)}.db")
                suite_env = get_base_env()
                suite_env["DATABASE_URL"] = f"sqlite:///{suite_db}"
                
                # We need to run alembic for the suite if it expects a migrated DB 
                # (Some suites might do this themselves, but we should ensure it's ready)
                subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], env=suite_env, cwd=suite_env["PYTHONPATH"])

                result = subprocess.run(
                    [sys.executable, "-m", "pytest", suite, "-v"],
                    env=suite_env,
                    capture_output=True,
                    text=True,
                    cwd=suite_env["PYTHONPATH"]
                )
                assert result.returncode == 0, f"Suite {suite} failed on clean isolated database.\nOutput:\n{result.stdout}\n{result.stderr}"
