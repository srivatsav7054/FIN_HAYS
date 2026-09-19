"""
Multi-turn benchmark for latency and multilingual verification.
Tests 5 turns across languages (Hindi, English, Telugu) to record
before/after latency numbers in logs/latency.csv.
"""

import asyncio
import socket
import struct
import sys
import time
import uuid

from app.telephony.audiosocket import _mp3_to_slin16_8k
from app.telephony.tts import synthesize_speech_async

HOST = "127.0.0.1"
PORT = 9092

MSG_TERMINATE = 0x00
MSG_UUID = 0x01
MSG_AUDIO = 0x10

FRAME_SIZE = 320  # 20ms at 8kHz, 16-bit mono


def write_frame(sock, msg_type, payload):
    header = struct.pack(">BH", msg_type, len(payload))
    sock.sendall(header + payload)


def read_frame(sock, timeout=5.0):
    sock.settimeout(timeout)
    try:
        header = b""
        while len(header) < 3:
            chunk = sock.recv(3 - len(header))
            if not chunk:
                return None, b""
            header += chunk
        msg_type = header[0]
        payload_len = struct.unpack(">H", header[1:3])[0]
        payload = b""
        while len(payload) < payload_len:
            chunk = sock.recv(payload_len - len(payload))
            if not chunk:
                break
            payload += chunk
        return msg_type, payload
    except socket.timeout:
        return -1, b""


def run_benchmark():
    test_queries = [
        ("What is Sukanya Samriddhi Yojana?", "en"),
        ("जन धन खाता खोलने के लिए क्या चाहिए?", "hi"),
        ("పొదుపు ఖాతా ఎలా తెరవాలి?", "te"),
        ("अगर मैं हर महीने 500 रुपये बचाऊं तो 2 साल में कितना होगा?", "hi"),
        ("How can I start saving money safely?", "en"),
    ]

    print("=== STARTING 5-TURN AUDIO BENCHMARK ===")
    silence = b"\x00" * FRAME_SIZE

    for idx, (query, lang) in enumerate(test_queries, 1):
        print(f"\n--- Turn {idx}/5: '{query}' (lang={lang}) ---")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((HOST, PORT))
        call_id = uuid.uuid4()
        write_frame(sock, MSG_UUID, call_id.bytes)

        # 1. Drain greeting
        start = time.time()
        silence_count = 0
        while time.time() - start < 10.0:
            mtype, payload = read_frame(sock, timeout=1.0)
            if mtype == -1 or mtype is None:
                break
            if mtype == MSG_AUDIO:
                if payload == silence:
                    silence_count += 1
                    if silence_count > 25:
                        break
                else:
                    silence_count = 0

        # Post-speak gate wait
        for _ in range(20):
            write_frame(sock, MSG_AUDIO, silence)
            time.sleep(0.02)

        # 2. Synthesize test query audio
        mp3 = asyncio.run(synthesize_speech_async(query, language=lang))
        pcm = _mp3_to_slin16_8k(mp3)

        # 3. Stream query frames
        t_query_start = time.time()
        for i in range(0, len(pcm), FRAME_SIZE):
            chunk = pcm[i : i + FRAME_SIZE]
            if len(chunk) < FRAME_SIZE:
                chunk += b"\x00" * (FRAME_SIZE - len(chunk))
            write_frame(sock, MSG_AUDIO, chunk)
            time.sleep(0.02)

        # 4. Stream silence to trigger VAD (webrtcvad with 700ms silence wait)
        # 40 frames * 20ms = 800ms
        for _ in range(45):
            write_frame(sock, MSG_AUDIO, silence)
            time.sleep(0.02)

        # 5. Measure wait to first non-silent response frame
        resp_start = time.time()
        first_frame_t = None
        speech_frames = 0

        while time.time() - resp_start < 25.0:
            mtype, payload = read_frame(sock, timeout=1.0)
            if mtype == -1:
                if first_frame_t is not None:
                    break
                continue
            if mtype is None:
                break
            if mtype == MSG_AUDIO:
                if payload != silence and any(b != 0 for b in payload):
                    if first_frame_t is None:
                        first_frame_t = time.time() - resp_start
                        print(f"  --> First response audio received in {first_frame_t:.2f}s!")
                    speech_frames += 1

        print(f"  Turn {idx} completed: speech frames = {speech_frames}, first frame latency = {first_frame_t}s")
        write_frame(sock, MSG_TERMINATE, b"")
        sock.close()
        time.sleep(0.5)

    print("\n=== BENCHMARK FINISHED ===")


if __name__ == "__main__":
    run_benchmark()
