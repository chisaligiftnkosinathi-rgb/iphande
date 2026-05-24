from typing import Any, Dict, Tuple

def validate_required_variables(template: Dict[str, Any], context: Dict[str, Any]) -> Tuple[bool, list[str]]:
    """
    Ensure all variables required by the blueprint are present in the context.
    """
    required_vars = template.get("variables", [])
    missing_vars = [var for var in required_vars if var not in context or not context[var]]
    return len(missing_vars) == 0, missing_vars

def resolve_template_variables(template: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Safely resolves variables within a deterministic blueprint.
    Raises ValueError if variables are missing to prevent leaking {placeholders} to customers.
    """
    is_valid, missing_vars = validate_required_variables(template, context)

    if not is_valid:
        raise ValueError(f"Missing required variables for blueprint '{template.get('template_key')}': {missing_vars}")

    resolved_template = template.copy()

    for pattern_key in ["hook_pattern", "body_pattern", "cta_pattern"]:
        if pattern_key in resolved_template and resolved_template[pattern_key]:
            for var in template.get("variables", []):
                resolved_template[pattern_key] = resolved_template[pattern_key].replace("{" + var + "}", str(context[var]))

    return resolved_template
