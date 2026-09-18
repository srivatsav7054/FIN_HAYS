"""Voice router — handles STT, TTS, and the full voice pipeline endpoint."""

from __future__ import annotations

import base64
import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.telephony.stt import transcribe_audio
from app.telephony.tts import synthesize_speech
from app.services.orchestrator import run_orchestrator
from app.models.database import get_db, ConversationTurnDB

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/voice", tags=["Voice"])

# ── In-memory session store (mirrors agent router) ───────────────────────
_sessions: dict[str, list[dict]] = {}


# ── Request/Response models ─────────────────────────────────────────────

class TTSRequest(BaseModel):
    text: str
    language: str = "hi"


class VoicePipelineRequest(BaseModel):
    """Full voice pipeline: audio in (base64) -> STT -> Orchestrator -> TTS -> audio out."""
    session_id: str
    audio_base64: str
    language: str = "hi"


class VoicePipelineResponse(BaseModel):
    transcribed_text: str
    response_text: str
    audio_base64: str
    sources: list[str]
    flagged: bool
    detected_language: str


# ── Endpoints ────────────────────────────────────────────────────────────

@router.post("/stt", summary="Transcribe audio to text")
async def stt_endpoint(
    audio: UploadFile = File(...),
    language: str = Form(default=""),
):
    """
    Upload an audio file and get a text transcription.
    Accepts WAV, MP3, FLAC, M4A, OGG, WEBM formats.
    """
    audio_bytes = await audio.read()
    lang = language if language else None
    result = transcribe_audio(audio_bytes, filename=audio.filename or "audio.wav", language=lang)
    return result


@router.post("/tts", summary="Synthesize text to speech audio")
async def tts_endpoint(request: TTSRequest):
    """Convert text to speech. Returns MP3 audio directly."""
    audio_bytes = synthesize_speech(request.text, language=request.language)
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "attachment; filename=response.mp3"},
    )


@router.post(
    "/pipeline",
    response_model=VoicePipelineResponse,
    summary="Full voice pipeline: audio -> STT -> LLM -> TTS -> audio",
)
def voice_pipeline_endpoint(
    request: VoicePipelineRequest,
    db: Session = Depends(get_db),
):
    """
    End-to-end voice pipeline:
    1. Decode base64 audio
    2. Transcribe (STT via Groq Whisper)
    3. Run through the orchestrator (Groq LLM + RAG + Calculator)
    4. Synthesize response (TTS via edge-tts)
    5. Return transcribed text, response text, and audio (base64)
    """
    # 1. Decode audio
    try:
        audio_bytes = base64.b64decode(request.audio_base64)
    except Exception as e:
        logger.error("Failed to decode base64 audio: %s", e)
        return VoicePipelineResponse(
            transcribed_text="",
            response_text="Could not decode the audio. Please try again.",
            audio_base64="",
            sources=[],
            flagged=False,
            detected_language=request.language,
        )

    # 2. STT
    stt_result = transcribe_audio(audio_bytes, language=request.language or None)
    transcribed_text = stt_result.get("text", "")
    detected_language = stt_result.get("language", request.language)

    if not transcribed_text.strip():
        logger.warning("STT returned empty transcription")
        return VoicePipelineResponse(
            transcribed_text="",
            response_text="I couldn't hear that clearly. Could you please repeat?",
            audio_base64="",
            sources=[],
            flagged=False,
            detected_language=detected_language,
        )

    # 3. Load session history (same pattern as agent router)
    if request.session_id not in _sessions:
        prior = (
            db.query(ConversationTurnDB)
            .filter(ConversationTurnDB.session_id == request.session_id)
            .order_by(ConversationTurnDB.timestamp)
            .all()
        )
        _sessions[request.session_id] = [
            {"role": t.role, "text": t.text} for t in prior
        ]
    history = _sessions[request.session_id]

    # 4. Orchestrator
    result = run_orchestrator(
        text=transcribed_text,
        language=detected_language,
        history=history,
    )

    response_text = result["response_text"]
    sources = result["sources"]
    flagged = result["flagged"]

    # 5. Persist turns to DB
    now = datetime.now(timezone.utc).isoformat()
    db.add(ConversationTurnDB(
        id=str(uuid.uuid4()), session_id=request.session_id,
        role="user", text=transcribed_text, timestamp=now,
        flagged=False, sources="[]",
    ))
    db.add(ConversationTurnDB(
        id=str(uuid.uuid4()), session_id=request.session_id,
        role="assistant", text=response_text,
        timestamp=datetime.now(timezone.utc).isoformat(),
        flagged=flagged, sources=json.dumps(sources),
    ))
    db.commit()

    history.append({"role": "user", "text": transcribed_text})
    history.append({"role": "assistant", "text": response_text})

    # 6. TTS
    tts_lang = detected_language if detected_language != "auto" else request.language
    audio_out = synthesize_speech(response_text, language=tts_lang)
    audio_b64 = base64.b64encode(audio_out).decode("utf-8")

    return VoicePipelineResponse(
        transcribed_text=transcribed_text,
        response_text=response_text,
        audio_base64=audio_b64,
        sources=sources,
        flagged=flagged,
        detected_language=detected_language,
    )
