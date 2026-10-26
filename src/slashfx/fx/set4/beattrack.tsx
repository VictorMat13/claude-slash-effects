// /beat-track (set 4): split frame. Above, a CRT screen in 2.5D: far back the real Media page press shot (SHOTS.media,
// pushed in on the media pool, blurred by distance, slow eased pan), then the grid, then one audio track: the real Resolve
// track name A1 (TRACK_NAMES) on its header, a ruler, and Victor's take drawn as a waveform of bars built from his real word
// timings (voiceEnv of the clip "highlight"). The track scrolls right to left past a fixed coral playhead with a Resolve
// timecode over it; the bars he has already said turn green as they cross the playhead. On every word a coral marker
// drops onto the track at the playhead (the pin lands, its stem rises, the word in mono lands above it in a small dark
// chip, staggered) and then rides the track out to the left. The live scope trace is the track's baseline: his voice is
// the green swell at the playhead, each marker lands with a coral swell that rides away with it. His words sit under the
// trace in coral mono, three at a time.
// One camera: tight on the playhead (1.3), pull out to the whole track (1.0) across the push to full screen, hold, drift.
// Below, his footage, his whole head inside the lower half of the safe rect.
// IG safe zone: the timecode, ruler content, chips, markers, header and words stay inside SAFE_IG (x 60..1000, y 270..930
// above the split) at every t: the tight framing keeps them in, the markers fade out before they reach the header, and
// the header only comes in once the camera has pulled out. The lane, the bars, the grid, the plate and the trace bleed.
// Every value is a pure function of t.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { CLIPS } from "../../data/clips";
import { SHOTS, TRACK_NAMES } from "../../data/facts";
import { CRT, Clip, DarkGrid, MONO } from "../../kit";
import { CLAMP, EASE, FPS, H, UI, W, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { TRACE_INK, camAt, voiceEnv, type Cam, type CamKeys } from "../shutterstrike";

const CLIP = "highlight" as const;
/** The screen above, the footage below. The split sits just under the middle of the safe rect (925). */
const SPLIT = 930;
const CX = W / 2;
const CY = SPLIT / 2;

// ---- the track (world px on the subject plane; at zoom 1.0 world = screen)
const PH_X = 700;
/** Track scroll: px per second of his take (15.8 px per frame). */
const PPS = 380;
const TC = { top: 348, h: 48, w: 256, font: 34 } as const;
const RULER = { top: 406, h: 28 } as const;
const ROWS = [446, 500] as const;
const CHIP_H = 46;
const LANE = { top: 556, bottom: 764 } as const;
const BASE = LANE.bottom;
const HEAD = { l: 84, r: 176 } as const;
const LANE_L = 184;
const LANE_R = 1700;
const WORD_FONT = 38;
/** Markers fade out between these world x as they ride toward the header. */
const FADE = [LANE_L + 30, LANE_L + 140] as const;

// ---- camera: tight on the playhead, pull out to the whole track, hold
const CAM: CamKeys = {
  t: [0, 7, 26, 48],
  x: [620, 616, 540, 540],
  y: [484, 484, 466, 466],
  z: [1.3, 1.29, 1.0, 1.0],
};
const layerAt = (cam: Cam, k: number) => ({ z: Math.pow(cam.z, k), fx: CX + (cam.x - CX) * k, fy: CY + (cam.y - CY) * k });
const toScreen = (cam: Cam, k: number, p: { x: number; y: number }) => {
  const { z, fx, fy } = layerAt(cam, k);
  return { x: CX + (p.x - fx) * z, y: CY + (p.y - fy) * z };
};
const layerStyle = (cam: Cam, k: number): React.CSSProperties => {
  const { z, fx, fy } = layerAt(cam, k);
  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: W,
    height: SPLIT,
    transformOrigin: "0 0",
    transform: `translate(${(CX - fx * z).toFixed(2)}px, ${(CY - fy * z).toFixed(2)}px) scale(${z.toFixed(5)})`,
  };
};

/** Clip time (seconds) under the playhead at frame t. */
const nowAt = (t: number) => t / FPS;

// ---- his words: one marker per word. The chips sit on two rows, laid out once from his word timings (the markers keep
// fixed spacing on the scrolling track): a word goes on the lower row only if its chip fits there without sitting above
// another word's pin and without touching the previous lower chip; otherwise it goes on the upper row (its stem passes
// the lower row in a clear gap). The chip may slide sideways along its own stem, never off it, so every pin reads as
// its own word's.
const CHAR_W = WORD_FONT * 0.6 - 0.4; // JetBrains Mono advance (0.6 em) minus the chip's tracking
const CHIP_PAD = 9;
/** The stem meets its chip at least this far inside the chip's edge. */
const STEM_IN = 10;
/** A lower-row chip keeps this far clear of every other marker's stem and pin. */
const PIN_CLEAR = 12;
/** Gap between neighbouring chips on the lower row. */
const CHIP_GAP = 10;
const WORDS = (() => {
  const raw = CLIPS[CLIP].words.map((w) => ({ w: w.w, s: w.s, u: w.s * PPS, cw: w.w.length * CHAR_W + 2 * CHIP_PAD, drop: w.s * FPS }));
  let lowR = -Infinity;
  return raw.map((r, j) => {
    const prev = j > 0 ? raw[j - 1].u : -Infinity;
    const next = j < raw.length - 1 ? raw[j + 1].u : Infinity;
    // lower row: the chip's left edge, as close to left-anchored on its stem as the neighbours allow
    const lo = Math.max(prev + PIN_CLEAR, lowR + CHIP_GAP, r.u + STEM_IN - r.cw);
    const hi = Math.min(r.u - STEM_IN, next - PIN_CLEAR - r.cw);
    if (lo <= hi) {
      lowR = hi + r.cw;
      return { ...r, row: 1, dl: hi - r.u };
    }
    // upper row: left-anchored on its own stem (upper neighbours are always two or more words apart, so they clear)
    return { ...r, row: 0, dl: -STEM_IN };
  });
})();
const markerX = (s: number, now: number) => PH_X + (s - now) * PPS;

// ---- the waveform: bars every 9 px of track, each the voice envelope at its own time, textured, from the baseline up
const BAR_DX = 9;
const barH = (tau: number) => {
  const env = voiceEnv(CLIP, tau * FPS);
  const tex = 0.42 + 0.58 * Math.abs(Math.sin(tau * 41.3 + 0.7) * Math.cos(tau * 13.1 + 1.9));
  return 5 + env * tex * 176;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
/** Resolve-style timecode (24 fps timeline from 01:00:00:00) of the clip time under the playhead. */
const timecode = (sec: number) => {
  const f = Math.max(0, Math.floor(sec * 24 + 1e-6));
  return `01:00:${pad2(Math.floor(f / 24))}:${pad2(f % 24)}`;
};

// ---- the far plate and the grid (each its own depth layer, bleeding past the screen)
const Plate: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => {
  const pan = ez(t, 0, 60, EASE.inOut);
  const sc = 3;
  return (
    <div style={layerStyle(cam, 0.55)}>
      <div
        style={{
          position: "absolute",
          left: -220 - 150 * pan,
          top: -290 - 24 * pan,
          width: 998 * sc,
          height: 567 * sc,
          filter: "blur(5px) brightness(0.46) contrast(0.92)",
        }}
      >
        <Img src={staticFile(SHOTS.media)} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", maxWidth: "none" }} />
      </div>
    </div>
  );
};
const Grid: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => (
  <div style={layerStyle(cam, 0.8)}>
    <DarkGrid shift={t * 0.4} style={{ left: -800, top: -800, width: W + 1600, height: SPLIT + 1600, backgroundColor: "transparent" }} />
  </div>
);

// ---- the track pieces (world px, inside layerStyle(cam, 1))
const Ruler: React.FC<{ now: number }> = ({ now }) => {
  const ticks: React.ReactNode[] = [];
  const k0 = Math.ceil((now - (PH_X - LANE_L) / PPS) * 10);
  const k1 = Math.floor((now + (LANE_R - PH_X) / PPS) * 10);
  for (let k = k0; k <= k1; k++) {
    const x = markerX(k / 10, now);
    if (x < LANE_L + 2) continue;
    const major = ((k % 5) + 5) % 5 === 0;
    ticks.push(<line key={k} x1={x} x2={x} y1={RULER.top + RULER.h} y2={RULER.top + RULER.h - (major ? 16 : 8)} stroke="rgba(233,231,226,0.45)" strokeWidth={major ? 2 : 1.5} />);
  }
  return (
    <>
      <div style={{ position: "absolute", left: LANE_L, top: RULER.top, width: LANE_R - LANE_L, height: RULER.h, background: "rgba(24,27,33,0.92)", boxShadow: "inset 0 -1.5px 0 rgba(233,231,226,0.3)" }} />
      <svg width={LANE_R} height={RULER.top + RULER.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {ticks}
      </svg>
    </>
  );
};

const Lane: React.FC<{ now: number }> = ({ now }) => {
  const bars: React.ReactNode[] = [];
  const i0 = Math.ceil((now * PPS + LANE_L + 4 - PH_X) / BAR_DX);
  const i1 = Math.floor((now * PPS + LANE_R - PH_X) / BAR_DX);
  for (let i = i0; i <= i1; i++) {
    const tau = (i * BAR_DX) / PPS;
    const x = markerX(tau, now);
    const h = barH(tau);
    // Played bars (left of the playhead) are his voice, green; the bars still to come are dim ink.
    const played = interpolate(x, [PH_X - 5, PH_X + 3], [1, 0], CLAMP);
    const c = played > 0.5 ? `rgba(${PH.userRgb},${(0.55 + 0.37 * played).toFixed(3)})` : `rgba(236,233,226,${(0.3 + 0.25 * played).toFixed(3)})`;
    bars.push(<line key={i} x1={x} x2={x} y1={BASE - 6} y2={BASE - 6 - h} stroke={c} strokeWidth={5} strokeLinecap="round" />);
  }
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: LANE_L,
          top: LANE.top,
          width: LANE_R - LANE_L,
          height: LANE.bottom - LANE.top,
          background: "rgba(18,21,26,0.86)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.5)",
        }}
      />
      <svg width={LANE_R} height={BASE + 10} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {bars}
      </svg>
    </>
  );
};

/** A1 on its header panel; it comes in once the camera has pulled out far enough to hold it inside the safe rect. */
const Header: React.FC<{ t: number }> = ({ t }) => {
  const p = ez(t, 24, 31, EASE.enter);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: HEAD.l,
        top: LANE.top,
        width: HEAD.r - HEAD.l,
        height: LANE.bottom - LANE.top,
        borderRadius: 10,
        background: "rgba(28,31,38,0.96)",
        boxShadow: "inset 0 0 0 1.5px rgba(233,231,226,0.22)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 40,
        color: UI.screenInk,
        opacity: p,
        transform: `translateX(${(14 * (1 - p)).toFixed(2)}px)`,
      }}
    >
      {TRACK_NAMES[2]}
    </div>
  );
};

/** The word markers: pin drops onto the lane top, the stem rises to the word's row, the chip lands; all ride the track. */
const Markers: React.FC<{ t: number; now: number }> = ({ t, now }) => {
  const stems: React.ReactNode[] = [];
  const pins: React.ReactNode[] = [];
  const chips: React.ReactNode[][] = [[], []];
  WORDS.forEach((w, j) => {
    if (t < w.drop - 1) return;
    const x = markerX(w.s, now);
    if (x < FADE[0]) return;
    const fade = interpolate(x, [FADE[0], FADE[1]], [0, 1], { ...CLAMP, easing: EASE.inOut });
    const p1 = ez(t, w.drop - 1, w.drop + 5, EASE.decel);
    const o1 = ez(t, w.drop - 1, w.drop + 2, EASE.enter) * fade;
    const p2 = ez(t, w.drop + 1, w.drop + 6, EASE.decel);
    const p3 = ez(t, w.drop + 2, w.drop + 7, EASE.enter);
    const pinY = LANE.top + 2 - 44 * (1 - p1);
    const chipBottom = ROWS[w.row] + CHIP_H;
    // stem: down from the pin to the baseline (quiet), up from the pin to the chip (rises after the pin lands)
    stems.push(<line key={`d${j}`} x1={x} x2={x} y1={pinY + 22} y2={BASE - 4} stroke={`rgba(${PH.claudeRgb},${(0.42 * o1 * p1).toFixed(3)})`} strokeWidth={2} />);
    stems.push(<line key={`u${j}`} x1={x} x2={x} y1={pinY + 2} y2={lerp(pinY + 2, chipBottom, p2)} stroke={`rgba(${PH.claudeRgb},${(0.85 * fade).toFixed(3)})`} strokeWidth={2.5} />);
    pins.push(
      <path
        key={`p${j}`}
        d={`M ${x - 11} ${pinY} L ${x + 11} ${pinY} L ${x + 11} ${pinY + 13} L ${x} ${pinY + 24} L ${x - 11} ${pinY + 13} Z`}
        fill={UI.coral}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        opacity={o1}
      />,
    );
    chips[w.row].push(
      <div
        key={`c${j}`}
        style={{
          position: "absolute",
          left: x + w.dl,
          top: ROWS[w.row],
          width: w.cw,
          boxSizing: "border-box",
          height: CHIP_H,
          padding: "0 9px",
          borderRadius: 7,
          background: "rgba(16,18,23,0.94)",
          boxShadow: `inset 0 0 0 1.5px rgba(${PH.claudeRgb},0.55)`,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: WORD_FONT,
          lineHeight: `${CHIP_H}px`,
          letterSpacing: -0.4,
          whiteSpace: "nowrap",
          color: UI.screenInk,
          opacity: p3 * fade,
          transform: `translateY(${(10 * (1 - p3)).toFixed(2)}px)`,
        }}
      >
        {w.w}
      </div>,
    );
  });
  return (
    <>
      <svg width={LANE_R} height={BASE + 10} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {stems}
        {pins}
      </svg>
      {chips[0]}
      {chips[1]}
    </>
  );
};

/** The coral playhead from the ruler to the baseline, its head on the ruler, the timecode box over it. */
const Playhead: React.FC<{ now: number }> = ({ now }) => (
  <>
    <svg width={W} height={BASE + 10} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <line x1={PH_X} x2={PH_X} y1={RULER.top + 18} y2={BASE - 3} stroke="rgba(0,0,0,0.5)" strokeWidth={7} />
      <line x1={PH_X} x2={PH_X} y1={RULER.top + 18} y2={BASE - 3} stroke={UI.coral} strokeWidth={3} />
      <path d={`M ${PH_X - 12} ${RULER.top + 1} L ${PH_X + 12} ${RULER.top + 1} L ${PH_X + 12} ${RULER.top + 15} L ${PH_X} ${RULER.top + 27} L ${PH_X - 12} ${RULER.top + 15} Z`} fill={UI.coral} />
      <path d={`M ${PH_X - 8} ${TC.top + TC.h - 1} L ${PH_X + 8} ${TC.top + TC.h - 1} L ${PH_X} ${TC.top + TC.h + 8} Z`} fill={UI.coral} />
    </svg>
    <div
      style={{
        position: "absolute",
        left: PH_X - TC.w / 2,
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
      {timecode(now)}
    </div>
  </>
);

/** The trace is the track's baseline: his voice at the playhead, a coral swell with each marker that rides away with it. */
const bumpsAt = (t: number, now: number): ScopeBump[] => {
  const b: ScopeBump[] = [{ x: PH_X, amp: 2 + voiceEnv(CLIP, t) * (14 + 5 * Math.sin(t * 0.61) + 3 * Math.sin(t * 1.37)), sigma: 22, rgb: PH.userRgb }];
  for (const w of WORDS) {
    const a = interpolate(t, [w.drop, w.drop + 3, w.drop + 16], [0, 1, 0], { ...CLAMP, easing: EASE.decel });
    if (a > 0.01) b.push({ x: markerX(w.s, now), amp: 12 * a, sigma: 18, rgb: PH.claudeRgb });
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
  const sec = nowAt(t);
  let gi = -1;
  for (let i = 0; i < GROUPS.length; i++) if (sec >= GROUPS[i].s) gi = i;
  if (gi < 0) return null;
  const inF = (sec - GROUPS[gi].s) * FPS;
  const show = (text: string, op: number, dy: number, key: string) => (
    <div key={key} style={{ position: "absolute", left: 0, right: 0, top: y + dy, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 54, lineHeight: 1.15, color: UI.coral, letterSpacing: -0.5, whiteSpace: "nowrap" }}>{text}</div>
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

/** His take below the split, not stretched, never zoomed: scale 1.0 plus a slow eased push of 2.5 percent anchored on his
 *  face, moved up so his hair top sits about 22 px under the split and his chin about 1530 (safe bottom 1580). */
const ORIGIN = { x: 560, y: 780 };
const LowerTake: React.FC<{ t: number }> = ({ t }) => {
  const s = 1 + 0.025 * ez(t, 0, 72, EASE.inOut);
  return (
    <div style={{ position: "absolute", left: 0, top: SPLIT, width: W, height: H - SPLIT, overflow: "hidden", background: UI.ink }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`, transform: `translate(0px, -468px) scale(${s.toFixed(5)})` }}>
        <Clip name={CLIP} />
      </div>
    </div>
  );
};

export const BeatTrack: React.FC<FxProps> = ({ t }) => {
  const cam = camAt(t, CAM);
  const now = nowAt(t);
  const bumps = bumpsAt(t, now);
  const traceScreenY = toScreen(cam, 1, { x: CX, y: BASE }).y;
  return (
    <AbsoluteFill style={{ background: UI.screen, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: SPLIT, overflow: "hidden" }}>
        <CRT>
          <AbsoluteFill style={{ background: UI.screen }}>
            <Plate cam={cam} t={t} />
            <Grid cam={cam} t={t} />
            <div style={layerStyle(cam, 1)}>
              <Ruler now={now} />
              <Lane now={now} />
              <svg width={W} height={SPLIT} viewBox={`0 0 ${W} ${SPLIT}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                <Scope frame={t} x0={-400} x1={W + 600} y={BASE} bumps={bumps} hum={1.5} stroke={3} color={TRACE_INK} />
              </svg>
              <Markers t={t} now={now} />
              <Header t={t} />
              <Playhead now={now} />
            </div>
            {/* his words under the trace: a soft dark scrim, then the coral mono line, centered on the screen */}
            <div
              style={{
                position: "absolute",
                left: 110,
                width: W - 220,
                top: traceScreenY + 10,
                height: 96,
                background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(16,18,23,0.92) 60%, rgba(16,18,23,0) 100%)",
              }}
            />
            <Words t={t} y={traceScreenY + 22} />
          </AbsoluteFill>
        </CRT>
      </div>
      <LowerTake t={t} />
    </AbsoluteFill>
  );
};

export const beattrack: FxDef = {
  id: "beattrack",
  command: "/beat-track",
  menu: "Your words drop onto the audio track",
  clip: "highlight",
  Comp: BeatTrack,
  thumbT: [26, 36, 46],
};
