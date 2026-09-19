"""
Speech-to-Text (STT) provider.

Uses Groq's hosted Whisper model (free tier) for transcription.
Supports Hindi and English only.
Fallback: returns error JSON if the Groq API is unreachable.
"""

from __future__ import annotations

import json
import logging
import re
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


def reset_client() -> None:
    """Reset the cached OpenAI client so a new API key is picked up."""
    global _client
    _client = None


def _strip_thinking(text: str) -> str:
    """Remove Qwen-style <think>...</think> reasoning blocks from model output."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


# Supported languages: Hindi and English only
SUPPORTED_LANGS = {"hi", "en"}

# STT prompt to bias Whisper towards Hindi/English financial vocabulary
INDIC_STT_PROMPT = (
    "Dhan Sakhi financial voice assistant. Hindi and English. "
    "हिन्दी: बचत खाता, बैंक, लोन, ब्याज, डाकघर, पैसा, जमा, खाता खोलना. "
    "English: savings account, bank, loan, interest, deposit, scheme, money."
)


LANG_NAME_TO_CODE: dict[str, str] = {
    "english": "en",
    "hindi": "hi",
}


def _normalize_lang_code(raw: str | None) -> str:
    """Map full language names or codes to 2-letter ISO codes. Default to 'en'."""
    if not raw:
        return "en"
    clean = raw.lower().strip()
    if clean in LANG_NAME_TO_CODE:
        return LANG_NAME_TO_CODE[clean]
    code = clean[:2] if len(clean) >= 2 else "en"
    # Only return supported langs
    return code if code in SUPPORTED_LANGS else "en"


def refine_detected_language(detected_lang: str, text: str, fallback_lang: str = "en") -> str:
    """
    Refine Whisper's language detection to only Hindi or English.
    Any non-Hindi/English detection is corrected based on script analysis.
    """
    if not text or not text.strip():
        return fallback_lang if fallback_lang in SUPPORTED_LANGS else "en"

    # 1. Devanagari script check — if text has Hindi characters, it's Hindi
    has_devanagari = any(0x0900 <= ord(c) <= 0x097F for c in text)
    if has_devanagari:
        return "hi"

    # 2. Arabic/Urdu script — Whisper often transcribes spoken Hindi as Urdu
    has_arabic_urdu = any(0x0600 <= ord(c) <= 0x06FF for c in text)
    if has_arabic_urdu or detected_lang in {"ur", "ar"}:
        return "hi"

    # 3. Romanized Hindi patterns (Hinglish)
    lower = text.lower()
    hindi_latin_patterns = [
        r"\b(aap|aapka|aapki|naam|kya|hai|hain|mera|meri|mere|paas)\b",
        r"\b(karna|kaise|kholna|khole|batao|bataiye|chahiye|kitna|hoga|hogi)\b",
        r"\b(bachat|paisa|paise|rupaye|rupya|khata|byaj|karz|jama|madad|pucho)\b",
        r"\b(namaste|namaskar|dhanyavad|shukriya|accha|theek|nahi|haan)\b",
    ]
    if any(re.search(p, lower) for p in hindi_latin_patterns):
        return "hi"

    # 4. English patterns
    english_patterns = [
        r"\b(savings|account|bank|hello|how|what|loan|deposit|interest)\b",
        r"\b(money|help|please|open|card|balance|government|scheme|fixed|post office)\b",
        r"\b(can|spend|divide|i have|want|need|tell me|thank you)\b",
    ]
    if any(re.search(p, lower) for p in english_patterns):
        return "en"

    # 5. If Whisper detected hi or en, trust it
    if detected_lang in SUPPORTED_LANGS:
        return detected_lang

    # 6. Fallback — default to session language or English
    return fallback_lang if fallback_lang in SUPPORTED_LANGS else "en"


def transcribe_audio(
    audio_bytes: bytes,
    filename: str = "audio.wav",
    language: str | None = None,
    current_session_lang: str = "en",
) -> dict:
    """
    Transcribe audio bytes to text using Groq Whisper with language detection.

    Returns:
        dict with keys:
            - text: The transcribed text
            - language: Detected language code ('hi' or 'en')
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
                "model": "whisper-large-v3",
                "file": audio_file,
                "response_format": "verbose_json",
                "prompt": INDIC_STT_PROMPT,
            }
            if language and language.strip() and language != "auto":
                kwargs["language"] = language

            transcription = client.audio.transcriptions.create(**kwargs)

        # Clean up temp file
        try:
            Path(tmp_path).unlink()
        except OSError:
            pass

        raw_lang = getattr(transcription, "language", None) or language or "en"
        initial_lang = _normalize_lang_code(raw_lang)
        text_out = getattr(transcription, "text", "") or ""

        # Refine and correct Whisper language misclassifications
        detected_lang = refine_detected_language(initial_lang, text_out, fallback_lang=current_session_lang)

        logger.info(
            "STT transcription: raw_lang=%s, initial_lang=%s, refined_lang=%s, len=%d chars",
            raw_lang,
            initial_lang,
            detected_lang,
            len(text_out),
        )

        return {
            "text": text_out,
            "language": detected_lang,
        }

    except Exception as e:
        logger.error("STT transcription failed: %s", e)
        fallback_lang = _normalize_lang_code(language) if language else "en"
        return {
            "text": "",
            "language": fallback_lang,
            "error": str(e),
        }
