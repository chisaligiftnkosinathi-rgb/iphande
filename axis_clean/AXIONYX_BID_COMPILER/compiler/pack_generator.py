import os
from .document_builder import (
    build_cover_letter,
    build_executive_summary,
    build_governance_model,
    build_legal_declaration,
)


def generate_pack(context: dict, output_root: str | None = None) -> str:
    base = output_root or os.path.join(
        os.path.dirname(__file__), "..", "output", "SANAS_RFI_PACK"
    )
    output_dir = os.path.abspath(base)
    os.makedirs(output_dir, exist_ok=True)

    artifacts = {
        "01_COVER_LETTER.txt": build_cover_letter(context),
        "02_EXECUTIVE_SUMMARY.txt": build_executive_summary(context),
        "03_GOVERNANCE_MODEL.txt": build_governance_model(context),
        "04_LEGAL_DECLARATION.txt": build_legal_declaration(context),
    }

    for filename, content in artifacts.items():
        with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
            f.write(content.strip() + "\n")

    return output_dir
