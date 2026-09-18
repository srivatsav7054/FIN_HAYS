"""Step 5 smoke test — tests TTS (edge-tts) and server startup with voice endpoints.

Run with:  python test_step5.py
(server must be running on port 8000)
"""

import sys
import json
import requests

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BASE = "http://127.0.0.1:8000"

def sep(label):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")

# ── Test 1: TTS endpoint (Hindi) ──
sep("1. TTS — Hindi text to speech")
r = requests.post(f"{BASE}/api/v1/voice/tts", json={
    "text": "Namaste, aap kaise hain? Main aapki madad karne ke liye yahan hoon.",
    "language": "hi",
})
print(f"  Status: {r.status_code}")
print(f"  Content-Type: {r.headers.get('content-type')}")
print(f"  Audio size: {len(r.content)} bytes")
assert r.status_code == 200, f"Expected 200, got {r.status_code}"
assert len(r.content) > 1000, f"Audio too small: {len(r.content)} bytes"
print("  [PASS] Hindi TTS returned valid audio")

# ── Test 2: TTS endpoint (English) ──
sep("2. TTS — English text to speech")
r = requests.post(f"{BASE}/api/v1/voice/tts", json={
    "text": "Hello! I am Dhan Sakhi, your financial literacy guide.",
    "language": "en",
})
print(f"  Status: {r.status_code}")
print(f"  Audio size: {len(r.content)} bytes")
assert r.status_code == 200
assert len(r.content) > 1000
print("  [PASS] English TTS returned valid audio")

# ── Test 3: Health check shows Step 5 ──
sep("3. Health check — Step 5 status")
r = requests.get(f"{BASE}/")
data = r.json()
print(f"  Status: {r.status_code}")
print(f"  Body: {json.dumps(data, indent=2)}")
assert "5" in data.get("step", ""), f"Expected Step 5, got: {data}"
print("  [PASS] Health check shows Step 5")

# ── Test 4: Voice endpoints are registered ──
sep("4. OpenAPI schema has voice endpoints")
r = requests.get(f"{BASE}/openapi.json")
schema = r.json()
paths = list(schema.get("paths", {}).keys())
voice_paths = [p for p in paths if "/voice/" in p]
print(f"  Voice endpoints: {voice_paths}")
assert "/api/v1/voice/stt" in paths, "Missing /stt endpoint"
assert "/api/v1/voice/tts" in paths, "Missing /tts endpoint"
assert "/api/v1/voice/pipeline" in paths, "Missing /pipeline endpoint"
print("  [PASS] All 3 voice endpoints registered (stt, tts, pipeline)")

print(f"\n{'='*60}")
print("  Step 5 tests complete — all passed!")
print(f"{'='*60}\n")
