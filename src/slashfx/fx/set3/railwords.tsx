// /rail-words (set 3 on the ArtCraft take, Victor 2026-10-26): his footage full frame (a_build, "You can just ask Claude to
// build your own."); his words ride a rail that bends around his head in 2.5D. The rail is the live scope trace: from his
// left shoulder (viewer right) up beside his head, over his hair and down to his right shoulder (viewer left). It tracks
// his head as it sways through the take (head x 315..840, hair top 400 at its highest, chin about 945).
// Depth: the arc over his hair leans toward the lens (near: big, sharp, bright), the legs run back behind his shoulders
// (far: small, soft, dim), so the rail and every word on it scale, blur and dim with depth (one continuous function).
// Each word enters at the far end on his left shoulder a few frames before he says it, runs up the rail (EASE.decel) and
// lands over his hair as he says it, pushing the words before it on along the rail (they keep their spacing in rail units,
// so perspective compresses them as they go), down his right side, and out behind his right shoulder. The sentence reads
// left to right along the arc. The clip starts OFFSET (12) frames in, so "Claude" lands at t 13.6, "to build" at 22.2 and
// "your own." at 29.9, inside the full-screen part; the 2.13 s clip ends at t 39.2, so from CLIP_END the footage holds a
// frame (a nested Sequence pins its time) and the rail and words, already settled, keep breathing.
// The words are laid on the outside of the rail (SVG textPath), so they can never reach his face. Inter 800 in phosphor
// ink with a slight red/cyan split and fine scanlines, "Claude" in coral on a coral packet; no glow, a dark shadow only.
// Each word rides a green packet on the trace that swells while he says it; a packet lays the rail on the first frames.
// Camera: hold, one push 1.0 to 1.05 anchored on the top of his head, hold; a small sine drift (the rail rides it 1.2x).
// Safe zone: every word stays inside SAFE_IG at every t (checked numerically at quarter frames and on the proof stills).
import React, { useId } from "react";
import { AbsoluteFill, Sequence, interpolate } from "remotion";
import { PH } from "../../../artcraft/theme";
import { CLIPS } from "../../data/clips";
import { Clip, INTER } from "../../kit";
import { CLAMP, EASE, FPS, H, UI, W, ez, type FxDef, type FxProps } from "../../theme";

// ---------------------------------------------------------------- geometry (rail built around x = 0, moved to railCx(t))
/** His head (hair and ears) is about a 230 px circle around y 630 in this take; the rail clears its sides by about 40 px
 *  and rides on top of his hair at the apex (hair, never his face). */
const R = 270;
const CY = 675;
/** The text baseline runs this far outside the rail. */
const OFF = 16;
/** Shoulders: the legs end here, flaring out a little. */
const LEG_Y = 1120;
const FLARE = 26;
const LEG_C = 150;
const KAPPA = 0.5523;

/** Where his head is (center x) through the take, measured on the clip (24 fps, less OFFSET): 588 at the clip's first frame,
 *  565 from t -6, then he drifts right at the end of the line (595 by t 32, 620 at the held frame). */
const railCx = (t: number) => interpolate(t, [-12, -6, 22, 32, 37, 48], [588, 565, 565, 595, 620, 620], { ...CLAMP, easing: EASE.inOut });

type Pt = { x: number; y: number };
type Seg = [Pt, Pt, Pt, Pt];
type Path = { pts: Pt[]; s: number[]; L: number };

/** The rail at radius r: viewer-left shoulder, up, over the top, down to the viewer-right shoulder (textPath direction). */
const segsAt = (r: number): Seg[] => [
  [{ x: -r - FLARE, y: LEG_Y }, { x: -r - FLARE, y: LEG_Y - LEG_C }, { x: -r, y: CY + LEG_C }, { x: -r, y: CY }],
  [{ x: -r, y: CY }, { x: -r, y: CY - KAPPA * r }, { x: -KAPPA * r, y: CY - r }, { x: 0, y: CY - r }],
  [{ x: 0, y: CY - r }, { x: KAPPA * r, y: CY - r }, { x: r, y: CY - KAPPA * r }, { x: r, y: CY }],
  [{ x: r, y: CY }, { x: r, y: CY + LEG_C }, { x: r + FLARE, y: LEG_Y - LEG_C }, { x: r + FLARE, y: LEG_Y }],
];
const cubicAt = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt => {
  const a = (1 - u) ** 3;
  const b = 3 * (1 - u) ** 2 * u;
  const c = 3 * (1 - u) * u * u;
  const d = u ** 3;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
};
const buildPath = (segs: Seg[]): Path => {
  const pts: Pt[] = [];
  for (const [p0, p1, p2, p3] of segs) for (let i = pts.length ? 1 : 0; i <= 120; i++) pts.push(cubicAt(p0, p1, p2, p3, i / 120));
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, s, L: s[s.length - 1] };
};
const indexAt = (arr: number[], v: number) => {
  let lo = 0;
  let hi = arr.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= v) lo = mid;
    else hi = mid;
  }
  return lo;
};
const pathAt = (p: Path, at: number) => {
  const v = Math.max(0, Math.min(p.L, at));
  const lo = Math.min(indexAt(p.s, v), p.s.length - 2);
  const a = p.pts[lo];
  const b = p.pts[lo + 1];
  const k = (v - p.s[lo]) / (p.s[lo + 1] - p.s[lo] || 1);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, nx: -(b.y - a.y) / len, ny: (b.x - a.x) / len };
};
const dOf = (segs: Seg[], dx: number) =>
  `M ${(segs[0][0].x + dx).toFixed(2)} ${segs[0][0].y} ` +
  segs.map(([, a, b, c]) => `C ${(a.x + dx).toFixed(2)} ${a.y.toFixed(2)} ${(b.x + dx).toFixed(2)} ${b.y.toFixed(2)} ${(c.x + dx).toFixed(2)} ${c.y.toFixed(2)}`).join(" ");

const RAIL_SEGS = segsAt(R);
const BASE_SEGS = segsAt(R + OFF);
const RAIL = buildPath(RAIL_SEGS);
const BASE = buildPath(BASE_SEGS);

// ---------------------------------------------------------------- depth along the rail
/** 1 at the apex over his hair (near), 0 at both ends behind his shoulders (far). */
const nearAt = (s: number, L: number) => Math.pow(1 - Math.min(1, Math.abs(s - L / 2) / (L / 2)), 1.4);
const SMIN = 0.36;
const scaleAt = (s: number, L: number) => SMIN + (1 - SMIN) * nearAt(s, L);

/** Rail units: arc length at apex scale (d rho = d s / scale), 0 at the apex, negative toward the exit (viewer left).
 *  Words keep constant spacing in rail units, so perspective compresses them on screen as they recede. */
const RHO = (() => {
  const c = [0];
  for (let i = 1; i < BASE.s.length; i++) c.push(c[i - 1] + (BASE.s[i] - BASE.s[i - 1]) / scaleAt((BASE.s[i] + BASE.s[i - 1]) / 2, BASE.L));
  const apex = c[c.length - 1] / 2;
  return c.map((v) => v - apex);
})();
const RHO_MIN = RHO[0];
const RHO_MAX = RHO[RHO.length - 1];
const sigmaAt = (rho: number) => {
  const v = Math.max(RHO_MIN, Math.min(RHO_MAX, rho));
  const i = Math.min(indexAt(RHO, v), RHO.length - 2);
  const k = (v - RHO[i]) / (RHO[i + 1] - RHO[i] || 1);
  return BASE.s[i] + (BASE.s[i + 1] - BASE.s[i]) * k;
};

// ---------------------------------------------------------------- his words (CLIPS.a_build), timed in frames
const CLIP = "a_build" as const;
/** The clip starts this many frames in (24 fps); word times, the head track and the rail's draw-on are shifted to match. */
const OFFSET = 12;
/** Last t the clip plays before it would run out (a 2-frame margin); after it the footage holds this frame. */
const CLIP_END = Math.floor(CLIPS[CLIP].dur * FPS) - OFFSET - 2;
/** Font size at the apex (his hair is high in this take: the apex word's top must clear the safe top at the 1.05 push). */
const S_APEX = 96;
const GAP = 0.5 * S_APEX;
/** A word leaves the far end LEAD frames before he says it and lands over TRAVEL frames (EASE.decel). */
const LEAD = 4;
const TRAVEL = 7;
/** A word that starts less than MIN_GAP frames after the previous one rides with it ("You can", "to build", "your own."). */
const MIN_GAP = 3.5;
const INK = UI.screenInk;
const ACCENT = new Set(["Claude"]);

/** Approximate advance widths of Inter ExtraBold in em (same table as pushdigital), to space the words. */
const ADV: Record<string, number> = {
  a: 0.58, b: 0.62, c: 0.56, d: 0.62, e: 0.58, f: 0.38, g: 0.62, h: 0.61, i: 0.27, j: 0.27, k: 0.58, l: 0.27, m: 0.91,
  n: 0.61, o: 0.61, p: 0.62, q: 0.62, r: 0.41, s: 0.55, t: 0.39, u: 0.61, v: 0.58, w: 0.84, x: 0.58, y: 0.58, z: 0.52,
  M: 0.88, ".": 0.29, ",": 0.29, "'": 0.25, " ": 0.26,
};
const LETTER_SPACING = -0.02;
const emWidth = (w: string) => w.split("").reduce((sum, c) => sum + (ADV[c] ?? 0.66), 0) * 1.06 + LETTER_SPACING * w.length;

type Part = { w: string; s: number; e: number };
type Beat = { parts: Part[]; s: number; text: string; wd: number };
const BEATS: Beat[] = (() => {
  const out: { parts: Part[]; s: number }[] = [];
  for (const w of CLIPS[CLIP].words) {
    const s = w.s * FPS - OFFSET;
    const e = w.e * FPS - OFFSET;
    const last = out[out.length - 1];
    if (last && s - last.s < MIN_GAP) last.parts.push({ w: w.w, s, e });
    else out.push({ parts: [{ w: w.w, s, e }], s });
  }
  return out.map((b) => {
    const text = b.parts.map((p) => p.w).join(" ");
    return { ...b, text, wd: emWidth(text) * S_APEX };
  });
})();
/** Rail-unit distance between the centers of beat j - 1 and beat j. */
const DIST = BEATS.map((b, j) => (j === 0 ? 0 : (BEATS[j - 1].wd + b.wd) / 2 + GAP));
const arrive = (t: number, j: number) => ez(t, BEATS[j].s - LEAD, BEATS[j].s - LEAD + TRAVEL, EASE.decel);
/** Center of beat k in rail units: in from the far end, then pushed on by every later beat as it lands. */
const rhoOf = (t: number, k: number) => {
  let r = RHO_MAX * (1 - arrive(t, k));
  for (let j = k + 1; j < BEATS.length; j++) r -= DIST[j] * arrive(t, j);
  return r;
};
/** His voice on a beat, 0..1, from the real word timings (frames), softened at the edges. The knots are forced strictly
 *  increasing, so a word shorter than 1.5 frames ("your" is 1.56) can never make interpolate throw. */
const speakOf = (t: number, b: Beat) =>
  Math.max(
    0,
    ...b.parts.map((p) => {
      const k0 = p.s - 1.5;
      const k1 = p.s + 1;
      const k2 = Math.max(k1 + 0.01, p.e - 0.5);
      const k3 = Math.max(k2 + 0.01, p.e + 2);
      return interpolate(t, [k0, k1, k2, k3], [0, 1, 1, 0], CLAMP);
    }),
  );

// ---------------------------------------------------------------- the trace (the rail)
type Bump = { s: number; amp: number; sigma: number; rgb: string };
const HUM = 1.3;
const gauss = (x: number, c: number, sg: number) => Math.exp(-((x - c) ** 2) / (2 * sg * sg));
/** The packet that lays the rail (shifted with the clip: the rail is laid before the first frame, words already riding it). */
const drawAt = (t: number) => RAIL.L * (1 - ez(t, -26, -2, EASE.inOut));

const Rail: React.FC<{ t: number; cx: number; bumps: Bump[] }> = ({ t, cx, bumps }) => {
  const from = drawAt(t);
  if (RAIL.L - from < 2) return null;
  const off = (s: number) => {
    const carrier = 0.62 * Math.sin(s * 0.085 - t * 0.42) + 0.38 * Math.sin(s * 0.21 + t * 0.31);
    const amp = bumps.reduce((a, b) => a + b.amp * gauss(s, b.s, b.sigma), 0);
    return carrier * amp + HUM * Math.sin(s * 0.05 + t * 0.07);
  };
  const pt = (s: number) => {
    const p = pathAt(RAIL, s);
    const o = off(s) * (0.55 + 0.45 * nearAt(s, RAIL.L));
    return `${(p.x + cx + p.nx * o).toFixed(1)},${(p.y + p.ny * o).toFixed(1)}`;
  };
  const run = (a: number, b: number) => {
    const out: string[] = [];
    for (let s = a; s < b; s += 4) out.push(pt(s));
    out.push(pt(b));
    return out.join(" ");
  };
  // Perspective: the line is drawn in short runs, thicker and brighter near the apex, thin and dim at the ends.
  const runs: React.ReactNode[] = [];
  const CH = 28;
  for (let a = from; a < RAIL.L; a += CH) {
    const b = Math.min(RAIL.L, a + CH + 2);
    const n = nearAt((a + b) / 2, RAIL.L);
    const endFade = Math.min(1, Math.min(a, RAIL.L - b) / 90 + 0.15);
    runs.push(
      <polyline
        key={a.toFixed(1)}
        points={run(a, b)}
        fill="none"
        stroke={`rgba(243,241,236,${((0.38 + 0.46 * n) * endFade).toFixed(3)})`}
        strokeWidth={2.2 + 2 * n}
        strokeLinejoin="round"
        strokeLinecap="round"
      />,
    );
  }
  return (
    <g>
      {runs}
      {bumps.map((b, i) => {
        if (b.amp < 0.6) return null;
        const a = Math.max(from, b.s - 2.6 * b.sigma);
        const c = Math.min(RAIL.L, b.s + 2.6 * b.sigma);
        if (c - a < 4) return null;
        const n = nearAt(b.s, RAIL.L);
        return (
          <polyline
            key={`b${i}`}
            points={run(a, c)}
            fill="none"
            stroke={`rgba(${b.rgb},${Math.min(1, (0.35 + b.amp / 22) * (0.5 + 0.5 * n)).toFixed(3)})`}
            strokeWidth={2.6 + 2 * n}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- the words
type Placed = { k: number; b: Beat; sigma: number; near: number; op: number; speak: number };
const placeAt = (t: number): Placed[] => {
  const out: Placed[] = [];
  BEATS.forEach((b, k) => {
    if (t < b.s - LEAD) return;
    const rho = rhoOf(t, k);
    if (rho <= RHO_MIN + 1 || rho >= RHO_MAX - 1) return;
    const sigma = sigmaAt(rho);
    const d = Math.min(1, Math.abs(sigma - BASE.L / 2) / (BASE.L / 2));
    const near = nearAt(sigma, BASE.L);
    const op = (0.38 + 0.62 * near) * (1 - ez(d, 0.74, 0.97, EASE.inOut));
    if (op < 0.01) return;
    out.push({ k, b, sigma, near, op, speak: speakOf(t, b) });
  });
  return out;
};

const WordOnRail: React.FC<{ w: Placed; href: string; blurId: string; shadowId: string }> = ({ w, href, blurId, shadowId }) => {
  const fs = S_APEX * (SMIN + (1 - SMIN) * w.near);
  const fringe = 1.2 + 1.8 * (1 - w.near);
  const blur = 2.2 * (1 - w.near);
  const common = {
    fontFamily: INTER,
    fontWeight: 800,
    fontSize: fs,
    letterSpacing: LETTER_SPACING * fs,
    textAnchor: "middle" as const,
  };
  const body = (accent: boolean) => (
    <textPath href={href} startOffset={w.sigma.toFixed(2)}>
      {w.b.parts.map((p, i) => (
        <tspan key={i} fill={accent && ACCENT.has(p.w) ? UI.coral : undefined}>
          {(i > 0 ? " " : "") + p.w}
        </tspan>
      ))}
    </textPath>
  );
  const split: React.CSSProperties = { mixBlendMode: "screen" };
  return (
    <g opacity={w.op} filter={blur > 0.15 ? `url(#${blurId})` : undefined}>
      {/* a dark shadow under the letters for legibility over the light bar and his hair (no glow) */}
      <text {...common} fill="rgba(4,3,6,0.62)" filter={`url(#${shadowId})`}>
        {body(false)}
      </text>
      <text {...common} fill="#FF3B30" opacity={0.42} transform={`translate(${-fringe} 0)`} style={split}>
        {body(false)}
      </text>
      <text {...common} fill="#2BD1FF" opacity={0.42} transform={`translate(${fringe} 0)`} style={split}>
        {body(false)}
      </text>
      <text {...common} fill={INK}>
        {body(true)}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------- camera
const KEY_T = [0, 6, 34, 48];
const ZOOM = [1.0, 1.0, 1.05, 1.05];
/** Anchored on the top of his head, so the apex words stay under the safe top through the push. */
const ANCHOR = { x: 560, y: 420 };
/** Footage overscan so the drift never shows an edge (1.012 x 1.05 = 1.063, under the 1.07 cap). */
const OVERSCAN = 1.012;
const NEAR_K = 1.2;
/** Fine phosphor scanlines on the rail layer only (the footage is untouched). */
const SCAN = "repeating-linear-gradient(to bottom, #000 0px, #000 3px, rgba(0,0,0,0.72) 3px, rgba(0,0,0,0.72) 4px)";

export const RailWords: React.FC<FxProps> = ({ t }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const z = interpolate(t, KEY_T, ZOOM, { ...CLAMP, easing: EASE.travel });
  const dx = 5 * Math.sin(t * 0.075 + 0.3);
  const dy = 3 * Math.sin(t * 0.058 + 1.1);
  const camera = (k: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    transformOrigin: `${ANCHOR.x}px ${ANCHOR.y}px`,
    transform: `translate(${(dx * k).toFixed(2)}px, ${(dy * k).toFixed(2)}px) scale(${z.toFixed(5)})`,
  });
  const cx = railCx(t);
  const placed = placeAt(t);
  // Each word rides a green packet that swells while he says it; the packet laying the rail runs first.
  const ratio = RAIL.L / BASE.L;
  const bumps: Bump[] = placed.map((w) => ({
    s: w.sigma * ratio,
    amp: 2.5 + 11 * w.speak,
    sigma: Math.max(22, 0.2 * w.b.wd * (SMIN + (1 - SMIN) * w.near)),
    rgb: w.b.parts.some((p) => ACCENT.has(p.w)) ? PH.claudeRgb : PH.userRgb,
  }));
  const lay = interpolate(t, [-26, -23, -5, -1], [0, 1, 1, 0], CLAMP);
  if (lay > 0.01) bumps.push({ s: drawAt(t), amp: 13 * lay, sigma: 28, rgb: PH.userRgb });
  const href = `#${uid}-base`;
  return (
    <AbsoluteFill style={{ background: UI.bg, overflow: "hidden" }}>
      <div style={camera(1)}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${ANCHOR.x}px ${ANCHOR.y}px`, transform: `scale(${OVERSCAN})` }}>
          {t > CLIP_END ? (
            // The clip has run out: a nested Sequence pins its time at CLIP_END, so the footage holds that frame.
            <Sequence from={t - CLIP_END} layout="none">
              <Clip name={CLIP} offset={OFFSET} />
            </Sequence>
          ) : (
            <Clip name={CLIP} offset={OFFSET} />
          )}
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.26) 100%)" }} />
      <div style={{ ...camera(NEAR_K), WebkitMaskImage: SCAN, maskImage: SCAN }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <path id={`${uid}-base`} d={dOf(BASE_SEGS, cx)} />
            <filter id={`${uid}-sh`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400}>
              <feGaussianBlur stdDeviation={7} />
            </filter>
            {placed.map((w) => (
              <filter key={w.k} id={`${uid}-b${w.k}`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400}>
                <feGaussianBlur stdDeviation={(2.2 * (1 - w.near)).toFixed(2)} />
              </filter>
            ))}
          </defs>
          <Rail t={t} cx={cx} bumps={bumps} />
          {placed.map((w) => (
            <WordOnRail key={w.k} w={w} href={href} blurId={`${uid}-b${w.k}`} shadowId={`${uid}-sh`} />
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const railwords: FxDef = {
  id: "railwords",
  command: "/rail-words",
  menu: "Your words ride a rail around your head",
  clip: CLIP,
  Comp: RailWords,
  thumbT: [16, 24, 30],
};
