"""Guardrail tool for safety checking."""

import json
import logging
import re

logger = logging.getLogger(__name__)

# Basic safety patterns for the hackathon (zero-cost local check)
UNSAFE_PATTERNS = [
    # Scams or get rich quick
    r"(?i)\b(double your money|get rich quick|lottery|free money|crypto|bitcoin|guaranteed returns)\b",
    
    # Financial advice disclaimers (detecting if the agent is trying to act as a certified planner)
    r"(?i)\b(I am a financial advisor|buy this stock|invest in exactly)\b",
    
    # PII extraction (asking for sensitive details)
    r"(?i)\b(send me your OTP|what is your ATM PIN|share your password|CVV)\b",
    
    # Out of scope topics (medical, legal)
    r"(?i)\b(take this medicine|sue them|divorce|cure for)\b"
]

def check_guardrails(draft_response: str) -> str:
    """
    Check the drafted response for safety and policy violations.
    Returns JSON with flagged status and reasons.
    """
    reasons = []
    
    for pattern in UNSAFE_PATTERNS:
        match = re.search(pattern, draft_response)
        if match:
            reasons.append(f"Matched unsafe pattern: {match.group(0)}")
            
    is_flagged = len(reasons) > 0
    
    if is_flagged:
        logger.warning(f"Guardrail flagged response. Reasons: {reasons}")
    
    return json.dumps({
        "flagged": is_flagged,
        "reasons": reasons,
        "safe": not is_flagged
    })
