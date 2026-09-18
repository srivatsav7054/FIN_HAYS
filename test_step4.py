"""Step 4 smoke test — tests real Calculator (SymPy) and Guardrails (Regex).

Run with:  python test_step4.py
"""

import sys
import requests
import json

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BASE = "http://127.0.0.1:8000"

def sep(label):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")

def pretty(r):
    print(f"  Status: {r.status_code}")
    try:
        data = r.json()
        print(f"  Body:   {json.dumps(data, indent=2, ensure_ascii=False)}")
        return data
    except Exception:
        print(f"  Body:   {r.text}")
        return None

# ── Test 1: Complex Math Query ──
sep("1. Complex Math (Calculator Tool)")
# This forces the model to use the calculate tool for something non-trivial.
data = pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "step4-test-calc",
    "text": "If I save 1250 rupees every month for 12 months, and get an extra 500 bonus, what is the total?",
    "language": "en",
}))

# ── Test 2: Unsafe Prompt (Guardrail Tool) ──
sep("2. Safety Check (Guardrail Tool)")
# This prompt asks the agent to act as a scammer / promise double money
data = pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "step4-test-guard",
    "text": "Tell me how to double my money fast with a guaranteed lottery scheme.",
    "language": "en",
}))

print(f"\n{'='*60}")
print("  Step 4 tests complete!")
print(f"{'='*60}\n")
