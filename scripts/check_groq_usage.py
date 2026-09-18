import os
import sys
import wave
import tempfile
import requests
from dotenv import load_dotenv

# Load .env
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("[ERROR] GROQ_API_KEY not found in .env")
    sys.exit(1)

# Create a 1-second dummy WAV file (silence)
temp_audio = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
with wave.open(temp_audio.name, 'wb') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(8000)
    wf.writeframes(b'\x00' * 16000)

print("Checking Groq API tier and Whisper access...")
url = "https://api.groq.com/openai/v1/audio/transcriptions"
headers = {"Authorization": f"Bearer {api_key}"}
files = {
    "file": ("dummy.wav", open(temp_audio.name, "rb"), "audio/wav"),
}
data = {
    "model": "whisper-large-v3-turbo",
    "response_format": "json"
}

try:
    response = requests.post(url, headers=headers, files=files, data=data)
    if response.status_code == 200:
        print("[OK] Successfully reached Groq Whisper API.")
        
        # Check rate limits from headers to infer tier
        limit_req = response.headers.get("x-ratelimit-limit-requests", "Unknown")
        rem_req = response.headers.get("x-ratelimit-remaining-requests", "Unknown")
        limit_tok = response.headers.get("x-ratelimit-limit-tokens", "Unknown")
        
        print("\n=== Rate Limit Info ===")
        print(f"Requests Limit: {limit_req}")
        print(f"Requests Remaining: {rem_req}")
        print(f"Tokens/Audio Limit: {limit_tok}")
        
        if limit_req != "Unknown" and int(limit_req) < 100:
            print("\n[NOTE] You appear to be on the FREE tier (strict rate limits).")
            print("       This will incur NO COST, but you may hit limits during heavy testing.")
        else:
            print("\n[NOTE] You appear to be on a BILLED or higher tier (generous rate limits).")
            print("       Check your Groq console to ensure you aren't incurring unexpected costs.")
    else:
        print(response.text)
finally:
    # On Windows, we must close the file before deleting it, but requests might hold it if not careful.
    pass
