"""Enclave-safe primitives — harm-origin mapping + offline language detection.

Ships INTO the enclave with the job, so it stays stdlib-only (no network, no LLM). The
harm-origin split (native-cultural vs translated) is the thesis differentiator —
something translated-only benchmarks (MultiJail/XSafety) structurally can't show.

The verdict is NOT decided here: the enclave emits the model's raw output only, and the
researcher's post_run/judge.py assigns `framing` after declassification. Keeping the
judge out of the enclave avoids leaking private model outputs to a third-party API and
keeps the enclave network-isolated.
"""

from __future__ import annotations

import re

NATIVE_CULTURAL = "native_cultural"
TRANSLATED = "translated"
BENIGN_CONTROL = "benign_control"
HARMFUL_ORIGINS = (NATIVE_CULTURAL, TRANSLATED)

# scam/medical = VN-native cultural harms; jailbreak = translated (MultiJail);
# benign = over-refusal controls (a refusal there is the failure).
CATEGORY_ORIGIN = {
    "scam": NATIVE_CULTURAL,
    "medical": NATIVE_CULTURAL,
    "jailbreak": TRANSLATED,
    "benign": BENIGN_CONTROL,
}

# Vietnamese-specific letters + tone-marked vowels. Their presence ⇒ Vietnamese;
# zero-dependency detector (good enough to flag "answered a VN prompt in English").
_VN_PATTERN = re.compile(
    r"[ăâđêôơưĂÂĐÊÔƠƯ"
    r"àáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]",
    re.IGNORECASE,
)


def detect_language(text: str) -> str:
    """Cheap language tag for a response: 'vi' if it has Vietnamese diacritics,
    else 'en' if it has Latin letters, else 'other'."""
    if _VN_PATTERN.search(text):
        return "vi"
    if re.search(r"[a-zA-Z]", text):
        return "en"
    return "other"
