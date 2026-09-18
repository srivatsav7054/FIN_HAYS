"""Step 3 smoke test — tests real ChromaDB RAG retrieval and full LLM integration.

Run with:  python test_step3.py
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

# ── Test 1: Direct RAG query (using orchestrator to trigger rag_search) ──
sep("1. RAG query about SSY (Sukanya Samriddhi Yojana)")
data = pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "step3-test-001",
    "text": "Tell me about Sukanya Samriddhi Yojana",
    "language": "en",
}))
if data:
    print(f"\n  Sources: {data.get('sources', [])}")
    print(f"  Flagged: {data.get('flagged', 'N/A')}")

# ── Test 2: RAG query in Hindi (should retrieve Hindi docs) ──────────────
sep("2. RAG query in Hindi about 50-30-20 rule")
data = pretty(requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "step3-test-002",
    "text": "50-30-20 niyam kya hai?",
    "language": "hi",
}))
if data:
    print(f"\n  Sources: {data.get('sources', [])}")
    print(f"  Flagged: {data.get('flagged', 'N/A')}")

print(f"\n{'='*60}")
print("  Step 3 tests complete!")
print(f"{'='*60}\n")
