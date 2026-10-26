// /word-scope (set 2): his footage full frame. One live scope trace runs under his chin, turns the corner at the left and
// climbs beside his head. Every word he says leaves his mouth as a green wave packet on the line under his chin, runs
// left, rounds the corner and climbs to its landing point, where it resolves into the typed word (phosphor mono with a
// slight RGB split, a coral block caret typing it) on a see-through CRT pane that grows row by row beside him. The words
// ARE the caption: his sentence builds word by word in that column. Claude answers each landing with a small coral swell.
// 2.5D: the pane is angled toward his head (its inner edge recedes) and rides the camera drift more than the footage.
// Camera: hold, one slow push 1.012 to 1.046 anchored on his head (never past 1.07), hold, with a sine drift throughout.
// Timing at 24 fps: inside the result card t 0 to 9, push to full screen 9 to 14, full screen 14 to 30, alive to 48.
// IG safe zone: the pane, the words, the caret and every packet stay inside SAFE_IG (x 60..1000, y 270..1580) at every t,
// including the push, the drift and its parallax. The trace line itself bleeds off the right and top edges.
// Every value is a pure function of t.
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { PH } from "../../../artcraft/theme";
import { CLIPS } from "../../data/clips";
import { Clip, MONO } from "../../kit";
import { CLAMP, EASE, FPS, H, UI, W, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { voiceEnv } from "../shutterstrike";

const CLIP = "intimidating" as const;
/** The clip starts this many frames into the take, so he is already saying "And for the" on the first frame, the first
 *  word lands inside the card and the next ones during the push to full screen. */
const OFFSET = 16;

// ---- camera (footage) and the overlay's parallax
const ORIGIN = { x: 690, y: 780 };
const KEY_T = [0, 10, 30, 48];
const ZOOM = [1.012, 1.012, 1.042, 1.046];
const CAM_EASE = Easing.inOut(Easing.cubic);
const DRIFT = { x: 5, y: 3 };
/** The overlay (trace, pane, words) sits nearer the lens: it rides the drift 1.25x and takes 40% of the push. */
const NEAR = 1.25;
const OVER_PUSH = 0.4;

// ---- the trace: from off the right edge, left under his chin, round the corner, up beside his head and off the top
const TX = 142;
const TY = 1166;
const R = 90;
const TOP = -60;
const RIGHT = W + 60;
type Pt = { x: number; y: number };
type Path = { pts: Pt[]; s: number[]; L: number };
const cubicAt = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt => {
  const a = (1 - u) ** 3;
  const b = 3 * (1 - u) ** 2 * u;
  const c = 3 * (1 - u) * u * u;
  const d = u ** 3;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
};
const PATH: Path = (() => {
  const pts: Pt[] = [];
  const line = (a: Pt, b: Pt) => {
    const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6));
    for (let i = pts.length ? 1 : 0; i <= n; i++) pts.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
  };
  line({ x: RIGHT, y: TY }, { x: TX + R, y: TY });
  // quarter circle as a cubic (k = 0.5523)
  const k = 0.5523 * R;
  for (let i = 1; i <= 40; i++) pts.push(cubicAt({ x: TX + R, y: TY }, { x: TX + R - k, y: TY }, { x: TX, y: TY - R + k }, { x: TX, y: TY - R }, i / 40));
  line({ x: TX, y: TY - R }, { x: TX, y: TOP });
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, s, L: s[s.length - 1] };
})();
const pathAt = (at: number) => {
  const v = Math.max(0, Math.min(PATH.L, at));
  let lo = 0;
  let hi = PATH.s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (PATH.s[mid] <= v) lo = mid;
    else hi = mid;
  }
  const a = PATH.pts[lo];
  const b = PATH.pts[hi];
  const f = (v - PATH.s[lo]) / (PATH.s[hi] - PATH.s[lo] || 1);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, nx: -(b.y - a.y) / len, ny: (b.x - a.x) / len };
};
/** Arc length of the corner's end (the vertical run starts here) and of a point at height y on the vertical run. */
const S_UP = PATH.L - (TY - R - TOP);
const sAtY = (y: number) => S_UP + (TY - R - y);
/** His voice: on the line right under his mouth. */
const VOICE_X = 660;
const S_VOICE = RIGHT - VOICE_X;

// ---- the pane and its rows (overlay px)
const FONT = 56;
const CHAR_W = FONT * 0.6; // JetBrains Mono advance
const PANE = { left: 162, top: 324, pad: 16, w: 334 } as const;
const ROW_H = 66;
const PITCH = 94;
/** The words of the take the column builds: "And for the video editors watching this," (the rest of the line is said
 *  after the effect has scrolled away, so the column ends on "this," and the ending grid's thumbs read whole). */
const ROWS = 7;
const rowTop = (i: number) => PANE.top + PANE.pad + i * PITCH;
const rowMid = (i: number) => rowTop(i) + ROW_H / 2;

type WordPlan = { w: string; say: number; land: number; s: number; travel: number };
/** Each word leaves his mouth when he says it and lands D frames later (longer climbs take a little longer). */
const PLAN: WordPlan[] = CLIPS[CLIP].words.slice(0, ROWS).map((wd, i) => {
  const say = wd.s * FPS - OFFSET;
  const s = sAtY(rowMid(i));
  const travel = 7 + (s - S_VOICE) / 190;
  return { w: wd.w, say, land: say + travel, s, travel };
});

const gauss = (x: number, c: number, sg: number) => Math.exp(-((x - c) ** 2) / (2 * sg * sg));
type Bump = { s: number; amp: number; sigma: number; rgb: string };

/** The bumps on the line at t: his voice under his chin, the word packets in flight, Claude's coral answer on landing. */
const bumpsAt = (t: number): Bump[] => {
  const b: Bump[] = [];
  const v = voiceEnv(CLIP, t + OFFSET);
  b.push({ s: S_VOICE, amp: 3 + v * (15 + 4 * Math.sin(t * 0.61) + 2.5 * Math.sin(t * 1.37)), sigma: 44, rgb: PH.userRgb });
  for (const p of PLAN) {
    if (t < p.say - 1 || t > p.land + 5) continue;
    const u = ez(t, p.say, p.land, EASE.inOut);
    const env = interpolate(t, [p.say - 1, p.say + 2, p.land - 1, p.land + 4], [0, 1, 1, 0], CLAMP);
    b.push({ s: lerp(S_VOICE - 10, p.s, u), amp: 15 * env, sigma: 20, rgb: PH.userRgb });
  }
  for (const p of PLAN) {
    const ans = interpolate(t, [p.land - 1, p.land + 2, p.land + 14], [0, 1, 0], { ...CLAMP, easing: EASE.decel });
    if (ans > 0.01) b.push({ s: p.s, amp: 9 * ans, sigma: 26, rgb: PH.claudeRgb });
  }
  return b;
};

const TRACE_INK = "rgba(243,241,236,0.55)";

/** Phosphor persistence: the stretch of line a word packet has just run along stays lit green, fading toward its tail. */
const TRAIL = 280;
const trailsAt = (t: number) =>
  PLAN.flatMap((p) => {
    if (t < p.say || t > p.land + 6) return [];
    const head = lerp(S_VOICE - 10, p.s, ez(t, p.say, p.land, EASE.inOut));
    const fade = interpolate(t, [p.say, p.say + 2, p.land, p.land + 6], [0, 1, 1, 0], CLAMP);
    return [{ head, tail: Math.max(S_VOICE - 10, head - TRAIL), fade }];
  });

/** The live line along PATH, the colored packets drawn over it. Same carrier as kit/Scope, offset along the normal. */
const Wire: React.FC<{ t: number; bumps: Bump[] }> = ({ t, bumps }) => {
  const off = (s: number) => {
    const carrier = 0.62 * Math.sin(s * 0.085 - t * 0.42) + 0.38 * Math.sin(s * 0.21 + t * 0.31);
    const amp = bumps.reduce((a, bp) => a + bp.amp * gauss(s, bp.s, bp.sigma), 0);
    return carrier * amp + 1.4 * Math.sin(s * 0.05 + t * 0.07);
  };
  const pt = (s: number) => {
    const p = pathAt(s);
    const o = off(s);
    return `${(p.x + p.nx * o).toFixed(1)},${(p.y + p.ny * o).toFixed(1)}`;
  };
  const line = (a: number, c: number) => {
    const out: string[] = [];
    for (let s = a; s < c; s += 3) out.push(pt(s));
    out.push(pt(c));
    return out.join(" ");
  };
  return (
    <g>
      <polyline points={line(0, PATH.L)} fill="none" stroke={TRACE_INK} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {trailsAt(t).map((tr, i) => {
        const n = 7;
        const step = (tr.head - tr.tail) / n;
        if (step < 1) return null;
        return Array.from({ length: n }, (_, k) => (
          <polyline
            key={`${i}-${k}`}
            points={line(tr.tail + k * step, tr.tail + (k + 1) * step + 1)}
            fill="none"
            stroke={`rgba(${PH.userRgb},${(tr.fade * 0.55 * ((k + 1) / n) ** 1.6).toFixed(3)})`}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ));
      })}
      {bumps.map((bp, i) => {
        if (bp.amp < 0.6) return null;
        const a = Math.max(0, bp.s - 2.6 * bp.sigma);
        const c = Math.min(PATH.L, bp.s + 2.6 * bp.sigma);
        if (c - a < 3) return null;
        return (
          <polyline
            key={i}
            points={line(a, c)}
            fill="none"
            stroke={`rgba(${bp.rgb},${Math.min(1, 0.45 + bp.amp / 24).toFixed(3)})`}
            strokeWidth={3.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

/** Graticule ticks on the climb: one per row, reaching out to the pane when its word lands. */
const Ticks: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {PLAN.map((p, i) => {
      const y = rowMid(i);
      const reach = ez(t, p.land - 1, p.land + 5, EASE.decel);
      return (
        <g key={i}>
          <line x1={TX - 7} x2={TX + 7} y1={y} y2={y} stroke="rgba(243,241,236,0.38)" strokeWidth={2} />
          {reach > 0.01 ? <line x1={TX + 7} x2={TX + 7 + (PANE.left + 2 - TX - 7) * reach} y1={y} y2={y} stroke="rgba(243,241,236,0.62)" strokeWidth={2} /> : null}
        </g>
      );
    })}
  </g>
);

/** One typed row: the characters arrive left to right behind a coral block caret. */
const Row: React.FC<{ p: WordPlan; i: number; t: number; dim: number; nextAt: number }> = ({ p, i, t, dim, nextAt }) => {
  const start = p.land - 1;
  if (t < start) return null;
  const chars = p.w.split("");
  const per = 0.75;
  const typed = (t - start) / per;
  const caretX = Math.min(chars.length, Math.max(0, typed)) * CHAR_W;
  // The caret appears with the landing, types the word, then breathes until the next word starts typing, then fades.
  const caretIn = ez(t, start, start + 2, EASE.enter);
  // One caret at a time: the old one is gone by the time the next word's first glyph is half in.
  const caretOut = Number.isFinite(nextAt) ? 1 - ez(t, nextAt - 1, nextAt + 1.5, EASE.inOut) : 1;
  const breathe = t > start + chars.length * per ? 0.55 + 0.45 * Math.cos((t - start - chars.length * per) * 0.42) : 1;
  const caretOp = caretIn * caretOut * breathe;
  return (
    <div
      style={{
        position: "absolute",
        left: PANE.pad,
        top: rowTop(i) - PANE.top,
        height: ROW_H,
        display: "flex",
        alignItems: "center",
        opacity: 1 - 0.08 * dim,
      }}
    >
      <div style={{ position: "relative", height: FONT, fontFamily: MONO, fontWeight: 700, fontSize: FONT, lineHeight: `${FONT}px`, whiteSpace: "pre" }}>
        {chars.map((ch, j) => {
          const a = start + j * per;
          const c = ez(t, a, a + 2.5, EASE.enter);
          if (c <= 0) return null;
          return (
            <span
              key={j}
              style={{
                position: "absolute",
                left: j * CHAR_W,
                top: 0,
                color: UI.screenInk,
                opacity: c,
                // Phosphor type: the slight RGB split of the tube, hard offsets (no glow), widest as the glyph strikes.
                textShadow: `${(1.4 + 1.8 * (1 - c)).toFixed(2)}px 0 0 rgba(255,70,50,0.55), ${(-1.4 - 1.8 * (1 - c)).toFixed(2)}px 0 0 rgba(50,150,255,0.55), 0 2px 10px rgba(0,0,0,0.55)`,
                transform: `translateY(${((1 - c) * 6).toFixed(2)}px)`,
              }}
            >
              {ch}
            </span>
          );
        })}
        {caretOp > 0.01 ? (
          <div
            style={{
              position: "absolute",
              left: caretX + 4,
              top: 6,
              width: CHAR_W * 0.62,
              height: FONT - 10,
              background: UI.coral,
              opacity: caretOp,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

/** The see-through CRT pane: grows down row by row as the words land; scanlines roll; angled toward his head. */
const Pane: React.FC<{ t: number }> = ({ t }) => {
  const first = PLAN[0].land;
  const appear = ez(t, first - 5, first + 0.5, EASE.enter);
  if (appear <= 0) return null;
  const open = PLAN.map((p) => ez(t, p.land - 3, p.land + 4, EASE.decel));
  const h = PANE.pad * 2 + 10 + open[0] * (ROW_H - 10) + open.slice(1).reduce((a, o) => a + o * PITCH, 0);
  const landed = PLAN.map((p) => t >= p.land - 1);
  return (
    <div
      style={{
        position: "absolute",
        left: PANE.left,
        top: PANE.top,
        width: PANE.w,
        height: h,
        opacity: appear,
        transform: `perspective(1500px) rotateY(13deg) translateY(${((1 - appear) * -10).toFixed(2)}px)`,
        // A fixed origin (not 50% of the growing height), so rows that already landed never shear as the pane grows.
        transformOrigin: "0px 378px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          background: "rgba(10, 12, 16, 0.5)",
          backdropFilter: "blur(5px) saturate(0.85)",
          WebkitBackdropFilter: "blur(5px) saturate(0.85)",
          boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.24), inset 0 0 26px rgba(0,0,0,0.35), 0 16px 34px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.32) 0px, rgba(0,0,0,0.32) 1px, transparent 1px, transparent 4px)",
            backgroundPosition: `0 ${(t % 4).toFixed(2)}px`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${((t * 6) % 170) - 45}%`,
            height: "26%",
            background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.045) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
      </div>
      {PLAN.map((p, i) => {
        if (!landed[i]) return null;
        const dim = PLAN.slice(i + 1).reduce((a, q) => a + ez(t, q.land, q.land + 6, EASE.inOut), 0);
        const nextAt = i + 1 < PLAN.length ? PLAN[i + 1].land - 1 : Number.POSITIVE_INFINITY;
        return <Row key={i} p={p} i={i} t={t} dim={Math.min(dim, 3)} nextAt={nextAt} />;
      })}
    </div>
  );
};

export const WordScope: React.FC<FxProps> = ({ t }) => {
  const z = interpolate(t, KEY_T, ZOOM, { ...CLAMP, easing: CAM_EASE });
  const dx = DRIFT.x * Math.sin(t * 0.085 + 0.4);
  const dy = DRIFT.y * Math.sin(t * 0.065 + 1.3);
  const oz = 1 + (z - 1) * OVER_PUSH;
  const bumps = bumpsAt(t);
  return (
    <AbsoluteFill style={{ background: UI.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${z.toFixed(5)})`,
          transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
        }}
      >
        <Clip name={CLIP} offset={OFFSET} />
      </div>
      {/* the tube's falloff: a vignette, a little deeper on the left where the words are typed */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.34) 0px, rgba(0,0,0,0.12) 420px, rgba(0,0,0,0) 620px), radial-gradient(ellipse at 60% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.26) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${(dx * NEAR).toFixed(2)}px, ${(dy * NEAR).toFixed(2)}px) scale(${oz.toFixed(5)})`,
          transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
        }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Wire t={t} bumps={bumps} />
          <Ticks t={t} />
        </svg>
        <Pane t={t} />
      </div>
    </AbsoluteFill>
  );
};

export const wordscope: FxDef = {
  id: "wordscope",
  command: "/word-scope",
  menu: "Your words arrive as waves on the line",
  clip: "intimidating",
  Comp: WordScope,
  thumbT: [16, 28, 40],
};
