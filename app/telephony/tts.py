"""
Text-to-Speech (TTS) provider.

Uses edge-tts (Microsoft Edge's free TTS service) for speech synthesis.
Supports Indian languages: Hindi (hi-IN), Telugu (te-IN), Marathi (mr-IN),
Tamil (ta-IN), English (en-IN).

edge-tts is free, requires no API key, and produces natural-sounding voices.
"""

from __future__ import annotations

import asyncio
import io
import logging

import edge_tts

logger = logging.getLogger(__name__)

# Voice mapping for Indian languages
# These are natural-sounding neural voices from Microsoft Edge
VOICE_MAP: dict[str, str] = {
    "hi": "hi-IN-SwaraNeural",       # Hindi female voice
    "en": "en-IN-NeerjaNeural",       # English (India) female voice
    "te": "te-IN-ShrutiNeural",       # Telugu female voice
    "mr": "mr-IN-AarohiNeural",       # Marathi female voice
    "ta": "ta-IN-PallaviNeural",      # Tamil female voice
    "kn": "kn-IN-SapnaNeural",        # Kannada female voice
    "ml": "ml-IN-SobhanaNeural",      # Malayalam female voice
    "bn": "bn-IN-TanishaaNeural",     # Bengali female voice
    "gu": "gu-IN-DhwaniNeural",       # Gujarati female voice
}

DEFAULT_VOICE = "hi-IN-SwaraNeural"


async def synthesize_speech_async(
    text: str,
    language: str = "hi",
    output_format: str = "audio-16khz-32kbitrate-mono-mp3",
) -> bytes:
    """
    Convert text to speech audio bytes using edge-tts.

    Args:
        text: The text to synthesize.
        language: ISO 639-1 language code (e.g. "hi", "en", "te").
        output_format: Audio format string for edge-tts.

    Returns:
        Audio bytes (MP3 format by default).
    """
    voice = VOICE_MAP.get(language, DEFAULT_VOICE)
    logger.info("TTS: voice=%s, text_len=%d", voice, len(text))

    communicate = edge_tts.Communicate(text, voice)
    audio_buffer = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])

    audio_bytes = audio_buffer.getvalue()
    logger.info("TTS: generated %d bytes of audio", len(audio_bytes))
    return audio_bytes


def synthesize_speech(
    text: str,
    language: str = "hi",
    output_format: str = "audio-16khz-32kbitrate-mono-mp3",
) -> bytes:
    """
    Synchronous wrapper for synthesize_speech_async.
    Safe to call from sync code or a running event loop.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # We're inside an async context (e.g. FastAPI) — run in a new thread
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(
                asyncio.run,
                synthesize_speech_async(text, language, output_format),
            )
            return future.result()
    else:
        return asyncio.run(
            synthesize_speech_async(text, language, output_format)
        )
