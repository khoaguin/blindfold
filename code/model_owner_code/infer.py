"""Model owner's inference asset — how to load and run the private model.

This file is the lab's IP: it ships *inside the model dataset* (alongside the
weights) and is loaded inside the enclave via `sc.load_dataset_code("model.infer")`.
The researcher's eval code never imports mlx or knows how the model runs — it only
calls `init()` once and `generate(prompt)` per prompt. An API lab (Anthropic, etc.)
would ship a different infer.py that calls their endpoint with their own key, same
two-function interface.
"""

from mlx_lm import generate as _generate
from mlx_lm import load as _load

_STATE: dict = {}


def init(model_dir: str) -> None:
    """Load the weights from the dataset directory. Called once."""
    loaded = _load(model_dir)
    _STATE["model"], _STATE["tok"] = loaded[0], loaded[1]


def generate(prompt: str, max_tokens: int = 512) -> str:
    """Deterministic (greedy) completion for one prompt."""
    tok = _STATE["tok"]
    text = tok.apply_chat_template(
        [{"role": "user", "content": prompt}], add_generation_prompt=True
    )
    return _generate(
        _STATE["model"], tok, prompt=text, max_tokens=max_tokens, verbose=False
    )
