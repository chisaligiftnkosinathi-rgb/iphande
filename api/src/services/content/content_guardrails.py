def validate_content(content: str, prohibited_phrases: list[str]) -> list[str]:
    violations = []
    lowered = content.lower()
    for phrase in prohibited_phrases:
        if phrase.lower() in lowered:
            violations.append(phrase)
    return violations
