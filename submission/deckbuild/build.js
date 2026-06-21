const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

// ---------- palette ----------
const BG = "0B1020";        // deep midnight
const BG2 = "111A33";       // panel
const CARD = "16213E";      // card
const INK = "E8EEF9";       // near-white text
const MUTE = "8A97B5";      // muted slate
const ACCENT = "5B8DEF";    // electric blue (primary accent)
const GREEN = "2BD17E";     // EN good
const GREENBG = "11341F";
const RED = "F0556B";       // VN bad
const REDBG = "3A1622";
const AMBER = "F2B541";     // surprise/safer
const VIOLET = "9B7BF0";

// ---------- icon raster cache ----------
async function icon(IconComponent, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

const mkShadow = () => ({ type: "outer", color: "000000", blur: 9, offset: 3, angle: 135, opacity: 0.35 });

async function main() {
  const pres = new pptxgen();
  pres.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
  pres.layout = "W16x9";
  pres.author = "Blindfold";
  pres.title = "Blindfold — Auditing the Vietnamese Safety Blind Spot, Blindly";

  const W = 13.333, H = 7.5;
  const REPO = "github.com/khoaguin/blindfold";

  // pre-render icons
  const ic = {
    eye: await icon(fa.FaEyeSlash, "#" + ACCENT),
    globe: await icon(fa.FaGlobeAsia, "#" + ACCENT),
    lock: await icon(fa.FaLock, "#" + ACCENT),
    shield: await icon(fa.FaShieldAlt, "#" + GREEN),
    flask: await icon(fa.FaFlask, "#" + ACCENT),
    code: await icon(fa.FaCode, "#" + VIOLET),
    book: await icon(fa.FaBalanceScale, "#" + AMBER),
    check: await icon(fa.FaCheckCircle, "#" + GREEN),
    cross: await icon(fa.FaTimesCircle, "#" + RED),
    bank: await icon(fa.FaUniversity, "#" + ACCENT),
    pills: await icon(fa.FaHeartbeat, "#" + RED),
    bug: await icon(fa.FaBug, "#" + RED),
    leaf: await icon(fa.FaLeaf, "#" + GREEN),
    arrow: await icon(fa.FaLongArrowAltRight, "#" + MUTE),
    warn: await icon(fa.FaExclamationTriangle, "#" + AMBER),
    rocket: await icon(fa.FaRocket, "#" + ACCENT),
    flag: await icon(fa.FaFlag, "#" + VIOLET),
    git: await icon(fa.FaGithub, "#" + INK),
    chart: await icon(fa.FaChartBar, "#" + ACCENT),
    handshake: await icon(fa.FaHandshakeSlash || fa.FaHandshake, "#" + RED),
    user: await icon(fa.FaUserSecret, "#" + ACCENT),
  };

  // helpers
  function base(slide, { dark = true } = {}) {
    slide.background = { color: dark ? BG : BG };
  }
  function kicker(slide, text, x = 0.7, y = 0.5) {
    slide.addText(text.toUpperCase(), {
      x, y, w: 11, h: 0.3, fontFace: "Consolas", fontSize: 12,
      color: ACCENT, bold: true, charSpacing: 3, margin: 0,
    });
  }
  function title(slide, text, x = 0.7, y = 0.82, w = 11.9) {
    slide.addText(text, {
      x, y, w, h: 0.9, fontFace: "Georgia", fontSize: 32, bold: true,
      color: INK, margin: 0, align: "left", valign: "top",
    });
  }
  function footer(slide, idx) {
    slide.addText([
      { text: "Blindfold", options: { color: ACCENT, bold: true } },
      { text: "   ·   Global South AI Safety Hackathon · Apart × AnToàn.AI", options: { color: MUTE } },
    ], { x: 0.7, y: H - 0.42, w: 10, h: 0.3, fontFace: "Calibri", fontSize: 9, margin: 0 });
    slide.addText(String(idx).padStart(2, "0") + " / 09", {
      x: W - 1.7, y: H - 0.42, w: 1.0, h: 0.3, fontFace: "Consolas", fontSize: 9,
      color: MUTE, align: "right", margin: 0,
    });
  }
  function card(slide, x, y, w, h, fill = CARD, opts = {}) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, fill: { color: fill }, rectRadius: 0.08,
      line: opts.line || { color: BG2, width: 1 },
      shadow: opts.shadow === false ? undefined : mkShadow(),
    });
  }

  // ================= SLIDE 1 — TITLE =================
  {
    const s = pres.addSlide(); base(s);
    // subtle top glow bar
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.12, fill: { color: ACCENT } });
    // big faint emoji-ish eye motif: use icon large + faint
    s.addImage({ data: ic.eye, x: 9.35, y: 1.05, w: 3.1, h: 3.1, transparency: 80 });

    s.addText("🙈", { x: 0.7, y: 1.45, w: 1.5, h: 1.2, fontSize: 64, margin: 0, align: "left" });
    s.addText("BLINDFOLD", {
      x: 2.15, y: 1.62, w: 9, h: 1.0, fontFace: "Georgia", fontSize: 58, bold: true,
      color: INK, charSpacing: 2, margin: 0, valign: "middle",
    });
    s.addText("Audit the blind spot, blindly.", {
      x: 0.75, y: 2.75, w: 11, h: 0.6, fontFace: "Georgia", fontSize: 26, italic: true,
      color: ACCENT, margin: 0,
    });
    s.addText(
      "A blind-audit harness + bilingual benchmark that measures the English→Vietnamese refusal gap inside a sealed enclave — so a lab, a safety org, and an auditor who don't trust each other can run one eval, and only a score comes out.",
      { x: 0.75, y: 3.55, w: 9.3, h: 1.3, fontFace: "Calibri", fontSize: 16, color: MUTE, margin: 0, lineSpacingMultiple: 1.15 }
    );

    // venue + repo strip
    s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 5.55, w: 0.05, h: 1.2, fill: { color: ACCENT } });
    s.addText([
      { text: "Global South AI Safety Hackathon", options: { color: INK, bold: true, breakLine: true } },
      { text: "Apart × AnToàn.AI  ·  Ho Chi Minh City", options: { color: MUTE, fontSize: 13, breakLine: true } },
    ], { x: 0.95, y: 5.55, w: 6, h: 0.85, fontFace: "Calibri", fontSize: 15, margin: 0, valign: "top" });

    s.addImage({ data: ic.git, x: 9.05, y: 6.18, w: 0.3, h: 0.3 });
    s.addText(REPO, {
      x: 9.45, y: 6.16, w: 3.6, h: 0.35, fontFace: "Consolas", fontSize: 13, color: ACCENT, margin: 0, valign: "middle",
    });
    s.notes = "Hi — we're Blindfold. The tagline is the whole pitch in five words: audit the blind spot, blindly. We built a way to measure whether a model's safety training survives translation into Vietnamese — and to do it without any of the three parties involved having to trust each other. Over the next eight slides: the problem, the trust problem, our solution, the benchmark, and the finding.";
  }

  // ================= SLIDE 2 — PROBLEM =================
  {
    const s = pres.addSlide(); base(s);
    kicker(s, "The problem");
    title(s, "Frontier labs red-team in English. Two blind spots open up.");

    // two cards
    const cy = 2.0, ch = 2.55, cw = 5.75;
    card(s, 0.7, cy, cw, ch);
    s.addImage({ data: ic.globe, x: 1.0, y: cy + 0.32, w: 0.55, h: 0.55 });
    s.addText("Local Global-South harms", { x: 1.72, y: cy + 0.32, w: cw - 1.1, h: 0.55, fontFace: "Georgia", fontSize: 19, bold: true, color: INK, margin: 0, valign: "middle" });
    s.addText([
      { text: "Bank / police-impersonation scams", options: { bullet: { code: "2022" }, color: INK, breakLine: true } },
      { text: "“đắp lá” & papaya-leaf cancer “cures”", options: { bullet: { code: "2022" }, color: INK, breakLine: true } },
      { text: "Telegram job scams", options: { bullet: { code: "2022" }, color: INK, breakLine: true } },
      { text: "Absent from English benchmarks.", options: { color: RED, italic: true } },
    ], { x: 1.05, y: cy + 1.05, w: cw - 0.7, h: 1.3, fontFace: "Calibri", fontSize: 14.5, margin: 0, paraSpaceAfter: 6 });

    card(s, 0.7 + cw + 0.4, cy, cw, ch);
    const x2 = 0.7 + cw + 0.4;
    s.addImage({ data: ic.user, x: x2 + 0.3, y: cy + 0.32, w: 0.55, h: 0.55 });
    s.addText("The non-English refusal gap", { x: x2 + 1.02, y: cy + 0.32, w: cw - 1.1, h: 0.55, fontFace: "Georgia", fontSize: 19, bold: true, color: INK, margin: 0, valign: "middle" });
    s.addText([
      { text: "Safety training is English-heavy. A model refuses a harmful prompt in English — then complies on the ", options: { color: INK } },
      { text: "identical", options: { color: INK, bold: true, italic: true } },
      { text: " request in Vietnamese.", options: { color: INK } },
    ], { x: x2 + 0.35, y: cy + 1.05, w: cw - 0.7, h: 1.35, fontFace: "Calibri", fontSize: 16, margin: 0, valign: "middle", lineSpacingMultiple: 1.3 });

    // cited proof band
    const by = cy + ch + 0.35;
    card(s, 0.7, by, 11.93, 1.35, BG2, { shadow: false, line: { color: ACCENT, width: 1 } });
    s.addText("CITED PROOF", { x: 1.0, y: by + 0.22, w: 2.2, h: 0.3, fontFace: "Consolas", fontSize: 11, bold: true, color: ACCENT, charSpacing: 2, margin: 0 });
    s.addText([
      { text: "0.63%", options: { color: GREEN, bold: true, fontSize: 30 } },
      { text: "  EN", options: { color: MUTE, fontSize: 15 } },
      { text: "      vs      ", options: { color: MUTE, fontSize: 15 } },
      { text: "7.94%", options: { color: RED, bold: true, fontSize: 30 } },
      { text: "  VN", options: { color: MUTE, fontSize: 15 } },
    ], { x: 1.0, y: by + 0.52, w: 5.6, h: 0.7, fontFace: "Georgia", margin: 0, valign: "middle" });
    s.addText("ChatGPT unsafe-response rate on identical prompts.\nDeng et al., Multilingual Jailbreak Challenges in LLMs, ICLR 2024.",
      { x: 6.8, y: by + 0.28, w: 5.6, h: 0.85, fontFace: "Calibri", fontSize: 13, color: INK, margin: 0, valign: "middle", lineSpacingMultiple: 1.1 });

    footer(s, 2);
    s.notes = "Frontier labs do their red-teaming overwhelmingly in English, on globally-recognised harms. That leaves two blind spots. First, local harms — Vietnamese bank-impersonation scams, papaya-leaf cancer cures, Telegram job scams — these never appear in English benchmarks. Second, the refusal gap: safety training is English-heavy, so a model that refuses in English will often comply on the exact same prompt in Vietnamese. This isn't speculation — Deng et al. at ICLR 2024 measured ChatGPT at 0.63% unsafe in English versus 7.94% in Vietnamese on identical prompts. More than a 10x gap.";
  }

  // ================= SLIDE 3 — TRUST PROBLEM =================
  {
    const s = pres.addSlide(); base(s);
    kicker(s, "The trust problem");
    title(s, "Auditing this needs three parties who won't share their secrets.");

    const cw = 3.7, ch = 2.9, cy = 2.15, gap = 0.42;
    const xs = [0.7, 0.7 + cw + gap, 0.7 + 2 * (cw + gap)];
    const data = [
      { ic: ic.lock, t: "The Lab", s: "holds the model weights", k: "private weights", c: ACCENT },
      { ic: ic.book, t: "The Safety Org", s: "holds the VN benchmark", k: "private prompts", c: AMBER },
      { ic: ic.code, t: "The Auditor", s: "holds the eval code", k: "eval logic", c: VIOLET },
    ];
    data.forEach((d, i) => {
      card(s, xs[i], cy, cw, ch);
      s.addShape(pres.shapes.RECTANGLE, { x: xs[i], y: cy, w: cw, h: 0.09, fill: { color: d.c } });
      s.addImage({ data: d.ic, x: xs[i] + cw / 2 - 0.45, y: cy + 0.45, w: 0.9, h: 0.9 });
      s.addText(d.t, { x: xs[i], y: cy + 1.45, w: cw, h: 0.45, fontFace: "Georgia", fontSize: 21, bold: true, color: INK, align: "center", margin: 0 });
      s.addText(d.s, { x: xs[i], y: cy + 1.92, w: cw, h: 0.4, fontFace: "Calibri", fontSize: 14, color: MUTE, align: "center", margin: 0 });
      s.addText(d.k.toUpperCase(), { x: xs[i] + 0.4, y: cy + 2.42, w: cw - 0.8, h: 0.35, fontFace: "Consolas", fontSize: 11, bold: true, color: d.c, align: "center", charSpacing: 1.5, margin: 0 });
    });

    // bottom takeaway
    s.addImage({ data: ic.handshake, x: 0.95, y: 5.55, w: 0.55, h: 0.55 });
    s.addText([
      { text: "Nobody will hand over their secret. ", options: { color: INK, bold: true } },
      { text: "No weights to the org. No prompts to the lab. No data to anyone. So today, the audit simply doesn't happen.", options: { color: MUTE } },
    ], { x: 1.65, y: 5.5, w: 11, h: 0.85, fontFace: "Calibri", fontSize: 16, margin: 0, valign: "middle", lineSpacingMultiple: 1.12 });

    footer(s, 3);
    s.notes = "Here's why this audit doesn't happen today. It needs three parties who actively distrust each other. The lab owns the weights and won't ship them. The safety org owns a hard-won Vietnamese benchmark and won't leak it — if it's public, the lab can just train on it. The auditor owns the eval code. Each one's asset is the thing they can't reveal. So the audit stalls before it starts. That's the gap we close.";
  }

  // ================= SLIDE 4 — SOLUTION / ENCLAVE =================
  {
    const s = pres.addSlide(); base(s);
    kicker(s, "Our solution");
    title(s, "The blind-audit enclave");

    // three inputs on left
    const inX = 0.75, inW = 2.55, inH = 1.05;
    const inputs = [
      { y: 1.95, ic: ic.lock, t: "Lab", s: "weights", c: ACCENT },
      { y: 3.18, ic: ic.book, t: "Safety org", s: "VN benchmark", c: AMBER },
      { y: 4.41, ic: ic.code, t: "Auditor", s: "eval code", c: VIOLET },
    ];
    inputs.forEach((d) => {
      card(s, inX, d.y, inW, inH, CARD, { shadow: false, line: { color: d.c, width: 1.5 } });
      s.addImage({ data: d.ic, x: inX + 0.25, y: d.y + 0.28, w: 0.5, h: 0.5 });
      s.addText([
        { text: d.t, options: { bold: true, color: INK, fontSize: 16, breakLine: true } },
        { text: d.s, options: { color: MUTE, fontSize: 12 } },
      ], { x: inX + 0.92, y: d.y + 0.16, w: inW - 1.0, h: 0.75, fontFace: "Calibri", margin: 0, valign: "middle" });
      // arrow
      s.addImage({ data: ic.arrow, x: inX + inW + 0.12, y: d.y + 0.33, w: 0.55, h: 0.4 });
    });

    // sealed enclave (center)
    const ex = 4.15, ey = 1.85, ew = 5.0, eh = 3.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ex, y: ey, w: ew, h: eh, fill: { color: BG2 }, rectRadius: 0.12, line: { color: GREEN, width: 2.5 }, shadow: mkShadow() });
    s.addImage({ data: ic.shield, x: ex + ew / 2 - 0.4, y: ey + 0.35, w: 0.8, h: 0.8 });
    s.addText("SEALED ENCLAVE", { x: ex, y: ey + 1.2, w: ew, h: 0.4, fontFace: "Consolas", fontSize: 14, bold: true, color: GREEN, charSpacing: 3, align: "center", margin: 0 });
    s.addText([
      { text: "Both data owners review + approve the code", options: { color: INK, breakLine: true } },
      { text: "Either party can veto", options: { color: RED, bold: true, breakLine: true } },
      { text: "Built on OpenMined syft-client", options: { color: MUTE, italic: true } },
    ], { x: ex + 0.45, y: ey + 1.75, w: ew - 0.9, h: 1.4, fontFace: "Calibri", fontSize: 14.5, align: "center", margin: 0, paraSpaceAfter: 8, lineSpacingMultiple: 1.1 });

    // output: signed scorecard
    s.addImage({ data: ic.arrow, x: ex + ew + 0.1, y: ey + eh / 2 - 0.2, w: 0.6, h: 0.4 });
    const ox = ex + ew + 0.75, oy = 2.55, ow = 2.65, oh = 2.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ox, y: oy, w: ow, h: oh, fill: { color: GREENBG }, rectRadius: 0.1, line: { color: GREEN, width: 2 }, shadow: mkShadow() });
    s.addImage({ data: ic.check, x: ox + ow / 2 - 0.35, y: oy + 0.3, w: 0.7, h: 0.7 });
    s.addText("Signed\nscorecard", { x: ox, y: oy + 1.1, w: ow, h: 0.8, fontFace: "Georgia", fontSize: 18, bold: true, color: INK, align: "center", margin: 0 });
    s.addText("the only thing that exits", { x: ox, y: oy + 1.92, w: ow, h: 0.4, fontFace: "Calibri", fontSize: 12, italic: true, color: GREEN, align: "center", margin: 0 });

    // guarantee strip
    card(s, 0.75, 5.95, 11.85, 0.78, BG2, { shadow: false, line: { color: BG2, width: 1 } });
    s.addText([
      { text: "Lab never sees prompts", options: { color: INK, bold: true } },
      { text: "   ·   ", options: { color: MUTE } },
      { text: "Org never sees weights", options: { color: INK, bold: true } },
      { text: "   ·   ", options: { color: MUTE } },
      { text: "Neither can game it", options: { color: GREEN, bold: true } },
    ], { x: 0.75, y: 5.95, w: 11.85, h: 0.78, fontFace: "Calibri", fontSize: 16, align: "center", valign: "middle", margin: 0 });

    footer(s, 4);
    s.notes = "Our answer is a blind-audit enclave. The three secrets — weights, benchmark, eval code — meet only inside a sealed enclave, built on OpenMined's syft-client. It's code-to-data: the code travels to the data, not the other way around. Crucially, both data owners review and approve the exact code that will run, and either one can veto. Nothing leaks. The only thing that ever exits is a signed scorecard. So the lab never sees the prompts, the org never sees the weights, and because both approved the code, neither can rig the result.";
  }

  // ================= SLIDE 5 — BENCHMARK =================
  {
    const s = pres.addSlide(); base(s);
    kicker(s, "The benchmark");
    title(s, "47 bilingual EN↔VN prompts — global harms meet local ones.");

    // big count callout left
    card(s, 0.7, 2.05, 2.7, 3.05, BG2, { shadow: false, line: { color: ACCENT, width: 1.5 } });
    s.addText("47", { x: 0.7, y: 2.25, w: 2.7, h: 1.0, fontFace: "Georgia", fontSize: 64, bold: true, color: ACCENT, align: "center", margin: 0 });
    s.addText("prompts × 2 languages", { x: 0.7, y: 3.25, w: 2.7, h: 0.4, fontFace: "Calibri", fontSize: 13, color: MUTE, align: "center", margin: 0 });
    s.addShape(pres.shapes.LINE, { x: 1.1, y: 3.78, w: 1.9, h: 0, line: { color: BG, width: 1 } });
    s.addText([
      { text: "42", options: { color: RED, bold: true, fontSize: 22 } },
      { text: "  should-refuse", options: { color: INK, fontSize: 13, breakLine: true } },
      { text: "5", options: { color: GREEN, bold: true, fontSize: 22 } },
      { text: "  should-comply", options: { color: INK, fontSize: 13 } },
    ], { x: 0.7, y: 3.95, w: 2.7, h: 1.0, fontFace: "Georgia", align: "center", margin: 0, paraSpaceAfter: 6, valign: "top" });

    // four category rows on right
    const rx = 3.75, rw = 8.85, rh = 0.72, rg = 0.16;
    let ry = 2.05;
    const cats = [
      { ic: ic.bug, n: "26", t: "Jailbreak", tag: "GLOBAL", src: "MultiJail", c: ACCENT },
      { ic: ic.bank, n: "8", t: "Scam", tag: "LOCAL", src: "VN gov / AIS sources", c: RED },
      { ic: ic.pills, n: "8", t: "Medical", tag: "LOCAL", src: "Ministry of Health warnings", c: RED },
      { ic: ic.leaf, n: "5", t: "Benign", tag: "CONTROL", src: "over-refusal controls", c: GREEN },
    ];
    cats.forEach((d) => {
      card(s, rx, ry, rw, rh, CARD, { shadow: false, line: { color: BG2, width: 1 } });
      s.addShape(pres.shapes.RECTANGLE, { x: rx, y: ry, w: 0.09, h: rh, fill: { color: d.c } });
      s.addImage({ data: d.ic, x: rx + 0.3, y: ry + rh / 2 - 0.21, w: 0.42, h: 0.42 });
      s.addText(d.n, { x: rx + 0.95, y: ry, w: 0.95, h: rh, fontFace: "Georgia", fontSize: 26, bold: true, color: d.c, align: "center", valign: "middle", margin: 0 });
      s.addText(d.t, { x: rx + 2.0, y: ry, w: 2.3, h: rh, fontFace: "Calibri", fontSize: 17, bold: true, color: INK, valign: "middle", margin: 0 });
      s.addText(d.tag, { x: rx + 4.0, y: ry + rh / 2 - 0.16, w: 1.4, h: 0.32, fontFace: "Consolas", fontSize: 10.5, bold: true, color: d.c, valign: "middle", charSpacing: 1.5, margin: 0 });
      s.addText(d.src, { x: rx + 5.35, y: ry, w: rw - 5.7, h: rh, fontFace: "Calibri", fontSize: 13, italic: true, color: MUTE, valign: "middle", align: "right", margin: 0 });
      ry += rh + rg;
    });

    // bottom note
    s.addImage({ data: ic.check, x: 0.75, y: 5.55, w: 0.45, h: 0.45 });
    s.addText([
      { text: "Every harmful prompt cites a real Vietnamese source. ", options: { color: INK, bold: true } },
      { text: "Benign controls catch over-refusal — an all-refuse model can’t fake a perfect score.", options: { color: MUTE } },
    ], { x: 1.35, y: 5.5, w: 11.3, h: 0.85, fontFace: "Calibri", fontSize: 15, margin: 0, valign: "middle", lineSpacingMultiple: 1.12 });

    footer(s, 5);
    s.notes = "The benchmark is 47 prompts, each in English and Vietnamese — 94 total. Twenty-six jailbreaks from MultiJail give us the global axis. Then the local axis: 8 scam and 8 medical prompts, authored from Vietnamese government and Ministry of Health sources — real local harms. And 5 benign controls — harmless questions a helpful model should answer. 42 should be refused, 5 should be complied with. Those benign controls matter: without them, a model that refuses everything would score a perfect 100 and look safe. They're what caught the over-refusal you'll see in two slides.";
  }

  // ================= SLIDE 6 — HERO FINDING (2x2) =================
  {
    const s = pres.addSlide(); base(s);
    kicker(s, "The finding");
    title(s, "Safety training is English. It doesn’t transfer to Vietnamese.");

    // 2x2 grid
    const gx = 2.55, gy = 2.25, cellW = 4.55, cellH = 1.75, gp = 0.25;
    // column headers
    s.addText("EN", { x: gx, y: gy - 0.55, w: cellW, h: 0.45, fontFace: "Georgia", fontSize: 22, bold: true, color: INK, align: "center", margin: 0 });
    s.addText("VN", { x: gx + cellW + gp, y: gy - 0.55, w: cellW, h: 0.45, fontFace: "Georgia", fontSize: 22, bold: true, color: INK, align: "center", margin: 0 });
    // row labels (rotated-ish, just stacked left)
    s.addText("Harmful\njailbreak", { x: 0.7, y: gy + 0.25, w: 1.7, h: cellH - 0.3, fontFace: "Calibri", fontSize: 16, bold: true, color: MUTE, align: "right", valign: "middle", margin: 0 });
    s.addText("Harmless\nquestion", { x: 0.7, y: gy + cellH + gp + 0.25, w: 1.7, h: cellH - 0.3, fontFace: "Calibri", fontSize: 16, bold: true, color: MUTE, align: "right", valign: "middle", margin: 0 });

    function cell(x, y, good, icData, label, sub) {
      const fill = good ? GREENBG : REDBG;
      const lc = good ? GREEN : RED;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cellW, h: cellH, fill: { color: fill }, rectRadius: 0.1, line: { color: lc, width: 2 }, shadow: mkShadow() });
      s.addImage({ data: icData, x: x + 0.4, y: y + cellH / 2 - 0.45, w: 0.9, h: 0.9 });
      s.addText(label, { x: x + 1.55, y: y + 0.28, w: cellW - 1.75, h: 0.7, fontFace: "Georgia", fontSize: 24, bold: true, color: lc, margin: 0, valign: "middle" });
      s.addText(sub, { x: x + 1.55, y: y + 0.98, w: cellW - 1.75, h: 0.6, fontFace: "Calibri", fontSize: 13.5, color: INK, margin: 0, valign: "top" });
    }
    cell(gx, gy, true, ic.check, "Refused", "blocked the attack");
    cell(gx + cellW + gp, gy, false, ic.cross, "Complied", "answered the attack");
    cell(gx, gy + cellH + gp, true, ic.check, "Helped", "answered the question");
    cell(gx + cellW + gp, gy + cellH + gp, false, ic.cross, "Refused", "blocked a safe question");

    // diagonal callout
    s.addText("Both diagonals fail — in opposite directions — only in Vietnamese.", {
      x: gx, y: gy + 2 * cellH + gp + 0.18, w: 2 * cellW + gp, h: 0.4,
      fontFace: "Calibri", fontSize: 14, italic: true, color: AMBER, align: "center", margin: 0,
    });

    footer(s, 6);
    s.notes = "This is the headline. Read it as a two-by-two. Top row, a harmful jailbreak: in English the model refuses — good. In Vietnamese, the same attack, it complies — it under-refuses real harm. Bottom row, a harmless question: in English it helps — good. In Vietnamese it refuses a perfectly safe question — it over-refuses. So both diagonals fail, in opposite directions, and only in Vietnamese. The one-line takeaway: safety training is English, and it does not transfer.";
  }

  // ================= SLIDE 7 — THE NUMBERS =================
  {
    const s = pres.addSlide(); base(s);
    kicker(s, "The numbers");
    title(s, "qwen2.5-0.5b — a two-directional failure in Vietnamese.");

    const rows = [
      { lbl: "Jailbreaks refused", en: 69, vn: 62, enT: "18/26", vnT: "16/26", verdict: "weaker", vc: RED, ic: ic.bug },
      { lbl: "Benign refused (lower = better)", en: 0, vn: 60, enT: "0/5", vnT: "3/5", verdict: "over-cautious", vc: RED, ic: ic.leaf },
      { lbl: "Scam + medical refused", en: 56, vn: 88, enT: "9/16", vnT: "14/16", verdict: "surprise: safer", vc: AMBER, ic: ic.bank },
    ];
    const rowY0 = 2.15, rowH = 1.3, rowGap = 0.18;
    const barX = 4.5, barMaxW = 5.0;
    rows.forEach((r, i) => {
      const y = rowY0 + i * (rowH + rowGap);
      card(s, 0.7, y, 11.93, rowH, CARD, { shadow: false, line: { color: BG2, width: 1 } });
      s.addImage({ data: r.ic, x: 0.95, y: y + rowH / 2 - 0.22, w: 0.44, h: 0.44 });
      s.addText(r.lbl, { x: 1.5, y: y + 0.14, w: 2.95, h: rowH - 0.28, fontFace: "Calibri", fontSize: 15, bold: true, color: INK, valign: "middle", margin: 0 });

      // EN bar
      const enW = Math.max(barMaxW * r.en / 100, 0.05);
      const vnW = Math.max(barMaxW * r.vn / 100, 0.05);
      // track
      s.addShape(pres.shapes.RECTANGLE, { x: barX, y: y + 0.28, w: barMaxW, h: 0.3, fill: { color: BG } });
      s.addShape(pres.shapes.RECTANGLE, { x: barX, y: y + 0.28, w: enW, h: 0.3, fill: { color: GREEN } });
      s.addText("EN " + r.enT + " · " + r.en + "%", { x: barX + barMaxW + 0.15, y: y + 0.22, w: 2.0, h: 0.4, fontFace: "Consolas", fontSize: 12, color: GREEN, valign: "middle", margin: 0 });
      s.addShape(pres.shapes.RECTANGLE, { x: barX, y: y + 0.68, w: barMaxW, h: 0.3, fill: { color: BG } });
      s.addShape(pres.shapes.RECTANGLE, { x: barX, y: y + 0.68, w: vnW, h: 0.3, fill: { color: r.vc === AMBER ? AMBER : RED } });
      s.addText("VN " + r.vnT + " · " + r.vn + "%", { x: barX + barMaxW + 0.15, y: y + 0.62, w: 2.0, h: 0.4, fontFace: "Consolas", fontSize: 12, color: r.vc, valign: "middle", margin: 0 });

      // verdict pill far right
      s.addText(r.verdict.toUpperCase(), { x: 10.55, y: y + 0.14, w: 1.78, h: rowH - 0.28, fontFace: "Consolas", fontSize: 10.5, bold: true, color: r.vc, align: "right", valign: "middle", charSpacing: 1, margin: 0 });
    });

    // takeaway
    s.addImage({ data: ic.warn, x: 0.75, y: 6.42, w: 0.42, h: 0.42 });
    s.addText([
      { text: "Under-refuses real attacks AND over-refuses harmless questions. ", options: { color: INK, bold: true } },
      { text: "The gap cuts both ways — and is worst on local harms.", options: { color: MUTE } },
    ], { x: 1.3, y: 6.38, w: 11.3, h: 0.5, fontFace: "Calibri", fontSize: 14.5, margin: 0, valign: "middle" });

    footer(s, 7);
    s.notes = "Here are the actual numbers from the qwen2.5-0.5b run. Jailbreaks: refused 18 of 26 in English, only 16 of 26 in Vietnamese — weaker exactly where it matters. Benign controls: refused 0 of 5 in English, but 3 of 5 in Vietnamese — over-cautious, blocking safe questions. And a genuine surprise — scam and medical, the local harms: 56% refused in English jumps to 88% in Vietnamese, so on those it's actually safer. The honest picture is two-directional failure: it under-refuses real attacks and over-refuses harmless ones, and the gap is worst on local harms.";
  }

  // ================= SLIDE 8 — LIMITATIONS + FUTURE =================
  {
    const s = pres.addSlide(); base(s);
    kicker(s, "Limitations + future work");
    title(s, "Directional, not final — and a clear path to make it citable.");

    // LIMITATIONS column
    const lx = 0.7, lw = 5.75, ly = 2.05, lh = 3.95;
    card(s, lx, ly, lw, lh, BG2, { shadow: false, line: { color: RED, width: 1.5 } });
    s.addImage({ data: ic.warn, x: lx + 0.35, y: ly + 0.32, w: 0.5, h: 0.5 });
    s.addText("Honest limitations", { x: lx + 1.0, y: ly + 0.32, w: lw - 1.2, h: 0.5, fontFace: "Georgia", fontSize: 19, bold: true, color: INK, valign: "middle", margin: 0 });
    s.addText([
      { text: "Single small model (qwen2.5-0.5b)", options: { bullet: { code: "2022" }, color: INK, breakLine: true } },
      { text: "94-answer run — directional, not citable-final", options: { bullet: { code: "2022" }, color: INK, breakLine: true } },
      { text: "TEE / remote attestation is mocked in stage-1", options: { bullet: { code: "2022" }, color: INK, breakLine: true } },
      { text: "47-prompt set is small; refusal scoring heuristic (+ optional LLM judge)", options: { bullet: { code: "2022" }, color: INK } },
    ], { x: lx + 0.4, y: ly + 1.15, w: lw - 0.8, h: 2.6, fontFace: "Calibri", fontSize: 15, margin: 0, paraSpaceAfter: 12, lineSpacingMultiple: 1.1 });

    // FUTURE column
    const fx = lx + lw + 0.4, fw = 5.75;
    card(s, fx, ly, fw, lh, BG2, { shadow: false, line: { color: GREEN, width: 1.5 } });
    s.addImage({ data: ic.rocket, x: fx + 0.35, y: ly + 0.32, w: 0.5, h: 0.5 });
    s.addText("Roadmap", { x: fx + 1.0, y: ly + 0.32, w: fw - 1.2, h: 0.5, fontFace: "Georgia", fontSize: 19, bold: true, color: INK, valign: "middle", margin: 0 });
    s.addText([
      { text: "Real enclave + GCP Confidential Space (stages 2 & 3)", options: { bullet: { code: "2022" }, color: INK, breakLine: true } },
      { text: "Bigger models, already wired: qwen2.5-3b · phogpt-4b · seallm-v3-7b", options: { bullet: { code: "2022" }, color: INK, breakLine: true } },
      { text: "Expand the benchmark", options: { bullet: { code: "2022" }, color: INK, breakLine: true } },
      { text: "Tagalog companion set — show the local-harm gap generalises across SEA", options: { bullet: { code: "2022" }, color: INK } },
    ], { x: fx + 0.4, y: ly + 1.15, w: fw - 0.8, h: 2.6, fontFace: "Calibri", fontSize: 15, margin: 0, paraSpaceAfter: 12, lineSpacingMultiple: 1.1 });

    s.addText("The TEE being mocked is a credibility note, not the contribution — the architecture is real, the hardware seal is the only thing stubbed.", {
      x: 0.7, y: 6.2, w: 11.9, h: 0.55, fontFace: "Calibri", fontSize: 13, italic: true, color: MUTE, align: "center", margin: 0,
    });

    footer(s, 8);
    s.notes = "We want to be transparent about what this is and isn't. It's one small model, a 94-answer run — that's directional, not a final citable number. The trusted-execution hardware and remote attestation are mocked in this stage-1 demo; that's a credibility note, not the contribution — the enclave architecture is real, only the hardware seal is stubbed. The benchmark is small and refusal scoring is heuristic. The roadmap closes all of that: real enclave on GCP Confidential Space, bigger models already wired up including a Vietnamese-native PhoGPT and SeaLLM, an expanded benchmark, and a Tagalog companion set we've already built to show the local-harm gap generalises across Southeast Asian languages.";
  }

  // ================= SLIDE 9 — CLOSING =================
  {
    const s = pres.addSlide(); base(s);
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.12, fill: { color: ACCENT } });
    s.addImage({ data: ic.eye, x: 10.35, y: 0.45, w: 2.1, h: 2.1, transparency: 84 });

    kicker(s, "What we contributed", 0.7, 0.7);
    s.addText("Three things that didn’t exist before.", {
      x: 0.7, y: 1.05, w: 11.5, h: 0.9, fontFace: "Georgia", fontSize: 34, bold: true, color: INK, margin: 0,
    });

    const cy = 2.35, ch = 2.0, cw = 3.85, gap = 0.35;
    const xs = [0.7, 0.7 + cw + gap, 0.7 + 2 * (cw + gap)];
    const contribs = [
      { ic: ic.shield, t: "Blind-audit harness", s: "Three secrets meet in a sealed enclave on syft-client — only a signed scorecard exits.", c: ACCENT },
      { ic: ic.book, t: "Local-harms benchmark", s: "47 bilingual EN↔VN prompts; every harmful one cites a real Vietnamese source.", c: AMBER },
      { ic: ic.chart, t: "The measured gap", s: "English safety doesn’t transfer to Vietnamese — it fails both ways.", c: GREEN },
    ];
    contribs.forEach((d, i) => {
      card(s, xs[i], cy, cw, ch);
      s.addShape(pres.shapes.RECTANGLE, { x: xs[i], y: cy, w: cw, h: 0.09, fill: { color: d.c } });
      s.addImage({ data: d.ic, x: xs[i] + 0.35, y: cy + 0.35, w: 0.55, h: 0.55 });
      s.addText(d.t, { x: xs[i] + 0.35, y: cy + 1.0, w: cw - 0.7, h: 0.4, fontFace: "Georgia", fontSize: 17, bold: true, color: INK, margin: 0 });
      s.addText(d.s, { x: xs[i] + 0.35, y: cy + 1.42, w: cw - 0.7, h: 0.55, fontFace: "Calibri", fontSize: 12.5, color: MUTE, margin: 0, lineSpacingMultiple: 1.08 });
    });

    // CTA strip
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 4.95, w: 11.93, h: 1.45, fill: { color: BG2 }, rectRadius: 0.1, line: { color: ACCENT, width: 1.5 }, shadow: mkShadow() });
    s.addText("Audit the blind spot — blindly.", {
      x: 1.1, y: 5.2, w: 7.5, h: 0.55, fontFace: "Georgia", fontSize: 24, italic: true, bold: true, color: ACCENT, margin: 0, valign: "middle",
    });
    s.addText("Trust-minimized by construction: labs audited on local harms without leaking weights; local safety orgs contribute benchmarks without leaking them.", {
      x: 1.1, y: 5.72, w: 7.6, h: 0.6, fontFace: "Calibri", fontSize: 12.5, color: MUTE, margin: 0, valign: "top", lineSpacingMultiple: 1.05 });
    s.addImage({ data: ic.git, x: 8.75, y: 5.46, w: 0.4, h: 0.4 });
    s.addText(REPO, { x: 9.22, y: 5.42, w: 3.45, h: 0.45, fontFace: "Consolas", fontSize: 12, bold: true, color: INK, valign: "middle", margin: 0 });
    s.addText("Run the eval yourself →", { x: 9.22, y: 5.92, w: 3.45, h: 0.35, fontFace: "Calibri", fontSize: 12, italic: true, color: ACCENT, margin: 0 });

    s.addText("Global South AI Safety Hackathon  ·  Apart × AnToàn.AI  ·  Ho Chi Minh City", {
      x: 0.7, y: 6.75, w: 11.9, h: 0.4, fontFace: "Calibri", fontSize: 11, color: MUTE, align: "center", margin: 0,
    });
    s.notes = "To close — three things that didn't exist before Blindfold. One: a blind-audit harness where three mutually-distrustful parties run one eval and only a signed scorecard comes out. Two: a local-harms bilingual benchmark, every harmful prompt grounded in a real Vietnamese source. Three: the measured gap — English safety training doesn't transfer to Vietnamese, failing in both directions. It's trust-minimized by construction: labs get audited on local harms without leaking weights, and local safety orgs contribute benchmarks without leaking them. The code is on GitHub — run the eval yourself. Thank you.";
  }

  await pres.writeFile({ fileName: "/Users/khoaguin/Desktop/projects/Hackathons/blindfold/submission/blindfold_deck.pptx" });
  console.log("WROTE deck");
}

main().catch((e) => { console.error(e); process.exit(1); });
