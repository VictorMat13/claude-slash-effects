// /terminal-quote (set 3, builder S3-B; retargeted 2026-10-26 to the ArtCraft take "a_years"). Victor's take; beside his
// head (right side) a tall CRT terminal pane in the CRT Scope look types the quote in data/facts.ts (PETTY.quote, verbatim:
// for set 3 Brandon Thomas, founder of ArtCraft, as quoted by Ars Technica) line by line in mono with a block
// cursor; the two PETTY.cards fragments turn coral as they are typed; the last lines are a prompt glyph with
// PETTY.name and PETTY.role. A live scope trace runs under the pane (and under his chin): every line end fires a coral
// packet that runs along it to his voice (green, from the real word timings). His words as the caption under his chin.
// Layout: in this take his head (hair and ears) spans x 335..810 over the first two seconds (measured), leaving about 190 px
// beside it, so the pane cannot sit there with the face centered. The footage is set left (a two-shot: him left, the terminal right) and the strip it uncovers on the right
// is filled by a mirrored, blurred, dimmed copy of the take, feathered at the seam (never letterboxed).
// Camera (one KEY_T timeline, hold, travel, hold): opens tight on the cursor (inside the tube, content zoom 1.85 that
// follows the cursor like a carriage), holds while the first coral fragment types, then pulls out (t 6 to 21) to the whole quote
// while the far plane (his take) racks into focus and settles from 1.03 to 1.0 and the pane's 2.5D turn settles.
// Safe zone (SAFE_IG, 60..1000 x 270..1580 since 2026-10-26 00:50): the pane, its text, the caption and the packets stay inside SAFE_IG at every t,
// including the opening zoom, the turn, the sway, the float and the drift; the trace and the footage bleed.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CRT } from "../../../artcraft/kit/Tube";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { PETTY } from "../../data/facts";
import { Caption, Clip, DarkGrid, MONO } from "../../kit";
import { CLAMP, EASE, H, SAFE_IG, UI, W, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { voiceEnv } from "../shutterstrike";

/** Victor's take for this effect (set 3: the ArtCraft take). */
const CLIP = "a_years" as const;

// ---------------------------------------------------------------- camera: one keyframe timeline
const KEY_T = [0, 6, 21, 48];
const key = (t: number, v: number[]) => interpolate(t, KEY_T, v, { ...CLAMP, easing: EASE.travel });
/** content zoom inside the tube (tight on the cursor), the pane plane's zoom and turn, the far plane (his take) */
const ZI_KEYS = [1.85, 1.82, 1.0, 1.0];
const ZP_KEYS = [1.025, 1.023, 1.0, 1.0];
const RY_KEYS = [-7, -6.7, -4, -4];
const ZC_KEYS = [1.03, 1.029, 1.0, 1.0];
/** ambient: the pane sways and floats, the whole scene drifts (the pane rides it a little more: parallax) */
const SWAY = 0.5;
const FLOAT = 3;
const DRIFT = { x: 3, y: 2 };
const NEAR = 1.3;
const PERSP = 1400;

// ---------------------------------------------------------------- the terminal (pane px)
const INK = "#ECEAE4";
const FONT = 30;
/** JetBrains Mono advances 0.6 em */
const CHW = FONT * 0.6;
const LH = 40;
const ROLE = 26;
const ROLE_LH = 34;
const PAD_X = 20;
const PAD_T = 16;
const PAD_B = 20;
const HEADER = 42;
const GAP_CREDIT = 12;
const PANE_W = 384;
const COLS = Math.floor((PANE_W - 2 * PAD_X) / CHW); // 19

type Line = { text: string; start: number };
/** Greedy word wrap at COLS characters, keeping each line's offset in the quote (spaces dropped at the break). */
const wrap = (s: string, cols: number): Line[] => {
  const out: Line[] = [];
  let i = 0;
  while (i < s.length) {
    if (s.length - i <= cols) {
      out.push({ text: s.slice(i), start: i });
      break;
    }
    let br = s.lastIndexOf(" ", i + cols);
    if (br <= i) br = i + cols;
    out.push({ text: s.slice(i, br), start: i });
    i = br + 1;
  }
  return out;
};
const LINES = wrap(PETTY.quote, COLS);
/** Character ranges of the two coral fragments in the quote. */
const FRAG = PETTY.cards.map((c) => {
  const a = PETTY.quote.indexOf(c);
  return [a, a + c.length] as const;
});
const isFrag = (i: number) => FRAG.some(([a, b]) => i >= a && i < b);

const CONTENT_H = PAD_T + LINES.length * LH + GAP_CREDIT + LH + ROLE_LH + PAD_B;
const PANE_H = HEADER + CONTENT_H;
const NAME_Y = PAD_T + LINES.length * LH + GAP_CREDIT;
const ROLE_Y = NAME_Y + LH;

// ---------------------------------------------------------------- typing schedule (24 fps, t = 0 at the card resolve)
/** Typing already runs when the card resolves (two lines are up). The first coral fragment ("1:1 functional
 *  equivalents", lines 2 to 4) types on the tight hold, the lines speed up on the pull and the second fragment types on it,
 *  the credit types as the camera settles. Durations are per wrapped line (nine lines at 19 columns). */
const T0 = -8;
const DUR = [3.2, 3.3, 3.3, 3.3, 2.8, 2.8, 2.8, 2.4, 1.6];
const durOf = (i: number) => DUR[Math.min(i, DUR.length - 1)];
type Slot = { a: number; b: number; len: number };
const SLOTS: Slot[] = (() => {
  const out: Slot[] = [];
  let at = T0;
  LINES.forEach((l, i) => {
    out.push({ a: at, b: at + durOf(i), len: l.text.length });
    at += durOf(i);
  });
  // a short beat, then the prompt line with the name, then the role
  at += 1.5;
  out.push({ a: at, b: at + 3, len: 2 + PETTY.name.length });
  at += 3;
  out.push({ a: at, b: at + 3.5, len: PETTY.role.length });
  return out;
})();
const NAME_SLOT = SLOTS[LINES.length];
const ROLE_SLOT = SLOTS[LINES.length + 1];
const DONE = ROLE_SLOT.b;
/** Characters typed of slot s at t (continuous). */
const typed = (s: Slot, t: number) => s.len * ez(t, s.a, s.b, EASE.inOut);
/** Frame at which character j of slot s is typed (inverse of typed, by bisection). */
const typedAt = (s: Slot, j: number) => {
  let lo = s.a;
  let hi = s.b;
  for (let k = 0; k < 24; k++) {
    const m = (lo + hi) / 2;
    if (typed(s, m) >= j + 1) hi = m;
    else lo = m;
  }
  return hi;
};

/** The cursor cell (pane content px) at t: after the last typed character. */
const cursorAt = (t: number) => {
  let line = 0;
  for (let i = 0; i < SLOTS.length; i++) if (t >= SLOTS[i].a) line = i;
  const s = SLOTS[line];
  const col = Math.min(s.len, Math.floor(typed(s, t)));
  if (line < LINES.length) return { x: PAD_X + col * CHW, y: PAD_T + line * LH, h: LH };
  if (line === LINES.length) return { x: PAD_X + col * CHW, y: NAME_Y, h: LH };
  return { x: PAD_X + col * ROLE * 0.6, y: ROLE_Y, h: ROLE_LH };
};
/** The camera follows the cursor softly (a weighted look-back, still a pure function of t), like a carriage. */
const focusAt = (t: number) => {
  let x = 0;
  let y = 0;
  let n = 0;
  for (let k = 0; k <= 8; k++) {
    const w = 9 - k;
    const c = cursorAt(t - k * 0.6);
    x += w * c.x;
    y += w * (c.y + c.h / 2);
    n += w;
  }
  return { x: x / n, y: y / n };
};

// ---------------------------------------------------------------- frame layout (screen px)
/** His head in a_years over the first two seconds (measured every 0.125 to 0.5 s): hair and ears x 335..810, hair top 400;
 *  his chin's lowest point is y 950 (960 with margin), chin x about 575. */
const HEAD_R = 810;
const CHIN = { x: 575, y: 960 };
/** His take scales about this point (the middle of his face). */
const O = { x: 565, y: 660 };
/** Clear space between the pane's worst corner and the safe rect, and between his ear and the pane. */
const EDGE = 6;
const GAP = 14;

/** Screen offset (from the pane center) of pane point (x, y) under perspective(PERSP) rotateY(ry) scale(z). */
const project = (x: number, y: number, z: number, ry: number) => {
  const b = (ry * Math.PI) / 180;
  const x1 = x * z * Math.cos(b);
  const z1 = -x * z * Math.sin(b);
  const k = PERSP / (PERSP - z1);
  return { x: x1 * k, y: y * z * k };
};
/** Worst reach of the pane (its opening zoom and turn plus the sway), right, left (inward) and up or down. */
const REACH = (() => {
  let right = 0;
  let left = 0;
  let vert = 0;
  for (const z of [ZP_KEYS[0], 1])
    for (const ry of [RY_KEYS[0] - SWAY, RY_KEYS[0] + SWAY, RY_KEYS[3] - SWAY, RY_KEYS[3] + SWAY])
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const p = project((sx * PANE_W) / 2, (sy * PANE_H) / 2, z, ry);
          if (sx > 0) right = Math.max(right, p.x);
          else left = Math.max(left, -p.x);
          vert = Math.max(vert, Math.abs(p.y));
        }
  return { right, left, vert };
})();
/** The pane hugs the safe right edge at its worst frame; its bottom sits just above the trace. */
const PANE_CX = Math.floor(SAFE_IG.x1 - EDGE - REACH.right - DRIFT.x * NEAR);
const PANE_X0 = PANE_CX - PANE_W / 2;
/** The trace runs CHIN_CLEAR under his chin's lowest point at the opening zoom; the pane ends above it, the caption under it. */
const CHIN_CLEAR = 36;
const TY = Math.ceil(O.y + (CHIN.y - O.y) * ZC_KEYS[0] + CHIN_CLEAR);
const PANE_BOTTOM = TY - 44;
const PANE_CY = PANE_BOTTOM - PANE_H / 2;
/** His take moves left so his ear clears the pane's worst inner edge by GAP at the opening zoom (1.03) and the drift.
 *  (Safe rect 60..1000: the pane sits at about x 599..983 and y 438..962, his take about 242 px left.) */
const PANE_LEFT_WORST = PANE_CX - REACH.left - DRIFT.x * NEAR;
const DX = Math.floor(PANE_LEFT_WORST - GAP - DRIFT.x - (O.x + (HEAD_R - O.x) * ZC_KEYS[0]));

/** His voice sits on the trace under his chin; the caption under the trace. */
const VOICE_X = O.x + (CHIN.x - O.x) + DX;
const CAPTION_Y = TY + 34;
const CAPTION_SIZE = 58;

// ---------------------------------------------------------------- the trace: his voice, a coral packet per line end
const RUN = 14;
const PACKETS = SLOTS.map((s, i) => {
  const lineEnd = i < LINES.length ? PAD_X + s.len * CHW : i === LINES.length ? PAD_X + s.len * CHW : PAD_X + s.len * ROLE * 0.6;
  const frag = i < LINES.length && LINES[i].text.split("").some((_, j) => isFrag(LINES[i].start + j));
  return { at: s.b, x: PANE_X0 + Math.min(lineEnd, PANE_W - PAD_X), amp: frag ? 17 : 11 };
});
const traceBumps = (t: number): ScopeBump[] => {
  const bumps: ScopeBump[] = [
    { x: VOICE_X, amp: 3 + 14 * voiceEnv(CLIP, t) * (0.85 + 0.15 * Math.sin(t * 0.9)), sigma: 34, rgb: PH.userRgb },
  ];
  for (const p of PACKETS) {
    if (t < p.at - 1 || t > p.at + RUN + 2) continue;
    const u = ez(t, p.at, p.at + RUN, EASE.inOut);
    const env = interpolate(t, [p.at - 1, p.at + 1.5, p.at + RUN - 4, p.at + RUN + 2], [0, 1, 0.8, 0], CLAMP);
    bumps.push({ x: lerp(p.x, VOICE_X + 40, u), amp: p.amp * env, sigma: 20, rgb: PH.claudeRgb });
  }
  return bumps;
};

// ---------------------------------------------------------------- color
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, p: number) => {
  const x = hex(a);
  const y = hex(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * p)).join(",")})`;
};

/** One quote line: typed characters only; fragment characters turn from ink to coral over 4 frames after typing. */
const QuoteLine: React.FC<{ i: number; t: number }> = ({ i, t }) => {
  const l = LINES[i];
  const s = SLOTS[i];
  const n = Math.min(l.text.length, Math.floor(typed(s, t)));
  if (n <= 0) return null;
  const parts: React.ReactNode[] = [];
  let run = "";
  const flush = (k: number) => {
    if (run) parts.push(<span key={`r${k}`}>{run}</span>);
    run = "";
  };
  for (let j = 0; j < n; j++) {
    const g = l.start + j;
    if (!isFrag(g)) {
      run += l.text[j];
      continue;
    }
    flush(j);
    const p = ez(t, typedAt(s, j), typedAt(s, j) + 4, EASE.decel);
    parts.push(
      <span key={j} style={{ color: mix(INK, UI.coral, p), fontWeight: 700 }}>
        {l.text[j]}
      </span>,
    );
  }
  flush(n);
  return (
    <div style={{ position: "absolute", left: PAD_X, top: PAD_T + i * LH, height: LH, lineHeight: `${LH}px`, whiteSpace: "pre", fontFamily: MONO, fontWeight: 500, fontSize: FONT, color: INK }}>
      {parts}
    </div>
  );
};

/** On the tight shot the first line may sit this far under the window bar (pane px), never once the camera is out. */
const TOP_SLACK = 120;

/** What the tube shows: the window bar, then the typed quote under the inner camera. */
const Screen: React.FC<{ t: number; zi: number }> = ({ t, zi }) => {
  // inner camera: tight on the cursor (the typed lines fill the view above it), clamped to the text; identity at zoom 1
  const f = focusAt(t);
  const tight = (zi - 1) / (ZI_KEYS[0] - 1);
  const ax = PANE_W * 0.62;
  const ay = CONTENT_H * 0.6;
  const tx = Math.min(0, Math.max(PANE_W * (1 - zi), ax - f.x * zi));
  const ty = Math.min(TOP_SLACK * tight, Math.max(CONTENT_H * (1 - zi), ay - f.y * zi));
  const cur = cursorAt(t);
  const curW = cur.h === ROLE_LH ? ROLE * 0.6 : CHW;
  // solid while typing, then an eased blink
  const ph = (((t - DONE) % 14) + 14) % 14;
  const blink = t < DONE ? 1 : interpolate(ph, [0, 6, 8, 12, 14], [1, 1, 0, 0, 1], { ...CLAMP, easing: EASE.inOut });
  const nName = Math.floor(typed(NAME_SLOT, t));
  const nRole = Math.floor(typed(ROLE_SLOT, t));
  return (
    <AbsoluteFill style={{ background: PH.panel, overflow: "hidden" }}>
      <DarkGrid shift={t * 0.35} pitch={48} style={{ backgroundColor: "transparent", opacity: 0.55 }} />
      {/* window bar: three dots and a keyline */}
      <div style={{ position: "absolute", left: 0, top: 0, width: PANE_W, height: HEADER, borderBottom: "1.5px solid rgba(255,255,255,0.12)" }}>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ position: "absolute", left: 22 + k * 22, top: HEADER / 2 - 6, width: 12, height: 12, borderRadius: 6, background: k === 0 ? "rgba(217,119,87,0.85)" : "rgba(236,234,228,0.32)" }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, top: HEADER, width: PANE_W, height: CONTENT_H, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: PANE_W, height: CONTENT_H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zi.toFixed(4)})` }}>
          {LINES.map((_, i) => (
            <QuoteLine key={i} i={i} t={t} />
          ))}
          {nName > 0 ? (
            <div style={{ position: "absolute", left: PAD_X, top: NAME_Y, height: LH, lineHeight: `${LH}px`, whiteSpace: "pre", fontFamily: MONO, fontSize: FONT, fontWeight: 700, color: INK }}>
              <span style={{ color: UI.coral }}>{"> ".slice(0, nName)}</span>
              {PETTY.name.slice(0, Math.max(0, nName - 2))}
            </div>
          ) : null}
          {nRole > 0 ? (
            <div style={{ position: "absolute", left: PAD_X, top: ROLE_Y, height: ROLE_LH, lineHeight: `${ROLE_LH}px`, whiteSpace: "pre", fontFamily: MONO, fontSize: ROLE, fontWeight: 500, color: "rgba(236,234,228,0.78)" }}>
              {PETTY.role.slice(0, nRole)}
            </div>
          ) : null}
          {/* the block cursor */}
          <div style={{ position: "absolute", left: cur.x + 1, top: cur.y + cur.h * 0.16, width: curW - 2, height: cur.h * 0.7, background: INK, opacity: 0.92 * blink }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** The CRT pass sizes itself to the composition (1080 wide): draw the tube 1080 wide, scale it into the pane. The tube
 *  overscans the pane by OVER px on every side, so the CRT's own black inset (14 px, about 5 px at this scale) and the
 *  hard part of its inner shadow sit outside the pane's clip: the screen meets the keyline with no dark row. */
const OVER = 16;
const TUBE_W = 1080;
const K = (PANE_W + 2 * OVER) / TUBE_W;
const TUBE_H = (PANE_H + 2 * OVER) / K;

const FEATHER = 140;

export const TerminalQuote: React.FC<FxProps> = ({ t }) => {
  const zi = key(t, ZI_KEYS);
  const zp = key(t, ZP_KEYS);
  const ry = key(t, RY_KEYS) + SWAY * Math.sin(t * 0.06);
  const zc = key(t, ZC_KEYS);
  const blur = key(t, [2.6, 2.4, 0, 0]);
  const bright = key(t, [0.74, 0.76, 1, 1]);
  const dx = DRIFT.x * Math.sin(t * 0.07);
  const dy = DRIFT.y * Math.sin(t * 0.05 + 0.6);
  const float = FLOAT * Math.sin(t * 0.13);
  const clipFilter = `${blur > 0.05 ? `blur(${blur.toFixed(2)}px) ` : ""}brightness(${bright.toFixed(3)})`;
  const featherMask = `linear-gradient(to right, #000 0px, #000 ${W - FEATHER}px, transparent ${W}px)`;
  return (
    <AbsoluteFill style={{ background: "#050304", overflow: "hidden" }}>
      {/* far plane: his take, set left; the uncovered right strip is the same take mirrored, blurred and dimmed */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: `${O.x}px ${O.y}px`,
          transform: `translate(${(DX + dx).toFixed(2)}px, ${dy.toFixed(2)}px) scale(${zc.toFixed(4)})`,
          filter: clipFilter,
        }}
      >
        <div style={{ position: "absolute", left: W - 40, top: 0, width: W, height: H, transform: "scaleX(-1)", filter: "blur(26px) brightness(0.2) saturate(0.7)" }}>
          <Clip name={CLIP} />
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, WebkitMaskImage: featherMask, maskImage: featherMask }}>
          <Clip name={CLIP} />
        </div>
      </div>
      {/* the terminal side of the room sits a little darker */}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,0,0,0) 46%, rgba(0,0,0,0.42) 74%, rgba(0,0,0,0.68) 100%)" }} />
      {/* the trace under the pane and his chin (rides the drift a little more than the take) */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible", transform: `translate(${(dx * 1.15).toFixed(2)}px, ${(dy * 1.15).toFixed(2)}px)` }}
      >
        <Scope frame={t} x0={-20} x1={W + 20} y={TY} bumps={traceBumps(t)} hum={1.4} stroke={3} color="rgba(243,241,236,0.6)" />
      </svg>
      {/* the pane: a CRT tube turned a few degrees toward him (2.5D), floating */}
      <div
        style={{
          position: "absolute",
          left: PANE_X0,
          top: PANE_CY - PANE_H / 2,
          width: PANE_W,
          height: PANE_H,
          borderRadius: 22,
          overflow: "hidden",
          background: "#000",
          transformOrigin: "50% 50%",
          transform: `translate(${(dx * NEAR).toFixed(2)}px, ${(dy * NEAR + float).toFixed(2)}px) perspective(${PERSP}px) rotateY(${ry.toFixed(3)}deg) scale(${zp.toFixed(4)})`,
          boxShadow: "0 0 0 2px rgba(255,255,255,0.14), 0 30px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ position: "absolute", left: -OVER, top: -OVER, width: TUBE_W, height: TUBE_H, overflow: "hidden", transform: `scale(${K})`, transformOrigin: "0 0" }}>
          <CRT loop={150} bloom={0.8}>
            <div style={{ position: "absolute", left: 0, top: 0, width: PANE_W + 2 * OVER, height: PANE_H + 2 * OVER, transform: `scale(${1 / K})`, transformOrigin: "0 0" }}>
              <div style={{ position: "absolute", left: OVER, top: OVER, width: PANE_W, height: PANE_H }}>
                <Screen t={t} zi={zi} />
              </div>
            </div>
          </CRT>
        </div>
      </div>
      <Caption name={CLIP} t={t} y={CAPTION_Y} size={CAPTION_SIZE} maxWidth={SAFE_IG.w - 40} />
    </AbsoluteFill>
  );
};

export const terminalquote: FxDef = {
  id: "terminalquote",
  command: "/terminal-quote",
  menu: "A quote typed on a CRT terminal",
  clip: CLIP,
  Comp: TerminalQuote,
  thumbT: [30, 36, 44],
};
