"""Render the Blindfold hero/thumbnail PNG for the project gallery.

Numbers are canonical (BRIEF.md, qwen2.5-0.5b headline run). Invent nothing.
"""

from pathlib import Path

import matplotlib.font_manager as fm
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

# ---- palette ----------------------------------------------------------------
BG = "#0f1419"
PANEL = "#171d26"
INK = "#e8edf2"
MUTED = "#8a97a6"
GREEN = "#2e9e4a"
GREEN_BG = "#16321f"
RED = "#d24a3a"
RED_BG = "#34191a"
ACCENT = "#5dade2"
GRID = "#2a323d"

# pick a clean sans that ships with matplotlib
for fam in ("DejaVu Sans",):
    try:
        fm.findfont(fam, fallback_to_default=False)
        plt.rcParams["font.family"] = fam
        break
    except Exception:
        pass

W, H = 16.0, 10.0
fig = plt.figure(figsize=(W, H), dpi=160)
fig.patch.set_facecolor(BG)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, 16)
ax.set_ylim(0, 10)
ax.axis("off")


def panel(x, y, w, h, fc, ec=None, lw=0, rad=0.12, alpha=1.0, z=1):
    p = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle=f"round,pad=0,rounding_size={rad}",
        facecolor=fc,
        edgecolor=ec if ec else "none",
        linewidth=lw,
        alpha=alpha,
        zorder=z,
        mutation_aspect=1,
    )
    ax.add_patch(p)


def text(
    x,
    y,
    s,
    size,
    color=INK,
    weight="normal",
    ha="left",
    va="center",
    style="normal",
    family=None,
    z=5,
    alpha=1.0,
):
    ax.text(
        x,
        y,
        s,
        fontsize=size,
        color=color,
        fontweight=weight,
        ha=ha,
        va=va,
        style=style,
        fontfamily=family,
        zorder=z,
        alpha=alpha,
    )


# ---- header -----------------------------------------------------------------
text(0.85, 9.35, "Blindfold", 52, color=INK, weight="bold")
# little eyes-shut mark to evoke the blindfold without relying on emoji
ax.plot([0.55], [9.35], marker="o", markersize=0)  # noop anchor
text(
    0.9,
    8.55,
    "Audit the Vietnamese safety blind spot, blindly.",
    22,
    color=ACCENT,
    weight="normal",
)

# top-right callout: the one message
panel(10.55, 8.28, 4.8, 1.42, PANEL, ec=GRID, lw=1.4, rad=0.14, z=1)
text(10.85, 9.34, "THE FINDING", 12.5, color=MUTED, weight="bold")
text(10.85, 8.92, "Safe in English.", 18.5, color=GREEN, weight="bold")
text(10.85, 8.50, "Unsafe in Vietnamese.", 18.5, color=RED, weight="bold")

# ---- center: 2x2 matrix -----------------------------------------------------
# grid geometry
gx0, gy0 = 1.5, 2.55  # bottom-left of the cell block
col_w, row_h = 3.55, 2.05
gap = 0.28
lab_col = 2.0  # width reserved for row labels on the left
hdr_h = 0.85  # height for column headers on top

# column header band
col_x = [gx0 + lab_col, gx0 + lab_col + col_w + gap]
col_top = gy0 + 2 * row_h + gap + hdr_h
for cx, (code, name) in zip(col_x, [("EN", "English"), ("VN", "Vietnamese")]):
    panel(
        cx,
        gy0 + 2 * row_h + gap + 0.12,
        col_w,
        hdr_h - 0.12,
        PANEL,
        ec=GRID,
        lw=1.2,
        rad=0.1,
        z=1,
    )
    text(
        cx + col_w / 2,
        gy0 + 2 * row_h + gap + 0.12 + (hdr_h - 0.12) / 2,
        f"{code}  ·  {name}",
        19,
        color=INK,
        weight="bold",
        ha="center",
    )

# row labels
row_y = [gy0 + row_h + gap, gy0]  # top row (harmful), bottom row (harmless)
row_labels = [
    ("HARMFUL", "jailbreak", RED),
    ("HARMLESS", "question", GREEN),
]
for ry, (l1, l2, c) in zip(row_y, row_labels):
    panel(gx0, ry, lab_col - 0.25, row_h, PANEL, ec=GRID, lw=1.2, rad=0.1, z=1)
    text(
        gx0 + (lab_col - 0.25) / 2,
        ry + row_h / 2 + 0.28,
        l1,
        16,
        color=c,
        weight="bold",
        ha="center",
    )
    text(
        gx0 + (lab_col - 0.25) / 2,
        ry + row_h / 2 - 0.22,
        l2,
        14,
        color=MUTED,
        ha="center",
    )

# cells: [row][col] -> (verdict_word, good?, sub)
cells = [
    # harmful jailbreak row
    [
        ("REFUSED", True, "blocked the attack"),
        ("COMPLIED", False, "answered the attack"),
    ],
    # harmless question row
    [
        ("HELPED", True, "answered the question"),
        ("REFUSED", False, "blocked the question"),
    ],
]

for r, ry in enumerate(row_y):
    for cidx, cx in enumerate(col_x):
        verdict, good, sub = cells[r][cidx]
        fc = GREEN_BG if good else RED_BG
        ec = GREEN if good else RED
        mark = "✓" if good else "✗"  # check / cross
        mcol = GREEN if good else RED
        panel(cx, ry, col_w, row_h, fc, ec=ec, lw=2.2, rad=0.12, z=2)
        text(
            cx + 0.55,
            ry + row_h / 2 + 0.12,
            mark,
            46,
            color=mcol,
            weight="bold",
            ha="center",
            z=4,
        )
        text(
            cx + 1.25,
            ry + row_h / 2 + 0.30,
            verdict,
            23,
            color=INK,
            weight="bold",
            ha="left",
            z=4,
        )
        text(cx + 1.25, ry + row_h / 2 - 0.42, sub, 13.5, color=MUTED, ha="left", z=4)

# the eye-catching diagonal: outline the two VN failure cells subtly handled by ec already.

# ---- bottom stat strip ------------------------------------------------------
strip_y = 0.6
strip_h = 1.55
stats = [
    (
        "Jailbreaks refused",
        "18/26",
        "EN",
        "16/26",
        "VN",
        "fewer in VN — where it matters",
    ),
    ("Harmless refused", "0/5", "EN", "3/5", "VN", "over-cautious in VN"),
    (
        "Bilingual audit",
        "47",
        "prompts",
        "94",
        "answers",
        "sealed-enclave · code-to-data",
    ),
]
sw = (15.35 - 0.85) / 3
for i, (title, a, al, b, bl, note) in enumerate(stats):
    sx = 0.85 + i * sw
    panel(sx, strip_y, sw - 0.25, strip_h, PANEL, ec=GRID, lw=1.3, rad=0.12, z=1)
    cx = sx + 0.35
    text(cx, strip_y + strip_h - 0.32, title.upper(), 12.5, color=MUTED, weight="bold")
    # big number pair with an arrow
    base_y = strip_y + 0.66
    text(cx, base_y, a, 30, color=INK, weight="bold")
    aw = 1.05 if len(a) <= 4 else 1.45
    text(cx + aw, base_y - 0.18, al, 13, color=MUTED, va="center")
    arrow_x = cx + aw + 0.75
    text(arrow_x, base_y - 0.02, "→", 26, color=ACCENT, weight="bold", va="center")
    bx = arrow_x + 0.65
    bcol = RED if i < 1 else (RED if i == 1 else ACCENT)
    bcol = RED if i <= 1 else INK
    text(bx, base_y, b, 30, color=bcol, weight="bold")
    bw = 1.05 if len(b) <= 4 else 1.45
    text(bx + bw, base_y - 0.18, bl, 13, color=MUTED, va="center")
    text(cx, strip_y + 0.18, note, 12, color=MUTED, style="italic")

# ---- footer -----------------------------------------------------------------
text(
    0.85,
    0.22,
    "Global South AI Safety Hackathon  ·  Apart × AnToàn.AI",
    14,
    color=MUTED,
    weight="bold",
)
text(15.35, 0.22, "github.com/khoaguin/blindfold", 12.5, color=MUTED, ha="right")

# faint top rule under header
ax.plot([0.85, 15.35], [8.15, 8.15], color=GRID, lw=1.2, zorder=0)

out = Path(
    "/Users/khoaguin/Desktop/projects/Hackathons/blindfold/submission/blindfold_hero.png"
)
fig.savefig(out, facecolor=BG, dpi=160)
print(f"wrote {out}  ({int(W * 160)}x{int(H * 160)} px)")
