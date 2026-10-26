// /over-the-shoulder-zoom: the camera pushes in on Victor's head while two see-through CRT proof panes land beside it, one after
// the other. The panes carry only the verbatim fragments of Grant Petty's press-release quote, his name and his role (PETTY in
// data/facts.ts). Polish (Victor, 16:50 and 17:05, CRT Scope bar; placement per the orchestrator, 17:20):
//  - in this take (re-cut 16:45) his face is centered: head about x 290..800, hair top about y 495, and his jaw reaches x 400..470
//    at y 980..1060. Pane 1 hangs above his head, right of center; pane 2 sits beside his left shoulder, its top clear under his
//    jaw line (y 1100) so it never covers his face;
//  - one live scope trace runs from pane 1, left over his hair, down the gap beside his head into pane 2. His real voice (word
//    timings of the ceo take) shows as green amplitude beside his head; a green packet runs from his head along the trace to each
//    pane as it lands, laying the line as it goes, and the pane answers on the line in coral;
//  - both panes arrive on one eased path (down DROP px plus a 4 degree settle, EASE.decel, 6 frames), the words inside two per frame.
//    When pane 2 lands, pane 1 shifts 10 px further out and sinks back a little (slight depth). The panes are angled a few degrees
//    toward his head (perspective) and ride the camera drift slightly more than the footage (parallax);
//  - camera: hold, then one push 1.015 to 1.07 (never past 1.07), then hold; a 6 px sine drift throughout.
// Timing is at 24 fps: inside the result card t 0 to 9, push to full screen t 9 to 14, full screen t 14 to 30, alive to 48.
// Instagram safe zone (Victor, 22:00): both panes and the caption sit inside SAFE_IG (x 100..980, y 290..1520) at every t,
// including the drop-in, the 1.07 push, the drift with its parallax, the float and the perspective. His clip keeps bleeding.
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { PH } from "../../artcraft/theme";
import { CLIPS } from "../data/clips";
import { PETTY } from "../data/facts";
import { Caption, Clip, INTER, MONO } from "../kit";
import { CLAMP, EASE, FPS, H, SAFE_IG, UI, W, ez, lerp, type FxDef, type FxProps } from "../theme";

/** Push-in origin: the middle of his head, so the push grows him in place and his hair stays clear of the panes. */
const ORIGIN = { x: 585, y: 700 };
/** Camera keyframes: hold while pane 1 lands, push to 1.07 across the card-to-full-screen push, hold while pane 2 lands. */
const KEY_T = [0, 7, 19, 48];
const ZOOM = [1.015, 1.015, 1.07, 1.07];
const CAM_EASE = Easing.inOut(Easing.cubic);
/** Camera drift (sine). At zoom 1.015 the footage overscans 7 px or more on every side, so the drift never shows an edge. */
const DRIFT = { x: 6, y: 3 };
/** The panes and the trace sit nearer the lens than the footage: they ride the drift a little more (parallax). */
const NEAR = 1.25;

const TRACE_INK = "rgba(243,241,236,0.55)";

/** Frames a pane takes to land (EASE.decel). */
const LAND = 6;
/** How far a pane drops in (60 before the safe-zone pass): pane 1 sits right under the safe top, and its first visible frame
 *  of the drop (t 4, opacity 0.4, still tilted) must not rise above it. */
const DROP = 30;
/** One type scale for both panes (kicker, fragment, name and role), sized so pane 1 fits between the safe top and his hair. */
const TYPE = { kicker: 24, fragment: 44, credit: 24 } as const;

type Spot = {
  i: 0 | 1;
  /** t at which the pane starts to drop in. */
  land: number;
  left: number;
  width: number;
  /** Top edge (both panes are anchored by their top edge). */
  top: number;
  /** Keep the fragment on one line (pane 1 is wide and short, pane 2 narrow and tall). */
  oneLine?: boolean;
  /** Starting rotation of the 4 degree settle. */
  fromRot: number;
  /** Perspective angle toward his head (the inner edge recedes). */
  ry: number;
};

// Worst-case reach past a pane's resting box, measured on the stills: drift x 1.25 (parallax) up to 7.5 px, pane 1's 10 px nudge,
// perspective up to 3 px, float 2 px and 0.2 degrees, and during the drop the 4 degree settle about the pane's center.
// Pane 1: top 36 px under the safe top (its t 4 frame lands just inside), right edge 26 px in from the safe right, bottom
// (about 468) clear above his hair (about 495). One line: kicker, fragment, then name and role side by side.
const CARD1: Spot = { i: 0, land: 3, left: 434, width: 520, top: SAFE_IG.y0 + 36, fromRot: -4, ry: -6, oneLine: true };
// Pane 2: 20 px in from the safe left, top clear under his jaw; the fragment wraps, name over role.
const CARD2: Spot = { i: 1, land: 16, left: SAFE_IG.x0 + 20, width: 400, top: 1100, fromRot: 4, ry: 6 };
/** Pane 1's height as rendered (padding, kicker, one fragment line, the credit row): the trace starts inside its bottom-left corner. */
const CARD1_H = 142;
/** His caption sits under pane 2, its bottom edge 12 px above the safe bottom (one line: top about 1440). */
const CAPTION_BOTTOM = SAFE_IG.y1 - 12;

// ---- the trace as a path (lines and cubics sampled by arc length; same smooth carrier as kit/Scope, offset along the normal)
type Pt = { x: number; y: number };
type Seg = ["L", Pt, Pt] | ["C", Pt, Pt, Pt, Pt];
type Path = { pts: Pt[]; s: number[]; L: number };
type WireBump = { s: number; amp: number; sigma: number; rgb: string };

const cubicAt = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt => {
  const a = (1 - u) ** 3;
  const b = 3 * (1 - u) ** 2 * u;
  const c = 3 * (1 - u) * u * u;
  const d = u ** 3;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
};
const buildPath = (segs: Seg[]): Path => {
  const pts: Pt[] = [];
  for (const seg of segs) {
    if (seg[0] === "L") {
      const [, a, b] = seg;
      const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6));
      for (let i = pts.length ? 1 : 0; i <= n; i++) pts.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
    } else {
      const [, p0, p1, p2, p3] = seg;
      for (let i = pts.length ? 1 : 0; i <= 80; i++) pts.push(cubicAt(p0, p1, p2, p3, i / 80));
    }
  }
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, s, L: s[s.length - 1] };
};
const pathAt = (p: Path, at: number) => {
  const v = Math.max(0, Math.min(p.L, at));
  let lo = 0;
  let hi = p.s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (p.s[mid] <= v) lo = mid;
    else hi = mid;
  }
  const a = p.pts[lo];
  const b = p.pts[hi];
  const k = (v - p.s[lo]) / (p.s[hi] - p.s[lo] || 1);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, nx: -(b.y - a.y) / len, ny: (b.x - a.x) / len };
};

/** Pane 1 (inside its bottom-left corner, behind the glass), left over his hair, down beside his head, into pane 2's top. */
const RUN_X = 262;
const TRACE_Y1 = CARD1.top + CARD1_H - 6;
const TRACE = buildPath([
  ["L", { x: CARD1.left + 34, y: TRACE_Y1 }, { x: 400, y: TRACE_Y1 }],
  ["C", { x: 400, y: TRACE_Y1 }, { x: 318, y: TRACE_Y1 }, { x: RUN_X, y: TRACE_Y1 + 46 }, { x: RUN_X, y: TRACE_Y1 + 134 }],
  ["L", { x: RUN_X, y: TRACE_Y1 + 134 }, { x: RUN_X, y: CARD2.top + 16 }],
]);
/** His head's spot on the trace: beside his temple, level with y 700. */
const S_HEAD = TRACE.L - (CARD2.top + 16 - 700);
/** Where each pane answers on the line: just outside its edge. */
const S_ANS = [36, TRACE.L - 34] as const;
/** The packets: from his head to pane 1 (already in flight on the first frame), then to pane 2; each lands with its pane. */
const PACKET = [
  { from: -4, to: CARD1.land + LAND - 1, end: 0 },
  { from: CARD2.land - 4, to: CARD2.land + LAND - 1, end: TRACE.L },
] as const;

const gauss = (x: number, c: number, sg: number) => Math.exp(-((x - c) ** 2) / (2 * sg * sg));

/** The trace between arc lengths s0 and s1, with its packets and voices as colored wave segments. */
const Wire: React.FC<{ t: number; s0: number; s1: number; bumps: WireBump[] }> = ({ t, s0, s1, bumps }) => {
  if (s1 - s0 < 2) return null;
  const off = (s: number) => {
    const carrier = 0.62 * Math.sin(s * 0.085 - t * 0.42) + 0.38 * Math.sin(s * 0.21 + t * 0.31);
    const amp = bumps.reduce((a, b) => a + b.amp * gauss(s, b.s, b.sigma), 0);
    return carrier * amp + 1.4 * Math.sin(s * 0.05 + t * 0.07);
  };
  const pt = (s: number) => {
    const p = pathAt(TRACE, s);
    const o = off(s);
    return `${(p.x + p.nx * o).toFixed(1)},${(p.y + p.ny * o).toFixed(1)}`;
  };
  const line = (a: number, b: number) => {
    const out: string[] = [];
    for (let s = a; s < b; s += 3) out.push(pt(s));
    out.push(pt(b));
    return out.join(" ");
  };
  return (
    <g>
      <polyline points={line(s0, s1)} fill="none" stroke={TRACE_INK} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {bumps.map((b, i) => {
        if (b.amp < 0.5) return null;
        const a = Math.max(s0, b.s - 2.6 * b.sigma);
        const c = Math.min(s1, b.s + 2.6 * b.sigma);
        if (c - a < 3) return null;
        return (
          <polyline
            key={i}
            points={line(a, c)}
            fill="none"
            stroke={`rgba(${b.rgb},${Math.min(1, 0.4 + b.amp / 26).toFixed(3)})`}
            strokeWidth={3.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

/** His voice, 0..1, from the real word timings of the take, softened over 5 frames so the line never jitters. */
const WORDS = CLIPS.ceo.words;
const speechAt = (sec: number) => {
  let v = 0;
  for (const w of WORDS) {
    const a = w.s - 0.03;
    const b = w.e + 0.03;
    if (sec > a && sec < b) v = Math.max(v, Math.sin((Math.PI * (sec - a)) / (b - a)));
  }
  return v;
};
const voiceAt = (t: number) => {
  let s = 0;
  let n = 0;
  for (let k = -2; k <= 2; k++) {
    const wgt = 3 - Math.abs(k);
    s += wgt * speechAt((t + k) / FPS);
    n += wgt;
  }
  return s / n;
};

/** The trace at frame t: drawn range, his voice beside his head, a green packet to each pane, the pane answering. */
const traceAt = (t: number) => {
  const green = PH.userRgb;
  const coral = PH.claudeRgb;
  const bumps: WireBump[] = [{ s: S_HEAD, amp: 3 + 13 * voiceAt(t) + 1.2 * Math.sin(t * 0.29), sigma: 60, rgb: green }];
  // The line exists around his head from the first frame and is laid toward each pane by its packet.
  let s0 = S_HEAD - 70;
  let s1 = S_HEAD + 70;
  PACKET.forEach((k, i) => {
    const p = ez(t, k.from, k.to, EASE.inOut);
    const at = lerp(S_HEAD, k.end, p);
    if (i === 0) s0 = Math.min(s0, Math.max(0, at - 30));
    else s1 = Math.max(s1, Math.min(TRACE.L, at + 30));
    const env = interpolate(t, [k.from - 1, k.from + 2, k.to - 1, k.to + 3], [0, 1, 1, 0], CLAMP);
    if (env > 0.01) bumps.push({ s: at, amp: 17 * env, sigma: 30, rgb: green });
    // The pane answers on the line as the packet arrives, then settles to a quiet hum.
    const ans = interpolate(t, [k.to - 2, k.to + 1, k.to + 14], [0, 1, 0.25], CLAMP);
    if (ans > 0.01) bumps.push({ s: S_ANS[i], amp: 11 * ans, sigma: 40, rgb: coral });
  });
  return { s0, s1, bumps };
};

/** One see-through CRT proof pane: kicker, the verbatim fragment, then name and role. Drops in, settles, then floats. */
const ProofPane: React.FC<{ spot: Spot; t: number; nudge?: number; sink?: number }> = ({ spot, t, nudge = 0, sink = 0 }) => {
  const { i, land, left, width, top, fromRot, ry, oneLine } = spot;
  if (t < land) return null;
  const p = ez(t, land, land + LAND, EASE.decel);
  const since = t - land;
  const op = interpolate(t, [land, land + 2.5], [0, 1], CLAMP);
  const floatY = Math.sin(since * 0.14) * 2 * p;
  const floatR = Math.sin(since * 0.09 + 0.8) * 0.2 * p;
  const ty = lerp(-DROP, 0, p) + floatY;
  const rot = lerp(fromRot, 0, p) + floatR;
  const sc = lerp(1.03, 1, p) * (1 - 0.025 * sink);
  // In the air the shadow is wide and light; once the pane lands it tightens.
  const shY = lerp(38, 14, p);
  const shB = lerp(64, 34, p);
  const shA = lerp(0.2, 0.36, p);
  const words = PETTY.cards[i].split(" ");
  // Kicker, then the fragment two words per frame, then name and role.
  const kp = ez(t, land + 0.5, land + 3.5);
  const bp = ez(t, land + 2 + words.length * 0.5, land + 5 + words.length * 0.5);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        opacity: op,
        transform: `translate(${nudge.toFixed(2)}px, ${ty.toFixed(2)}px) perspective(1400px) rotateY(${ry}deg) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(4)})`,
        transformOrigin: "50% 50%",
      }}
    >
      <div
        style={{
          // See-through CRT pane (Victor, 16:30: "make them crt and seethrough"): translucent dark glass over his footage,
          // a thin keyline, scanlines that roll, and phosphor text. No white card.
          position: "relative",
          background: "rgba(10, 12, 16, 0.52)",
          backdropFilter: "blur(5px) saturate(0.85)",
          WebkitBackdropFilter: "blur(5px) saturate(0.85)",
          borderRadius: 20,
          padding: "13px 18px",
          boxShadow: `inset 0 0 0 1.5px rgba(255,255,255,0.26), inset 0 0 28px rgba(0,0,0,0.35), 0 ${shY}px ${shB}px rgba(0,0,0,${shA.toFixed(3)})`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.34) 0px, rgba(0,0,0,0.34) 1px, transparent 1px, transparent 4px)",
            backgroundPosition: `0 ${(since % 4) * 1}px`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${((since * 9) % 160) - 40}%`,
            height: "28%",
            background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Pane 1 sinks back a touch when pane 2 lands. */}
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(0.18 * sink).toFixed(3)})`, pointerEvents: "none" }} />
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: TYPE.kicker,
            lineHeight: 1.2,
            // One line in both panes: mono tracked in a little.
            letterSpacing: -1.2,
            whiteSpace: "nowrap",
            color: UI.coral,
            textShadow: "0 0 6px rgba(217,119,87,0.5), 0 0 16px rgba(217,119,87,0.2)",
            position: "relative",
            opacity: kp,
            transform: `translateY(${(1 - kp) * 8}px)`,
          }}
        >
          {PETTY.kicker[i]}
        </div>
        <div
          style={{
            marginTop: 5,
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: TYPE.fragment,
            lineHeight: 1.04,
            letterSpacing: -1,
            whiteSpace: oneLine ? "nowrap" : undefined,
            color: UI.screenInk,
            textShadow: "1.2px 0 0 rgba(255,60,40,0.35), -1.2px 0 0 rgba(40,140,255,0.35), 0 0 8px rgba(236,233,226,0.45), 0 0 22px rgba(236,233,226,0.18)",
            position: "relative",
            textWrap: "balance",
          }}
        >
          {words.map((w, j) => {
            const wp = ez(t, land + 1.5 + j * 0.5, land + 4.5 + j * 0.5);
            return (
              <React.Fragment key={j}>
                <span style={{ display: "inline-block", opacity: wp, transform: `translateY(${(1 - wp) * 10}px)` }}>{w}</span>
                {j < words.length - 1 ? " " : null}
              </React.Fragment>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 7,
            fontFamily: INTER,
            fontSize: TYPE.credit,
            lineHeight: 1.2,
            color: "rgba(236,233,226,0.74)",
            textShadow: "0 0 6px rgba(236,233,226,0.3)",
            position: "relative",
            opacity: bp,
            transform: `translateY(${(1 - bp) * 8}px)`,
            // Name and role side by side when the pane is wide enough (pane 1), name over role when it is not (pane 2).
            display: "flex",
            flexWrap: "wrap",
            columnGap: 12,
          }}
        >
          <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{PETTY.name}</div>
          <div style={{ fontWeight: 500, whiteSpace: "nowrap" }}>{PETTY.role}</div>
        </div>
      </div>
    </div>
  );
};

export const ShoulderZoom: React.FC<FxProps> = ({ t }) => {
  // Primary: the push-in on his head (hold, push, hold), never past 1.07.
  const s = interpolate(t, KEY_T, ZOOM, { ...CLAMP, easing: CAM_EASE });
  // Ambient: a slow sine drift of the whole camera, already moving on the first frame.
  const dx = DRIFT.x * Math.sin(t * 0.085 + 0.4);
  const dy = DRIFT.y * Math.sin(t * 0.065 + 1.3);
  // Reaction: when pane 2 lands, pane 1 shifts 10 px further out and sinks back a touch.
  const nudge = 10 * ez(t, CARD2.land + 2, CARD2.land + LAND + 2, EASE.decel);
  const sink = ez(t, CARD2.land + 1, CARD2.land + LAND + 1, EASE.decel);
  const tr = traceAt(t);
  return (
    <AbsoluteFill style={{ background: UI.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${s.toFixed(5)})`,
          transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
        }}
      >
        <Clip name="ceo" />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 54% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.24) 100%)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${(dx * NEAR).toFixed(2)}px, ${(dy * NEAR).toFixed(2)}px)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Wire t={t} {...tr} />
        </svg>
        <ProofPane spot={CARD1} t={t} nudge={nudge} sink={sink} />
        <ProofPane spot={CARD2} t={t} />
      </div>
      {/* Anchored by its bottom edge, so a chunk that ever wraps grows up, never past the safe bottom. */}
      <Caption name="ceo" t={t} size={60} chunk={3} maxWidth={SAFE_IG.w - 40} style={{ top: undefined, bottom: H - CAPTION_BOTTOM }} />
    </AbsoluteFill>
  );
};

export const shoulderzoom: FxDef = {
  id: "shoulderzoom",
  command: "/over-the-shoulder-zoom",
  menu: "Proof cards land beside your head",
  clip: "ceo",
  Comp: ShoulderZoom,
  thumbT: [12, 26, 40],
};
