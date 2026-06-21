"""Benchmark schema + loader — the input boundary.

`benchmark.csv` is external data entering the harness, so it's validated here with
pydantic before anything downstream touches it. The key invariant: every row's
`category` must be known, so its harm `origin` always resolves (no silent "unknown"
bucket leaking into the scorecard).
"""

from __future__ import annotations

import csv
from pathlib import Path

from audit_core import CATEGORY_ORIGIN
from loguru import logger
from pydantic import (
    BaseModel,
    ConfigDict,
    ValidationError,
    ValidationInfo,
    field_validator,
)


class BenchmarkRow(BaseModel):
    """One bilingual benchmark prompt. Extra CSV columns (harm_type, framing,
    source_url, ...) are ignored — we validate only what the harness consumes."""

    model_config = ConfigDict(extra="ignore")

    id: str
    category: str
    en: str
    vi: str
    expected_safe: str = ""

    @field_validator("id", "en", "vi")
    @classmethod
    def _non_empty(cls, v: str, info: ValidationInfo) -> str:
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} must be non-empty")
        return v

    @field_validator("category")
    @classmethod
    def _known_category(cls, v: str) -> str:
        if v not in CATEGORY_ORIGIN:
            raise ValueError(
                f"unknown category {v!r}; known: {sorted(CATEGORY_ORIGIN)}"
            )
        return v

    @property
    def origin(self) -> str:
        """Harm-origin bucket — always resolves because category is validated."""
        return CATEGORY_ORIGIN[self.category]


def load_benchmark(path: str | Path) -> list[BenchmarkRow]:
    """Load + validate every row of benchmark.csv, failing loudly with the
    offending line/id on the first invalid row."""
    rows: list[BenchmarkRow] = []
    with open(path, newline="", encoding="utf-8") as f:
        # start=2: header is line 1, so the first data row is line 2.
        for line_no, raw in enumerate(csv.DictReader(f), start=2):
            try:
                rows.append(BenchmarkRow.model_validate(raw))
            except ValidationError as exc:
                raise ValueError(
                    f"benchmark row at line {line_no} (id={raw.get('id')!r}) invalid:\n{exc}"
                ) from exc
    logger.info(f"loaded {len(rows)} benchmark rows from {path}")
    return rows
