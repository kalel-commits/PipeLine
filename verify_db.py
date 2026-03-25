import sqlite3
import os

db_path = "backend/db/dev.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Users in DB ---")
    try:
        cursor.execute("SELECT id, name, email, role FROM users")
        users = cursor.fetchall()
        for u in users:
            print(f"ID: {u[0]}, Name: {u[1]}, Email: {u[2]}, Role: {u[3]}")
            
        if len(users) >= 3:
            print("\nVerification SUCCESS: Seeded users found.")
        else:
            print(f"\nVerification FAILED: Expected at least 3 users, found {len(users)}.")
    except Exception as e:
        print(f"Error reading users: {e}")

    conn.close()
else:
    print(f"DB not found at {db_path}")
