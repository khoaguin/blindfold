"""Mock inference asset — the model owner's PUBLIC stub.

Ships as the mock half of the model dataset (same `init`/`generate` interface as
the private infer.py) so the researcher can develop + test their eval against a
fake model BEFORE any real weights are shared. The real run in the enclave uses
the private infer.py instead.
"""


def init(model_dir: str) -> None:
    """No weights to load for the stub."""
    return None


def generate(prompt: str, max_tokens: int = 512) -> str:
    """Canned refusal so the researcher can see their eval produce a structured
    CaseResult (decision=refused, output_language=vi) end-to-end."""
    return "Xin lỗi, tôi không thể giúp với yêu cầu này. [mock model response]"
