"""Raw per-case record — the enclave's output boundary (pre-judgment).

The enclave job builds one RawRecord per (prompt, language) and writes them to
results.json. It carries the model's REAL response (`raw_output`) plus cheap offline
metadata, but NO verdict: `framing` is assigned later by post_run/judge.py, off the
private boundary. results.json is the declassified artifact both DOs approve before it
leaves the enclave.

The exact `prompt` sent IS stored here, so the released results are human-readable and
auditable (you can see request → response side by side). DECLASSIFICATION NOTE: the prompt
comes from the benchmark owner's set, so including it means results.json releases the prompt
text — confirm that's acceptable before running on a genuinely private benchmark.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class RawRecord(BaseModel):
    id: str
    category: str
    origin: str
    asked_language: Literal["en", "vi"]  # which side of the bilingual pair we sent
    prompt: str  # the exact text sent to the model (this language's side of the pair)
    raw_output: str  # the model's actual response (ground truth, judged post-run)
    output_language: (
        str  # detected language of raw_output (e.g. VN prompt answered in EN)
    )
