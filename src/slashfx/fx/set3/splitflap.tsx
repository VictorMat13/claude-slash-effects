// /split-flap (set 3, builder S3-B). Victor's "surface" take full frame; under his chin a CRT tube (crtgraph's
// placement: top below his jaw, bottom inside the safe rect) holds three split-flap displays, mechanical flip boards.
// Each module flips top to bottom through a few characters of its drum (the upper flap falls, the lower flap lands),
// eased, faster first and slower into the landing, staggered left to right, and lands on the verified counts (COUNTS:
// 20, 25+, 100+) with the COUNTS labels under them, COUNTS_TITLE above with the real Resolve mark, COUNTS_SOURCE small
// below. Behind the boards, far back and out of focus, the real Fusion page (press shot) pans across its viewer.
// One live scope trace runs under the boards: a coral packet runs in along it and fires on each board as it lands.
// Camera (one KEY_T timeline, hold, travel, hold): opens tight on the first display (inside the tube, content zoom
// 1.75) while it flips and lands, then pulls out (t 8 to 22) to all three boards; the tube plane settles from 1.06 and
// a 6 degree tilt, and the far plane (his take) moves less (1.07 to 1.035, parallax) and racks into focus.
// Safe zone (SAFE_IG, 60..1000 x 270..1580 since 2026-10-26 00:50): the tube's worst frame (the opening zoom and tilt
// with the float and turn) is sized to land inside it; its top sits under his jaw and his words sit above it.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { CRT } from "../../../artcraft/kit/Tube";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { COUNTS, COUNTS_SOURCE, COUNTS_TITLE, LOGOS, SHOTS } from "../../data/facts";
import { Caption, Clip, INTER, MONO } from "../../kit";
import { CLAMP, EASE, SAFE_IG, ez, lerp, type FxDef, type FxProps } from "../../theme";

// ---------------------------------------------------------------- camera: one keyframe timeline
const KEY_T = [0, 8, 22, 48];
const key = (t: number, v: number[]) => interpolate(t, KEY_T, v, { ...CLAMP, easing: EASE.travel });
/** tube plane zoom (anchored on its top center) and tilt; the content zoom inside the tube (tight on display 1) */
const Z_KEYS = [1.04, 1.037, 1.0, 0.99];
const RX_KEYS = [6, 5.5, 1.4, 1.1];
const ZI_KEYS = [1.75, 1.72, 1.0, 1.0];
const FLOAT = 3;
const RY = 0.6;
const PERSP = 1600;

// ---------------------------------------------------------------- the tube (on-screen px), sized to its worst frame
/** His take scales about (540, 1840) from 1.07 down to 1.033 (CLIP_S). His chin's lowest point over the first two
 *  seconds of the take is y 1085 (measured every 0.125 s; 1090 with margin), so on screen it is lowest at the smallest
 *  scale. His words sit at least CHIN_CLEAR under it, and the tube's top edge sits under his words. */
const CLIP_S = [1.07, 1.068, 1.035, 1.033];
const CLIP_ORIGIN = { x: 540, y: 1840 };
const CHIN_TAKE = 1090;
const CHIN_CLEAR = 40;
const CHIN_SCREEN = CLIP_ORIGIN.y + (CHIN_TAKE - CLIP_ORIGIN.y) * Math.min(...CLIP_S);
const CAPTION_SIZE = 60;
const CAPTION_Y = Math.ceil(CHIN_SCREEN + CHIN_CLEAR);
/** The tube's top edge: under the caption box, clear of it at the highest float. */
const CARD_TOP = Math.ceil(CAPTION_Y + CAPTION_SIZE * 1.12 + 6 + FLOAT);
const EDGE = 8;
/** Screen offset from the top-center anchor of card point (x, y) under perspective(PERSP) rotateX(rx) rotateY(ry) scale(z). */
const project = (x: number, y: number, z: number, rx: number, ry: number) => {
  const a = (rx * Math.PI) / 180;
  const b = (ry * Math.PI) / 180;
  const x1 = x * z * Math.cos(b);
  const z1 = -x * z * Math.sin(b);
  const y2 = y * z * Math.cos(a) - z1 * Math.sin(a);
  const z2 = y * z * Math.sin(a) + z1 * Math.cos(a);
  const k = PERSP / (PERSP - z2);
  return { x: x1 * k, y: y2 * k };
};
/** How far a w x h tube reaches at its worst frame: the opening zoom and tilt with the full turn and float. */
const reach = (w: number, h: number) => {
  let side = 0;
  let bottom = 0;
  for (const ry of [-RY, RY])
    for (const sx of [-1, 1])
      for (const y of [0, h]) {
        const p = project((sx * w) / 2, y, Z_KEYS[0], RX_KEYS[0], ry);
        side = Math.max(side, Math.abs(p.x));
        bottom = Math.max(bottom, p.y + FLOAT);
      }
  return { side, bottom };
};
const fit = (ok: (v: number) => boolean, lo: number, hi: number) => {
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (ok(m)) lo = m;
    else hi = m;
  }
  return Math.floor(lo);
};
const CARD_H = fit((h) => CARD_TOP + reach(SAFE_IG.w, h).bottom <= SAFE_IG.y1 - EDGE, 100, SAFE_IG.h);
const CARD_W = fit((w) => reach(w, CARD_H).side <= SAFE_IG.w / 2 - EDGE, 100, SAFE_IG.w);
const CARD_R = 30;
const CARD_LEFT = (SAFE_IG.x0 + SAFE_IG.x1 - CARD_W) / 2;

/** The CRT pass sizes itself to the composition (1080 wide): draw the tube at 1080 wide, scale it into the card. */
const TUBE_W = 1080;
const K = CARD_W / TUBE_W;
const TUBE_H = CARD_H / K;

// ---------------------------------------------------------------- layout inside the tube (card px)
const INK = "#ECEAE4";
const PAD_X = 36;
const TITLE = 30;
const LOGO = 36;
const LABEL = 30;
const LABEL_LH = 1.14;
const SOURCE = 26;
/** What each board shows (verbatim counts): "20", "25+", "100+". */
const TARGETS = COUNTS.map((c) => `${c.n}${c.plus ? "+" : ""}`);
const MGAP = 6;
const BPAD = 7;
/** Widest line of each label in em of Inter 600 ("new scripting", "new Krokodove", "and controls"), measured on the
 *  27 px stills (177, 201 and 158 px), plus 4 percent. Each label is centered under its board. */
const LABEL_EM = [6.56, 7.44, 5.85].map((e) => e * 1.04);
const labelW = (d: number) => LABEL_EM[d] * LABEL;
/** Clear space between neighbouring labels, and the smallest gap between boards. */
const LABEL_GAP = 34;
const GAP_MIN = 48;
const boardWith = (mw: number, n: number) => n * mw + (n - 1) * MGAP + 2 * BPAD;
/** The board row for module width mw: one equal gap (wide enough for the labels), centers, and its full extent. */
const rowFor = (mw: number) => {
  const bw = TARGETS.map((s) => boardWith(mw, s.length));
  let gap = GAP_MIN;
  for (let i = 0; i + 1 < bw.length; i++) gap = Math.max(gap, (labelW(i) + labelW(i + 1)) / 2 + LABEL_GAP - (bw[i] + bw[i + 1]) / 2);
  const c = [0];
  for (let i = 1; i < bw.length; i++) c.push(c[i - 1] + (bw[i - 1] + bw[i]) / 2 + gap);
  const half = bw.map((w, i) => Math.max(w, labelW(i)) / 2);
  const left = Math.min(...c.map((x, i) => x - half[i]));
  const right = Math.max(...c.map((x, i) => x + half[i]));
  return { bw, gap, c, left, span: right - left };
};
/** The largest module that lets the row (boards and labels) fit inside the tube's padding. */
const MW = (() => {
  let mw = 30;
  while (rowFor(mw + 1).span <= CARD_W - 2 * PAD_X) mw++;
  return mw;
})();
const ROW = rowFor(MW);
/** A tall flap like a real board. */
const MH = Math.round(MW * 1.72);
const DIGIT = Math.round(MH * 0.74);
const BOARD_H = MH + 2 * BPAD;
const boardW = (n: number) => boardWith(MW, n);
/** Center x of board i (card px); the packets land here and the labels center on it. */
const colX = (i: number) => ROW.c[i] + (CARD_W - ROW.span) / 2 - ROW.left;
/** Label box width: roomy, the text is centered and never wraps. */
const LABEL_W = 2 * Math.max(...TARGETS.map((_, d) => labelW(d)));
/** Vertical rhythm: title, boards, the trace, two label lines, the source; spare height split evenly between rows. */
const BLOCK = TITLE + BOARD_H + 2 * LABEL * LABEL_LH + SOURCE * 1.2;
const SPARE = Math.max(4, (CARD_H - 2 * 20 - BLOCK) / 5);
const TITLE_Y = 20 + SPARE * 0.6;
const BOARD_Y = TITLE_Y + TITLE + SPARE * 1.3;
const TY = BOARD_Y + BOARD_H + Math.min(22, SPARE * 0.8);
const LABEL_Y = TY + Math.min(20, SPARE * 0.7);
const SOURCE_Y = CARD_H - 20 - SPARE * 0.4 - SOURCE * 1.2;
/** Fusion page press shot (3840 x 2160), far back: its viewer and time ruler (the bright part of the page). */
const SHOT_W = 3840;
const SHOT_H = 2160;

// ---------------------------------------------------------------- the flip schedule (24 fps, t = 0 at the card resolve)
/** The drums the modules turn through, in order: digits count up through 0..9, the "+" module lands after the 9.
 *  Every module starts blank. */
const DIGITS = "0123456789";
const PLUS = "0123456789+";
/** Each board's last module lands at LAND[i] + (n - 1) * STEP; display 1 already flips when the card resolves. */
const LAND = [6.6, 15.6, 22.4];
const STEP = 1.2;
const FLIPS = [5, 6, 7];
type Mod = { seq: string[]; at: number[]; dur: number[] };
const MODS: Mod[][] = TARGETS.map((s, d) =>
  s.split("").map((ch, m) => {
    const n = FLIPS[d] + (m % 2);
    const drum = ch === "+" ? PLUS : DIGITS;
    const end = drum.indexOf(ch);
    const seq = [" "];
    for (let j = n - 1; j >= 0; j--) seq.push(drum[(end - j + drum.length * 4) % drum.length]);
    // faster first, slower into the landing (eased cadence)
    const dur = Array.from({ length: n }, (_, j) => 1.5 + 1.6 * Math.pow(j / Math.max(1, n - 1), 2));
    const land = LAND[d] + m * STEP;
    const at: number[] = [];
    let s0 = land - dur.reduce((a, b) => a + b, 0);
    for (const x of dur) {
      at.push(s0);
      s0 += x;
    }
    return { seq, at, dur };
  }),
);
/** The moment board d has fully landed (its last module), and when it starts turning. */
const landed = (d: number) => LAND[d] + (TARGETS[d].length - 1) * STEP;
const started = (d: number) => Math.min(...MODS[d].map((m) => m.at[0]));

/** A coral packet runs in from the left along the trace and fires on each board as it lands, then hums at its foot. */
const RUN = 10;
const traceBumps = (t: number): ScopeBump[] =>
  TARGETS.map((_, i) => {
    const land = landed(i);
    const breathe = 0.88 + 0.12 * Math.sin(t * 0.4 + i * 1.7);
    if (t < land) {
      const u = ez(t, land - RUN, land, EASE.travel);
      const env = interpolate(t, [land - RUN, land - RUN + 3], [0, 1], CLAMP);
      return { x: lerp(-30, colX(i), u), amp: 18 * env * breathe, sigma: 30, rgb: PH.claudeRgb };
    }
    return { x: colX(i), amp: (20 - 15 * ez(t, land, land + 14, EASE.decel)) * breathe, sigma: 30, rgb: PH.claudeRgb };
  });

// ---------------------------------------------------------------- one flap module
/** Flap card colors are set high on purpose: the tube's grade crushes darks (about #5B to #25), so these read as dark grey
 *  cards with a black hinge after the CRT pass; anything darker vanishes into the ground. */
const FLAP_TOP = "#5D626E";
const FLAP_BOT = "#50545F";
const Glyph: React.FC<{ ch: string; half: "top" | "bottom" }> = ({ ch, half }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: half === "top" ? 0 : -MH / 2,
      width: MW,
      height: MH,
      lineHeight: `${MH}px`,
      textAlign: "center",
      fontFamily: INTER,
      fontWeight: 800,
      fontSize: DIGIT,
      fontVariantNumeric: "tabular-nums",
      color: INK,
      letterSpacing: -1,
    }}
  >
    {ch === " " ? "" : ch}
  </div>
);
/** Half a flap (top or bottom) showing its half of a character; `shade` darkens it (0..1). */
const Half: React.FC<{ ch: string; half: "top" | "bottom"; shade?: number; style?: React.CSSProperties }> = ({ ch, half, shade = 0, style }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: half === "top" ? 0 : MH / 2,
      width: MW,
      height: MH / 2,
      overflow: "hidden",
      background: half === "top" ? FLAP_TOP : FLAP_BOT,
      borderRadius: half === "top" ? "6px 6px 0 0" : "0 0 6px 6px",
      backfaceVisibility: "hidden",
      ...style,
    }}
  >
    <Glyph ch={ch} half={half} />
    {shade > 0.005 ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${shade.toFixed(3)})` }} /> : null}
  </div>
);

const Module: React.FC<{ mod: Mod; t: number; x: number }> = ({ mod, t, x }) => {
  const { seq, at, dur } = mod;
  let k = 0;
  while (k < at.length && t >= at[k]) k++;
  const j = k - 1;
  const p = j >= 0 ? (t - at[j]) / dur[j] : 1;
  const flipping = j >= 0 && p < 1;
  const shown = flipping ? seq[j] : seq[k];
  const next = flipping ? seq[j + 1] : shown;
  // phase 1: the upper flap of the old character falls (accelerating); phase 2: the lower flap of the new one lands
  const p1 = flipping ? EASE.accel(Math.min(1, p / 0.5)) : 1;
  const p2 = flipping ? EASE.decel(Math.max(0, (p - 0.5) / 0.5)) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: 0, width: MW, height: MH, perspective: MH * 4 }}>
      {/* static halves: the new top is revealed behind the falling flap, the old bottom waits to be covered */}
      <Half ch={next} half="top" />
      <Half ch={flipping ? shown : next} half="bottom" shade={flipping ? 0.28 * p2 : 0} />
      {flipping && p < 0.5 ? (
        <Half ch={shown} half="top" shade={0.5 * p1} style={{ transformOrigin: "50% 100%", transform: `rotateX(${(-90 * p1).toFixed(2)}deg)` }} />
      ) : null}
      {flipping && p >= 0.5 ? (
        <Half ch={next} half="bottom" shade={0.45 * (1 - p2)} style={{ transformOrigin: "50% 0%", transform: `rotateX(${(90 * (1 - p2)).toFixed(2)}deg)` }} />
      ) : null}
      {/* the hinge */}
      <div style={{ position: "absolute", left: 0, top: MH / 2 - 1.5, width: MW, height: 3, background: "#000" }} />
      <div style={{ position: "absolute", left: -2, top: MH / 2 - 5, width: 4, height: 10, borderRadius: 2, background: "#7A7F8A" }} />
      <div style={{ position: "absolute", left: MW - 2, top: MH / 2 - 5, width: 4, height: 10, borderRadius: 2, background: "#7A7F8A" }} />
    </div>
  );
};

/** One board: a dark inset frame holding its modules, centered on its column, standing on the trace. */
const Board: React.FC<{ d: number; t: number }> = ({ d, t }) => {
  const n = TARGETS[d].length;
  const w = boardW(n);
  const on = ez(t, started(d) - 5, started(d) + 1, EASE.enter);
  return (
    <div
      style={{
        position: "absolute",
        left: colX(d) - w / 2,
        top: BOARD_Y,
        width: w,
        height: BOARD_H,
        borderRadius: 12,
        background: "#34373F",
        boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.22), 0 10px 22px rgba(0,0,0,0.5)",
        opacity: 0.35 + 0.65 * on,
        transform: `translateY(${((1 - on) * 10).toFixed(2)}px)`,
      }}
    >
      <div style={{ position: "absolute", left: BPAD, top: BPAD, width: w - 2 * BPAD, height: MH }}>
        {MODS[d].map((m, i) => (
          <Module key={i} mod={m} t={t} x={i * (MW + MGAP)} />
        ))}
      </div>
    </div>
  );
};

/** Two lines, broken at the space nearest the middle (labels are verbatim from facts.ts). */
const twoLines = (s: string): [string, string] => {
  const mid = s.length / 2;
  let best = -1;
  for (let i = 0; i < s.length; i++) if (s[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? [s, ""] : [s.slice(0, best), s.slice(best + 1)];
};

/** What the tube shows: the press shot far back (parallax), then the content plane under the inner camera. */
const Screen: React.FC<{ t: number; zi: number }> = ({ t, zi }) => {
  // inner camera: tight on display 1, easing to identity as the zoom returns to 1
  const u = (ZI_KEYS[0] - zi) / (ZI_KEYS[0] - 1);
  const fx = lerp(colX(0), CARD_W / 2, u);
  const fy = lerp(BOARD_Y + BOARD_H / 2, CARD_H / 2, u);
  const tx = CARD_W / 2 - fx * zi;
  const ty = CARD_H / 2 - fy * zi;
  // far plane: the Fusion viewer and ruler, pushed in, panning, moving less than the content (k = 0.35)
  const pan = ez(t, -6, 52, EASE.inOut);
  const shotS = 0.52 * Math.pow(zi, 0.35);
  const sx = lerp(1640, 2160, pan) + (fx - CARD_W / 2) * 0.6;
  const sy = lerp(640, 720, pan) + (fy - CARD_H / 2) * 0.6;
  const title = ez(t, -3, 4, EASE.enter);
  const source = ez(t, 19, 26, EASE.enter);
  return (
    <AbsoluteFill style={{ background: PH.panel, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: "blur(5px) brightness(0.72) contrast(0.92)" }}>
        <Img
          src={staticFile(SHOTS.fusion)}
          style={{ position: "absolute", left: CARD_W / 2 - sx * shotS, top: CARD_H / 2 - sy * shotS, width: SHOT_W * shotS, height: SHOT_H * shotS, maxWidth: "none", display: "block" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(16,18,23,0.7) 0%, rgba(16,18,23,0.42) 38%, rgba(16,18,23,0.5) 62%, rgba(16,18,23,0.8) 100%)",
        }}
      />
      <div style={{ position: "absolute", left: 0, top: 0, width: CARD_W, height: CARD_H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zi.toFixed(4)})` }}>
        {/* title row: the real Resolve mark and the version */}
        <div style={{ position: "absolute", left: PAD_X, top: TITLE_Y, display: "flex", alignItems: "center", gap: 12, opacity: title, transform: `translateY(${((1 - title) * 10).toFixed(2)}px)` }}>
          <Img src={staticFile(LOGOS.resolve)} style={{ width: LOGO, height: LOGO, display: "block" }} />
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: TITLE, lineHeight: 1, color: INK, whiteSpace: "nowrap" }}>{COUNTS_TITLE}</div>
        </div>
        {TARGETS.map((_, d) => (
          <Board key={d} d={d} t={t} />
        ))}
        <svg width={CARD_W} height={CARD_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Scope frame={t} x0={-40} x1={CARD_W + 40} y={TY} bumps={traceBumps(t)} hum={1.4} stroke={3} color="rgba(243,241,236,0.62)" />
        </svg>
        {COUNTS.map((c, d) => {
          const lab = ez(t, started(d) - 3, started(d) + 4, EASE.enter);
          const lit = ez(t, landed(d) - 1, landed(d) + 4, EASE.decel);
          const [l1, l2] = twoLines(c.label);
          return (
            <div
              key={c.label}
              style={{
                position: "absolute",
                left: colX(d) - LABEL_W / 2,
                width: LABEL_W,
                top: LABEL_Y,
                textAlign: "center",
                fontFamily: INTER,
                fontWeight: 600,
                fontSize: LABEL,
                lineHeight: LABEL_LH,
                color: INK,
                opacity: lab * (0.6 + 0.34 * lit),
                transform: `translateY(${((1 - lab) * 12).toFixed(2)}px)`,
              }}
            >
              <div style={{ whiteSpace: "nowrap" }}>{l1}</div>
              <div style={{ whiteSpace: "nowrap" }}>{l2}</div>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: PAD_X,
            right: PAD_X,
            top: SOURCE_Y,
            textAlign: "center",
            fontFamily: MONO,
            fontWeight: 400,
            fontSize: SOURCE,
            lineHeight: 1.2,
            color: INK,
            opacity: 0.8 * source,
            transform: `translateY(${((1 - source) * 10).toFixed(2)}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {COUNTS_SOURCE}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SplitFlap: React.FC<FxProps> = ({ t }) => {
  const z = key(t, Z_KEYS);
  const rx = key(t, RX_KEYS);
  const zi = key(t, ZI_KEYS);
  const clipS = key(t, CLIP_S);
  const clipBlur = key(t, [2.4, 2.1, 0, 0]);
  const clipBright = key(t, [0.8, 0.82, 1, 1]);
  // ambient: the take drifts a hair (never down: the bottom edge has little slack), the tube floats and turns
  const dx = 3 * Math.sin(t * 0.07);
  const dy = 1.5 * Math.sin(t * 0.05) - 1.5;
  const float = FLOAT * Math.sin(t * 0.14);
  const ry = RY * Math.sin(t * 0.06);
  const clipFilter = `${clipBlur > 0.05 ? `blur(${clipBlur.toFixed(2)}px) ` : ""}brightness(${clipBright.toFixed(3)})`;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${clipS.toFixed(4)})`, transformOrigin: `${CLIP_ORIGIN.x}px ${CLIP_ORIGIN.y}px`, filter: clipFilter }}>
        <Clip name="surface" />
      </AbsoluteFill>
      <Caption name="surface" t={t} y={CAPTION_Y} size={CAPTION_SIZE} maxWidth={SAFE_IG.w - 40} style={{ left: SAFE_IG.x0, right: 1080 - SAFE_IG.x1 }} />
      <div
        style={{
          position: "absolute",
          left: CARD_LEFT,
          top: CARD_TOP,
          width: CARD_W,
          height: CARD_H,
          borderRadius: CARD_R,
          overflow: "hidden",
          background: "#000",
          transformOrigin: `${CARD_W / 2}px 0px`,
          transform: `perspective(${PERSP}px) translateY(${float.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${z.toFixed(4)})`,
          boxShadow: "0 0 0 2px rgba(255,255,255,0.14), 0 28px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: TUBE_W, height: TUBE_H, overflow: "hidden", transform: `scale(${K})`, transformOrigin: "0 0" }}>
          <CRT loop={150} bloom={0.8}>
            <div style={{ position: "absolute", left: 0, top: 0, width: CARD_W, height: CARD_H, transform: `scale(${1 / K})`, transformOrigin: "0 0" }}>
              <Screen t={t} zi={zi} />
            </div>
          </CRT>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const splitflap: FxDef = {
  id: "splitflap",
  command: "/split-flap",
  menu: "Flip-board digits land on real numbers",
  clip: "surface",
  Comp: SplitFlap,
  thumbT: [28, 34, 42],
};
