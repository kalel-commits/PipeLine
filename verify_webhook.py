import sqlite3
import time
import os

DB_PATH = 'c:/Users/ajay/Desktop/SE Project/backend/db/dev.db'

def get_latest_log():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT id, action, timestamp, status FROM audit_logs ORDER BY id DESC LIMIT 1')
        row = cursor.fetchone()
        conn.close()
        return row
    except Exception as e:
        return None

print("👀 Monitoring PipelineAI Audit Logs for new Webhooks...")
last_id = None
initial_log = get_latest_log()
if initial_log:
    last_id = initial_log[0]
    print(f"Current Latest Log: ID {last_id} | {initial_log[1]} at {initial_log[2]}")

try:
    while True:
        log = get_latest_log()
        if log and log[0] != last_id:
            last_id = log[0]
            print(f"\n🚀 NEW LOG RECEIVED!")
            print(f"ID: {log[0]}")
            print(f"Action: {log[1]}")
            print(f"Time: {log[2]}")
            print(f"Status: {log[3]}")
            print("-" * 30)
        time.sleep(2)
except KeyboardInterrupt:
    print("\nStopped monitoring.")
