import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_unification():
    print("--- Testing Unified Prediction Unification (Full Traceback Mode) ---")
    
    # 1. Simulate IDE Sync (Extension)
    print("\n[1] Sending IDE Sync (Extension)...")
    sync_data = [{
        "hash": "ext_123",
        "added": 100,
        "removed": 50,
        "files_changed": 5,
        "message": "Update core logic (IDE)",
        "date": "2026-03-31T12:00:00Z"
    }]
    resp = requests.post(f"{BASE_URL}/dataset/auto-sync", json=sync_data)
    print(f"Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"ERROR BODY: {resp.text}")
    
    # 2. Check Latest
    time.sleep(1)
    print("\n[2] Checking Latest (GET /predict/latest)...")
    resp = requests.get(f"{BASE_URL}/predict/latest")
    print(f"Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"ERROR BODY: {resp.text}")
        return

    latest = resp.json()
    print(f"Latest Source: {latest.get('source')}, Risk: {latest.get('risk')}")
    
    # 3. Simulate VCS Webhook
    print("\n[3] Sending VCS Webhook (GitLab)...")
    webhook_payload = {
        "object_kind": "merge_request",
        "project": {"id": 1},
        "object_attributes": {
            "iid": 42,
            "source_branch": "feature-x",
            "last_commit": {"id": "hook_456", "message": "Critical bug fix"},
            "action": "open"
        }
    }
    resp = requests.post(f"{BASE_URL}/vcs/webhook", json=webhook_payload, headers={"X-Gitlab-Event": "Merge Request Hook"})
    print(f"Webhook Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"ERROR BODY: {resp.text}")

    # 4. Check Latest (should be webhook)
    time.sleep(1)
    print("\n[4] Checking Latest after Webhook...")
    resp = requests.get(f"{BASE_URL}/predict/latest")
    print(f"Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"ERROR BODY: {resp.text}")
        return

    latest = resp.json()
    print(f"Latest Source: {latest.get('source')}, Risk: {latest.get('risk')}")
    
    if latest.get('source') == 'webhook':
        print("\n✅ Unification Success!")
    else:
        print(f"\n❌ Unification Failed: Expected source 'webhook', got '{latest.get('source')}'")

if __name__ == "__main__":
    try:
        test_unification()
    except Exception as e:
        print(f"❌ Test Failed: {e}")
