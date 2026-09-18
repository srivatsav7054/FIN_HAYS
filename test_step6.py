"""Step 6 smoke test — tests AudioSocket server startup + basic protocol.

Verifies:
1. Server is listening on port 9092 (TCP)
2. The AudioSocket protocol handshake works (send UUID, receive no error)
3. The full pipeline (TTS still works after AudioSocket integration)
4. Health check shows Step 6

Run with:  python test_step6.py
(server must be running on port 8000 with AudioSocket on 9092)
"""

import sys
import json
import socket
import struct
import time
import requests

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BASE = "http://127.0.0.1:8000"
AUDIOSOCKET_HOST = "127.0.0.1"
AUDIOSOCKET_PORT = 9092

# Protocol constants
MSG_TERMINATE = 0x00
MSG_UUID = 0x01
MSG_AUDIO = 0x10

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

# ── Test 1: Health check shows Step 6 ──
sep("1. Health check — Step 6 status")
r = requests.get(f"{BASE}/")
data = r.json()
print(f"  Status: {r.status_code}")
print(f"  Body: {json.dumps(data, indent=2)}")
assert "6" in data.get("step", ""), f"Expected Step 6, got: {data}"
print("  [PASS] Health check shows Step 6")

# ── Test 2: AudioSocket TCP connection ──
sep("2. AudioSocket TCP — connect and send UUID")
try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    sock.connect((AUDIOSOCKET_HOST, AUDIOSOCKET_PORT))
    print("  Connected to AudioSocket server")

    # Send a UUID frame (type=0x01, 16-byte binary UUID)
    import uuid
    test_uuid = uuid.uuid4()
    uuid_payload = test_uuid.bytes
    header = struct.pack(">BH", MSG_UUID, len(uuid_payload))
    sock.sendall(header + uuid_payload)
    print(f"  Sent UUID: {test_uuid}")

    # Send a small silence audio frame (320 bytes of zeros = 20ms silence)
    silence = b"\x00" * 320
    header = struct.pack(">BH", MSG_AUDIO, len(silence))
    sock.sendall(header + silence)
    print("  Sent 20ms silence frame")

    # Send terminate
    header = struct.pack(">BH", MSG_TERMINATE, 0)
    sock.sendall(header)
    print("  Sent terminate")

    # Give server a moment to process
    time.sleep(0.5)
    sock.close()
    print("  [PASS] AudioSocket TCP handshake successful")

except ConnectionRefusedError:
    print("  [FAIL] Could not connect to AudioSocket on port 9092")
    print("  Make sure the server is running!")
    sys.exit(1)
except Exception as e:
    print(f"  [FAIL] AudioSocket error: {e}")
    sys.exit(1)

# ── Test 3: TTS still works (no regression) ──
sep("3. TTS — regression check")
r = requests.post(f"{BASE}/api/v1/voice/tts", json={
    "text": "Dhan Sakhi aapka swagat karti hai.",
    "language": "hi",
})
print(f"  Status: {r.status_code}")
print(f"  Audio size: {len(r.content)} bytes")
assert r.status_code == 200
assert len(r.content) > 1000
print("  [PASS] TTS still works correctly")

# ── Test 4: Agent query still works (no regression) ──
sep("4. Agent query — regression check")
r = requests.post(f"{BASE}/api/v1/agent/query", json={
    "session_id": "step6-test",
    "text": "What is a savings account?",
    "language": "en",
})
data = pretty(r)
assert r.status_code == 200
assert len(data["response_text"]) > 20
print("  [PASS] Agent query still works")

print(f"\n{'='*60}")
print("  Step 6 tests complete — all passed!")
print(f"{'='*60}\n")
