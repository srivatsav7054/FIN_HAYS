"""Orchestrator — single LLM call with tool-calling via Groq API.

Uses the OpenAI-compatible Groq endpoint.
Two tools are registered (rag_search, calculate).
Focused on Hindi and English financial guidance only.
"""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any

from openai import OpenAI

from app.config import get_settings
from app.rag.retriever import rag_search as real_rag_search
from app.services.calculator import safe_calculate
from app.services.guardrails import check_guardrails

logger = logging.getLogger(__name__)

# Primary model — fast and multilingual on Groq
LLM_MODEL = "qwen/qwen3.8-27b"

# ── Groq client (OpenAI-compatible) ─────────────────────────────────────

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    """Lazy-init the Groq client so import doesn't fail without a key."""
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


# ── System prompt ────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are "Dhan Sakhi" (धन सखी), a warm, patient, and trustworthy AI \
financial literacy guide speaking on a real-time phone call \
with rural women and low-literacy citizens across India.

CRITICAL VOICE & CONVERSATIONAL RULES (HARD BOUNDARIES):
1. BREVITY: Keep your answer to 2-3 SHORT sentences (under 40 words total) \
   unless the caller explicitly asks for more detail ("tell me more", "explain further", "विस्तार से बताओ").
2. DIRECT ANSWER FIRST: Answer the question directly in the very first sentence. \
   Never repeat or paraphrase the caller's question. No polite filler or preamble \
   such as "That is a good question" or "Sure, I can help you with that".
3. STRICT RAG GROUNDING BOUNDARY (NO SPECULATION / NO UNGROUNDED GUESSES):
   - Always call "rag_search" to find verified facts before answering knowledge questions.
   - Ground your answer strictly in the facts returned by "rag_search".
   - If the caller asks about a topic that has NO verified information in the knowledge base, \
     you MUST NEVER invent, guess, or pull from unverified general knowledge.
   - In that case, use this EXACT plain, respectful refusal in the caller's language:
     • Hindi: "माफ़ कीजिए, मुझे इसके बारे में पक्की जानकारी नहीं है। सही मदद के लिए आप अपने पास के बैंक मित्र या बैंक जाकर पूछ सकते हैं।"
     • English: "I am sorry, I do not have clear information on that. Please speak with your local Bank Mitra or visit your nearby bank branch to get help."
4. LOW-LITERACY SIMPLIFICATION & RELATABLE COMPARISONS:
   - Use simple, everyday spoken words. Strictly avoid financial jargon.
   - Use relatable rural comparisons:
     • Compare regular saving to setting aside a fistful of grain daily (रोज मुट्ठी भर अनाज).
     • Compare bank interest to a seed growing into a crop with water.
     • Compare a bank account to a safe locker in the village post office.
5. STRICT LANGUAGE MATCHING:
   - Always respond in the EXACT language of the user: Hindi or English.
   - If user speaks Hindi, reply ONLY in Hindi (Devanagari script).
   - If user speaks English, reply ONLY in English.
6. NO MENTAL MATH & NO FALSE GUARANTEES:
   - Never guarantee outcomes or speculate on earnings.
   - Always call the "calculate" tool for any arithmetic. Never calculate numbers in your head.
7. PHONETIC RESILIENCE & NEVER REJECT FINANCIAL QUESTIONS:
   - Spoken telephony audio often has transcription errors.
   - If the caller mentions money, saving, bank, loan, rupees, or accounts even with imperfect words, \
     ALWAYS answer the financial question helpfully using verified knowledge!
   - NEVER trigger the "समझ नहीं आई" refusal if there is ANY financial intent or mention of money.

FEW-SHOT EXAMPLES:

Example 1 (Hindi - PMJDY):
User: जन धन खाता कैसे खोलें?
Dhan Sakhi: जन धन खाता किसी भी बैंक में बिना किसी पैसे के खुलता है। बस आधार कार्ड और एक फोटो लेकर जाएं, इसमें 2 लाख का मुफ्त दुर्घटना बीमा भी मिलता है।

Example 2 (English - FD):
User: What is a fixed deposit?
Dhan Sakhi: A fixed deposit lets you keep money in the bank for a set time and earn higher interest than a savings account. Your money stays completely safe, like grain stored in a locked room.

Example 3 (Hindi - noisy input):
User: प्राश शौर रुपए क्या करना?
Dhan Sakhi: अगर आपके पास पैसे हैं, तो आप इसे बचत खाते या डाकघर में जमा कर सकते हैं। वहाँ पैसा सुरक्षित रहेगा और ब्याज भी मिलेगा।

Example 4 (English - Out of scope):
User: Should I invest in Bitcoin?
Dhan Sakhi: I am sorry, I do not have clear information on that. Please speak with your local Bank Mitra or visit your nearby bank branch to get help.

Example 5 (Hindi - Unintelligible):
User: अ ब स
Dhan Sakhi: नमस्ते, मुझे आपकी बात साफ समझ नहीं आई। कृपया दोबारा कहें।
"""

# ── Tool definitions (OpenAI function-calling format) ────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "rag_search",
            "description": (
                "Search the financial literacy knowledge base for relevant "
                "information. Use this before answering any knowledge question."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query in the user's language.",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": (
                "Perform deterministic arithmetic for budgeting, savings "
                "projections, interest calculations, etc. The LLM must NEVER "
                "do math itself — always call this tool."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": (
                            "A math expression or description like "
                            "'8000 - 5500' or 'monthly_savings=2500, months=12, total=?'"
                        ),
                    }
                },
                "required": ["expression"],
            },
        },
    },
]

# ── Tool dispatcher ─────────────────────────────────────────────────────

_TOOL_HANDLERS: dict[str, Any] = {
    "rag_search": lambda args: real_rag_search(args.get("query", "")),
    "calculate": lambda args: safe_calculate(args.get("expression", "")),
}


def _execute_tool(name: str, arguments: str) -> str:
    """Parse tool arguments and dispatch to the handler."""
    try:
        args = json.loads(arguments)
    except json.JSONDecodeError:
        args = {"raw": arguments}

    handler = _TOOL_HANDLERS.get(name)
    if handler is None:
        return json.dumps({"error": f"Unknown tool: {name}"})

    result = handler(args)
    logger.info("Tool %s called with %s -> %s", name, args, result[:200])
    return result


# ── Main orchestrator ────────────────────────────────────────────────────

def run_orchestrator(
    text: str,
    language: str,
    history: list[dict],
) -> dict:
    """Run the orchestrator pipeline with Groq LLM + tool-calling.

    Returns:
        {
            "response_text": str,
            "sources": list[str],
            "flagged": bool,
        }
    """
    client = _get_client()

    # ── Build message history ────────────────────────────────────────
    lang_name = "Hindi" if language == "hi" else "English"
    script_instruction = "Devanagari Hindi script (हिन्दी)" if language == "hi" else "clear simple English"

    dynamic_sys_prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"═══════════════════════════════════════════════════════════════\n"
        f"CRITICAL LANGUAGE & SCRIPT ENFORCEMENT FOR THIS TURN:\n"
        f"User is speaking: {lang_name.upper()} (code: '{language}').\n"
        f"1. You MUST formulate your entire response in {lang_name.upper()} ONLY.\n"
        f"2. You MUST write in {script_instruction}.\n"
        f"3. Do NOT answer in Hindi if user spoke English, and vice versa.\n"
        f"═══════════════════════════════════════════════════════════════"
    )

    messages = [{"role": "system", "content": dynamic_sys_prompt}]

    # Add conversation history (last 6 turns for context)
    for turn in history[-6:]:
        turn_text = turn.get("text", "")
        messages.append({
            "role": turn["role"],
            "content": turn_text,
        })

    # Add current user message
    messages.append({
        "role": "user",
        "content": text,
    })

    # ── LLM call with tool-calling loop ──────────────────────────────
    sources: list[str] = []
    flagged = False
    max_tool_rounds = 5  # Safety limit to prevent infinite loops

    for _round in range(max_tool_rounds):
        # Retry with exponential backoff for Groq rate limits (429)
        last_error = None
        for _retry in range(4):  # up to 3 retries (4 attempts total)
            try:
                response = client.chat.completions.create(
                    model=LLM_MODEL,
                    messages=messages,
                    tools=TOOLS,
                    tool_choice="auto",
                    temperature=0.3,
                    max_tokens=300,
                )
                last_error = None
                break  # success
            except Exception as e:
                last_error = e
                err_str = str(e)
                # Retry on rate limit (429) or server errors (5xx)
                if "429" in err_str or "rate_limit" in err_str.lower() or "502" in err_str or "503" in err_str:
                    wait = (2 ** _retry) + 0.5  # 1.5s, 2.5s, 4.5s, 8.5s
                    logger.warning("Groq rate-limited (attempt %d/4), retrying in %.1fs: %s", _retry + 1, wait, err_str[:100])
                    time.sleep(wait)
                else:
                    # Non-retryable error (auth, bad request, etc.)
                    logger.error("Groq API error (non-retryable): %s", e)
                    break

        if last_error is not None:
            logger.error("Groq API failed after retries: %s", last_error)
            # Return language-appropriate error message
            if language == "hi":
                error_text = "माफ़ कीजिए, अभी कुछ तकनीकी दिक्कत है। कृपया थोड़ी देर बाद दोबारा कॉल करें।"
            else:
                error_text = "I am sorry, there is a technical issue right now. Please try calling again shortly."
            return {
                "response_text": error_text,
                "sources": [],
                "flagged": False,
            }

        choice = response.choices[0]
        message = choice.message

        logger.info(
            "Round %d: finish_reason=%s, has_tool_calls=%s, content_len=%s",
            _round,
            choice.finish_reason,
            bool(message.tool_calls),
            len(message.content or ""),
        )

        # If no tool calls, we have the final response
        if not message.tool_calls:
            raw_content = message.content or ""
            # Strip Qwen thinking tokens FIRST before anything else
            response_text = _strip_thinking(raw_content)
            if not response_text:
                # Edge case: model produced only thinking tokens with no actual answer
                response_text = raw_content
            logger.info("LLM raw length=%d, after strip_thinking length=%d", len(raw_content), len(response_text))
            break

        # Process tool calls
        messages.append(message)  # Add assistant message with tool calls

        for tool_call in message.tool_calls:
            tool_name = tool_call.function.name
            tool_args = tool_call.function.arguments
            logger.info("  Tool call: %s(%s)", tool_name, tool_args[:200])
            tool_result = _execute_tool(tool_name, tool_args)

            # Track sources from RAG results
            if tool_name == "rag_search":
                try:
                    parsed = json.loads(tool_result)
                    for r in parsed.get("results", []):
                        src = r.get("source", "")
                        if src and src not in sources:
                            sources.append(src)
                except json.JSONDecodeError:
                    pass

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": tool_result,
            })
    else:
        # Exhausted tool rounds — use last message content
        raw_content = message.content or ""
        response_text = _strip_thinking(raw_content)
        if not response_text:
            response_text = raw_content
        if not response_text:
            if language == "hi":
                response_text = "माफ़ कीजिए, कृपया दोबारा कहें।"
            else:
                response_text = "I am sorry, could you please say that again?"

    # ── Clean formatting artifacts ────────────────────────────────────
    # Strip markdown headers, bold prefixes, asterisks, quotes
    response_text = re.sub(r"^\s*(\*\*[^*]+\*\*|Transcript:|Response:)\s*", "", response_text, flags=re.IGNORECASE).strip()
    response_text = re.sub(r"[*#_`]", "", response_text).strip()
    # Strip any remaining XML-like tags (e.g. leftover <think> fragments)
    response_text = re.sub(r"<[^>]+>", "", response_text).strip()

    # Safety: enforce guardrail on final output
    is_detailed = any(w in text.lower() for w in ["tell me more", "explain further", "detail", "विस्तार", "more details"])
    guardrail_result_str = check_guardrails(response_text, is_detailed_request=is_detailed)
    guardrail_result = json.loads(guardrail_result_str)
    
    if guardrail_result.get("flagged"):
        flagged = True
        logger.warning(f"Final response blocked by guardrails: {guardrail_result.get('reasons')}")
        has_unsafe_pattern = any("Matched unsafe pattern" in r for r in guardrail_result.get("reasons", []))
        if has_unsafe_pattern:
            if language == "hi":
                response_text = "माफ़ कीजिए, मैं इस विषय पर मदद नहीं कर सकती। कृपया अपने बैंक मित्र से बात करें।"
            else:
                response_text = "I am sorry, I cannot help with that topic. Please speak with your local Bank Mitra."

    # Script safety: ensure Hindi response has Devanagari, else replace
    if language == "hi":
        has_devanagari = any(0x0900 <= ord(c) <= 0x097F for c in response_text)
        if not has_devanagari and response_text:
            logger.warning("LLM produced non-Hindi response for Hindi session: '%s'", response_text[:80])
            response_text = "नमस्ते, मुझे आपकी बात साफ समझ नहीं आई। कृपया दोबारा कहें।"

    return {
        "response_text": response_text,
        "sources": sources,
        "flagged": flagged,
    }
