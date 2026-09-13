import os
import subprocess

db_path = "test_alembic_sync.db"
if os.path.exists(db_path):
    os.remove(db_path)

os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

alembic_path = r".venv\Scripts\alembic.exe"

# 1. Apply existing migrations
subprocess.run([alembic_path, "upgrade", "head"], check=True)

# 2. Autogenerate new migration to catch all the manual alters from database.py
subprocess.run([alembic_path, "revision", "--autogenerate", "-m", "consolidate_startup_mutations"], check=True)

# 3. Upgrade to new head
subprocess.run([alembic_path, "upgrade", "head"], check=True)

print("Alembic sync successful!")
