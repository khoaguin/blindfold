"""Download model weights into ./models/<name>/ as visible, self-contained dirs.

Each dir holds everything one model needs (config + weights + tokenizer, plus the
custom modeling code for PhoGPT) so it can be:
  1. inspected on disk — `ls models/<name>/`
  2. uploaded as a syft-client private dataset:

        model_owner.create_dataset(
            name="qwen2.5-3b",
            mock_path=<a tiny model-card dir>,      # what the researcher sees
            private_path="models/qwen2.5-3b",       # the real weights -> enclave only
            ...
        )

  3. loaded inside the enclave job straight from that dir:
        mlx_lm.load("models/qwen2.5-3b")                         # qwen, seallm
        AutoModelForCausalLM.from_pretrained(dir, trust_remote_code=True)  # phogpt

API models (gpt-oss-120b, glm-4.7, claude) have NO weights — they're remote, so
they're not here.

Usage:
    uv run python scripts/download_models.py                 # default: qwen2.5-0.5b only (lightest)
    uv run python scripts/download_models.py --models seallm-v3-7b   # opt into a heavier model
    uv run python scripts/download_models.py --all           # every local model
    uv run python scripts/download_models.py --verify        # also load-test each
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from huggingface_hub import snapshot_download
from loguru import logger

MODELS_DIR = Path(__file__).resolve().parents[1] / "models"

# Frameworks we never want (avoids pulling duplicate PyTorch-bin / TF / Flax copies).
_DROP_FRAMEWORKS = ["*.pt", "*.pth", "*.h5", "*.msgpack", "*.onnx", "*.tflite"]

# name -> (hf repo, runtime, extra ignore patterns)
WEIGHTS = {
    # tiny model for the live enclave demo — fast to share into the enclave
    # (mechanism demo; the real finding runs the larger models offline).
    "qwen2.5-0.5b": (
        "mlx-community/Qwen2.5-0.5B-Instruct-4bit",
        "mlx",
        [*_DROP_FRAMEWORKS, "*.bin"],
    ),
    # qwen2-arch, safetensors only -> also drop *.bin to be safe
    "qwen2.5-3b": (
        "mlx-community/Qwen2.5-3B-Instruct-4bit",
        "mlx",
        [*_DROP_FRAMEWORKS, "*.bin"],
    ),
    "seallm-v3-7b": (
        "SeaLLMs/SeaLLMs-v3-7B-Chat",
        "mlx",
        [*_DROP_FRAMEWORKS, "*.bin"],
    ),
    # PhoGPT's original transformers build has 2023-era custom modeling code that breaks
    # on modern transformers (removed Llama rotary classes), so we run the GGUF build via
    # llama.cpp instead. Keep only the Q4_K_M quant (4-bit, parity with the 4-bit qwen
    # models); drop the larger Q8_0 + full-precision ggufs.
    "phogpt-4b": (
        "vinai/PhoGPT-4B-Chat-gguf",
        "gguf",
        ["*Q8_0.gguf", "PhoGPT-4B-Chat.gguf", *_DROP_FRAMEWORKS, "*.bin"],
    ),
}

# The only model the live notebook demo needs — lightest, fastest to share into the
# enclave. The heavier models are opt-in (--models <name> or --all).
DEFAULT_MODEL = "qwen2.5-0.5b"


def _dir_report(dest: Path) -> None:
    files = sorted(p for p in dest.rglob("*") if p.is_file())
    total = sum(p.stat().st_size for p in files)
    logger.info(f"{dest.name}: {len(files)} files, {total / 1e9:.2f} GB")
    for p in files:
        logger.info(f"    {p.relative_to(dest)}  ({p.stat().st_size / 1e6:.1f} MB)")


def download(name: str) -> Path:
    repo, _runtime, ignore = WEIGHTS[name]
    dest = MODELS_DIR / name
    logger.info(f"downloading {repo} -> {dest}")
    snapshot_download(repo_id=repo, local_dir=str(dest), ignore_patterns=ignore)
    # Strip HF's resumability metadata so the dir we upload as a syft private
    # dataset is pure model files (config + weights + tokenizer).
    shutil.rmtree(dest / ".cache", ignore_errors=True)
    _dir_report(dest)
    return dest


def verify(name: str, dest: Path) -> None:
    """Load the model from its local dir exactly as the enclave job would."""
    _repo, runtime, _ignore = WEIGHTS[name]
    if runtime == "mlx":
        from mlx_lm import generate, load

        _loaded = load(str(dest))
        model, tok = _loaded[0], _loaded[1]
        text = tok.apply_chat_template(
            [{"role": "user", "content": "Xin chào"}], add_generation_prompt=True
        )
        out = generate(model, tok, prompt=text, max_tokens=8, verbose=False)
        logger.info(f"[verify] {name} loads + generates from {dest}: {out!r}")
    elif runtime == "gguf":
        from llama_cpp import Llama

        gguf = next(dest.glob("*.gguf"))
        llm = Llama(model_path=str(gguf), n_ctx=2048, verbose=False)
        out = llm.create_completion(
            "### Câu hỏi: Xin chào\n### Trả lời:", max_tokens=8, temperature=0.0
        )
        assert isinstance(out, dict)  # not streaming → one response, not an Iterator
        logger.info(
            f"[verify] {name} loads + generates from {gguf.name}: "
            f"{out['choices'][0]['text']!r}"
        )
    else:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        tok = AutoTokenizer.from_pretrained(str(dest), trust_remote_code=True)
        AutoModelForCausalLM.from_pretrained(
            str(dest), trust_remote_code=True, torch_dtype=torch.float16
        )
        logger.info(f"[verify] {name} loads from {dest} (tokenizer + model OK)")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--models",
        nargs="*",
        choices=list(WEIGHTS),
        default=[DEFAULT_MODEL],
        help=f"models to download (default: {DEFAULT_MODEL})",
    )
    ap.add_argument("--all", action="store_true", help="download every local model")
    ap.add_argument("--verify", action="store_true", help="load-test after download")
    args = ap.parse_args()

    names = list(WEIGHTS) if args.all else args.models
    for name in names:
        dest = download(name)
        if args.verify:
            verify(name, dest)
    logger.info(f"done. weights under {MODELS_DIR}")


if __name__ == "__main__":
    main()
