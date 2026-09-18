"""Orchestrator — single LLM call with tool-calling via Groq API.

Uses the OpenAI-compatible Groq endpoint with llama-3.3-70b-versatile.
Three tools are registered (rag_search, calculate, guardrail_check);
Step 2 uses mocked/canned tool implementations, Steps 3-4 wire in real ones.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from openai import OpenAI

from app.config import get_settings
from app.rag.retriever import rag_search as real_rag_search
from app.services.calculator import safe_calculate
from app.services.guardrails import check_guardrails

logger = logging.getLogger(__name__)

# Model to use — configurable so we can switch if Groq changes availability
LLM_MODEL = "openai/gpt-oss-120b"

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


# ── System prompt ────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are "Dhan Sakhi" (धन सखी), a warm, patient, and trustworthy AI \
financial literacy assistant designed for rural women and individuals \
with limited financial or technical knowledge in India.

CORE RULES:
1. You speak simply and clearly. Avoid jargon. Use everyday examples \
   (farming, household expenses, small business) that your users relate to.
2. You are multilingual. Respond in the SAME language the user speaks. \
   Supported: Hindi, Telugu, Marathi, English.
3. You NEVER make personalized financial promises ("you WILL save ₹X"). \
   Frame everything as general education and guidance.
4. You NEVER do arithmetic yourself. Always use the "calculate" tool for \
   any math — budgets, savings projections, interest estimates, etc.
5. You ground your answers in your knowledge base. Use the "rag_search" \
   tool to retrieve relevant financial literacy content before answering.
6. Before sending any response, run it through the "guardrail_check" tool \
   to verify it doesn't contain unverifiable claims or advice-like language.
7. If you don't know something or the guardrail flags your response, say: \
   "I'm not fully sure about that — let me suggest you speak with a local \
   financial literacy counselor or call the PMJDY helpline."
8. Always be encouraging and supportive. Many of your users are learning \
   about money management for the first time.
9. When a user provides income/expense numbers, help them think about \
   budgeting and saving step by step using the calculate tool.
10. Cite which knowledge-base sources you used, so answers are traceable.

You have access to these tools:
- rag_search(query): Search the financial literacy knowledge base
- calculate(expression): Do deterministic math (budget, savings, interest)

Always use rag_search first for knowledge questions, and calculate for math.
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
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add conversation history (prior turns for session continuity)
    for turn in history[-20:]:  # Keep last 20 turns to stay within context
        messages.append({
            "role": turn["role"],
            "content": turn["text"],
        })

    # Add current user message
    messages.append({
        "role": "user",
        "content": f"[Language: {language}] {text}",
    })

    # ── LLM call with tool-calling loop ──────────────────────────────
    sources: list[str] = []
    flagged = False
    max_tool_rounds = 5  # Safety limit to prevent infinite loops

    for _round in range(max_tool_rounds):
        try:
            response = client.chat.completions.create(
                model=LLM_MODEL,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.3,
                max_tokens=1024,
            )
        except Exception as e:
            logger.error("Groq API error: %s", e)
            return {
                "response_text": (
                    "I'm sorry, I'm having trouble connecting right now. "
                    "Please try again in a moment."
                ),
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
            response_text = message.content or ""
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

            # Track guardrail flags
            if tool_name == "guardrail_check":
                try:
                    parsed = json.loads(tool_result)
                    if parsed.get("flagged", False):
                        flagged = True
                except json.JSONDecodeError:
                    pass

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": tool_result,
            })
    else:
        # Exhausted tool rounds — use last message content
        response_text = message.content or "I need a moment to think about that."

    # Safety: enforce guardrail on final output
    guardrail_result_str = check_guardrails(response_text)
    guardrail_result = json.loads(guardrail_result_str)
    
    if guardrail_result.get("flagged"):
        flagged = True
        logger.warning(f"Final response blocked by guardrails: {guardrail_result.get('reasons')}")
        response_text = (
            "I'm sorry, I cannot fulfill that request as it violates our "
            "safety policies (e.g., sharing sensitive information, unverified "
            "schemes, or medical/legal advice). Please speak with a verified "
            "financial counselor."
        )

    return {
        "response_text": response_text,
        "sources": sources,
        "flagged": flagged,
    }
