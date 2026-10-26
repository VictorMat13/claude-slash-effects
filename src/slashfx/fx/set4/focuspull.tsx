// /focus-pull (set 4): Victor's take "focus" full frame (Video 4 A-roll: "so they can focus on the creative decisions that
// actually matter."; head at rest x 360..830, y 495..1070 from clips.ts), and one see-through CRT label pane hanging
// above-left of his head. The pane carries one entry of the verbatim job list Blackmagic publishes (JOBS in data/facts.ts, from ARTICLES[3],
// PTTL.gr): the kicker "Blackmagic lists" and the source name are cut from that same article, verbatim.
// The camera racks focus between two planes on his beats: the near plane (the pane) and the far plane (him).
//  - focus on the label: the pane is sharp, his footage blurs 6 px and dims 15 percent (a CSS filter on the footage layer),
//    and the lens breathes in a touch (+0.8 percent);
//  - focus on him: the footage is sharp, the pane goes soft (9 px), blooms 2.5 percent and fades a little;
//  - every rack is eased over 8 frames (EASE.travel), never a jump, and the label is sharp exactly when he is soft;
//  - each time the pane goes soft its job swaps to the next JOBS entry, cross-faded under the blur.
// One live scope trace runs under the label, down the right side of his head and back under his chin (three sides of a
// frame around him). His real voice (word timings of the take) is the green swell beside his mouth; on each rack to the
// label a green packet runs from his voice up into the pane, and the pane answers in coral; on each rack back to him a
// coral packet leaves the pane and runs down to the line under his chin. His words sit under that line (the caption).
// Racks on his words (the take starts 20 frames in, so he is saying "focus" on the first frame): the label is sharp on
// "focus", focus racks back to him into "creative", to the label on "decisions", back to him into "actually", and to the
// label again on "matter". "focus" to "matter" is 50 frames of the take, longer than the 42 the reel shows of an effect,
// so the "matter" rack starts at t 45, at the tail of the stage.
// Camera: hold at 1.03, one push to 1.06 anchored on his forehead, hold; a 5 px sine drift; never past 1.07 with the breath.
// The pane and the trace sit nearer the lens: they ride the drift 1.3x (parallax).
// Timing at 24 fps: card t 0..9, push 9..14, full screen 14..48, alive to 60. Every value is a pure function of t.
// IG safe zone: the pane and the caption stay inside SAFE_IG (x 60..1000, y 270..1580) at every t; the trace and the
// footage bleed. His face is never covered (the pane ends above his hair).
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { PH } from "../../../artcraft/theme";
import { ARTICLES, JOBS } from "../../data/facts";
import { Caption, Clip, MONO } from "../../kit";
import { CLAMP, EASE, FPS, H, SAFE_IG, UI, W, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { CLIPS } from "../../data/clips";
import { voiceEnv } from "../shutterstrike";

const CLIP = "focus" as const;
/** The take starts this many frames in: "focus" is under way on the first frame. */
const OFFSET = Math.round(0.84 * FPS);

// ---- focus
/** Frames one rack takes. */
const RACK = 8;
/** Effect frame at which he starts a word of the take (punctuation ignored). */
const wordAt = (word: string, fallback: number) => {
  const w = CLIPS[CLIP].words.find((x) => x.w.replace(/[.,!?]/g, "") === word);
  return w ? w.s * FPS - OFFSET : fallback;
};
/** Rack starts, from his word timings. Focus opens on the label (on "focus"); even entries rack to him (the pane goes
 *  soft and swaps its job), odd ones rack back to the label. At 24 fps: 1.8, 14, 27.2, 45.3, 61.3. */
const RACKS = (() => {
  const toHimCreative = wordAt("creative", 9.8) - RACK; // lands as he starts "creative"
  const toLabelDecisions = wordAt("decisions", 16) - 2; // pulls to the label on "decisions"
  const toHimActually = wordAt("actually", 35.2) - RACK; // lands as he starts "actually"
  const toLabelMatter = wordAt("matter", 45.3); // pulls to the label on "matter"
  return [toHimCreative, toLabelDecisions, toHimActually, toLabelMatter, toLabelMatter + 16];
})();
/** 1 = focus on the label (pane sharp, him soft), 0 = focus on him. */
const focusAt = (t: number) => {
  let f = 1;
  for (let i = 0; i < RACKS.length; i++) {
    if (t < RACKS[i]) break;
    const from = i % 2 === 0 ? 1 : 0;
    f = lerp(from, 1 - from, ez(t, RACKS[i], RACKS[i] + RACK, EASE.travel));
  }
  return f;
};
/** The job on the pane: it swaps to the next JOBS entry while the pane is soft (4 to 10 frames into each rack to him). */
const jobAt = (t: number) => {
  let n = 0;
  let q = 0;
  for (let i = 0; i < RACKS.length; i += 2) {
    const p = ez(t, RACKS[i] + 4, RACKS[i] + 10, EASE.inOut);
    if (p >= 1) n++;
    else {
      q = p;
      break;
    }
  }
  return { cur: JOBS[n % JOBS.length], next: JOBS[(n + 1) % JOBS.length], q };
};

/** Footage blur and dim when the label is sharp (Victor's spec: 6 px, 15 percent). */
const BLUR_HIM = 6;
const DIM_HIM = 0.15;
/** The pane when he is sharp. */
const BLUR_PANE = 9;

// ---- camera
/** Push origin: his forehead, so the push grows him downward and his hair stays clear of the pane. */
const ORIGIN = { x: 595, y: 640 };
const KEY_T = [0, 10, 28, 48];
const ZOOM = [1.03, 1.03, 1.06, 1.06];
const CAM_EASE = Easing.inOut(Easing.cubic);
/** Focus breathing: the lens magnifies a touch as focus pulls to the near plane. 1.06 x 1.008 = 1.0685, under 1.07. */
const BREATH = 0.008;
const DRIFT = { x: 5, y: 3 };
const NEAR = 1.3;

// ---- the pane (above-left of his head; its bottom clear of his hair at the full push)
const PANE = { left: SAFE_IG.x0 + 26, top: SAFE_IG.y0 + 20, w: 668 } as const;
const PANE_H = 148;
const TYPE = { kicker: 32, job: 58 } as const;
/** Verbatim from ARTICLES[3] ("... Blackmagic lists project analysis, media organization, ..."). */
const KICKER = (() => {
  const a = ARTICLES[3].text;
  const i = a.indexOf("Blackmagic lists");
  return i >= 0 ? a.slice(i, i + "Blackmagic lists".length) : ARTICLES[3].source;
})();
const SOURCE = ARTICLES[3].source;

// ---- the trace: under the label, down the right side of his head, back under his chin (world px of the near layer)
type Pt = { x: number; y: number };
type Seg = ["L", Pt, Pt] | ["C", Pt, Pt, Pt, Pt];
type Path = { pts: Pt[]; s: number[]; L: number };
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
      for (let i = pts.length ? 1 : 0; i <= 60; i++) pts.push(cubicAt(p0, p1, p2, p3, i / 60));
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

const YT = PANE.top + PANE_H + 22;
const XR = 912;
const YB = 1150;
const TRACE = buildPath([
  ["L", { x: -80, y: YT }, { x: XR - 112, y: YT }],
  ["C", { x: XR - 112, y: YT }, { x: XR - 42, y: YT }, { x: XR, y: YT + 40 }, { x: XR, y: YT + 110 }],
  ["L", { x: XR, y: YT + 110 }, { x: XR, y: YB - 110 }],
  ["C", { x: XR, y: YB - 110 }, { x: XR, y: YB - 40 }, { x: XR - 42, y: YB }, { x: XR - 112, y: YB }],
  ["L", { x: XR - 112, y: YB }, { x: -80, y: YB }],
]);
/** Arc length of the point on the trace nearest to (x, y) (sampled; only used for the fixed spots below). */
const sNear = (x: number, y: number) => {
  let best = 0;
  let d = Infinity;
  TRACE.pts.forEach((p, i) => {
    const dd = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (dd < d) {
      d = dd;
      best = TRACE.s[i];
    }
  });
  return best;
};
/** Under the pane (where the label answers), beside his mouth (his voice), under his chin (where Claude's packet lands). */
const S_LABEL = sNear(300, YT);
const S_VOICE = sNear(XR, 960);
const S_CHIN = sNear(ORIGIN.x, YB);
const TRACE_INK = "rgba(243,241,236,0.58)";

type Bump = { s: number; amp: number; sigma: number; rgb: string };
const gauss = (x: number, c: number, sg: number) => Math.exp(-((x - c) ** 2) / (2 * sg * sg));

/** The trace between arc lengths s0 and s1 with its colored wave packets (same carrier as kit Scope, along the normal). */
const Wire: React.FC<{ t: number; s0: number; s1: number; bumps: Bump[] }> = ({ t, s0, s1, bumps }) => {
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
            stroke={`rgba(${b.rgb},${Math.min(1, 0.4 + b.amp / 24).toFixed(3)})`}
            strokeWidth={3.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

/** One packet travelling along the trace from s `from` to s `to` between frames a and b. */
const packet = (t: number, a: number, b: number, from: number, to: number, amp: number, rgb: string): Bump | null => {
  if (t < a - 1 || t > b + 4) return null;
  const u = ez(t, a, b, EASE.inOut);
  const env = interpolate(t, [a - 1, a + 2, b - 1, b + 4], [0, 1, 1, 0], CLAMP);
  return { s: lerp(from, to, u), amp: amp * env, sigma: 28, rgb };
};

const traceAt = (t: number) => {
  const green = PH.userRgb;
  const coral = PH.claudeRgb;
  const bumps: Bump[] = [];
  // His voice beside his mouth (real word timings of the take).
  bumps.push({ s: S_VOICE, amp: 3 + voiceEnv(CLIP, t + OFFSET) * (12 + 4 * Math.sin(t * 0.61) + 2.5 * Math.sin(t * 1.37)), sigma: 46, rgb: green });
  // The pane's quiet coral hum, swelling when it lands sharp.
  let answer = 0;
  for (let i = 1; i < RACKS.length; i += 2) {
    const e = RACKS[i] + RACK;
    answer = Math.max(answer, interpolate(t, [e - 3, e, e + 14], [0, 1, 0], { ...CLAMP, easing: EASE.decel }));
  }
  bumps.push({ s: S_LABEL, amp: 2.5 + 1.2 * Math.sin(t * 0.37) + 10 * answer, sigma: 40, rgb: coral });
  RACKS.forEach((a, i) => {
    // Rack to the label: his voice runs up into the pane. Rack to him: Claude's packet leaves the pane for the line under his chin.
    const p = i % 2 === 1 ? packet(t, a - 6, a + RACK, S_VOICE, S_LABEL, 15, green) : packet(t, a, a + 15, S_LABEL, S_CHIN, 14, coral);
    if (p) bumps.push(p);
  });
  // The line is laid out from the pane on the opening frames, both ways.
  const lay = ez(t, -6, 13, EASE.inOut);
  const s0 = lerp(S_LABEL - 40, 0, lay);
  const s1 = lerp(S_LABEL + 40, TRACE.L, lay);
  return { s0, s1, bumps };
};

// ---- the label pane
const JobLine: React.FC<{ text: string; op: number; dy: number }> = ({ text, op, dy }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      opacity: op,
      transform: `translateY(${dy.toFixed(2)}px)`,
      fontFamily: MONO,
      fontWeight: 700,
      fontSize: TYPE.job,
      lineHeight: 1.12,
      letterSpacing: -0.8,
      color: UI.screenInk,
      // phosphor convergence split, no glow
      textShadow: "1.2px 0 0 rgba(255,60,40,0.4), -1.2px 0 0 rgba(40,140,255,0.4)",
    }}
  >
    {text}
  </div>
);

const LabelPane: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const enter = ez(t, -7, 3, EASE.decel);
  const op = interpolate(t, [-7, -2], [0, 1], CLAMP);
  const kp = ez(t, -5, 1, EASE.enter);
  const jp = ez(t, -3, 3, EASE.enter);
  const soft = 1 - f;
  const floatY = Math.sin(t * 0.14) * 2;
  const floatR = Math.sin(t * 0.09 + 0.8) * 0.2;
  const sc = 1 + 0.025 * soft;
  const { cur, next, q } = jobAt(t);
  return (
    <div
      style={{
        position: "absolute",
        left: PANE.left,
        top: PANE.top,
        width: PANE.w,
        height: PANE_H,
        opacity: op * (1 - 0.18 * soft),
        transform: `translateY(${(lerp(-18, 0, enter) + floatY).toFixed(2)}px) perspective(1400px) rotateY(5deg) rotate(${floatR.toFixed(3)}deg) scale(${sc.toFixed(4)})`,
        transformOrigin: "50% 50%",
        filter: `blur(${(BLUR_PANE * soft).toFixed(2)}px)`,
      }}
    >
      <div
        style={{
          // See-through CRT pane: dark glass over his footage, a keyline, rolling scanlines and a refresh band.
          position: "absolute",
          inset: 0,
          background: "rgba(10, 12, 16, 0.56)",
          borderRadius: 20,
          boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.28), inset 0 0 28px rgba(0,0,0,0.35), 0 16px 36px rgba(0,0,0,0.34)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.34) 0px, rgba(0,0,0,0.34) 1px, transparent 1px, transparent 4px)",
            backgroundPosition: `0 ${((t + 40) % 4).toFixed(2)}px`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${(((t + 40) * 9) % 160) - 40}%`,
            height: "30%",
            background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
      </div>
      <div style={{ position: "absolute", left: 24, right: 24, top: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: MONO,
            fontSize: TYPE.kicker,
            lineHeight: 1.2,
            opacity: kp,
            transform: `translateY(${((1 - kp) * 8).toFixed(2)}px)`,
          }}
        >
          <span style={{ color: UI.coral, fontWeight: 500, letterSpacing: -0.6 }}>{KICKER}</span>
          <span style={{ color: "rgba(236,233,226,0.7)", fontWeight: 500 }}>{SOURCE}</span>
        </div>
        <div style={{ position: "relative", marginTop: 10, height: TYPE.job * 1.12, opacity: jp, transform: `translateY(${((1 - jp) * 10).toFixed(2)}px)` }}>
          {/* the old job leaves before the new one arrives, so the two never overlap through the blur */}
          {q < 0.55 ? <JobLine text={cur} op={1 - ez(q, 0, 0.55, EASE.inOut)} dy={-12 * ez(q, 0, 0.55, EASE.inOut)} /> : null}
          {q > 0.45 ? <JobLine text={next} op={ez(q, 0.45, 1, EASE.inOut)} dy={12 * (1 - ez(q, 0.45, 1, EASE.decel))} /> : null}
        </div>
      </div>
    </div>
  );
};

export const FocusPull: React.FC<FxProps> = ({ t }) => {
  const f = focusAt(t);
  const z = interpolate(t, KEY_T, ZOOM, { ...CLAMP, easing: CAM_EASE }) * (1 + BREATH * f);
  const dx = DRIFT.x * Math.sin(t * 0.085 + 0.4);
  const dy = DRIFT.y * Math.sin(t * 0.065 + 1.3);
  const tr = traceAt(t);
  return (
    <AbsoluteFill style={{ background: UI.bg, overflow: "hidden" }}>
      {/* the far plane: his footage, racked soft and dimmed when the label is sharp */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${z.toFixed(5)})`,
          transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, filter: `blur(${(BLUR_HIM * f).toFixed(2)}px) brightness(${(1 - DIM_HIM * f).toFixed(4)})` }}>
          <Clip name={CLIP} offset={OFFSET} />
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 54% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.26) 100%)" }} />
      {/* the near plane: the trace and the label pane ride the drift a little more (parallax) */}
      <div style={{ position: "absolute", inset: 0, transform: `translate(${(dx * NEAR).toFixed(2)}px, ${(dy * NEAR).toFixed(2)}px)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Wire t={t} {...tr} />
        </svg>
        <LabelPane t={t} f={f} />
      </div>
      <Caption name={CLIP} t={t} offset={OFFSET} y={YB + 24} size={60} chunk={3} maxWidth={SAFE_IG.w - 40} />
    </AbsoluteFill>
  );
};

export const focuspull: FxDef = {
  id: "focuspull",
  command: "/focus-pull",
  menu: "Focus racks between you and the label",
  clip: "focus",
  Comp: FocusPull,
  thumbT: [12, 24, 40],
};
