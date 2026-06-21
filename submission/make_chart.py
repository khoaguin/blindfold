"""Render the refused EN vs VN bar chart for the Blindfold report."""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).parent / "results_chart.pdf"

# Numbers are canonical from BRIEF.md (qwen2.5-0.5b headline run).
# Each bucket: refused-EN, refused-VN, total prompts.
buckets = [
    ("Jailbreaks\n(global, n=26)", 18, 16, 26),
    ("Scam + Medical\n(local, n=16)", 9, 14, 16),
    ("Benign controls\n(refusals = bad, n=5)", 0, 3, 5),
]

labels = [b[0] for b in buckets]
en = [b[1] for b in buckets]
vn = [b[2] for b in buckets]

x = np.arange(len(labels))
width = 0.36

fig, ax = plt.subplots(figsize=(7.2, 3.5))
fig.patch.set_facecolor("white")
ax.set_facecolor("white")

c_en = "#2f6f8f"  # english - muted blue
c_vn = "#c0392b"  # vietnamese - muted red

bars_en = ax.bar(
    x - width / 2,
    en,
    width,
    label="Refused (EN)",
    color=c_en,
    edgecolor="white",
    linewidth=0.5,
)
bars_vn = ax.bar(
    x + width / 2,
    vn,
    width,
    label="Refused (VN)",
    color=c_vn,
    edgecolor="white",
    linewidth=0.5,
)

# Value labels
for bars, totals in ((bars_en, vn), (bars_vn, vn)):
    pass
for i, (rect, total) in enumerate(zip(bars_en, [b[3] for b in buckets])):
    ax.annotate(
        f"{en[i]}/{total}",
        (rect.get_x() + rect.get_width() / 2, rect.get_height()),
        ha="center",
        va="bottom",
        fontsize=8.5,
        color="#1a1a1a",
        xytext=(0, 2),
        textcoords="offset points",
    )
for i, (rect, total) in enumerate(zip(bars_vn, [b[3] for b in buckets])):
    ax.annotate(
        f"{vn[i]}/{total}",
        (rect.get_x() + rect.get_width() / 2, rect.get_height()),
        ha="center",
        va="bottom",
        fontsize=8.5,
        color="#1a1a1a",
        xytext=(0, 2),
        textcoords="offset points",
    )

ax.set_ylabel("Prompts refused", fontsize=10, color="#1a1a1a")
ax.set_xticks(x)
ax.set_xticklabels(labels, fontsize=9, color="#1a1a1a")
ax.set_ylim(0, 30)
ax.tick_params(axis="y", labelsize=9, colors="#1a1a1a")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.spines["left"].set_color("#888888")
ax.spines["bottom"].set_color("#888888")
ax.yaxis.grid(True, color="#dddddd", linewidth=0.7)
ax.set_axisbelow(True)
ax.legend(frameon=False, fontsize=9, loc="upper left", ncol=2)

fig.tight_layout()
fig.savefig(OUT, bbox_inches="tight")
print(f"wrote {OUT}")
