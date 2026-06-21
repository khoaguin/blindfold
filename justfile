_cyan := '\033[0;36m'
_green := '\033[0;32m'
_red := '\033[0;31m'
_nc := '\033[0m'

set shell := ["bash", "-cu"]

# List available commands
default:
    @just --list

# ── Setup ─────────────────────────────────────────────────────────────────────

# Install / sync dependencies and set up pre-commit + pre-push hooks
sync:
    @echo -e "{{_cyan}}Syncing dependencies…{{_nc}}"
    uv sync
    uv run pre-commit install --hook-type pre-commit --hook-type pre-push

# Download model weights into models/ (default: all; --verify load-tests them)
#   just download-models
#   just download-models --models qwen2.5-0.5b --verify
download-models *args:
    @echo -e "{{_cyan}}Downloading model weights…{{_nc}}"
    uv run python scripts/download_models.py {{args}}

# ── Benchmark & eval ──────────────────────────────────────────────────────────

# Rebuild data/benchmark.csv from the authored prompts + MultiJail jailbreak rows
benchmark:
    @echo -e "{{_cyan}}Building benchmark.csv…{{_nc}}"
    cd data && uv run python build_benchmark.py

# Tally the EN-vs-VN refusal gap from an eval results file (default: outputs/results.json)
#   just report
#   just report results/results.json
report *args:
    @echo -e "{{_cyan}}Scoring results…{{_nc}}"
    uv run python scripts/report.py {{args}}

# ── Quality ───────────────────────────────────────────────────────────────────

# Lint with ruff (check only — no changes)
lint:
    @echo -e "{{_cyan}}Linting…{{_nc}}"
    uv run ruff check .
    uv run ruff format --check .

# Format + auto-fix with ruff
fmt:
    @echo -e "{{_cyan}}Formatting…{{_nc}}"
    uv run ruff check --fix .
    uv run ruff format .
    @echo -e "{{_green}}Done.{{_nc}}"

# Static type check with pyrefly
check:
    @echo -e "{{_cyan}}Type checking…{{_nc}}"
    uv run pyrefly check

# Run all pre-commit hooks against every file
precommit:
    uv run pre-commit run --all-files

# Run unit tests in parallel (pass extra args: just test -k test_name)
test *args:
    @echo -e "{{_cyan}}Running tests…{{_nc}}"
    uv run pytest -n auto {{args}}

# ── Housekeeping ──────────────────────────────────────────────────────────────

# Remove caches
clean:
    @echo -e "{{_red}}Cleaning caches…{{_nc}}"
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
    find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
    find . -type d -name ".ipynb_checkpoints" -exec rm -rf {} + 2>/dev/null || true
    @echo -e "{{_green}}Done.{{_nc}}"
