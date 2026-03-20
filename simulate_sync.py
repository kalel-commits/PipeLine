import requests
import time

print("Waiting 5 seconds for the browser to open and start recording...")
time.sleep(5)

commits = [{
    "hash": "abcdef123456",
    "author": "Ajay",
    "date": "Sat Mar 14 22:30:00 2026 +0530",
    "message": "fix: massive urgent refactoring",
    "added": 300,
    "removed": 20
}]

print("Sending simulated Git history payload to backend...")
try:
    res = requests.post("http://localhost:8000/dataset/auto-sync", json=commits)
    print("Backend response:", res.json())
except Exception as e:
    print("Failed to send payload:", e)
