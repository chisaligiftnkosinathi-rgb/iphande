import sqlite3
conn = sqlite3.connect('data/iphande.db')
conn.execute('DROP TABLE IF EXISTS alembic_version;')
conn.commit()
print("Dropped alembic_version table")
