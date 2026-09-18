# SH-105 — AI-Powered Financial Empowerment for Rural Women
### Team Master Plan & Execution Doc

---

## 1. Master Prompt (paste this at the top of any AI coding assistant / keep pinned in your group chat)

```
PROJECT: AI-Powered Financial Empowerment Platform for Rural Women (SH-105)

PROBLEM: Rural women and individuals with limited financial/technical literacy
need a way to get personalized financial education, income/expense tracking,
and budgeting/saving/investment guidance — through an interface that requires
ZERO technical skill.

CORE SOLUTION: A phone-call-based conversational AI agent. Users dial a
dedicated number and talk naturally (no app, no smartphone, no literacy
required). The agent is multilingual, context-aware, and grounded in a
curated financial-literacy knowledge base via RAG.

HARD REQUIREMENTS:
- Voice-first, phone-line based (not app/chat first)
- Multilingual, high transcription/response accuracy
- Fully context-aware conversation (no generic/repetitive answers)
- Grounded answers via RAG — minimal hallucination
- Strict behavioral boundaries (financial advice guardrails, no fabricated
  numbers, no unsafe claims)
- Low latency (voice calls die if response takes >2-3s)
- No access to real bank statements/account numbers — privacy-first design,
  user self-reports numbers, nothing sensitive stored in plaintext
- Must degrade gracefully on poor rural network (call quality, SMS fallback)
- Must have a defined "wrong advice" recovery protocol (see Section on false-case handling)

STAKEHOLDERS: Rural women, low-financial-literacy individuals generally.

TEAM: 4 people — 2 frontend (dashboard/admin/demo UI), 2 backend
(voice pipeline + AI/RAG pipeline). Contract-first development: API schema
locked early so both sides build in parallel.

TECH STACK: FastAPI (Python) backend, Twilio/Exotel telephony, Whisper/
Bhashini/Sarvam for multilingual STT+TTS, a vector DB (Chroma) for RAG,
Redis for session/context memory, Postgres for persistent data, single LLM
orchestrator with tool-calling instead of a full multi-agent framework,
Dockerized for consistent local + demo environments.
```

Use this block whenever anyone (or any AI tool) needs full context fast.

---

## 2. System Architecture

Recommendation: **single orchestrator agent with tools**, not a full
multi-agent framework. Reasoning: multi-agent hand-offs (agent-to-agent
messages) add real latency and are hard to debug under hackathon time
pressure. You get the same behavior — bounded, grounded, low-hallucination
responses — by giving **one** LLM call a tight system prompt plus callable
tools. This also directly solves your "advanced: reduce latency" goal,
since one LLM call beats several agents talking to each other.

```
 Phone Call
     │
     ▼
[Telephony Layer: Twilio/Exotel]
     │  (audio stream)
     ▼
[STT: Whisper / Bhashini / Sarvam] ──► transcribed text + detected language
     │
     ▼
[Orchestrator LLM]  ◄──── system prompt: boundaries, tone, persona
     │        │
     │        ├──► Tool: RAG Retriever (vector DB of financial-literacy docs)
     │        ├──► Tool: Calculator (budget math — never let the LLM do math itself)
     │        ├──► Tool: Session Memory (Redis — last N turns + user profile)
     │        └──► Tool: Guardrail Check (flags advice-like claims before they go out)
     │
     ▼
[Response text] ──► [TTS: same provider] ──► audio back to caller
     │
     ▼
[Logging: full transcript + flags → Postgres, for the "false case" protocol]
```

**Why a Calculator tool matters:** LLMs are bad at arithmetic and rural
users will ask real math ("if I save ₹500/month for a year..."). Never let
the model freehand this — call a deterministic function. This alone kills a
large share of hallucination risk.

**Why a Guardrail Check matters:** run every outgoing response through a
lightweight check (rule-based or a cheap second LLM call) for
investment-advice-like language, unverifiable claims, or anything outside
the RAG-retrieved content. If it fails, fall back to a safe canned response
("I'm not fully sure about that — let me connect you with a financial
literacy resource" / log for human follow-up).

**Reducing latency (your stated stretch goal):**
- Stream STT and start LLM inference before the caller finishes speaking (partial transcripts), where your STT provider supports it.
- Stream the LLM's response into TTS sentence-by-sentence instead of waiting for the full response.
- Keep the RAG index small and use a fast embedding model — don't over-engineer retrieval for a hackathon demo.
- Cache embeddings/responses for the most common questions (e.g., "how do I start saving").

---

## 3. False-Case Handling Protocol (your "we can't make excuses" concern)

This is a genuinely good thing to have designed — judges will like seeing
it. Concrete protocol:

1. **Never state a specific financial outcome as certain** ("this will
   definitely help you save ₹X") — always frame guidance as general
   education, not personalized financial promises.
2. **Every response is logged** with the RAG source(s) it was grounded in.
   If a user later says something went wrong, you have a full audit trail.
3. **Escalation path**: if the guardrail check fails, or the user expresses
   confusion/distress, the agent says it will connect them to a human
   resource / local financial literacy helpline (even if you just log a
   ticket in the hackathon demo — show the flow exists).
4. **Correction ability**: if the same user calls back, session memory
   recalls prior context so the agent can say "earlier I mentioned X — here's
   a correction" rather than pretending it never happened.

---

## 4. Recommended Backend Tech Stack

| Layer | Recommendation | Why |
|---|---|---|
| API Framework | **FastAPI** (Python) | async-native, fast to build, auto-generates OpenAPI docs — great for a contract-first team split |
| Telephony | **Twilio** (global, best docs) or **Exotel** (India-native, cheaper for Indian numbers) | both give you a phone number + call webhooks + audio streaming |
| STT/TTS | **Whisper (via API) + a multilingual TTS**, or **Bhashini** (Govt. of India, free, built for Indian regional languages) or **Sarvam AI** (Indian-language-first, low latency) | Bhashini/Sarvam specifically target the Indian-language, rural-accent problem better than generic Whisper |
| LLM | Claude or GPT via API, tool-calling enabled | for the orchestrator agent described above |
| RAG / Vector DB | **ChromaDB** (local, zero-config) | fastest to stand up for a hackathon; Pinecone/Weaviate are overkill here |
| Embeddings | A multilingual embedding model (e.g. `intfloat/multilingual-e5-base`) | your knowledge base and queries will be in regional languages |
| Session/context store | **Redis** | fast, simple key-value for "conversation so far" and rate-limiting |
| Persistent DB | **PostgreSQL** | user profiles, transcripts, flags, audit logs |
| Auth (for frontend dashboard) | JWT via FastAPI's built-in security utils | simple, no need for a full auth provider at hackathon scale |

**Datasets to source (your open item):**
- Financial literacy content: RBI's financial education material, NCFE (National Centre for Financial Education) resources, PMJDY/PFRDA public materials — these are public, India-specific, and exactly what your RAG should be grounded in.
- Conversational/test data: search for multilingual banking/finance QA datasets (e.g. any Indic-language FAQ sets) to test STT accuracy and RAG retrieval before you're demoing live.
- I can pull actual dataset links if you want — just ask and I'll search.

---

## 5. Docker — Yes, Use It (Minimal Setup)

Given none of you know Docker yet, don't try to containerize everything
from day one. Do this instead:

1. Build the FastAPI app locally first, working normally with a Python venv.
2. Once it runs locally, drop in the `docker-compose.yml` below — it wraps
   your existing code, Postgres, and Redis into one `docker compose up`.
3. This is the single highest-leverage thing for your specific
   "frontend/backend integration must be easy" goal — the frontend team
   gets one command that spins up a working backend + DB + cache, no local
   Python/Postgres setup needed on their machines.

```yaml
# docker-compose.yml
version: "3.9"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:password@postgres:5432/sh105
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=sh105
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

That's genuinely the whole learning curve for a hackathon: two files,
`docker compose up`, done.

---

## 6. Backend Work Split (2 people)

### Person A — Voice Pipeline & Telephony
- Set up Twilio/Exotel number + incoming call webhook
- Integrate STT (streaming if possible) and TTS
- Handle call state (start/end, silence detection, reconnect on drop —
  important for your "network issues" challenge)
- Build the audio streaming bridge between telephony and the orchestrator
- Implement graceful degradation: if network drops mid-call, resume session
  from Redis-stored context on reconnect; consider an SMS fallback for very
  poor connections
- Own the `/voice/incoming` and `/voice/status` webhook endpoints

### Person B — AI Orchestrator, RAG & Data
- Build the orchestrator LLM call with tool-calling (RAG tool, calculator
  tool, guardrail tool)
- Stand up ChromaDB, chunk and embed the financial literacy dataset
- Write the system prompt encoding boundaries/tone/persona
- Implement the guardrail check + false-case logging (Section 3)
- Source and clean the test datasets
- Own the `/agent/query` endpoint (text-in/text-out, so it can be tested
  independent of the phone pipeline) and `/user/profile`,
  `/transactions` endpoints for the dashboard

Both of you: agree on the API contract below **before** writing code — that's
what lets you work in parallel without blocking each other, and it's what
the frontend team builds against too.

---

## 7. API Contract (lock this first, across all 4 people)

```
POST /api/v1/voice/incoming        # Twilio/Exotel webhook, call starts
POST /api/v1/voice/status          # call status updates (ringing/completed/failed)

POST /api/v1/agent/query
  body: { session_id: str, text: str, language: str }
  returns: { response_text: str, sources: [str], flagged: bool }
  # this is the core endpoint — works over text so frontend/demo can hit it
  # directly without needing a live phone call

GET  /api/v1/user/{user_id}/profile
POST /api/v1/user/{user_id}/profile

GET  /api/v1/user/{user_id}/transactions
POST /api/v1/user/{user_id}/transactions

GET  /api/v1/session/{session_id}/history
  returns: full conversation log for that session — this is what the
  frontend dashboard displays, and what backs the false-case audit trail
```

FastAPI auto-generates interactive docs (`/docs`) from this — publish that
link to the frontend pair on day one so they can start building against a
mocked version of these responses before the real logic is done.

---

## 8. Suggested First-24-Hours Order of Operations

1. Both backend people: agree on and lock the API contract above (30 min).
2. Person B: stand up FastAPI skeleton with mocked `/agent/query` returning
   canned responses — frontend can integrate against this immediately.
3. Person A: get Twilio/Exotel dialing your number and hitting a "hello
   world" webhook — proves the phone line works end-to-end before anything
   else is built on top of it.
4. Person B: build real RAG + orchestrator behind `/agent/query`, swap out
   the mock.
5. Person A: wire STT/TTS into the call flow, connect to `/agent/query`.
6. Both: integration test — full phone call → STT → orchestrator → TTS → back
   to caller.
7. Add Docker wrapper once the core flow works, so your demo machine is
   reproducible.
8. Reserve the last few hours for the guardrail/false-case demo — judges
   will specifically reward that you thought about failure modes, not just
   the happy path.
