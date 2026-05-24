from dataclasses import dataclass
from typing import List

@dataclass(frozen=True)
class FormattedContent:
    platform: str
    content: str
    default_cta: str
    suggested_tags: List[str]


class PlatformFormatter:
    """
    Presentation-only formatter.

    This layer must not invent offers, urgency, testimonials,
    discounts, guarantees, or engagement claims.
    It only shapes already-generated content for a target platform.
    """

    def format(
        self,
        *,
        platform: str,
        content: str,
        default_cta: str,
        suggested_tags: List[str],
    ) -> FormattedContent:
        normalized_platform = platform.lower().strip()

        if normalized_platform == "facebook":
            return self._format_facebook(content, default_cta, suggested_tags)

        if normalized_platform == "whatsapp":
            return self._format_whatsapp(content, default_cta, suggested_tags)

        if normalized_platform == "instagram":
            return self._format_instagram(content, default_cta, suggested_tags)

        return FormattedContent(
            platform=normalized_platform or "generic",
            content=content.strip(),
            default_cta=default_cta.strip(),
            suggested_tags=suggested_tags,
        )

    def _format_facebook(
        self,
        content: str,
        default_cta: str,
        suggested_tags: List[str],
    ) -> FormattedContent:
        tags = self._clean_tags(suggested_tags)

        formatted = "\n\n".join(
            part for part in [
                content.strip(),
                default_cta.strip(),
                " ".join(tags),
            ]
            if part
        )

        return FormattedContent(
            platform="facebook",
            content=formatted,
            default_cta=default_cta.strip(),
            suggested_tags=tags,
        )

    def _format_whatsapp(
        self,
        content: str,
        default_cta: str,
        suggested_tags: List[str],
    ) -> FormattedContent:
        formatted = "\n\n".join(
            part for part in [
                content.strip(),
                default_cta.strip(),
            ]
            if part
        )

        return FormattedContent(
            platform="whatsapp",
            content=formatted,
            default_cta=default_cta.strip(),
            suggested_tags=[],
        )

    def _format_instagram(
        self,
        content: str,
        default_cta: str,
        suggested_tags: List[str],
    ) -> FormattedContent:
        tags = self._clean_tags(suggested_tags)

        formatted = "\n\n".join(
            part for part in [
                content.strip(),
                default_cta.strip(),
                " ".join(tags),
            ]
            if part
        )

        return FormattedContent(
            platform="instagram",
            content=formatted,
            default_cta=default_cta.strip(),
            suggested_tags=tags,
        )

    def _clean_tags(self, tags: List[str]) -> List[str]:
        cleaned: List[str] = []

        for tag in tags:
            value = tag.strip()
            if not value:
                continue

            if not value.startswith("#"):
                value = f"#{value}"

            cleaned.append(value.lower())

        return cleaned
