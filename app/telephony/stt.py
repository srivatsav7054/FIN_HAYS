"""
Speech-to-Text (STT) provider.

Uses Groq's hosted Whisper model (free tier) for transcription.
Whisper supports multilingual audio out of the box.
Fallback: returns error JSON if the Groq API is unreachable.
"""

from __future__ import annotations

import json
import logging
import tempfile
from pathlib import Path

from openai import OpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        _client = OpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
    return _client


def transcribe_audio(
    audio_bytes: bytes,
    filename: str = "audio.wav",
    language: str | None = None,
) -> dict:
    """
    Transcribe audio bytes to text using Groq Whisper.

    Args:
        audio_bytes: Raw audio data (WAV, MP3, FLAC, etc.)
        filename: Filename hint for the API (helps with format detection).
        language: Optional ISO 639-1 language code (e.g. "hi", "en", "te").
                  If None, Whisper auto-detects the language.

    Returns:
        dict with keys:
            - text: The transcribed text
            - language: Detected/specified language code
            - error: Error message if transcription failed (absent on success)
    """
    try:
        client = _get_client()

        # Write audio bytes to a temp file (Groq API needs a file-like object)
        suffix = Path(filename).suffix or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as audio_file:
            kwargs = {
                "model": "whisper-large-v3-turbo",
                "file": audio_file,
                "response_format": "json",
            }
            if language:
                kwargs["language"] = language

            transcription = client.audio.transcriptions.create(**kwargs)

        # Clean up temp file
        try:
            Path(tmp_path).unlink()
        except OSError:
            pass

        detected_lang = language or "auto"
        logger.info(
            "STT transcription: lang=%s, len=%d chars",
            detected_lang,
            len(transcription.text),
        )

        return {
            "text": transcription.text,
            "language": detected_lang,
        }

    except Exception as e:
        logger.error("STT transcription failed: %s", e)
        return {
            "text": "",
            "language": language or "unknown",
            "error": str(e),
        }
