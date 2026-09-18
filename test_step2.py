"""Step 2 smoke test — tests real Groq LLM orchestrator via /agent/query.

Run with:  python test_step2.py
(while the server is running on port 8000 with a valid GROQ_API_KEY in .env)
"""

import json
import sys
import requests

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


# ── Test 1: Simple English greeting ──────────────────────────────────────
sep("1. English greeting (should use rag_search)")
data = pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "step2-test-001",
    "text": "Hello, I want to learn about saving money",
    "language": "en",
}))
if data:
    print(f"\n  Sources: {data.get('sources', [])}")
    print(f"  Flagged: {data.get('flagged', 'N/A')}")

# ── Test 2: Math question (should trigger calculate tool) ────────────────
sep("2. Math question (should use calculate tool)")
data = pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "step2-test-001",
    "text": "If I earn 8000 rupees and spend 5500, how much can I save each month?",
    "language": "en",
}))
if data:
    print(f"\n  Sources: {data.get('sources', [])}")
    print(f"  Flagged: {data.get('flagged', 'N/A')}")

# ── Test 3: Hindi question ───────────────────────────────────────────────
sep("3. Hindi question (should respond in Hindi)")
data = pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "step2-test-002",
    "text": "mujhe bachat ke baare mein batao",
    "language": "hi",
}))
if data:
    print(f"\n  Sources: {data.get('sources', [])}")
    print(f"  Flagged: {data.get('flagged', 'N/A')}")

# ── Test 4: Session continuity ───────────────────────────────────────────
sep("4. Follow-up in same session (should have context from test 1 & 2)")
data = pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "step2-test-001",
    "text": "What government schemes can help me with that?",
    "language": "en",
}))
if data:
    print(f"\n  Sources: {data.get('sources', [])}")
    print(f"  Flagged: {data.get('flagged', 'N/A')}")

# ── Test 5: Check session history persisted ──────────────────────────────
sep("5. Session history (audit trail)")
r = requests.get(f"{BASE}/api/v1/session/step2-test-001/history")
data = r.json()
print(f"  Status: {r.status_code}")
print(f"  Total turns: {len(data.get('turns', []))}")
for turn in data.get("turns", []):
    role = turn["role"].upper()
    text = turn["text"][:100] + ("..." if len(turn["text"]) > 100 else "")
    print(f"    [{role}] {text}")
    if turn.get("flagged"):
        print(f"           ^^^ FLAGGED!")

print(f"\n{'='*60}")
print("  Step 2 tests complete!")
print(f"{'='*60}\n")
