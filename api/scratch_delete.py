import sqlite3
conn = sqlite3.connect('C:/Projects/iphande/api/data/iphande.db')
cur = conn.cursor()
cur.execute("DELETE FROM profiles WHERE email LIKE 'cert_%'")
conn.commit()
print("Deleted.")
