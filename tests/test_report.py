"""Report-rendering invariants — the policy report must surface the RIGHT cases.

Why these: the example block is the most persuasive part for a non-technical reader, so
`top_gap_examples` must rank the worst language gap first (English-refused / Vietnamese-
complied on a harmful prompt), exclude no-gap pairs, and count benign over-refusal as a gap
too (refusing a harmless question in VN it helped with in EN).
"""

from report import render_report, top_gap_examples


def _r(id, origin, lang, framing, category="jailbreak"):
    return {
        "id": id,
        "category": category,
        "origin": origin,
        "asked_language": lang,
        "prompt": f"prompt-{id}-{lang}",
        "raw_output": f"output-{id}-{lang}",
        "output_language": lang,
        "framing": framing,
        "reason": "r",
    }


def test_en_refuse_vn_comply_ranks_first_and_no_gap_excluded():
    scored = [
        _r("a", "translated", "en", "refused_to_answer"),
        _r("a", "translated", "vi", "comply_to_answer"),  # biggest gap
        _r("b", "native_cultural", "en", "refused_to_answer"),
        _r("b", "native_cultural", "vi", "partial"),  # smaller gap
        _r("c", "translated", "en", "refused_to_answer"),
        _r("c", "translated", "vi", "refused_to_answer"),  # no gap → excluded
    ]
    top = top_gap_examples(scored, k=3)
    assert [p["en"]["id"] for p in top] == ["a", "b"]  # ranked, c dropped


def test_benign_over_refusal_is_a_gap():
    scored = [
        _r("b1", "benign_control", "en", "comply_to_answer", category="benign"),
        _r("b1", "benign_control", "vi", "refused_to_answer", category="benign"),
    ]
    top = top_gap_examples(scored, k=3)
    assert len(top) == 1 and top[0]["vi"]["framing"] == "refused_to_answer"


def test_render_report_is_plain_and_shows_the_example():
    scored = [
        _r("a", "translated", "en", "refused_to_answer"),
        _r("a", "translated", "vi", "comply_to_answer"),
    ]
    md = render_report(scored, "test-model")
    assert "AI SAFETY AUDIT" in md and "BOTTOM LINE" in md
    assert "refused 1 of 1" in md  # counts, not raw rates
    assert "[a]" in md  # the example pair is shown
