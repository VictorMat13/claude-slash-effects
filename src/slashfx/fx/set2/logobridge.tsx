// /logo-bridge (set 2, builder S2-A). Victor full frame, face centered (clip "hook": "DaVinci Resolve lets you edit with
// AI right inside the app."). The official Claude mark and the official Resolve icon sit on a slow 2.5D orbit around his
// head, left and right of it (never over his face), each on its own small dark CRT disc with a keyline. As the ring turns,
// Resolve starts in front (bigger, lower, sharp) and swings back, Claude starts behind (smaller, higher, a little soft) and
// comes forward, so the two trade depth over the shot.
// One live scope trace leaves each disc and arcs over his hair; at the top of the arc a small see-through CRT pane carries
// MCP.phrase in mono with MCP.expansion under it (verbatim, facts.ts). Coral packets leave Claude, green packets leave
// Resolve, and they cross under the pane exactly on his beats ("Resolve", "lets", "edit": the word onsets in clips.ts), then
// run on into the other disc, which answers with one soft ring. Each disc speaks up on the line as its packet leaves; the
// whole carrier hums with his real voice envelope.
// Camera: hold, one push 1.012 to 1.05 anchored on his head (never past 1.07), hold; a small sine drift throughout, the
// overlay plane riding it a little more than the footage (parallax). Caption: his words, white, under his chin.
// Safe zone: discs, pane, packets and caption stay inside SAFE_IG (x 60..1000, y 270..1580) at every t, including the push,
// the drift and the orbit's front-most frame. Timing at 24 fps: card t 0..9, push 9..14, full screen 14..42, alive to 48.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { PH } from "../../../artcraft/theme";
import { CLIPS } from "../../data/clips";
import { LOGOS, MCP } from "../../data/facts";
import { Caption, Clip, MONO } from "../../kit";
import { CLAMP, EASE, FPS, H, SAFE_IG, UI, W, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { voiceEnv } from "../shutterstrike";

// ---------------------------------------------------------------- camera (one keyframe timeline: hold, push, hold)
/** Push anchor: between his eyes and his brow, so the push grows him in place. */
const ANCHOR = { x: 620, y: 700 };
const KEY_T = [0, 10, 28, 48];
const ZOOM = [1.012, 1.012, 1.05, 1.05];
const zoomAt = (t: number) => interpolate(t, KEY_T, ZOOM, { ...CLAMP, easing: EASE.travel });
/** Drift (px). At zoom 1.012 the footage overscans at least 5 px on every side of the anchor, so no edge ever shows. */
const driftAt = (t: number) => ({ x: 4 * Math.sin(t * 0.08 + 0.3), y: 3 * Math.sin(t * 0.06 + 1.1) });
/** The orbit and its trace sit a little nearer the lens than his face: they ride the drift more (parallax). */
const NEAR = 1.25;

// ---------------------------------------------------------------- the orbit (world px = footage px before the push)
/** Head center of this take (x about 340..830, hair top about 500, chin about 1070..1110). */
const HEAD_X = 580;
const A_MAX = 26;
/** Ring angle in degrees: eased across the whole shot so it is still turning at t 48. */
const orbitA = (t: number) => interpolate(t, [-10, 58], [A_MAX, -A_MAX], { ...CLAMP, easing: EASE.inOut });
const R0 = 60; // disc radius at depth 0
type Side = "claude" | "resolve";
type Pose = { x: number; y: number; s: number; d: number; blur: number; dim: number; ry: number };
/** d is depth, -1 (behind his head) to 1 (in front). Behind: smaller, higher, softer, dimmer. */
const poseAt = (side: Side, t: number): Pose => {
  const a = (orbitA(t) * Math.PI) / 180;
  const d0 = Math.sin(a) / Math.sin((A_MAX * Math.PI) / 180);
  const back = (d: number) => Math.max(0, -d);
  if (side === "claude") {
    const d = -d0;
    return {
      x: HEAD_X - 350 * Math.cos(a),
      y: 650 + 40 * d + 3 * Math.sin(t * 0.11),
      s: 1 + 0.11 * d,
      d,
      blur: 1.8 * back(d),
      dim: 1 - 0.22 * back(d),
      ry: -10 * d0,
    };
  }
  const d = d0;
  return {
    x: HEAD_X + 315 * Math.cos(a),
    y: 585 + 35 * d + 3 * Math.sin(t * 0.11 + 2.1),
    s: 1 + 0.11 * d,
    d,
    blur: 1.8 * back(d),
    dim: 1 - 0.22 * back(d),
    ry: -10 * d0,
  };
};

// ---------------------------------------------------------------- the trace as a path (lines and cubics, by arc length)
type Pt = { x: number; y: number };
type Seg = ["L", Pt, Pt] | ["C", Pt, Pt, Pt, Pt];
type Path = { pts: Pt[]; s: number[]; L: number; marks: number[] };
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
  const ends: number[] = [];
  for (const seg of segs) {
    if (seg[0] === "L") {
      const [, a, b] = seg;
      const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6));
      for (let i = pts.length ? 1 : 0; i <= n; i++) pts.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
    } else {
      const [, p0, p1, p2, p3] = seg;
      for (let i = pts.length ? 1 : 0; i <= 90; i++) pts.push(cubicAt(p0, p1, p2, p3, i / 90));
    }
    ends.push(pts.length - 1);
  }
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, s, L: s[s.length - 1], marks: ends.map((i) => s[i]) };
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

/** The pane at the top of the arc (world px) and the flat run of the trace under it. */
const PANE = { cx: 585, top: 326, w: 404, h: 98 } as const;
const AY = 452;
const HALF = 150;
/** Left cubic from the Claude disc center up over his hair, the flat run under the pane, the right cubic down into Resolve.
 *  Both ends start under their discs, so the line leaves each rim. marks[0] is where the flat run starts. */
const traceAt = (t: number) => {
  const c = poseAt("claude", t);
  const r = poseAt("resolve", t);
  const path = buildPath([
    ["C", { x: c.x, y: c.y }, { x: c.x + 8, y: AY + 46 }, { x: PANE.cx - HALF - 120, y: AY }, { x: PANE.cx - HALF, y: AY }],
    ["L", { x: PANE.cx - HALF, y: AY }, { x: PANE.cx + HALF, y: AY }],
    ["C", { x: PANE.cx + HALF, y: AY }, { x: PANE.cx + HALF + 100, y: AY }, { x: r.x - 6, y: AY + 46 }, { x: r.x, y: r.y }],
  ]);
  return { path, mid: path.marks[0] + HALF, c, r };
};

// ---------------------------------------------------------------- beats and packets
/** His real word onsets (clips.ts), in effect frames: the packets cross under the pane on these (t 15, 25, 32.2). The reel
 *  mounts the effect for t 0..41 and scrolls it out from t 32, so all three land while it is on screen, two in the hold. */
const onset = (w: string) => {
  const hit = CLIPS.hook.words.find((x) => x.w === w);
  return hit ? hit.s * FPS : 0;
};
const BEATS = [onset("Resolve"), onset("lets"), onset("edit")];
/** Frames from a disc to the crossing (and on from the crossing to the other disc). */
const HALF_TRIP = 11;
const gauss = (x: number, c: number, sg: number) => Math.exp(-((x - c) ** 2) / (2 * sg * sg));
/** Monotone remap of an eased 0..1 so that 0.5 lands on arc fraction m (the crossing), with no speed jump. */
const through = (u: number, m: number) => u + (m - 0.5) * Math.sin(Math.PI * u);

const bumpsAt = (t: number, L: number, mid: number) => {
  const coral = PH.claudeRgb;
  const green = PH.userRgb;
  const bumps: WireBump[] = [];
  let speakC = 0;
  let speakR = 0;
  BEATS.forEach((at, i) => {
    const t0 = at - HALF_TRIP;
    const t1 = at + HALF_TRIP;
    speakC = Math.max(speakC, interpolate(t, [t0 - 6, t0, t0 + 9], [0, 1, 0], CLAMP));
    speakR = Math.max(speakR, interpolate(t, [t0 - 6, t0, t0 + 9], [0, 1, 0], CLAMP));
    if (t < t0 - 1 || t > t1 + 1) return;
    const u = ez(t, t0, t1, EASE.inOut);
    const env = interpolate(t, [t0, t0 + 3, t1 - 3, t1], [0, 1, 1, 0], CLAMP);
    const wob = 0.92 + 0.08 * Math.sin(t * 0.7 + i);
    bumps.push({ s: L * through(u, mid / L), amp: 19 * env * wob, sigma: 30, rgb: coral });
    bumps.push({ s: L - L * through(u, 1 - mid / L), amp: 19 * env * wob, sigma: 30, rgb: green });
  });
  // Each mark keeps a quiet voice just outside its rim and speaks up as its packet leaves.
  bumps.push({ s: 74, amp: 3.5 + 1.5 * Math.sin(t * 0.23) + 11 * speakC, sigma: 30, rgb: coral });
  bumps.push({ s: L - 74, amp: 3.5 + 1.5 * Math.sin(t * 0.23 + 1.9) + 11 * speakR, sigma: 30, rgb: green });
  return { bumps, speakC, speakR };
};

/** The trace between arc lengths, with its packets drawn as colored wave segments. Same carrier as kit/Scope. */
const Wire: React.FC<{ path: Path; t: number; ranges: [number, number][]; bumps: WireBump[]; hum: number }> = ({ path, t, ranges, bumps, hum }) => {
  const off = (s: number) => {
    const carrier = 0.72 * Math.sin(s * 0.1 - t * 0.42) + 0.28 * Math.sin(s * 0.16 + t * 0.31);
    const amp = bumps.reduce((a, b) => a + b.amp * gauss(s, b.s, b.sigma), 0);
    return carrier * amp + hum * Math.sin(s * 0.05 + t * 0.07);
  };
  const pt = (s: number) => {
    const p = pathAt(path, s);
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
      {ranges.map(([a, b], k) =>
        b - a < 2 ? null : (
          <polyline key={`l${k}`} points={line(a, b)} fill="none" stroke="rgba(243,241,236,0.58)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        ),
      )}
      {bumps.map((b, i) => {
        if (b.amp < 0.6) return null;
        return ranges.map(([r0, r1], k) => {
          const a = Math.max(r0, b.s - 2.6 * b.sigma);
          const c = Math.min(r1, b.s + 2.6 * b.sigma);
          if (c - a < 3) return null;
          return (
            <polyline
              key={`b${i}-${k}`}
              points={line(a, c)}
              fill="none"
              stroke={`rgba(${b.rgb},${Math.min(1, 0.42 + b.amp / 24).toFixed(3)})`}
              strokeWidth={3.6}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        });
      })}
    </g>
  );
};

// ---------------------------------------------------------------- the discs
/** One soft ring as a packet arrives (the mark answers), in the packet's color. */
const Ring: React.FC<{ p: Pose; at: number; t: number; rgb: string }> = ({ p, at, t, rgb }) => {
  // grows only 12 px: the Resolve disc sits near the safe right edge at the push, and the ring must stay inside it
  const k = (t - at) / 15;
  if (k < 0 || k > 1) return null;
  const r = R0 * p.s + 12 * EASE.decel(k);
  const op = 0.65 * ez(t, at, at + 4, EASE.enter) * (1 - k);
  return (
    <div
      style={{
        position: "absolute",
        left: p.x - r,
        top: p.y - r,
        width: 2 * r,
        height: 2 * r,
        boxSizing: "border-box",
        borderRadius: "50%",
        border: `2.5px solid rgba(${rgb},${op.toFixed(3)})`,
      }}
    />
  );
};

/** A small dark CRT disc with a keyline, the official mark inside, rolling scanlines and a refresh band. */
const Disc: React.FC<{ p: Pose; t: number; side: Side; talk: number; inP: number }> = ({ p, t, side, talk, inP }) => {
  const rgb = side === "claude" ? PH.claudeRgb : PH.userRgb;
  const src = side === "claude" ? LOGOS.claude : LOGOS.resolve;
  const logo = side === "claude" ? 0.56 : 0.66;
  const size = 2 * R0;
  const lift = lerp(10, 0, inP);
  return (
    <div
      style={{
        position: "absolute",
        left: p.x - R0,
        top: p.y - R0,
        width: size,
        height: size,
        opacity: inP,
        transform: `translateY(${lift.toFixed(2)}px) perspective(900px) rotateY(${p.ry.toFixed(2)}deg) scale(${(p.s * lerp(0.9, 1, inP)).toFixed(4)})`,
        filter: `${p.blur > 0.05 ? `blur(${p.blur.toFixed(2)}px) ` : ""}brightness(${p.dim.toFixed(3)})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          background: "radial-gradient(circle at 50% 40%, #171A20 0%, #0B0C10 62%, #060709 100%)",
          boxShadow: `inset 0 0 0 2.5px rgba(${rgb},${(0.5 + 0.35 * talk).toFixed(3)}), inset 0 0 22px rgba(0,0,0,0.75), 0 ${(14 + 6 * p.d).toFixed(1)}px ${(26 + 8 * p.d).toFixed(1)}px rgba(0,0,0,0.5)`,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            left: (size * (1 - logo)) / 2,
            top: (size * (1 - logo)) / 2,
            width: size * logo,
            height: size * logo,
            display: "block",
            transform: `scale(${(1 + 0.03 * talk).toFixed(4)})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.32) 0px, rgba(0,0,0,0.32) 1px, transparent 1px, transparent 4px)",
            backgroundPosition: `0 ${(t % 4).toFixed(0)}px`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${(((t * 6 + (side === "claude" ? 0 : 70)) % 170) - 45).toFixed(1)}%`,
            height: "30%",
            background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- the MCP pane at the top of the arc
const PHRASE = 34;
const EXPAN = 28;
const typed = (s: string, p: number) => s.slice(0, Math.round(s.length * p));
const McpPane: React.FC<{ t: number; flash: number }> = ({ t, flash }) => {
  // powers on out of the trace (scaleY from its bottom edge), then the phrase and the expansion type in
  const on = ez(t, 2, 9, EASE.decel);
  const p1 = ez(t, 7, 14, EASE.inOut);
  const p2 = ez(t, 11, 21, EASE.inOut);
  const caret = p2 < 1 || Math.floor(t / 6) % 2 === 0;
  const floatY = 2 * Math.sin(t * 0.13 + 0.6) - 3 * flash;
  const split = "1px 0 0 rgba(255,70,50,0.45), -1px 0 0 rgba(60,150,255,0.45)";
  return (
    <div
      style={{
        position: "absolute",
        left: PANE.cx - PANE.w / 2,
        top: PANE.top,
        width: PANE.w,
        height: PANE.h,
        transformOrigin: "50% 100%",
        transform: `translateY(${floatY.toFixed(2)}px) perspective(1200px) rotateX(${lerp(14, 5, on).toFixed(2)}deg) scaleY(${lerp(0.04, 1, on).toFixed(4)})`,
        opacity: interpolate(on, [0, 0.25], [0, 1], CLAMP),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          overflow: "hidden",
          background: "rgba(10,12,16,0.62)",
          backdropFilter: "blur(6px) saturate(0.85)",
          WebkitBackdropFilter: "blur(6px) saturate(0.85)",
          boxShadow: `inset 0 0 0 1.5px rgba(243,241,236,${(0.26 + 0.4 * flash).toFixed(3)}), inset 0 0 26px rgba(0,0,0,0.4), 0 14px 30px rgba(0,0,0,0.35)`,
          filter: on < 0.999 ? `brightness(${(1 + 1.4 * (1 - on)).toFixed(3)})` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 4px)",
            backgroundPosition: `0 ${(t % 4).toFixed(0)}px`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${(((t * 7) % 170) - 45).toFixed(1)}%`,
            height: "34%",
            background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        {flash > 0.01 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 16,
              padding: 2.5,
              background: `linear-gradient(90deg, rgba(${PH.claudeRgb},${(0.95 * flash).toFixed(3)}) 0%, rgba(${PH.claudeRgb},${(0.6 * flash).toFixed(3)}) 42%, rgba(${PH.userRgb},${(0.6 * flash).toFixed(3)}) 58%, rgba(${PH.userRgb},${(0.95 * flash).toFixed(3)}) 100%)`,
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        ) : null}
        <div style={{ position: "absolute", left: 0, right: 0, top: 12, textAlign: "center", whiteSpace: "nowrap" }}>
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: PHRASE,
              lineHeight: 1.12,
              letterSpacing: -0.5,
              color: UI.screenInk,
              opacity: 0.9 + 0.1 * flash,
              textShadow: split,
            }}
          >
            {typed(MCP.phrase, p1)}
            <span style={{ opacity: 0 }}>{MCP.phrase.slice(typed(MCP.phrase, p1).length)}</span>
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: EXPAN,
              lineHeight: 1.12,
              letterSpacing: -0.7,
              color: "rgba(236,233,226,0.72)",
              textShadow: split,
            }}
          >
            {typed(MCP.expansion, p2)}
            <span style={{ display: "inline-block", width: 0, position: "relative" }}>
              {p1 > 0.99 && caret ? (
                <span style={{ position: "absolute", left: 3, top: 3, width: 13, height: EXPAN - 4, background: UI.coral, opacity: 0.9 }} />
              ) : null}
            </span>
            <span style={{ opacity: 0 }}>{MCP.expansion.slice(typed(MCP.expansion, p2).length)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- the scene
/** His words under his chin (chin about 1110 at the push), one line, white. */
const CAPTION_Y = 1160;

export const LogoBridge: React.FC<FxProps> = ({ t }) => {
  const z = zoomAt(t);
  const dr = driftAt(t);
  const { path, mid, c, r } = traceAt(t);
  const L = path.L;
  // The line is laid from both rims toward the crossing point, already running on the first frame.
  const lay = ez(t, -8, 6, EASE.inOut);
  const ranges: [number, number][] =
    lay > 0.999 ? [[0, L]] : [[0, mid * lay], [L - (L - mid) * lay, L]];
  const { bumps, speakC: talkC, speakR: talkR } = bumpsAt(t, L, mid);
  const hum = 1.2 + 2.2 * voiceEnv("hook", t);
  const flash = Math.max(0, ...BEATS.map((at) => ez(t, at - 5, at, EASE.enter) * (1 - ez(t, at, at + 12, EASE.decel))));
  const inC = ez(t, -8, 2, EASE.enter);
  const inR = ez(t, -5, 5, EASE.enter);
  const cam = (k: number) =>
    `translate(${(dr.x * k).toFixed(2)}px, ${(dr.y * k).toFixed(2)}px) scale(${z.toFixed(5)})`;
  return (
    <AbsoluteFill style={{ background: UI.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: cam(1), transformOrigin: `${ANCHOR.x}px ${ANCHOR.y}px` }}>
        <Clip name="hook" />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 54% 36%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.26) 100%)" }} />
      <AbsoluteFill style={{ transform: cam(NEAR), transformOrigin: `${ANCHOR.x}px ${ANCHOR.y}px` }}>
        <McpPane t={t} flash={flash} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Wire path={path} t={t} ranges={ranges} bumps={bumps} hum={hum} />
        </svg>
        {BEATS.map((at, i) => (
          <React.Fragment key={i}>
            <Ring p={r} at={at + HALF_TRIP} t={t} rgb={PH.claudeRgb} />
            <Ring p={c} at={at + HALF_TRIP} t={t} rgb={PH.userRgb} />
          </React.Fragment>
        ))}
        {/* the disc behind his head is drawn first, so the front one passes over it if they ever line up */}
        {c.d < r.d ? (
          <>
            <Disc p={c} t={t} side="claude" talk={talkC} inP={inC} />
            <Disc p={r} t={t} side="resolve" talk={talkR} inP={inR} />
          </>
        ) : (
          <>
            <Disc p={r} t={t} side="resolve" talk={talkR} inP={inR} />
            <Disc p={c} t={t} side="claude" talk={talkC} inP={inC} />
          </>
        )}
      </AbsoluteFill>
      <Caption name="hook" t={t} y={CAPTION_Y} size={62} chunk={3} maxWidth={SAFE_IG.w - 40} />
    </AbsoluteFill>
  );
};

export const logobridge: FxDef = {
  id: "logobridge",
  command: "/logo-bridge",
  menu: "Two logos, one line between them",
  clip: "hook",
  Comp: LogoBridge,
  thumbT: [15, 25, 33],
};
