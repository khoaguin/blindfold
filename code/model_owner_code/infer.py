"""Model owner's inference asset — how to load and run the private model.

This file is the lab's IP: it ships *inside the model dataset* (alongside the
weights) and is loaded inside the enclave via `sc.load_dataset_code("model.infer")`.
The researcher's eval code never imports mlx/llama_cpp or knows how the model runs —
it only calls `init()` once and `generate(prompt)` per prompt. An API lab (Anthropic,
etc.) would ship a different infer.py that calls their endpoint, same two-function
interface.

One infer.py serves every model in models/: it picks the runtime from the weights dir
itself (no model-name lookup, no scripts/ import — stays self-contained for the enclave).
A dir holding a `.gguf` file loads through llama.cpp (PhoGPT — its 2023-era custom
transformers code is incompatible with modern transformers, so we run the GGUF build
instead); everything else (Qwen, SeaLLM) loads via mlx_lm. Generation is greedy
(temperature 0) on both paths, so a run is deterministic and reproducible.
"""

from __future__ import annotations

from pathlib import Path

_STATE: dict = {}

# PhoGPT-4B-Chat's documented instruction format (the GGUF build has no baked chat
# template). Source: vinai/PhoGPT-4B-Chat model card.
_PHOGPT_PROMPT = "### Câu hỏi: {}\n### Trả lời:"


def _is_gguf(model_dir: Path) -> bool:
    """True when the dir holds a llama.cpp GGUF weight file (PhoGPT)."""
    return any(model_dir.glob("*.gguf"))


def init(model_dir: str) -> None:
    """Load the weights from the dataset directory. Called once. Records the runtime so
    generate() dispatches without re-detecting."""
    d = Path(model_dir)
    if _is_gguf(d):
        from llama_cpp import Llama

        gguf = next(d.glob("*.gguf"))
        _STATE.update(
            runtime="gguf",
            model=Llama(model_path=str(gguf), n_ctx=4096, verbose=False),
        )
    else:
        from mlx_lm import load as _load

        loaded = _load(model_dir)
        _STATE.update(runtime="mlx", model=loaded[0], tok=loaded[1])


def generate(prompt: str, max_tokens: int = 512) -> str:
    """Deterministic (greedy) completion for one prompt."""
    if _STATE["runtime"] == "gguf":
        out = _STATE["model"].create_completion(
            _PHOGPT_PROMPT.format(prompt),
            max_tokens=max_tokens,
            temperature=0.0,  # greedy → deterministic, reproducible
            stop=["### Câu hỏi:", "</s>"],
        )
        return out["choices"][0]["text"].strip()

    from mlx_lm import generate as _generate

    tok = _STATE["tok"]
    text = tok.apply_chat_template(
        [{"role": "user", "content": prompt}], add_generation_prompt=True
    )
    return _generate(
        _STATE["model"], tok, prompt=text, max_tokens=max_tokens, verbose=False
    )
