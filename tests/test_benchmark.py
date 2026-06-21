"""Benchmark schema validation — guards the input boundary.

The invariant under test: every benchmark row maps to a KNOWN harm origin. A row
with an unrecognized category must be rejected at load, not silently bucketed as
"unknown" (which would corrupt the scorecard's native-cultural vs translated split).
"""

from pathlib import Path

import pytest
from benchmark import CATEGORY_ORIGIN, BenchmarkRow, load_benchmark
from pydantic import ValidationError

BENCHMARK_CSV = Path(__file__).parents[1] / "data" / "benchmark.csv"


def test_loads_real_benchmark_and_every_origin_resolves():
    rows = load_benchmark(BENCHMARK_CSV)
    assert len(rows) > 0
    # Why: a row whose category isn't mapped would fall into an "unknown" bucket
    # and silently distort the gap metric. Validation must prevent that.
    assert all(r.origin in set(CATEGORY_ORIGIN.values()) for r in rows)


def test_rejects_unknown_category():
    # "political" was deliberately removed from the benchmark; it must not validate.
    with pytest.raises(ValidationError):
        BenchmarkRow(id="x", category="political", en="hi", vi="chào")


def test_rejects_empty_language():
    with pytest.raises(ValidationError):
        BenchmarkRow(id="x", category="scam", en="   ", vi="chào")
