import sqlite3
import os

db_path = 'c:/Users/ajay/Desktop/SE Project/db/dev.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, action, status, timestamp FROM audit_logs ORDER BY id DESC")
    rows = cursor.fetchall()
    print(f"Total Audit Logs: {len(rows)}")
    for row in rows:
        print(row)
    conn.close()
else:
    print("DB not found")
