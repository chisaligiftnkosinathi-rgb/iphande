from datetime import datetime
import os


def _build_date() -> str:
    # Deterministic build: allow override for audit repeatability
    # Expected format: YYYY-MM-DD
    env = os.environ.get("BUILD_DATE")
    if env:
        return env
    # Fallback to a fixed date to keep output reproducible by default
    return "2026-06-19"


def _render(template: str, context: dict) -> str:
    # Minimal renderer: supports {{key}} placeholders for top-level keys and
    # company/sanas nested dicts via {{company.company_name}} style.
    out = template
    for k, v in context.items():
        out = out.replace(f"{{{{{k}}}}}", str(v))

    for group_name, group in context.items():
        if isinstance(group, dict):
            for k, v in group.items():
                out = out.replace(f"{{{{{group_name}.{k}}}}}", str(v))

    return out


def build_cover_letter(context: dict) -> str:
    company = context["company"]
    sanas = context["sanas"]

    return _render(
        open(os.path.join(os.path.dirname(__file__), "..", "templates", "cover_letter.md"), encoding="utf-8").read(),
        {
            "build_date": _build_date(),
            "company": company,
            "sanas": sanas,
        },
    )


def build_executive_summary(context: dict) -> str:
    return _render(
        open(os.path.join(os.path.dirname(__file__), "..", "templates", "executive_summary.md"), encoding="utf-8").read(),
        {
            "company": context["company"],
            "sanas": context["sanas"],
        },
    )


def build_governance_model(context: dict) -> str:
    return _render(
        open(os.path.join(os.path.dirname(__file__), "..", "templates", "governance_model.md"), encoding="utf-8").read(),
        {
            "company": context["company"],
            "sanas": context["sanas"],
        },
    )


def build_legal_declaration(context: dict) -> str:
    return _render(
        open(os.path.join(os.path.dirname(__file__), "..", "templates", "legal_declaration.md"), encoding="utf-8").read(),
        {
            "company": context["company"],
            "sanas": context["sanas"],
        },
    )
