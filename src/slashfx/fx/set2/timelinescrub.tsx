// /timeline-scrub (set 2): split frame. Top half is a CRT screen in 2.5D: far back, the real Resolve 21 Edit page (press
// shot, its timeline behind ours, blurred by distance, slow eased pan); then the grid; then a timeline with the real
// Resolve track names V2, V1, A1 down its left side, a ruler, and a coral playhead with its timecode above it. Victor's
// voice is the green wave on the live scope trace under the timeline. Each word he says leaves his voice as a green
// packet and runs along the trace to the playhead; when it arrives a clip block (a still of his take) snaps onto V1 at
// the playhead, eased, its linked audio opens on A1, and the playhead scrubs across the block for as long as the word
// lasts while A1 fills with his waveform behind it. The timecode counts with the scrub. Claude answers each block with
// a coral swell at the playhead's foot. His spoken words sit under the trace in coral mono, three at a time.
// One camera: tight on the playhead, follows it right, pulls out to the whole timeline, holds.
// Bottom half is Victor's clip "hours", his whole head inside the safe rect.
// IG safe zone: the timecode, track headers, blocks, packets and words stay inside SAFE_IG (x 60..1000, y 270..1580; above
// the split y 270..960) at every t, including the camera travel and drift; his whole head stays inside it too. The lanes, the ruler, the grid, the far plate and
// the white trace are the screen itself and bleed to the frame edge.
// Every value is a pure function of t.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { CLIPS } from "../../data/clips";
import { SHOTS, TRACK_NAMES } from "../../data/facts";
import { CRT, MONO } from "../../kit";
import { CLAMP, EASE, FPS, UI, W, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { GridLayer, LowerClip, Plate, SPLIT, TRACE_INK, camAt, layerStyle, toScreen, voiceEnv, type CamKeys } from "../shutterstrike";

const CLIP = "hours" as const;
/** The take starts this many frames in, so he is already saying "These" on the first frame. */
const OFFSET = 12;
/** Frames a word's packet takes from his voice to the playhead: the block snaps when it arrives. */
const LAG = 7;

// ---- the timeline (world px on the 1080 x 960 screen, the subject plane)
const HEAD = { l: 140, r: 258 } as const;
const LANE_L = 270;
/** The lanes and the ruler run off the right edge of the screen (they are the screen, not a box). */
const LANE_R = 1600;
const TC = { top: 302, h: 50, w: 252, font: 34 } as const;
const RULER = { top: 362, h: 28 } as const;
const LANES = [
  { top: 398, h: 62 },
  { top: 468, h: 124 },
  { top: 600, h: 68 },
] as const;
const V1 = LANES[1];
const A1 = LANES[2];
const TRACE_Y = 724;
const VOICE_X = 200;

/** Clip blocks: one per spoken word, as long as the word (300 px per second, at least 70 px), end to end from X0. */
const X0 = 272;
const PPS = 300;
const MINW = 70;
type Block = { w: string; s: number; e: number; x0: number; x1: number; T0: number; T1: number; say: number };
const BLOCKS: Block[] = (() => {
  let x = X0;
  return CLIPS[CLIP].words.map((wd) => {
    const width = Math.max(MINW, (wd.e - wd.s) * PPS);
    const b = { w: wd.w, s: wd.s, e: wd.e, x0: x, x1: x + width, say: wd.s * FPS - OFFSET, T0: wd.s * FPS - OFFSET + LAG, T1: wd.e * FPS - OFFSET + LAG };
    x += width;
    return b;
  });
})();
const S0 = BLOCKS[0].s;

/** The playhead scrubs through one curve: linear through every block edge (it reaches a block's left edge when that
 *  word's packet arrives and its right edge when the word ends; the words are back to back), then a box average over
 *  t - 2 .. t + 2 rounds every corner. An average of a non-decreasing curve never reverses, and no word boundary is a
 *  dead stop. The timecode reads the same curve in take seconds. */
const KNOT_T = [BLOCKS[0].T0, ...BLOCKS.map((b) => b.T1)];
const KNOT_X = [BLOCKS[0].x0, ...BLOCKS.map((b) => b.x1)];
const KNOT_S = [BLOCKS[0].s, ...BLOCKS.map((b) => b.e)];
const SMOOTH = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
const smoothed = (t: number, out: number[]) => SMOOTH.reduce((a, d) => a + interpolate(t + d, KNOT_T, out, CLAMP), 0) / SMOOTH.length;
const playheadAt = (t: number) => ({ x: smoothed(t, KNOT_X), tau: smoothed(t, KNOT_S) - S0 });
const pad2 = (n: number) => String(n).padStart(2, "0");
/** Resolve-style timecode (24 fps timeline starting at 01:00:00:00) of the playhead. */
const timecode = (tau: number) => {
  const f = Math.round(tau * 24);
  return `01:00:${pad2(Math.floor(f / 24))}:${pad2(f % 24)}`;
};
/** Smooth min, so the timecode box eases against the right edge instead of stopping dead. */
const smin = (a: number, b: number, k: number) => -k * Math.log(Math.exp(-a / k) + Math.exp(-b / k));
const TC_MAX_X = 830;

// ---- camera: tight on the playhead, then one curve that follows it right while pulling out to the whole timeline, hold.
// The tight hold sits high (the timecode's top at y 280) so his words under the trace clear the tube's bottom shadow.
const CAM: CamKeys = {
  t: [0, 6, 34, 48],
  x: [392, 398, 540, 540],
  y: [454, 454, 470, 470],
  z: [1.3, 1.3, 1.04, 1.03],
};

// ---- the trace
const packet = (t: number, a: number, len: number, x0: number, x1: number, amp: number, sigma: number, rgb: string): ScopeBump | null => {
  if (t < a - 1 || t > a + len + 3) return null;
  const u = ez(t, a, a + len, EASE.travel);
  const env = interpolate(t, [a - 1, a + 2, a + len - 1, a + len + 3], [0, 1, 1, 0], CLAMP);
  return { x: lerp(x0, x1, u), amp: amp * env, sigma, rgb };
};
const bumpsAt = (t: number, ph: number): ScopeBump[] => {
  const b: ScopeBump[] = [];
  // Victor talks (real word timings of "hours").
  b.push({ x: VOICE_X, amp: 2 + voiceEnv(CLIP, t + OFFSET) * (14 + 5 * Math.sin(t * 0.61) + 3 * Math.sin(t * 1.37)), sigma: 24, rgb: PH.userRgb });
  // Claude rides the playhead's foot: a quiet coral hum that swells as each block lands.
  const ans = BLOCKS.reduce((a, bl) => Math.max(a, interpolate(t, [bl.T0 - 1, bl.T0 + 2, bl.T0 + 13], [0, 1, 0], { ...CLAMP, easing: EASE.decel })), 0);
  b.push({ x: ph, amp: 4 + 1.5 * Math.sin(t * 0.37) + 11 * ans, sigma: 18, rgb: PH.claudeRgb });
  for (const bl of BLOCKS) {
    const p = packet(t, bl.say, LAG, VOICE_X + 12, bl.x0, 18, 20, PH.userRgb);
    if (p) b.push(p);
  }
  return b;
};

// ---- his words under the trace (screen px), the 3-word group being spoken, coral mono, eased crossfade
const GROUPS = (() => {
  const w = CLIPS[CLIP].words;
  const g: { s: number; text: string }[] = [];
  for (let i = 0; i < w.length; i += 3) g.push({ s: w[i].s, text: w.slice(i, i + 3).map((x) => x.w).join(" ") });
  return g;
})();
const Words: React.FC<{ t: number; y: number }> = ({ t, y }) => {
  const sec = (t + OFFSET) / FPS;
  let gi = -1;
  for (let i = 0; i < GROUPS.length; i++) if (sec >= GROUPS[i].s) gi = i;
  if (gi < 0) return null;
  const inF = (sec - GROUPS[gi].s) * FPS;
  const show = (text: string, op: number, dy: number, key: string) => (
    <div key={key} style={{ position: "absolute", left: 0, right: 0, top: y + dy, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 56, lineHeight: 1.15, color: UI.coral, letterSpacing: -0.5, whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
  const inP = ez(inF, 0, 5, EASE.enter);
  const outP = ez(inF, 0, 4, EASE.decel);
  return (
    <>
      {gi > 0 && outP < 1 ? show(GROUPS[gi - 1].text, 1 - outP, -10 * outP, "prev") : null}
      {show(GROUPS[gi].text, inP, 12 * (1 - inP), "cur")}
    </>
  );
};

// ---- the timeline pieces (world px, inside layerStyle(cam, 1))
const Lanes: React.FC = () => (
  <>
    {/* ruler */}
    <div style={{ position: "absolute", left: LANE_L, top: RULER.top, width: LANE_R - LANE_L, height: RULER.h, background: "rgba(24,27,33,0.92)", boxShadow: "inset 0 -1.5px 0 rgba(233,231,226,0.3)" }} />
    <svg width={LANE_R} height={RULER.top + RULER.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {Array.from({ length: Math.floor((LANE_R - LANE_L) / 15) }, (_, i) => {
        const x = LANE_L + 6 + i * 15;
        const major = i % 5 === 0;
        return <line key={i} x1={x} x2={x} y1={RULER.top + RULER.h} y2={RULER.top + RULER.h - (major ? 15 : 7)} stroke="rgba(233,231,226,0.42)" strokeWidth={major ? 2 : 1.5} />;
      })}
    </svg>
    {LANES.map((l, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: LANE_L,
          top: l.top,
          width: LANE_R - LANE_L,
          height: l.h,
          background: i === 1 ? "rgba(22,25,31,0.9)" : "rgba(18,21,26,0.86)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.5)",
        }}
      />
    ))}
  </>
);

/** Track headers: the real Resolve names, on a dark panel at the timeline's left edge. They come in staggered. */
const Headers: React.FC<{ t: number }> = ({ t }) => (
  <>
    <div style={{ position: "absolute", left: HEAD.l, top: LANES[0].top, width: HEAD.r - HEAD.l, height: A1.top + A1.h - LANES[0].top, borderRadius: 10, background: "rgba(28,31,38,0.94)", boxShadow: "inset 0 0 0 1.5px rgba(233,231,226,0.2)" }} />
    {TRACK_NAMES.map((name, i) => {
      const l = LANES[i];
      const p = ez(t, -6 + i * 3, 2 + i * 3, EASE.enter);
      return (
        <div
          key={name}
          style={{
            position: "absolute",
            left: HEAD.l + 22,
            top: l.top + l.h / 2 - 22,
            height: 44,
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 34,
            lineHeight: "44px",
            color: i === 1 ? UI.screenInk : "rgba(236,233,226,0.8)",
            opacity: p,
            transform: `translateX(${(-12 * (1 - p)).toFixed(2)}px)`,
          }}
        >
          {name}
        </div>
      );
    })}
  </>
);

/** His take as the clip thumbnail: the still pushed in on his face (natural 1080 x 1920, face center about 675, 840). */
const THUMB_K = 0.15;
const FACE = { x: 675, y: 840 };

const ClipBlock: React.FC<{ b: Block; t: number; i: number }> = ({ b, t, i }) => {
  if (t < b.T0 - 0.5) return null;
  const p = ez(t, b.T0, b.T0 + 6, EASE.decel);
  const fade = ez(t, b.T0 - 0.5, b.T0 + 2.5, EASE.enter);
  const bw = b.x1 - b.x0 - 3;
  const bh = V1.h - 16;
  // The still inside keeps pushing in slowly (ambient), each block framed a touch differently.
  const life = ez(t, b.T0, b.T0 + 40, EASE.inOut);
  const k = THUMB_K * (1.02 + 0.05 * life);
  const sh = (a: number, c: number) => lerp(a, c, p).toFixed(2);
  return (
    <div
      style={{
        position: "absolute",
        left: b.x0 + 1.5,
        top: V1.top + 8,
        width: bw,
        height: bh,
        borderRadius: 7,
        overflow: "hidden",
        background: "#1C1F26",
        opacity: fade,
        transform: `translateY(${(-30 * (1 - p)).toFixed(2)}px) scale(${(1.06 - 0.06 * p).toFixed(4)})`,
        transformOrigin: "50% 100%",
        boxShadow: `inset 0 0 0 2px rgba(233,231,226,0.62), 0 ${sh(22, 6)}px ${sh(34, 12)}px rgba(0,0,0,${sh(0.25, 0.5)})`,
      }}
    >
      <Img
        src={staticFile(CLIPS[CLIP].thumb)}
        style={{
          position: "absolute",
          width: 1080 * k,
          height: 1920 * k,
          left: bw / 2 - (FACE.x + (i % 2 === 0 ? -12 : 12)) * k,
          top: bh / 2 - FACE.y * k,
          maxWidth: "none",
          filter: "brightness(1.18) contrast(0.95)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 2px rgba(233,231,226,0.62)", borderRadius: 7 }} />
    </div>
  );
};

/** Linked audio on A1: opens with its clip, then his waveform fills in up to the playhead. */
const AudioBlock: React.FC<{ b: Block; t: number; ph: number }> = ({ b, t, ph }) => {
  if (t < b.T0 - 0.5) return null;
  const open = ez(t, b.T0 + 1, b.T0 + 6, EASE.decel);
  const bw = b.x1 - b.x0 - 3;
  const bh = A1.h - 12;
  const bars: React.ReactNode[] = [];
  for (let x = 5; x < bw - 3; x += 5) {
    const wx = b.x0 + 1.5 + x;
    const reveal = interpolate(ph - wx, [-2, 8], [0, 1], { ...CLAMP, easing: EASE.decel });
    if (reveal <= 0) continue;
    const u = x / bw;
    const env = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.6);
    const tex = 0.5 + 0.5 * Math.abs(Math.sin(wx * 0.71) * Math.cos(wx * 0.23 + 1.1));
    const hh = Math.max(3, env * tex * (bh - 14)) * reveal;
    bars.push(<line key={x} x1={x} x2={x} y1={bh / 2 - hh / 2} y2={bh / 2 + hh / 2} stroke={`rgba(${PH.userRgb},0.9)`} strokeWidth={2.6} strokeLinecap="round" />);
  }
  return (
    <div
      style={{
        position: "absolute",
        left: b.x0 + 1.5,
        top: A1.top + 6,
        width: bw,
        height: bh,
        borderRadius: 6,
        overflow: "hidden",
        background: "rgba(59,224,138,0.08)",
        boxShadow: "inset 0 0 0 1.5px rgba(59,224,138,0.5)",
        opacity: open,
        transform: `scaleY(${(0.6 + 0.4 * open).toFixed(4)})`,
        transformOrigin: "50% 0%",
      }}
    >
      <svg width={bw} height={bh} style={{ position: "absolute", left: 0, top: 0 }}>
        {bars}
      </svg>
    </div>
  );
};

/** The coral playhead from the ruler to the trace, its head on the ruler, the timecode box above it. */
const Playhead: React.FC<{ ph: number; tau: number }> = ({ ph, tau }) => {
  const cx = smin(ph, TC_MAX_X, 12);
  const top = RULER.top;
  return (
    <>
      <svg width={W} height={TRACE_Y + 10} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={ph} x2={ph} y1={top + 18} y2={TRACE_Y - 4} stroke="rgba(0,0,0,0.5)" strokeWidth={7} />
        <line x1={ph} x2={ph} y1={top + 18} y2={TRACE_Y - 4} stroke={UI.coral} strokeWidth={3} />
        <path d={`M ${ph - 12} ${top + 1} L ${ph + 12} ${top + 1} L ${ph + 12} ${top + 15} L ${ph} ${top + 27} L ${ph - 12} ${top + 15} Z`} fill={UI.coral} />
        <path d={`M ${ph - 8} ${TC.top + TC.h - 1} L ${ph + 8} ${TC.top + TC.h - 1} L ${ph} ${TC.top + TC.h + 9} Z`} fill={UI.coral} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: cx - TC.w / 2,
          top: TC.top,
          width: TC.w,
          height: TC.h,
          borderRadius: 8,
          background: "rgba(16,18,23,0.96)",
          boxShadow: `inset 0 0 0 2px ${UI.coral}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: TC.font,
          color: UI.screenInk,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: 0.5,
        }}
      >
        {timecode(tau)}
      </div>
    </>
  );
};

export const TimelineScrub: React.FC<FxProps> = ({ t }) => {
  const cam = camAt(t, CAM);
  const { x: ph, tau } = playheadAt(t);
  const pan = ez(t, 0, 52, EASE.inOut);
  const bumps = bumpsAt(t, ph);
  const traceScreenY = toScreen(cam, 1, { x: 540, y: TRACE_Y }).y;
  return (
    <AbsoluteFill style={{ background: UI.screen, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: SPLIT, overflow: "hidden" }}>
        <CRT>
          <AbsoluteFill style={{ background: UI.screen }}>
            {/* Far plate: the real Edit page, its timeline sitting behind ours, panning slowly with the scrub. */}
            <Plate cam={cam} k={0.6} src={SHOTS.edit} nw={5120} nh={2880} scale={0.5} x={-330 - 180 * pan} y={-640 - 14 * pan} blur={5} bright={0.44} tilt={4} />
            <GridLayer cam={cam} k={0.82} t={t} />
            <div style={layerStyle(cam, 1)}>
              <Lanes />
              <svg width={W} height={SPLIT} viewBox={`0 0 ${W} ${SPLIT}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                <Scope frame={t} x0={-240} x1={W + 360} y={TRACE_Y} bumps={bumps} hum={1.5} stroke={3} color={TRACE_INK} />
              </svg>
              {BLOCKS.map((b, i) => (
                <AudioBlock key={`a${i}`} b={b} t={t} ph={ph} />
              ))}
              {BLOCKS.map((b, i) => (
                <ClipBlock key={`v${i}`} b={b} t={t} i={i} />
              ))}
              <Headers t={t} />
              <Playhead ph={ph} tau={tau} />
            </div>
            {/* his words under the trace: the press shot is darkened behind them (a full-width band), then the coral mono line */}
            <div
              style={{
                position: "absolute",
                left: 0,
                width: W,
                top: traceScreenY + 8,
                height: 96,
                background: "linear-gradient(180deg, rgba(10,12,16,0) 0%, rgba(10,12,16,0.93) 24%, rgba(10,12,16,0.93) 76%, rgba(10,12,16,0) 100%)",
              }}
            />
            <Words t={t} y={traceScreenY + 24} />
          </AbsoluteFill>
        </CRT>
      </div>
      {/* s 0.94, tx -7 centres the sharp take (its sides feather into the blurred copy equally); hair top ~971, chin <= ~1560 */}
      <LowerClip name={CLIP} t={t} s={0.94} tx={-7} ty={-505} offset={OFFSET} />
    </AbsoluteFill>
  );
};

export const timelinescrub: FxDef = {
  id: "timelinescrub",
  command: "/timeline-scrub",
  menu: "A playhead scrubs your words onto the track",
  clip: "hours",
  Comp: TimelineScrub,
  thumbT: [14, 26, 38],
};
