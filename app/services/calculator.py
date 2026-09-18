"""Safe calculator tool using SymPy."""

import json
import logging
import sympy

logger = logging.getLogger(__name__)

def safe_calculate(expression: str) -> str:
    """
    Safely evaluate a mathematical expression.
    Returns the result or an error message formatted as JSON.
    """
    try:
        # SymPy's sympify safely parses and evaluates mathematical expressions
        # evaluate=True evaluates the expression immediately
        result = sympy.sympify(expression, evaluate=True)
        
        # Convert to float for practical currency/financial calculations
        # if it's a number, otherwise leave it as a string
        if result.is_number:
            numeric_result = float(result)
            return json.dumps({"result": numeric_result})
        else:
            return json.dumps({"result": str(result)})
            
    except Exception as e:
        logger.warning(f"Calculator failed to parse expression '{expression}': {e}")
        return json.dumps({"error": "Invalid mathematical expression."})
