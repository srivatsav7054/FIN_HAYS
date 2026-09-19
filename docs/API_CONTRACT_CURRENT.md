# SH-105 API Contract — Current Live Backend Specification
> **Status:** Authoritative Single Source of Truth  
> **Source:** Extracted directly from live FastAPI codebase (`app/main.py`, `app/routers/`, `app/models/schemas.py`) and verified against the running server on `http://127.0.0.1:8000`.  
> **Target Audience:** Frontend Team (Web UI, Mobile App, Admin Dashboard, Telephony Integration).

---

## 🚨 BREAKING — Update These First

If the frontend was written against the early speculative master plan (Section 7 of `SH-105_master_plan.md`), notice these critical discrepancies immediately:

1. **`POST /api/v1/voice/incoming` & `POST /api/v1/voice/status` DO NOT EXIST over HTTP**
   - **Reason:** Telephony integration was implemented using direct Asterisk PBX with **AudioSocket TCP protocol** on raw TCP port `9092` (`app/telephony/audiosocket.py`), not HTTP webhook streaming (Twilio/Exotel).
   - **Impact:** Any frontend mock or webhook handler polling or calling `/api/v1/voice/incoming` or `/voice/status` will receive a `404 Not Found`.

2. **`POST /api/v1/voice/pipeline` is the Primary Voice Endpoint for Frontend Apps**
   - **What to use:** Web/mobile clients that record voice locally should send base64 audio directly to `POST /api/v1/voice/pipeline`. It runs STT -> LLM/RAG/Tools -> TTS and returns the transcribed text, assistant text, and synthesized base64 audio in a single synchronous roundtrip.

3. **`GET /api/v1/session/{session_id}/history` Return Shape is Wrapped**
   - The master plan noted: `returns: full conversation log for that session`.
   - **Real Shape:** It does **NOT** return a bare array `[...]`. It returns a dictionary object:
     ```json
     {
       "session_id": "string",
       "turns": [ ... ]
     }
     ```
   - Make sure your frontend state unpacks `response.data.turns`.

4. **`GET /api/v1/user/{user_id}/transactions` Return Shape is a List**
   - Returns a top-level JSON array `Transaction[]` (e.g. `[ { "id": "...", ... } ]`), whereas `/history` returns an object.

---

## 📋 Changes from the Original Plan

| # | Endpoint / Area | Original Spec (Master Plan §7) | Actual Implementation | Why It Shifted |
|---|---|---|---|---|
| 1 | `POST /api/v1/voice/pipeline` | *Not in original spec* | **Added** (`session_id`, `audio_base64`, `language`) -> (`transcribed_text`, `response_text`, `audio_base64`, `sources`, `flagged`, `detected_language`) | Added so frontend web/mobile clients can do complete voice conversations without placing an actual cellular phone call. |
| 2 | `POST /api/v1/voice/stt` | *Not in original spec* | **Added** (`multipart/form-data` with `audio` file and optional `language` form field) -> `{"text": str, "language": str}` | Allows client-side modular transcription (e.g., live voice transcription box). |
| 3 | `POST /api/v1/voice/tts` | *Not in original spec* | **Added** (`{"text": str, "language": str}`) -> binary stream (`audio/mpeg`, `attachment; filename=response.mp3`) | Allows client-side reading out of UI cards or notifications. |
| 4 | `POST /api/v1/voice/incoming` | Planned for Twilio/Exotel | **Omitted from HTTP**; replaced by AudioSocket TCP server on `0.0.0.0:9092` | Switched to Asterisk PBX with AudioSocket for zero-cost SIP telephony with softphones (Linphone/Zoiper). |
| 5 | `POST /api/v1/voice/status` | Planned for Twilio/Exotel | **Omitted from HTTP** | Asterisk handles call state internally without webhook callbacks. |
| 6 | `GET /` | *Not specified* | **Added** -> `{"status": "ok", "project": "SH-105", "step": "..."}` | Root health check for devops and connectivity checks. |
| 7 | `Transaction.id` | Handled on backend | Client can pass custom `id` or leave empty (backend assigns UUID if blank). | Allows optimistic client-side ID generation. |

---

## 🔍 Schema Inconsistencies & OpenAPI Discrepancies (Flagged for Visibility)

1. **`POST /api/v1/voice/stt` Response Model:**
   - In `app/routers/voice.py`, `stt_endpoint` returns a raw `dict` from `transcribe_audio(...)` without an explicit `response_model`.
   - **OpenAPI Schema:** Shows `schema: {}` (untyped object).
   - **Actual Runtime Shape:** Guaranteed to return:
     ```json
     {
       "text": "string",
       "language": "string"
     }
     ```
     *(If failed: `{"text": "", "language": "...", "error": "message"}`)*.
   - *Recommendation:* Frontend should type this response as `{ text: string; language: string; error?: string }`.

2. **`POST /api/v1/voice/tts` Response Model:**
   - Returns a raw FastAPI `Response(content=audio_bytes, media_type="audio/mpeg")`.
   - **OpenAPI Schema:** Shows `application/json: {}`.
   - **Actual Runtime Behavior:** Binary audio stream with header `Content-Type: audio/mpeg`. Frontend should consume as `blob` / `ArrayBuffer`.

---

## 🛠️ Complete Endpoint Reference

Base URL: `http://<HOST>:8000` (e.g., `http://127.0.0.1:8000` or `http://192.168.137.52:8000`)

---

### 1. Agent Query (Text-in, Text-out with RAG & Guardrails)
- **Method:** `POST`
- **Path:** `/api/v1/agent/query`
- **Description:** Submit user text query to the Dhan Sakhi financial agent. Runs through Groq LLM (LLaMA 3.3 70B), queries ChromaDB RAG, executes Python math calculator if needed, enforces guardrails, and stores conversation turns in SQLite.

#### Request Body (`application/json`)
| Field | Type | Required? | Default | Description |
|---|---|---|---|---|
| `session_id` | `string` | **Yes** | — | Unique session identifier for maintaining multi-turn memory |
| `text` | `string` | **Yes** | — | User's question or statement in natural language |
| `language` | `string` | No | `"en"` | Language code (`"hi"`, `"en"`, `"te"`, `"mr"`) |

#### Response (`200 OK`, `application/json`)
| Field | Type | Required? | Description |
|---|---|---|---|
| `response_text` | `string` | **Yes** | Agent's empathetic, plain-language financial literacy advice |
| `sources` | `string[]` | **Yes** | List of retrieved RAG knowledge document filenames (e.g. `["government_schemes_ssy.md"]`) |
| `flagged` | `boolean` | **Yes** | `true` if response was intercepted or flagged by guardrail check |

#### Real Example
**Request:**
```http
POST /api/v1/agent/query HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json

{
  "session_id": "sess_real_rag",
  "text": "What is Sukanya Samriddhi Yojana?",
  "language": "en"
}
```

**Response (`200 OK`):**
```json
{
  "response_text": "**Sukanya Samriddhi Yojana (SSY)** is a special savings account opened by the **government of India** for the **girl child** in a family.  \n\n- **Who can open it?**  \n  - The mother or father (or legal guardian) of a girl who is **under 10 years old**.  \n  - One account can be opened for each girl in the family.\n\n- **Why is it useful?**  \n  - It helps families **save money early** for the girl’s future education, higher studies, or marriage.  \n  - The account earns a **higher interest rate** than most regular savings accounts, and the interest is **tax-free**.\n\n- **How does it work?**  \n  1. **Deposit:** You can put as little as **₹250** in a month, and up to **₹1.5 lakh** in a year.  \n  2. **Interest:** The bank adds interest every quarter.  \n  3. **Lock-in period:** The money stays locked until the girl turns **10 years old**, or up to age 21.\n\n- **How to start:** Visit any bank or post office with the girl's birth certificate and parents' Aadhaar.",
  "sources": [
    "government_schemes_ssy.md",
    "government_schemes_pmjdy.md"
  ],
  "flagged": false
}
```

---

### 2. User Profile — Retrieve
- **Method:** `GET`
- **Path:** `/api/v1/user/{user_id}/profile`
- **Description:** Retrieve user profile information including preferred language, income, expenses, and savings goal.

#### Path Parameters
| Parameter | Type | Required? | Description |
|---|---|---|---|
| `user_id` | `string` | **Yes** | The user identifier (e.g. `u_demo_101`) |

#### Response (`200 OK`, `application/json`)
| Field | Type | Required? | Description |
|---|---|---|---|
| `user_id` | `string` | **Yes** | User identifier |
| `name` | `string` | **Yes** | Full name of the user |
| `preferred_language` | `string` | **Yes** | Language code (default `"en"`) |
| `phone_number` | `string` | **Yes** | Contact phone number |
| `monthly_income` | `number` (float) | **Yes** | Monthly income in INR |
| `monthly_expenses` | `number` (float) | **Yes** | Monthly expenses in INR |
| `savings_goal` | `number` (float) | **Yes** | Target savings amount in INR |

*(Error: `404 Not Found` with `{"detail": "User not found"}` if user does not exist).*

#### Real Example
**Request:**
```http
GET /api/v1/user/u_demo_101/profile HTTP/1.1
Host: 127.0.0.1:8000
```

**Response (`200 OK`):**
```json
{
  "user_id": "u_demo_101",
  "name": "Sunita Devi",
  "preferred_language": "hi",
  "phone_number": "+919876543210",
  "monthly_income": 15000.0,
  "monthly_expenses": 9000.0,
  "savings_goal": 3000.0
}
```

---

### 3. User Profile — Create / Update (Upsert)
- **Method:** `POST`
- **Path:** `/api/v1/user/{user_id}/profile`
- **Description:** Create or update a user profile. If user exists, updates all fields; if not, inserts a new record.

#### Path Parameters
| Parameter | Type | Required? | Description |
|---|---|---|---|
| `user_id` | `string` | **Yes** | Must match `user_id` in request body |

#### Request Body (`application/json`)
| Field | Type | Required? | Default | Description |
|---|---|---|---|---|
| `user_id` | `string` | **Yes** | — | Unique user ID |
| `name` | `string` | No | `""` | User's full name |
| `preferred_language` | `string` | No | `"en"` | Primary language code (`"hi"`, `"te"`, `"mr"`, `"en"`) |
| `phone_number` | `string` | No | `""` | User's phone number |
| `monthly_income` | `number` (float) | No | `0.0` | Self-reported monthly income |
| `monthly_expenses` | `number` (float) | No | `0.0` | Self-reported monthly expenses |
| `savings_goal` | `number` (float) | No | `0.0` | Target savings goal |

#### Response (`200 OK`, `application/json`)
Returns the persisted `UserProfile` object.

#### Real Example
**Request:**
```http
POST /api/v1/user/u_demo_101/profile HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json

{
  "user_id": "u_demo_101",
  "name": "Sunita Devi",
  "preferred_language": "hi",
  "phone_number": "+919876543210",
  "monthly_income": 15000.0,
  "monthly_expenses": 9000.0,
  "savings_goal": 3000.0
}
```

**Response (`200 OK`):**
```json
{
  "user_id": "u_demo_101",
  "name": "Sunita Devi",
  "preferred_language": "hi",
  "phone_number": "+919876543210",
  "monthly_income": 15000.0,
  "monthly_expenses": 9000.0,
  "savings_goal": 3000.0
}
```

---

### 4. Transactions — List
- **Method:** `GET`
- **Path:** `/api/v1/user/{user_id}/transactions`
- **Description:** Returns all logged income/expense transactions for a user, sorted by date descending.

#### Path Parameters
| Parameter | Type | Required? | Description |
|---|---|---|---|
| `user_id` | `string` | **Yes** | Target user ID |

#### Response (`200 OK`, `application/json`)
Returns top-level JSON array `Transaction[]`.

| Field | Type | Required? | Description |
|---|---|---|---|
| `id` | `string` | **Yes** | Unique transaction ID |
| `date` | `string` | **Yes** | ISO date/timestamp string (e.g. `"2026-09-19T02:50:00Z"`) |
| `type` | `string` (`"income"` \| `"expense"`) | **Yes** | Transaction type enum |
| `category` | `string` | **Yes** | Category name (e.g. `"Groceries"`, `"Dairy Sales"`) |
| `amount` | `number` (float) | **Yes** | Monetary amount in INR |
| `note` | `string` | **Yes** | Optional note or details |

#### Real Example
**Request:**
```http
GET /api/v1/user/u_demo_101/transactions HTTP/1.1
Host: 127.0.0.1:8000
```

**Response (`200 OK`):**
```json
[
  {
    "id": "tx_001",
    "date": "2026-09-19T02:50:00Z",
    "type": "expense",
    "category": "Groceries",
    "amount": 450.0,
    "note": "Weekly vegetables"
  }
]
```

---

### 5. Transactions — Create
- **Method:** `POST`
- **Path:** `/api/v1/user/{user_id}/transactions`
- **Description:** Record a new income or expense transaction for a user.

#### Path Parameters
| Parameter | Type | Required? | Description |
|---|---|---|---|
| `user_id` | `string` | **Yes** | Target user ID |

#### Request Body (`application/json`)
| Field | Type | Required? | Default | Description |
|---|---|---|---|---|
| `id` | `string` | No | `""` | Optional ID. If omitted or empty, backend generates a UUID. |
| `date` | `string` | No | `""` | ISO timestamp string (e.g. `"2026-09-19T02:50:00Z"`) |
| `type` | `string` (`"income"` \| `"expense"`) | **Yes** | — | Must be `"income"` or `"expense"` |
| `category` | `string` | No | `""` | Category label |
| `amount` | `number` (float) | No | `0.0` | Monetary value |
| `note` | `string` | No | `""` | Optional note |

#### Response (`200 OK`, `application/json`)
Returns the persisted `Transaction` object with its generated or supplied `id`.

#### Real Example
**Request:**
```http
POST /api/v1/user/u_demo_101/transactions HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json

{
  "id": "tx_001",
  "date": "2026-09-19T02:50:00Z",
  "type": "expense",
  "category": "Groceries",
  "amount": 450.0,
  "note": "Weekly vegetables"
}
```

**Response (`200 OK`):**
```json
{
  "id": "tx_001",
  "date": "2026-09-19T02:50:00Z",
  "type": "expense",
  "category": "Groceries",
  "amount": 450.0,
  "note": "Weekly vegetables"
}
```

---

### 6. Session History (Audit Trail)
- **Method:** `GET`
- **Path:** `/api/v1/session/{session_id}/history`
- **Description:** Retrieve the full conversational history and audit trail for a session, including user turns, agent turns, timestamps, and guardrail flags.

#### Path Parameters
| Parameter | Type | Required? | Description |
|---|---|---|---|
| `session_id` | `string` | **Yes** | Target session ID |

#### Response (`200 OK`, `application/json`)
| Field | Type | Required? | Description |
|---|---|---|---|
| `session_id` | `string` | **Yes** | Session identifier |
| `turns` | `ConversationTurn[]` | **Yes** | Array of conversational turns |
| `turns[].role` | `string` | **Yes** | `"user"` or `"assistant"` |
| `turns[].text` | `string` | **Yes** | Message text |
| `turns[].timestamp` | `string` | **Yes** | ISO-8601 UTC timestamp |
| `turns[].flagged` | `boolean` | **Yes** | `true` if this turn was flagged by guardrails |

#### Real Example
**Request:**
```http
GET /api/v1/session/sess_real_rag/history HTTP/1.1
Host: 127.0.0.1:8000
```

**Response (`200 OK`):**
```json
{
  "session_id": "sess_real_rag",
  "turns": [
    {
      "role": "user",
      "text": "What is Sukanya Samriddhi Yojana?",
      "timestamp": "2026-09-18T21:26:15.340618+00:00",
      "flagged": false
    },
    {
      "role": "assistant",
      "text": "**Sukanya Samriddhi Yojana (SSY)** is a special savings account opened by the **government of India** for the **girl child** in a family...",
      "timestamp": "2026-09-18T21:26:18.046563+00:00",
      "flagged": false
    }
  ]
}
```

---

### 7. Voice Pipeline (End-to-End Voice In / Voice Out)
- **Method:** `POST`
- **Path:** `/api/v1/voice/pipeline`
- **Description:** Web/mobile full voice conversation turn. Takes recorded base64 audio, executes Groq Whisper STT, runs Groq Orchestrator + RAG + Calculator, synthesizes natural neural speech with `edge-tts`, and returns both text and base64-encoded MP3 audio.

#### Request Body (`application/json`)
| Field | Type | Required? | Default | Description |
|---|---|---|---|---|
| `session_id` | `string` | **Yes** | — | Conversation session ID |
| `audio_base64` | `string` | **Yes** | — | Base64-encoded audio (WAV, MP3, WEBM, OGG, etc.) |
| `language` | `string` | No | `"hi"` | Expected language hint (`"hi"`, `"te"`, `"mr"`, `"en"`) |

#### Response (`200 OK`, `application/json`)
| Field | Type | Required? | Description |
|---|---|---|---|
| `transcribed_text` | `string` | **Yes** | What the user said (from Whisper STT) |
| `response_text` | `string` | **Yes** | Agent's response text |
| `audio_base64` | `string` | **Yes** | Base64-encoded MP3 audio of the agent's voice response |
| `sources` | `string[]` | **Yes** | RAG source documents used |
| `flagged` | `boolean` | **Yes** | `true` if guardrails intervened |
| `detected_language` | `string` | **Yes** | Language detected or used |

#### Real Example
**Request:**
```http
POST /api/v1/voice/pipeline HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json

{
  "session_id": "sess_pipe_test",
  "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA...",
  "language": "hi"
}
```

**Response (`200 OK`):**
```json
{
  "transcribed_text": "नमस्ते मुझे बचत खाते के बारे में जानना है",
  "response_text": "नमस्ते! मैं धन सखी हूँ—आपकी वित्तीय जानकारी में मदद करने वाली दोस्त। आप जो भी सवाल पूछना चाहें—बजट बनाना, बचत के उपाय, छोटे व्यापार की योजना—मैं सरल भाषा में समझाने की कोशिश करूँगी। बताइए, आज मैं आपकी किस बात में मदद कर सकती हूँ?",
  "audio_base64": "//NkxAAAAANIAAAAAExBTUVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVV...",
  "sources": [],
  "flagged": false,
  "detected_language": "hi"
}
```

---

### 8. Voice STT (Audio Transcription Only)
- **Method:** `POST`
- **Path:** `/api/v1/voice/stt`
- **Description:** Standalone transcription endpoint. Upload an audio file and receive transcribed text and detected language via Groq Whisper.

#### Request (`multipart/form-data`)
| Field | Type | Required? | Default | Description |
|---|---|---|---|---|
| `audio` | `File` (binary) | **Yes** | — | Audio file (WAV, MP3, FLAC, M4A, OGG, WEBM) |
| `language` | `string` (Form) | No | `""` | Optional ISO language code (e.g. `"hi"`, `"en"`) |

#### Response (`200 OK`, `application/json`)
```json
{
  "text": "string",
  "language": "string"
}
```

#### Real Example
**Request:**
```http
POST /api/v1/voice/stt HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryX

------WebKitFormBoundaryX
Content-Disposition: form-data; name="audio"; filename="sample.wav"
Content-Type: audio/wav

[BINARY WAV DATA]
------WebKitFormBoundaryX
Content-Disposition: form-data; name="language"

hi
------WebKitFormBoundaryX--
```

**Response (`200 OK`):**
```json
{
  "text": "नमस्ते मुझे बचत खाते के बारे में जानना है",
  "language": "hi"
}
```

---

### 9. Voice TTS (Text-to-Speech Synthesis Only)
- **Method:** `POST`
- **Path:** `/api/v1/voice/tts`
- **Description:** Standalone speech synthesis endpoint. Takes text and language and streams back MP3 audio.

#### Request Body (`application/json`)
| Field | Type | Required? | Default | Description |
|---|---|---|---|---|
| `text` | `string` | **Yes** | — | Text to synthesize |
| `language` | `string` | No | `"hi"` | Voice language (`"hi"`, `"en"`, `"te"`, `"mr"`, `"ta"`, `"kn"`, `"bn"`, `"gu"`) |

#### Response (`200 OK`, `audio/mpeg`)
- **Headers:**
  - `Content-Type: audio/mpeg`
  - `Content-Disposition: attachment; filename=response.mp3`
- **Body:** Raw binary MP3 audio bytes.

#### Real Example
**Request:**
```http
POST /api/v1/voice/tts HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json

{
  "text": "नमस्ते! धन सखी में आपका स्वागत है।",
  "language": "hi"
}
```

**Response (`200 OK`):**
- Status: `200 OK`
- Content-Type: `audio/mpeg`
- Bytes: Binary MP3 stream (playable directly in HTML `<audio>` tag).

---

### 10. Health Check
- **Method:** `GET`
- **Path:** `/`
- **Description:** Verifies server is active and reports project step.

#### Response (`200 OK`, `application/json`)
```json
{
  "status": "ok",
  "project": "SH-105",
  "step": "6 — AudioSocket integrated"
}
```

---

## 📞 Telephony Note for Frontend Team

If building an in-browser SIP softphone or Linphone mobile bridge:
- **SIP Registrar / Proxy:** `<HOST_IP>:5060` (UDP)
- **Test Extensions:**
  - `1001` (password: `sh105pass`)
  - `1002` (password: `sh105pass`)
- **Agent Dial Extension:** Dial **`3532`** (`DHAN` on keypad) to connect directly to the AI agent over the phone line.
- The telephony backend runs Asterisk in Docker and bridges calls to the Python backend over **AudioSocket TCP port 9092**.

---

## 📝 Document Changelog
- **Version:** `1.0.0`
- **Date:** `2026-09-19`
- **Generated From:** Live codebase (`app/main.py`, `app/routers/`, `app/models/schemas.py`) and live HTTP requests to `http://127.0.0.1:8000`.
- **Author:** SH-105 Backend Engineering Team
