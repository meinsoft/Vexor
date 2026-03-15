from __future__ import annotations

from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd


_CSV_PATH = Path(__file__).with_name("ServicesByOrganizations.csv")
_SIMILARITY_THRESHOLD = 70.0

_SERVICES_BY_ORGANIZATIONS_DF = pd.read_csv(_CSV_PATH, encoding="utf-16")
_ORGANIZATION_NAMES = (
    _SERVICES_BY_ORGANIZATIONS_DF["organization_name"].dropna().drop_duplicates().tolist()
)


def _normalize_text(value: str) -> str:
    return " ".join(value.casefold().split())


def _calculate_similarity(left: str, right: str) -> float:
    return SequenceMatcher(None, _normalize_text(left), _normalize_text(right)).ratio() * 100


def validate_entity(institution_name: str, sender_domain: str) -> dict[str, object]:
    if not institution_name or not institution_name.strip():
        return {
            "entity_found": False,
            "matched_org": None,
            "mismatch": False,
            "confidence": 0,
        }

    best_score = 0.0
    best_org_name: str | None = None

    for row in _SERVICES_BY_ORGANIZATIONS_DF[
        ["organization_name", "organization_short_name"]
    ].drop_duplicates().itertuples(index=False):
        scores = [_calculate_similarity(institution_name, row.organization_name)]
        if isinstance(row.organization_short_name, str) and row.organization_short_name.strip():
            scores.append(_calculate_similarity(institution_name, row.organization_short_name))

        row_best_score = max(scores)
        if row_best_score > best_score:
            best_score = row_best_score
            best_org_name = row.organization_name

    if best_score > _SIMILARITY_THRESHOLD and best_org_name is not None:
        return {
            "entity_found": True,
            "matched_org": best_org_name,
            "mismatch": True,
            "confidence": round(best_score, 2),
        }

    return {
        "entity_found": False,
        "matched_org": None,
        "mismatch": False,
        "confidence": 0,
    }


def get_all_organizations() -> list[str]:
    return list(_ORGANIZATION_NAMES)
