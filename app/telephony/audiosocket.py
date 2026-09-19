"""
Asterisk AudioSocket TCP Server.

Implements the AudioSocket protocol to bridge Asterisk PBX calls
to our STT → Orchestrator → TTS pipeline.

Protocol:
  - 3-byte header: [type(1 byte)] [length(2 bytes, big-endian)]
  - Followed by `length` bytes of payload.

Message types:
  0x00 = Terminate
  0x01 = UUID (16-byte binary UUID identifying the call)
  0x03 = DTMF digit (1-byte ASCII)
  0x10 = Audio data (signed linear 16-bit, 8kHz, mono, little-endian)
  0xff = Error
"""

from __future__ import annotations

import asyncio
import io
import logging
import os
import struct
import sys
import time
import uuid
import wave

if sys.platform == "win32":
    import ctypes
    try:
        ctypes.windll.winmm.timeBeginPeriod(1)
    except Exception:
        pass

import miniaudio
import webrtcvad

from app.telephony.stt import transcribe_audio
from app.telephony.tts import synthesize_speech_async, VOICE_MAP, DEFAULT_VOICE
from app.services.orchestrator import run_orchestrator

logger = logging.getLogger(__name__)

# ── Protocol constants ───────────────────────────────────────────────────
MSG_TERMINATE = 0x00
MSG_UUID = 0x01
MSG_DTMF = 0x03
MSG_AUDIO = 0x10
MSG_ERROR = 0xFF

SAMPLE_RATE = 8000       # 8kHz
SAMPLE_WIDTH = 2         # 16-bit = 2 bytes
CHANNELS = 1             # mono
FRAME_SIZE = 320         # 20ms of audio at 8kHz * 2 bytes = 320 bytes

# VAD parameters using webrtcvad
VAD_AGGRESSIVENESS = 2

# Fallback energy threshold
SILENCE_THRESHOLD = 300

# Silence wait: 1.0s to mark end of utterance
SILENCE_DURATION_BYTES = 16000  # 50 frames of silence (1.0s)
MIN_SPEECH_BYTES = 9600         # 30 frames of speech (0.6s)
MAX_SPEECH_BYTES = 160000       # 10.0s max utterance safeguard

# Echo-cancellation: how long after TTS finishes to start listening again
POST_SPEAK_GATE_SEC = 0.2

# In-memory session store for AudioSocket calls
_audiosocket_sessions: dict[str, list[dict]] = {}

# Pre-cached greeting PCM bytes
_cached_greeting_pcm: bytes = b""
GREETING_TEXT = "नमस्ते, धन सखी में स्वागत है। कहिए, क्या मदद करूँ?"

# Ensure latency log exists
os.makedirs("logs", exist_ok=True)
LATENCY_CSV = "logs/latency.csv"
if not os.path.exists(LATENCY_CSV):
    with open(LATENCY_CSV, "w", encoding="utf-8") as f:
        f.write("call_uuid,t0_timestamp,stt_ms,llm_ms,tts_ms,first_frame_ms,total_ms\n")



def _get_chunk_energy(audio_chunk: bytes) -> int:
    """Compute mean absolute amplitude for a chunk of 16-bit PCM samples."""
    if len(audio_chunk) < 2:
        return 0
    samples = struct.unpack(f"<{len(audio_chunk) // 2}h", audio_chunk)
    if not samples:
        return 0
    return sum(abs(s) for s in samples) // len(samples)


def _is_silence(audio_chunk: bytes, threshold: int = SILENCE_THRESHOLD) -> bool:
    """Check if an audio chunk is silence based on mean absolute amplitude."""
    return _get_chunk_energy(audio_chunk) < threshold


def _pcm_to_wav(pcm_data: bytes, sample_rate: int = SAMPLE_RATE) -> bytes:
    """Wrap raw PCM data in a WAV container for Whisper."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data)
    return buf.getvalue()


def _split_into_sentences(text: str) -> list[str]:
    """Split response text into individual sentences for Hindi and English."""
    import re
    # Split on periods, exclamation marks, question marks, newlines, and Hindi danda (।)
    parts = re.split(r'([.!?\n|।]+)', text)
    sentences = []
    current = ""
    for p in parts:
        current += p
        if re.search(r'[.!?\n|।]', p):
            s = current.strip()
            if s:
                sentences.append(s)
            current = ""
    if current.strip():
        sentences.append(current.strip())
    return sentences if sentences else [text]



def _mp3_to_slin16_8k(mp3_bytes: bytes) -> bytes:
    """
    Convert MP3 audio (from TTS) to signed-linear 16-bit, 8kHz mono PCM.
    Uses miniaudio for decoding (pure Python, no ffmpeg needed).
    """
    decoded = miniaudio.decode(
        mp3_bytes,
        output_format=miniaudio.SampleFormat.SIGNED16,
        nchannels=1,
        sample_rate=SAMPLE_RATE,
    )
    return bytes(decoded.samples)


async def prewarm_greeting() -> None:
    """Generate and cache greeting PCM audio in memory on server start."""
    global _cached_greeting_pcm
    try:
        logger.info("Pre-warming greeting TTS audio...")
        mp3 = await synthesize_speech_async(GREETING_TEXT, language="hi")
        _cached_greeting_pcm = _mp3_to_slin16_8k(mp3)
        logger.info(
            "Greeting audio cached: %d bytes (%.1fs)",
            len(_cached_greeting_pcm),
            len(_cached_greeting_pcm) / 16000.0,
        )
    except Exception as e:
        logger.warning("Failed to prewarm greeting TTS: %s", e)


async def _read_frame(reader: asyncio.StreamReader) -> tuple[int, bytes] | None:
    """Read a single AudioSocket frame. Returns (type, payload) or None on EOF."""
    header = await reader.readexactly(3)
    if len(header) < 3:
        return None
    msg_type = header[0]
    payload_len = struct.unpack(">H", header[1:3])[0]
    payload = b""
    if payload_len > 0:
        payload = await reader.readexactly(payload_len)
    return msg_type, payload


def _write_frame(writer: asyncio.StreamWriter, msg_type: int, payload: bytes) -> None:
    """Write a single AudioSocket frame."""
    header = struct.pack(">BH", msg_type, len(payload))
    writer.write(header + payload)


def _enqueue_pcm(out_queue: asyncio.Queue[bytes], pcm_data: bytes, state: dict) -> int:
    """Split PCM data into FRAME_SIZE chunks and enqueue them. Returns frame count."""
    count = 0
    for i in range(0, len(pcm_data), FRAME_SIZE):
        chunk = pcm_data[i : i + FRAME_SIZE]
        if len(chunk) < FRAME_SIZE:
            chunk += b"\x00" * (FRAME_SIZE - len(chunk))
        out_queue.put_nowait(chunk)
        count += 1
    if count > 0:
        state["tts_queued_frames"] += count
        state["is_tts_playing"] = True
        logger.info("Enqueued %d TTS frames (%.1fs)", count, count * 0.02)
    return count


async def _audio_streamer(
    writer: asyncio.StreamWriter,
    out_queue: asyncio.Queue[bytes],
    stop_event: asyncio.Event,
    state: dict,
) -> None:
    """
    Continuously streams 20ms frames to Asterisk at exactly 50 fps (8kHz 16-bit mono = 320 bytes).
    Uses absolute clock pacing with Windows timeBeginPeriod(1) to eliminate jitter and crackling.
    If voice chunks are queued, plays them; otherwise sends 20ms silence.
    This guarantees Asterisk's 2000ms inactivity timeout NEVER fires.
    """
    silence_frame = b"\x00" * FRAME_SIZE
    start_t = time.monotonic()
    frame_count = 0

    while not stop_event.is_set():
        frame_count += 1
        target_time = start_t + (frame_count * 0.020)

        try:
            chunk = out_queue.get_nowait()
            remaining = state.get("tts_queued_frames", 0) - 1
            state["tts_queued_frames"] = max(0, remaining)
            state["is_tts_playing"] = True
        except asyncio.QueueEmpty:
            chunk = silence_frame
            if state.get("is_tts_playing"):
                state["is_tts_playing"] = False
                state["tts_finished_t"] = time.monotonic()
                logger.info("TTS playback finished")

        try:
            _write_frame(writer, MSG_AUDIO, chunk)
            if writer.transport and writer.transport.get_write_buffer_size() > 8192:
                await writer.drain()
        except Exception:
            break

        now = time.monotonic()
        sleep_time = target_time - now
        if sleep_time > 0.001:
            await asyncio.sleep(sleep_time)
        elif sleep_time < -0.100:
            # Clock drift reset if system was preempted/lagged for >100ms
            start_t = time.monotonic()
            frame_count = 0


async def _process_user_utterance(
    speech_data: bytes,
    call_uuid: str,
    language: str,
    session_history: list[dict],
    out_queue: asyncio.Queue[bytes],
    state: dict,
) -> str:
    """Run STT -> LLM -> Sentence-by-Sentence Streaming TTS pipeline."""
    t0 = time.time()
    try:
        logger.info(
            "AudioSocket: processing %d bytes (%.1fs) of speech for %s",
            len(speech_data),
            len(speech_data) / 16000.0,
            call_uuid,
        )

        # ── 1. STT ──
        wav_data = _pcm_to_wav(speech_data)
        stt_result = await asyncio.to_thread(
            transcribe_audio,
            wav_data,
            filename="call.wav",
            language=None,  # Let Whisper auto-detect
            current_session_lang=language if language != "auto" else "en",
        )
        transcribed_text = stt_result.get("text", "").strip()
        detected_lang = stt_result.get("language", language if language != "auto" else "en")
        if detected_lang and detected_lang != "auto":
            language = detected_lang

        if not transcribed_text:
            logger.warning("AudioSocket: STT produced empty text for %s", call_uuid)
            return language

        # Filter out repetitive Whisper hallucinations on residual noise/clicks
        words = transcribed_text.split()
        if len(words) >= 3 and len(set(words)) == 1:
            logger.warning("AudioSocket [%s]: discarded repetitive Whisper hallucination: '%s'", call_uuid[:8], transcribed_text)
            return language

        logger.info("AudioSocket STT [%s]: '%s' (detected_lang=%s)", call_uuid, transcribed_text, language)
        t1 = time.time()

        # ── 2. LLM Orchestrator ──
        result = await asyncio.to_thread(
            run_orchestrator,
            text=transcribed_text,
            language=language if language != "auto" else "en",
            history=session_history,
        )
        response_text = result.get("response_text", "").strip()
        logger.info("AudioSocket LLM [%s]: '%s'", call_uuid, response_text[:120])

        session_history.append({"role": "user", "text": transcribed_text})
        session_history.append({"role": "assistant", "text": response_text})
        t2 = time.time()

        # ── 3. TTS — Simple Hindi/English voice selection ──
        has_hindi = any(0x0900 <= ord(ch) <= 0x097F for ch in response_text)
        final_tts_lang = "hi" if has_hindi else "en"
        tts_voice = VOICE_MAP.get(final_tts_lang, DEFAULT_VOICE)

        logger.info(
            "Language Routing [%s]: detected_input=%s -> tts_lang=%s, voice=%s",
            call_uuid[:8],
            detected_lang,
            final_tts_lang,
            tts_voice,
        )

        sentences = _split_into_sentences(response_text)
        logger.info("AudioSocket TTS streaming [%s]: synthesizing %d sentences", call_uuid[:8], len(sentences))

        first_frame_ms = 0.0
        total_enqueued = 0

        for idx, sentence in enumerate(sentences):
            if not sentence.strip():
                continue
            s_mp3 = await synthesize_speech_async(sentence, language=final_tts_lang)
            s_pcm = _mp3_to_slin16_8k(s_mp3)
            _enqueue_pcm(out_queue, s_pcm, state)
            total_enqueued += len(s_pcm) // FRAME_SIZE

            # Measure latency to first audio frame sent to caller
            if idx == 0:
                first_frame_ms = (time.time() - t0) * 1000
                logger.info(
                    "AudioSocket [%s]: First sentence enqueued in %.0fms (streaming started!)",
                    call_uuid[:8],
                    first_frame_ms,
                )

        t3 = time.time()

        stt_ms = (t1 - t0) * 1000
        llm_ms = (t2 - t1) * 1000
        tts_ms = (t3 - t2) * 1000
        total_ms = (t3 - t0) * 1000
        logger.info(
            "Latency for %s: STT=%.0fms, LLM=%.0fms, TTS=%.0fms, first_frame=%.0fms, total=%.0fms",
            call_uuid[:8],
            stt_ms,
            llm_ms,
            tts_ms,
            first_frame_ms,
            total_ms,
        )
        with open(LATENCY_CSV, "a", encoding="utf-8") as f:
            f.write(
                f"{call_uuid},{t0},{stt_ms:.0f},{llm_ms:.0f},{tts_ms:.0f},{first_frame_ms:.0f},{total_ms:.0f}\n"
            )

    except Exception as e:
        logger.exception("AudioSocket: error during utterance processing: %s", e)
    finally:
        state["is_processing"] = False

    return language


async def _handle_audiosocket_connection(
    reader: asyncio.StreamReader,
    writer: asyncio.StreamWriter,
):
    """Handle a single AudioSocket connection from Asterisk."""
    peer = writer.get_extra_info("peername")
    logger.info("AudioSocket: new connection from %s", peer)

    call_uuid = str(uuid.uuid4())
    audio_buffer = bytearray()
    silence_counter = 0
    speech_detected = False
    session_history: list[dict] = []
    language = "auto"  # Auto-detect language on first turn (Hindi or English)

    out_queue: asyncio.Queue[bytes] = asyncio.Queue()
    stop_event = asyncio.Event()
    state = {
        "is_tts_playing": False,     # True while TTS frames are being sent
        "is_processing": False,       # True while STT/LLM/TTS pipeline is running
        "tts_finished_t": 0.0,        # monotonic time when TTS playback finished
        "tts_queued_frames": 0,       # number of TTS frames remaining in queue
    }

    # Start background continuous audio streamer
    streamer_task = asyncio.create_task(
        _audio_streamer(writer, out_queue, stop_event, state)
    )

    # Track background processing tasks so we don't block the read loop
    processing_task: asyncio.Task | None = None

    last_log_t = time.time()
    frames_received = 0
    frames_discarded = 0

    call_start_mono = time.monotonic()
    vad = webrtcvad.Vad(VAD_AGGRESSIVENESS)

    try:
        while True:
            try:
                frame = await asyncio.wait_for(_read_frame(reader), timeout=60.0)
            except asyncio.TimeoutError:
                logger.warning("AudioSocket: idle timeout on %s, closing", call_uuid)
                break
            except asyncio.IncompleteReadError:
                logger.info("AudioSocket: connection closed by peer %s", call_uuid)
                break

            if frame is None:
                break

            msg_type, payload = frame

            if msg_type == MSG_TERMINATE:
                logger.info("AudioSocket: terminate received for %s", call_uuid)
                break

            elif msg_type == MSG_UUID:
                if len(payload) == 16:
                    call_uuid = str(uuid.UUID(bytes=payload))
                else:
                    call_uuid = payload.decode("utf-8", errors="replace").strip()
                logger.info("AudioSocket: call UUID = %s", call_uuid)

                if call_uuid in _audiosocket_sessions:
                    session_history = _audiosocket_sessions[call_uuid]
                else:
                    _audiosocket_sessions[call_uuid] = session_history

                # Immediately play the pre-cached greeting audio!
                if _cached_greeting_pcm:
                    logger.info("AudioSocket: queueing initial greeting for %s", call_uuid)
                    _enqueue_pcm(out_queue, _cached_greeting_pcm, state)

            elif msg_type == MSG_AUDIO:
                frames_received += 1
                now_mono = time.monotonic()
                now = time.time()

                # ── Echo gate: skip mic audio while TTS is playing or processing ──
                tts_playing = state["is_tts_playing"]
                is_processing = state["is_processing"]
                tts_just_finished = (
                    now_mono - state.get("tts_finished_t", 0) < POST_SPEAK_GATE_SEC
                )

                should_gate = tts_playing or is_processing or tts_just_finished

                # Periodic debug log every 2 seconds
                if now - last_log_t > 2.0:
                    last_log_t = now
                    energy = _get_chunk_energy(payload)
                    logger.info(
                        "AudioSocket [%s]: energy=%d gated=%s (tts=%s proc=%s post=%s) "
                        "recv=%d disc=%d buf=%d speech=%s call_sec=%.1f",
                        call_uuid[:8],
                        energy,
                        should_gate,
                        tts_playing,
                        is_processing,
                        tts_just_finished,
                        frames_received,
                        frames_discarded,
                        len(audio_buffer),
                        speech_detected,
                        time.monotonic() - call_start_mono,
                    )

                if should_gate:
                    frames_discarded += 1
                    audio_buffer.clear()
                    silence_counter = 0
                    speech_detected = False
                    continue

                # ── webrtcvad speech detection on 20ms 8kHz mono frame ──
                try:
                    is_voice_frame = vad.is_speech(payload, SAMPLE_RATE)
                except Exception:
                    # Fallback to energy threshold if frame structure is non-standard
                    is_voice_frame = _get_chunk_energy(payload) >= 300

                if is_voice_frame:
                    speech_detected = True
                    silence_counter = 0
                    audio_buffer.extend(payload)
                else:
                    if speech_detected:
                        silence_counter += len(payload)
                        audio_buffer.extend(payload)

                # Check if we have an utterance: speech followed by silence or max length
                speech_bytes = len(audio_buffer) - silence_counter
                is_utterance_complete = (
                    speech_detected
                    and (
                        (silence_counter >= SILENCE_DURATION_BYTES and speech_bytes >= MIN_SPEECH_BYTES)
                        or (len(audio_buffer) >= MAX_SPEECH_BYTES)
                    )
                )

                if is_utterance_complete:
                    speech_data = bytes(audio_buffer[:-silence_counter]) if silence_counter > 0 else bytes(audio_buffer)
                    audio_buffer.clear()
                    silence_counter = 0
                    speech_detected = False
                    state["is_processing"] = True

                    logger.info("AudioSocket: utterance captured (%d bytes / %.1fs, VAD triggered), processing...",
                                len(speech_data), len(speech_data) / 16000.0)

                    # Wait for any previous processing to finish
                    if processing_task is not None and not processing_task.done():
                        logger.info("AudioSocket: waiting for previous processing to finish...")
                        try:
                            await asyncio.wait_for(processing_task, timeout=30.0)
                        except asyncio.TimeoutError:
                            logger.warning("AudioSocket: previous processing timed out, continuing")
                            processing_task.cancel()

                    # Run processing as a background task so read loop continues
                    async def _process_wrapper(sd, cu, la, sh, oq, st):
                        nonlocal language
                        language = await _process_user_utterance(
                            speech_data=sd,
                            call_uuid=cu,
                            language=la,
                            session_history=sh,
                            out_queue=oq,
                            state=st,
                        )

                    processing_task = asyncio.create_task(
                        _process_wrapper(speech_data, call_uuid, language, session_history, out_queue, state)
                    )

            elif msg_type == MSG_DTMF:
                digit = payload.decode("ascii", errors="replace") if payload else "?"
                logger.info("AudioSocket: DTMF digit '%s' from %s", digit, call_uuid)

            elif msg_type == MSG_ERROR:
                error_code = payload[0] if payload else 0
                logger.error("AudioSocket: error code %d from %s", error_code, call_uuid)
                break

    except Exception as e:
        logger.exception("AudioSocket: unhandled error for %s: %s", call_uuid, e)

    finally:
        logger.info("AudioSocket: closing connection for %s", call_uuid)
        stop_event.set()
        streamer_task.cancel()
        if processing_task is not None and not processing_task.done():
            try:
                await asyncio.wait_for(asyncio.shield(processing_task), timeout=5.0)
            except Exception:
                processing_task.cancel()
        try:
            writer.close()
            await writer.wait_closed()
        except Exception:
            pass


async def start_audiosocket_server(host: str = "0.0.0.0", port: int = 9092):
    """Start the AudioSocket TCP server."""
    # Pre-warm greeting audio
    await prewarm_greeting()

    server = await asyncio.start_server(
        _handle_audiosocket_connection, host, port
    )
    addrs = ", ".join(str(sock.getsockname()) for sock in server.sockets)
    logger.info("AudioSocket server listening on %s", addrs)
    print(f"[OK] AudioSocket server listening on {addrs}")
    return server
