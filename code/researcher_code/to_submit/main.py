"""Enclave job entrypoint — the researcher's eval logic ONLY.

It does not know how the model runs: the model owner ships that as `infer.py` inside
their dataset (the lab's IP), and we load it with `sc.load_dataset_code`. This file
iterates the benchmark, calls `infer.generate` with the BARE prompt, and writes the
model's raw response per case. It assigns NO verdict — judging happens off the private
boundary in post_run/judge.py, so no API key or network egress ever enters the enclave.

Run parameters (owner emails, dataset names, sample size) come from params.json, which
the researcher's notebook writes next to this file at submit time.
"""

import csv
import json
from pathlib import Path

import syft_client as sc
from audit_core import CATEGORY_ORIGIN, detect_language
from record import RawRecord

_HERE = Path(__file__).resolve().parent
params = json.loads((_HERE / "params.json").read_text())

# The model owner's inference asset: weights + how to run them (their IP).
infer = sc.load_dataset_code(
    f"{params['model_dataset']}.infer", owner_email=params["model_owner"]
)
model_files = sc.resolve_dataset_files_path(
    params["model_dataset"], owner_email=params["model_owner"]
)
infer.init(str(model_files[0].parent))

benchmark_path = sc.resolve_dataset_file_path(
    params["benchmark_dataset"], owner_email=params["bench_owner"]
)
with Path(benchmark_path).open(encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

# Live demo: audit a balanced sample for speed (None = the full hidden set). The
# enclave still holds every row either way — only the run is sampled.
per_cat = params.get("demo_per_category")
if per_cat:
    by: dict[str, list[dict]] = {}
    for r in rows:
        by.setdefault(r["category"], []).append(r)
    rows = [r for rs in by.values() for r in rs[:per_cat]]

records: list[RawRecord] = []
for row in rows:
    origin = CATEGORY_ORIGIN.get(row["category"], "unknown")
    for lang in ("en", "vi"):
        # Send the bare prompt — we measure real behavior, not a self-report.

        prompt = row[lang]
        # The infer asset abstracts away how the model runs (HF, custom code, etc).
        # We just call its generate method with the prompt.
        raw_output = infer.generate(prompt)

        # We record the raw output + metadata to the enclave's output which
        # will be shared with all parties post-run
        records.append(
            RawRecord(
                id=row["id"],
                category=row["category"],
                origin=origin,
                asked_language=lang,
                prompt=prompt,
                raw_output=raw_output,
                output_language=detect_language(raw_output),
            )
        )

out_dir = Path("outputs")
out_dir.mkdir(exist_ok=True)
(out_dir / "results.json").write_text(
    json.dumps(
        {
            "model": params.get("model_label", params["model_dataset"]),
            "records": [r.model_dump() for r in records],
        },
        indent=2,
        ensure_ascii=False,
    ),
    encoding="utf-8",
)

print(
    f"Eval complete. {len(records)} raw responses -> outputs/results.json "
    "(judge runs post-declassification: post_run/judge.py)"
)
