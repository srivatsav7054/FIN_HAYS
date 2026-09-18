"""Quick smoke test — hits every endpoint and prints results.

Run with:  python test_step1.py
(while the server is running on port 8000)
"""

import json
import sys
import requests

# Force UTF-8 output on Windows console
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "http://127.0.0.1:8000"

def sep(label):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")

def pretty(r):
    print(f"  Status: {r.status_code}")
    try:
        print(f"  Body:   {json.dumps(r.json(), indent=2, ensure_ascii=False)}")
    except Exception:
        print(f"  Body:   {r.text}")


# 1. Health check
sep("GET /")
pretty(requests.get(f"{BASE}/"))

# 2. Agent query — English
sep("POST /api/v1/agent/query (English, greeting)")
pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "test-session-001",
    "text": "hello",
    "language": "en",
}))

# 3. Agent query — Hindi
sep("POST /api/v1/agent/query (Hindi)")
pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "test-session-001",
    "text": "namaste",
    "language": "hi",
}))

# 4. Agent query — specific question
sep("POST /api/v1/agent/query (specific question)")
pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "test-session-001",
    "text": "How can I save 500 rupees per month?",
    "language": "en",
}))

# 5. Create user profile
sep("POST /api/v1/user/user-001/profile")
pretty(requests.post(f"{BASE}/api/v1/user/user-001/profile", json={
    "user_id": "user-001",
    "name": "Lakshmi Devi",
    "preferred_language": "hi",
    "phone_number": "+919876543210",
    "monthly_income": 8000.0,
    "monthly_expenses": 5500.0,
    "savings_goal": 2000.0,
}))

# 6. Get user profile
sep("GET /api/v1/user/user-001/profile")
pretty(requests.get(f"{BASE}/api/v1/user/user-001/profile"))

# 7. Get non-existent profile (should 404)
sep("GET /api/v1/user/nonexistent/profile (expect 404)")
pretty(requests.get(f"{BASE}/api/v1/user/nonexistent/profile"))

# 8. Add transaction
sep("POST /api/v1/user/user-001/transactions")
pretty(requests.post(f"{BASE}/api/v1/user/user-001/transactions", json={
    "id": "",
    "date": "2026-09-18",
    "type": "income",
    "category": "wages",
    "amount": 4000.0,
    "note": "Monthly wages from MGNREGA",
}))

# 9. Add another transaction
sep("POST /api/v1/user/user-001/transactions (expense)")
pretty(requests.post(f"{BASE}/api/v1/user/user-001/transactions", json={
    "id": "",
    "date": "2026-09-18",
    "type": "expense",
    "category": "groceries",
    "amount": 1200.0,
    "note": "Weekly ration from local shop",
}))

# 10. List transactions
sep("GET /api/v1/user/user-001/transactions")
pretty(requests.get(f"{BASE}/api/v1/user/user-001/transactions"))

# 11. Session history (should show the 3 turns from earlier)
sep("GET /api/v1/session/test-session-001/history")
pretty(requests.get(f"{BASE}/api/v1/session/test-session-001/history"))

# 12. Empty session history
sep("GET /api/v1/session/nonexistent/history (expect empty)")
pretty(requests.get(f"{BASE}/api/v1/session/nonexistent/history"))

print(f"\n{'='*60}")
print("  ✅ All endpoints tested!")
print(f"{'='*60}\n")
