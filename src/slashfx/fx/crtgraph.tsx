// /crt-graph (polish, Victor 2026-10-25 17:05: "use our style ... like my CRT videos for the DaVinci video").
// Victor's clip full frame; under his chin a CRT tube in the CRT Scope style: inside it the real Resolve 21 Edit page
// (official press shot) pushed in close on its timeline, dimmed and out of focus, and in front of it three phosphor-green
// columns standing on one live scope trace. Claude's coral packets run along the trace and arrive as each column lands
// on its verified count (COUNTS in data/facts.ts, nothing else). His real words as the caption.
// Camera (KEY_T): opens tight on the tube powering on (card plane zoom 1.12, anchored on the tube's top edge so it never
// rises over his chin), holds while the columns climb, then pulls out (t 9 to 25) to reveal him: the card plane goes to
// 1.0 while his clip, the far plane, moves less (1.07 to 1.035) and racks into focus. 2.5D: the tube tilts back a few
// degrees and settles; the press shot inside pans and pulls out more slowly than the columns (parallax).
// Safe zone (Victor, 2026-10-25 22:00): the tube sits under his jaw and its worst frame (the opening: zoom and tilt
// both peak at t = 0, the bottom edge leans toward the camera) is sized to land inside SAFE_IG; the caption sits above it.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { CRT } from "../../artcraft/kit/Tube";
import { Scope, type ScopeBump } from "../../artcraft/kit/Scope";
import { PH } from "../../artcraft/theme";
import { COUNTS, COUNTS_SOURCE, COUNTS_TITLE, LOGOS, SHOTS } from "../data/facts";
import { Caption, Clip, INTER, MONO } from "../kit";
import { CLAMP, EASE, SAFE_IG, ez, lerp, type FxDef, type FxProps } from "../theme";

// ---------------------------------------------------------------- camera: one keyframe timeline
const KEY_T = [0, 9, 25, 48];
const key = (t: number, v: number[]) => interpolate(t, KEY_T, v, { ...CLAMP, easing: EASE.travel });
/** card plane zoom (anchored on the tube's top center) and tilt; both only fall after t = 0 */
const Z_KEYS = [1.12, 1.113, 1.0, 0.985];
const RX_KEYS = [6, 5.4, 1.4, 1.1];
/** ambient float (px) and turn (deg) amplitudes of the tube, and the card plane's perspective */
const FLOAT = 3;
const RY = 0.6;
const PERSP = 1600;

// ---------------------------------------------------------------- card (final framing, on-screen px)
/** The tube's top edge, just under his jaw (about 1060 in the clip, about 1040 on screen after the far-plane push). */
const CARD_TOP = 1104;
/** Clear space between the tube's worst corner and the safe rect. */
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
/** How far a w x h tube reaches at its worst frame: the opening (Z_KEYS[0], RX_KEYS[0]) with the full turn and float. */
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
/** Largest integer v in [lo, hi] that passes ok (ok is monotone). */
const fit = (ok: (v: number) => boolean, lo: number, hi: number) => {
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (ok(m)) lo = m;
    else hi = m;
  }
  return Math.floor(lo);
};
/** The tube is as large as the safe rect allows at its worst frame (about 750 x 356). */
const CARD_H = fit((h) => CARD_TOP + reach(SAFE_IG.w, h).bottom <= SAFE_IG.y1 - EDGE, 100, SAFE_IG.h);
const CARD_W = fit((w) => reach(w, CARD_H).side <= SAFE_IG.w / 2 - EDGE, 100, SAFE_IG.w);
const CARD_R = 30;
const CARD_LEFT = (SAFE_IG.x0 + SAFE_IG.x1 - CARD_W) / 2;
/** His words sit above the tube (60 px, one line), clear of its top edge at the highest float. */
const CAPTION_SIZE = 60;
const CAPTION_Y = Math.round(CARD_TOP - FLOAT - 6 - CAPTION_SIZE * 1.12);

/** The CRT pass sizes itself to the composition (1080 wide): draw the tube at 1080 wide, scale it into the card. */
const TUBE_W = 1080;
const K = CARD_W / TUBE_W;
const TUBE_H = CARD_H / K;

/** The press shot framing was set on an 860 px tube: keep it proportional. */
const SHOT_K = CARD_W / 860;
const camAt = (t: number) => {
  const z = key(t, Z_KEYS);
  return {
    z,
    /** the tube tilts back (top edge fixed) and settles */
    rx: key(t, RX_KEYS),
    /** far plane (his clip): parallax 1.07 to 1.035, as before */
    clipS: key(t, [1.07, 1.0679, 1.035, 1.0329]),
    clipBlur: key(t, [2.4, 2.1, 0, 0]),
    clipBright: key(t, [0.8, 0.82, 1, 1]),
    /** the press shot inside the tube: source x at the tube center, and its scale (card px per source px) */
    shotX: key(t, [2300, 2380, 2780, 2960]),
    shotS: key(t, [0.7, 0.69, 0.62, 0.6]) * SHOT_K,
  };
};
/** Clip scale origin near the bottom edge: the frame stays covered and his face sits high. */
const CLIP_ORIGIN = "540px 1840px";

// ---------------------------------------------------------------- tube layout (card px, about on-screen px)
const INK = "#ECEAE4";
const GREEN = "#2ECC71";
const PAD_X = 40;
const TITLE_Y = 22;
const TITLE = 30;
const LOGO = 36;
const NUM = 54;
const LABEL = 26;
const LABEL_H = 2 * LABEL * 1.14;
const SOURCE = 23;
/** bottom up: pad, source line, gap, two label lines, gap to the trace */
const SOURCE_Y = Math.round(CARD_H - 18 - SOURCE * 1.2);
const LABEL_Y = Math.round(SOURCE_Y - 12 - LABEL_H);
/** the scope baseline: the columns stand on it */
const TY = LABEL_Y - 20;
/** the tallest column's number tops out level with the title row, right of it and clear of it */
const HMAX = TY - 10 - NUM - TITLE_Y;
const BAR_W = 86;
const COL_W = (CARD_W - 2 * PAD_X) / COUNTS.length;
const colX = (i: number) => PAD_X + COL_W * (i + 0.5);
const MAX = Math.max(...COUNTS.map((c) => c.n));
/** Edit page timeline region (5120 x 2880 press shot): source y at the tube center. */
const SHOT_Y = 2250;
const SHOT_W = 5120;
const SHOT_H = 2880;

// ---------------------------------------------------------------- timing (24 fps, t = 0 at the card resolve)
/** the tube is already powering on at t = 0 */
const POWER: [number, number] = [-3, 5];
const BAR = { at: 2, stagger: 3, len: 9 };
const barStart = (i: number) => BAR.at + BAR.stagger * i;
const barLand = (i: number) => barStart(i) + BAR.len;
/** a packet leaves the left edge this many frames before its column lands */
const RUN = 10;

/** Two lines, broken at the space nearest the middle (labels are verbatim from facts.ts). */
const twoLines = (s: string): [string, string] => {
  const mid = s.length / 2;
  let best = -1;
  for (let i = 0; i < s.length; i++) if (s[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? [s, ""] : [s.slice(0, best), s.slice(best + 1)];
};

const trace = (t: number): ScopeBump[] =>
  COUNTS.map((_, i) => {
    const land = barLand(i);
    const breathe = 0.88 + 0.12 * Math.sin(t * 0.4 + i * 1.7);
    if (t < land) {
      // Claude's packet runs in from the left edge along the trace
      const u = ez(t, land - RUN, land, EASE.travel);
      const env = interpolate(t, [land - RUN, land - RUN + 3], [0, 1], CLAMP);
      return { x: lerp(-30, colX(i), u), amp: 18 * env * breathe, sigma: 30, rgb: PH.claudeRgb };
    }
    // it lands at the column's foot and keeps talking there, quieter
    return { x: colX(i), amp: (18 - 14 * ez(t, land, land + 14, EASE.decel)) * breathe, sigma: 30, rgb: PH.claudeRgb };
  });

/** What the tube shows. Light ink on dark, the press shot dimmed behind. */
const Screen: React.FC<{ t: number; shotX: number; shotS: number }> = ({ t, shotX, shotS }) => {
  const on = ez(t, POWER[0], POWER[1], EASE.decel);
  const title = ez(t, -2, 4, EASE.enter);
  const source = ez(t, 18, 25, EASE.enter);
  return (
    <AbsoluteFill style={{ background: PH.panel, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scaleY(${lerp(0.012, 1, on).toFixed(4)})`,
          filter: on < 0.999 ? `brightness(${(1 + 1.6 * (1 - on)).toFixed(3)})` : undefined,
        }}
      >
        {/* far layer: the real Edit page, pushed in close on the timeline, panning (out of focus, dimmed) */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: "blur(2px) brightness(0.62) contrast(0.92)" }}>
          <Img
            src={staticFile(SHOTS.edit)}
            style={{
              position: "absolute",
              left: CARD_W / 2 - shotX * shotS,
              top: CARD_H / 2 - SHOT_Y * shotS,
              width: SHOT_W * shotS,
              height: SHOT_H * shotS,
              maxWidth: "none",
              display: "block",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(16,18,23,0.72) 0%, rgba(16,18,23,0.52) 38%, rgba(16,18,23,0.58) 62%, rgba(16,18,23,0.8) 100%)",
          }}
        />
        {/* title row: the real Resolve mark and the version */}
        <div
          style={{
            position: "absolute",
            left: PAD_X,
            top: TITLE_Y,
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: title,
            transform: `translateY(${(1 - title) * 10}px)`,
          }}
        >
          <Img src={staticFile(LOGOS.resolve)} style={{ width: LOGO, height: LOGO, display: "block" }} />
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: TITLE, lineHeight: 1, color: INK, whiteSpace: "nowrap" }}>{COUNTS_TITLE}</div>
        </div>
        {/* the columns stand on the trace */}
        {COUNTS.map((c, i) => {
          const p = ez(t, barStart(i), barLand(i), EASE.travel);
          const h = HMAX * (c.n / MAX) * p;
          const live = ez(t, barStart(i), barStart(i) + 3, EASE.enter);
          const plus = ez(t, barLand(i) - 2, barLand(i) + 2, EASE.enter);
          const lab = ez(t, barStart(i) - 4, barStart(i) + 3, EASE.enter);
          const [l1, l2] = twoLines(c.label);
          return (
            <React.Fragment key={c.label}>
              {h > 0.2 ? (
                <div style={{ position: "absolute", left: colX(i) - BAR_W / 2, top: TY - h, width: BAR_W, height: h, background: GREEN, borderRadius: "8px 8px 0 0" }} />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: colX(i) - COL_W / 2,
                  width: COL_W,
                  top: TY - h - 10 - NUM,
                  height: NUM,
                  textAlign: "center",
                  fontFamily: INTER,
                  fontWeight: 800,
                  fontSize: NUM,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: -1,
                  color: INK,
                  opacity: live,
                  whiteSpace: "nowrap",
                }}
              >
                {Math.round(c.n * p)}
                {c.plus ? <span style={{ display: "inline-block", opacity: plus, transform: `translateX(${(1 - plus) * -8}px)` }}>+</span> : null}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: colX(i) - COL_W / 2,
                  width: COL_W,
                  top: LABEL_Y,
                  textAlign: "center",
                  fontFamily: INTER,
                  fontWeight: 600,
                  fontSize: LABEL,
                  lineHeight: 1.14,
                  color: INK,
                  opacity: 0.92 * lab,
                  transform: `translateY(${(1 - lab) * 14}px)`,
                }}
              >
                <div style={{ whiteSpace: "nowrap" }}>{l1}</div>
                <div style={{ whiteSpace: "nowrap" }}>{l2}</div>
              </div>
            </React.Fragment>
          );
        })}
        <svg width={CARD_W} height={CARD_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Scope frame={t} x0={-10} x1={CARD_W + 10} y={TY} bumps={trace(t)} hum={1.4} stroke={3} color="rgba(243,241,236,0.62)" />
        </svg>
        <div
          style={{
            position: "absolute",
            left: PAD_X,
            right: PAD_X,
            top: SOURCE_Y,
            fontFamily: MONO,
            fontWeight: 400,
            fontSize: SOURCE,
            lineHeight: 1.2,
            color: INK,
            opacity: 0.82 * source,
            transform: `translateY(${(1 - source) * 10}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {COUNTS_SOURCE}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CrtGraph: React.FC<FxProps> = ({ t }) => {
  const c = camAt(t);
  // ambient: the clip drifts a hair (never down: the bottom edge has only a few px of slack), the tube floats
  const dx = 3 * Math.sin(t * 0.07);
  const dy = 1.5 * Math.sin(t * 0.05) - 1.5;
  const float = FLOAT * Math.sin(t * 0.14);
  const ry = RY * Math.sin(t * 0.06);
  const clipFilter = `${c.clipBlur > 0.05 ? `blur(${c.clipBlur.toFixed(2)}px) ` : ""}brightness(${c.clipBright.toFixed(3)})`;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${c.clipS.toFixed(4)})`, transformOrigin: CLIP_ORIGIN, filter: clipFilter }}>
        <Clip name="surface" />
      </AbsoluteFill>
      <Caption name="surface" t={t} y={CAPTION_Y} size={CAPTION_SIZE} maxWidth={SAFE_IG.w} />
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
          transform: `perspective(${PERSP}px) translateY(${float.toFixed(2)}px) rotateX(${c.rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${c.z.toFixed(4)})`,
          boxShadow: "0 0 0 2px rgba(255,255,255,0.14), 0 28px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: TUBE_W, height: TUBE_H, overflow: "hidden", transform: `scale(${K})`, transformOrigin: "0 0" }}>
          <CRT loop={150} bloom={0.85}>
            <div style={{ position: "absolute", left: 0, top: 0, width: CARD_W, height: CARD_H, transform: `scale(${1 / K})`, transformOrigin: "0 0" }}>
              <Screen t={t} shotX={c.shotX} shotS={c.shotS} />
            </div>
          </CRT>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const crtgraph: FxDef = {
  id: "crtgraph",
  command: "/crt-graph",
  menu: "A CRT screen with a graph that climbs",
  clip: "surface",
  Comp: CrtGraph,
  thumbT: [20, 28, 40],
};
