// /shutter-strike: split frame. Top half is a CRT screen in 2.5D: far back, the real Resolve 21 Color page (press shot,
// pushed in, blurred by distance, slow eased pan); then the grid; then four photo prints (the Color, Edit and Media press
// shots pushed in on what Victor says Claude can do, and a still of Victor) that arrive one after another along one
// diagonal, sliding down the live scope trace into a tidy fan. Claude's coral packet waits at the head of the trace,
// then strikes along it across all four prints in one eased move, painting the line coral; each print it crosses gets
// graded (desaturated to full color). Victor's voice is the green wave on the trace where it crosses his print.
// One camera: close on the first print, follows the wave down the diagonal, follows the strike, pulls out.
// His real words sit under the fan in coral mono, three at a time (the same style as /screen-push's words).
// Bottom half is Victor's clip "colorgrade", his whole head inside the safe rect.
// IG safe zone (Victor, 2026-10-25 22:00): every print, the strike line, the coral packet and the words stay inside
// SAFE_IG (x 100..980, y 290..960 above the split) at every t, including the camera travel and drift, and the words
// never touch a print; the grid, the far plate and the white trace still bleed to the frame edge.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { Scope, type ScopeBump } from "../../artcraft/kit/Scope";
import { PH } from "../../artcraft/theme";
import { CLIPS, type ClipName } from "../data/clips";
import { SHOTS } from "../data/facts";
import { CRT, Clip, ClipThumb, DarkGrid, MONO } from "../kit";
import { CLAMP, EASE, FPS, H, UI, W, ez, lerp, type FxDef, type FxProps } from "../theme";

/** Where the split sits: the grid above, the clip below. */
export const SPLIT = H / 2;

/** Below s = 1 the clip no longer spans the frame width: the same footage, enlarged, blurred and dimmed, fills the
 *  sides (never letterboxed), and the sharp clip's left and right edges feather into it over FEATHER_PX. */
const BACK_SCALE = 1.2;
const FEATHER_PX = 80;
const FEATHER = `linear-gradient(to right, transparent 0px, #000 ${FEATHER_PX}px, #000 ${W - FEATHER_PX}px, transparent ${W}px)`;

/**
 * Victor's clip in the lower half (y 960 to 1920), not stretched: scaled by `s` around his face (660, 820 in the
 * 1080x1920 clip) and moved by tx, ty. A slow push-in of +0.025 over 72 frames keeps it alive.
 * s >= 1 fills the half edge to edge (screenpush); s < 1 shows his whole head and fills the sides with the blurred
 * footage (shutterstrike).
 */
export const LowerClip: React.FC<{ name: ClipName; t: number; s: number; tx: number; ty: number }> = ({ name, t, s, tx, ty }) => {
  const push = 0.025 * Math.min(1, Math.max(0, t) / 72);
  const layer = (scale: number, style?: React.CSSProperties) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        transformOrigin: "660px 820px",
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
        ...style,
      }}
    >
      <Clip name={name} />
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: SPLIT, width: W, height: H - SPLIT, overflow: "hidden", background: UI.ink }}>
      {s < 1 ? layer(BACK_SCALE + push, { filter: "blur(28px) brightness(0.45) saturate(0.9)" }) : null}
      {layer(s + push, s < 1 ? { WebkitMaskImage: FEATHER, maskImage: FEATHER } : undefined)}
    </div>
  );
};

// ------------------------------------------------------------------ shared rig for the split-screen effects (also used by screenpush)

/** Camera on the 1080x960 screen above the split: focal point in world px and zoom. */
export type Cam = { x: number; y: number; z: number };
export type CamKeys = { t: number[]; x: number[]; y: number[]; z: number[] };
const CENTER = { x: W / 2, y: SPLIT / 2 };

/** One keyframe timeline for focal x, focal y and zoom (EASE.travel per segment), plus a small ambient drift. */
export const camAt = (t: number, k: CamKeys): Cam => {
  const o = { ...CLAMP, easing: EASE.travel };
  return {
    x: interpolate(t, k.t, k.x, o) + 3 * Math.sin(t * 0.09),
    y: interpolate(t, k.t, k.y, o) + 2 * Math.cos(t * 0.071),
    z: interpolate(t, k.t, k.z, o) * (1 + 0.003 * Math.sin(t * 0.05)),
  };
};

/**
 * A depth layer under the camera (2.5D parallax). k = 1 is the subject plane; k < 1 sits farther back, so it zooms and
 * pans less (zoom^k, focal pulled toward the screen center by k). World point p lands on screen at C + (p - f) * z.
 */
const layerAt = (cam: Cam, k: number) => ({
  z: Math.pow(cam.z, k),
  fx: CENTER.x + (cam.x - CENTER.x) * k,
  fy: CENTER.y + (cam.y - CENTER.y) * k,
});
/** Where world point p on depth layer k lands on the screen (same mapping as layerStyle). */
export const toScreen = (cam: Cam, k: number, p: { x: number; y: number }) => {
  const { z, fx, fy } = layerAt(cam, k);
  return { x: CENTER.x + (p.x - fx) * z, y: CENTER.y + (p.y - fy) * z };
};
export const layerStyle = (cam: Cam, k: number): React.CSSProperties => {
  const { z, fx, fy } = layerAt(cam, k);
  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: W,
    height: SPLIT,
    transformOrigin: "0 0",
    transform: `translate(${(CENTER.x - fx * z).toFixed(2)}px, ${(CENTER.y - fy * z).toFixed(2)}px) scale(${z.toFixed(5)})`,
  };
};

/** A real press shot as a far plate: placed in world px (x, y = its top-left), blurred by distance and dimmed. */
export const Plate: React.FC<{
  cam: Cam;
  k: number;
  src: string;
  nw: number;
  nh: number;
  scale: number;
  x: number;
  y: number;
  blur: number;
  bright: number;
  tilt?: number;
}> = ({ cam, k, src, nw, nh, scale, x, y, blur, bright, tilt = 0 }) => (
  <div style={layerStyle(cam, k)}>
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: nw * scale,
        height: nh * scale,
        transformOrigin: "50% 50%",
        transform: tilt ? `perspective(2200px) rotateX(${tilt}deg)` : undefined,
        filter: `blur(${blur}px) brightness(${bright}) contrast(0.92)`,
      }}
    >
      <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", display: "block", maxWidth: "none" }} />
    </div>
  </div>
);

/** The grid as its own depth layer, bleeding well past the screen so camera moves never show an edge. */
export const GridLayer: React.FC<{ cam: Cam; k: number; t: number }> = ({ cam, k, t }) => (
  <div style={layerStyle(cam, k)}>
    <DarkGrid shift={t * 0.4} style={{ left: -800, top: -800, width: W + 1600, height: SPLIT + 1600, backgroundColor: "transparent" }} />
  </div>
);

/** Voice envelope 0..1 from the clip's real word timings (t = frames since the clip started). */
export const voiceEnv = (name: ClipName, t: number) => {
  const sec = t / FPS;
  let e = 0;
  for (const w of CLIPS[name].words) {
    const d = w.e - w.s;
    const a = w.s + Math.min(0.03, d / 3);
    const b = w.e - Math.min(0.02, d / 3);
    e = Math.max(e, interpolate(sec, [w.s - 0.06, a, b, w.e + 0.07], [0, 1, 1, 0], CLAMP));
  }
  return e;
};

const gauss = (x: number, c: number, s: number) => Math.exp(-((x - c) ** 2) / (2 * s * s));
/** The same line as kit Scope (artcraft/kit/Scope.tsx), so overlays drawn here sit exactly on the live trace. */
export const traceY = (x: number, f: number, bumps: ScopeBump[], hum: number) => {
  const carrier = 0.62 * Math.sin(x * 0.085 - f * 0.42) + 0.38 * Math.sin(x * 0.21 + f * 0.31);
  const amp = bumps.reduce((a, b) => a + b.amp * gauss(x, b.x, b.sigma ?? 70), 0);
  return carrier * amp + hum * Math.sin(x * 0.05 + f * 0.07);
};
export const tracePts = (x0: number, x1: number, f: number, bumps: ScopeBump[], hum: number, y = 0) => {
  const pts: string[] = [];
  for (let x = x0; x < x1; x += 3) pts.push(`${x.toFixed(1)},${(y + traceY(x, f, bumps, hum)).toFixed(1)}`);
  pts.push(`${x1.toFixed(1)},${(y + traceY(x1, f, bumps, hum)).toFixed(1)}`);
  return pts.join(" ");
};
export const TRACE_INK = "rgba(243,241,236,0.62)";

// ------------------------------------------------------------------ this effect

/** A crop of an image: `c` is the point (natural px) to center, `rw` the natural width to show, `z` a push-in. */
type CropDef = { nw: number; nh: number; cx: number; cy: number; rw: number };

const cropStyle = (crop: CropDef, cw: number, ch: number, z: number, dx: number): React.CSSProperties => {
  const k = (cw / crop.rw) * z;
  return {
    position: "absolute",
    width: crop.nw * k,
    height: crop.nh * k,
    left: cw / 2 - (crop.cx + dx) * k,
    top: ch / 2 - crop.cy * k,
    maxWidth: "none",
  };
};

const PRINT_W = 390;
const PRINT_H = 276;
const BORDER = 14;
const RADIUS = 12;

/** The fan sits on one diagonal: print i rests at C1 + i * STEP. The prints slide in along it (60 px, EASE.decel).
 *  Safe zone: the diagonal is a little steeper (29.5 degrees, was 23) so the fan fills the 880 x 670 safe window above
 *  the split instead of the full 1080 width, and the fan sits lower in the world so it centers in that window. */
const STEP = { x: 152, y: 86 };
const STEP_LEN = Math.hypot(STEP.x, STEP.y);
const DIR = { x: STEP.x / STEP_LEN, y: STEP.y / STEP_LEN };
const ANGLE = (Math.atan2(STEP.y, STEP.x) * 180) / Math.PI; // 29.5 degrees
const C1 = { x: 347, y: 485 };
const SLIDE = 60;
/** The trace runs parallel to the fan, 92 px below the centers, so it crosses every print in its lower part
 *  (Victor's print below his chin). Trace coordinates: s along DIR from A, 0 at A. */
const A = { x: C1.x, y: C1.y + 92 };
/** The white trace runs well past the screen at every camera (it is background and bleeds to the edge). */
const S0 = -560;
const S1 = 1100;

type Print = {
  kind: "shot" | "victor";
  src?: string;
  crop: CropDef;
  rot: number;
  at: number;
  /** depth (1 = the trace plane) and its depth-of-field blur */
  k: number;
  blur: number;
  /** slow eased pan across the shot inside the print, natural px */
  pan: number;
};

// Crops are in the natural pixels of each file (see public/resolve/SOURCES.md), pushed in on the part his line names.
const PRINTS: Print[] = [
  // Color page: the HDR color wheels ("color grade your videos").
  { kind: "shot", src: SHOTS.color, crop: { nw: 3840, nh: 2160, cx: 700, cy: 1690, rw: 1300 }, rot: -6, at: -4, k: 0.9, blur: 1.1, pan: 120 },
  // Edit page timeline: track headers and the clips ("trim your footage").
  { kind: "shot", src: SHOTS.edit, crop: { nw: 5120, nh: 2880, cx: 2300, cy: 2150, rw: 1900 }, rot: -2, at: 1, k: 0.94, blur: 0.6, pan: 160 },
  // Media page clip grid on the monitor in the press photo ("organize your assets").
  { kind: "shot", src: SHOTS.media, crop: { nw: 998, nh: 567, cx: 250, cy: 150, rw: 300 }, rot: 3, at: 6, k: 0.98, blur: 0.2, pan: 18 },
  // Victor, on top of the fan. Cropped so his face sits in the upper half and the trace crosses his chest, not his face.
  { kind: "victor", crop: { nw: 1080, nh: 1920, cx: 560, cy: 960, rw: 1080 }, rot: 7, at: 11, k: 1.02, blur: 0, pan: 0 },
];
const centerOf = (i: number) => ({ x: C1.x + i * STEP.x, y: C1.y + i * STEP.y });
/** Where print i's center projects onto the trace. */
const sOf = (i: number) => {
  const c = centerOf(i);
  return (c.x - A.x) * DIR.x + (c.y - A.y) * DIR.y;
};

// 24 fps. Prints at -4, 1, 6, 11 (5 apart), each slide 9 frames, rotation settles over 11. Strike 16 to 29.
// The packet waits just before the first print and comes to rest just past Victor's (safe zone: shorter run-ins).
const STRIKE = { a: 16, b: 29, from: sOf(0) - 180, to: sOf(3) + 170 } as const;
const VOICE_S = sOf(3) + 100; // Victor's voice: on the trace where it crosses his shoulder, right of his face
/** Claude's packet width (gaussian sigma) waiting and while it strikes; its coral reaches 2.6 sigma either side. */
const SIG_WAIT = 32;
const SIG_MOVE = 38;
const headAt = (t: number) => lerp(STRIKE.from, STRIKE.to, ez(t, STRIKE.a, STRIKE.b, EASE.travel));
/** How graded print i is: 0 until the strike head reaches it, 1 once it has passed its middle. */
const gradeOf = (i: number, t: number) => interpolate(headAt(t), [sOf(i) - 170, sOf(i) + 40], [0, 1], { ...CLAMP, easing: EASE.decel });

// Same keys and timing as before; values reframed so everything on screen stays inside SAFE_IG at every t (checked
// with the drift): from t 6.5 his voice sits at the far end of the trace, from t 7.9 his words sit under the fan,
// from t 11 all four prints are up.
const CAM: CamKeys = {
  t: [0, 4, 17, 29, 43, 48],
  x: [505, 512, 532, 562, 574, 574],
  y: [478, 490, 486, 492, 488, 488],
  z: [0.97, 0.95, 0.88, 0.905, 0.866, 0.864],
};

/** His words under the fan (world px on the trace plane): below Victor's print and the lower-left run of the trace,
 *  at least ~20 px clear of every print at every t. Same type, size and crossfade as /screen-push's words. */
const WORDS_Y = 920;
const GROUPS = (() => {
  const w = CLIPS.colorgrade.words;
  const g: { s: number; text: string }[] = [];
  for (let i = 0; i < w.length; i += 3) g.push({ s: w[i].s, text: w.slice(i, i + 3).map((x) => x.w).join(" ") });
  return g;
})();

/** The 3-word group being spoken at t, coral mono. Groups cross-fade (eased, 4 frames). */
const Words: React.FC<{ t: number; y: number }> = ({ t, y }) => {
  const sec = t / FPS;
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

const PrintCard: React.FC<{ p: Print; i: number; t: number; cam: Cam }> = ({ p, i, t, cam }) => {
  if (t < p.at) return null;
  const slide = ez(t, p.at, p.at + 9, EASE.decel);
  const settle = ez(t, p.at, p.at + 11, EASE.decel);
  const fade = ez(t, p.at, p.at + 5, EASE.enter);
  const c = centerOf(i);
  const x = c.x - DIR.x * SLIDE * (1 - slide);
  const y = c.y - DIR.y * SLIDE * (1 - slide);
  const rot = p.rot - 1.5 * (1 - settle);
  const scale = 1.02 - 0.02 * slide;
  const g = gradeOf(i, t);
  // The shot inside keeps pushing in and panning, eased, from its arrival to the end (secondary + ambient).
  const life = ez(t, p.at, 52, EASE.inOut);
  const z = 1.04 + 0.06 * life;
  const dx = p.pan * (life - 0.5);
  const iw = PRINT_W - BORDER * 2;
  const ih = PRINT_H - BORDER * 2;
  const sh = (a: number, b: number) => lerp(a, b, slide).toFixed(2);
  return (
    <div style={layerStyle(cam, p.k)}>
      <div
        style={{
          position: "absolute",
          left: x - PRINT_W / 2,
          top: y - PRINT_H / 2,
          width: PRINT_W,
          height: PRINT_H,
          borderRadius: RADIUS,
          background: "#1C1F25",
          opacity: fade,
          transform: `rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
          boxShadow: `0 0 0 2px rgba(233,231,226,0.42), 0 ${sh(34, 20)}px ${sh(60, 40)}px rgba(0,0,0,${sh(0.25, 0.6)}), 0 ${sh(10, 5)}px ${sh(18, 10)}px rgba(0,0,0,${sh(0.15, 0.4)})`,
          filter: p.blur > 0 ? `blur(${p.blur}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: BORDER,
            top: BORDER,
            width: iw,
            height: ih,
            borderRadius: 6,
            overflow: "hidden",
            background: UI.ink,
            // Resolve's dark grey panels sink to black in the tube: flattened a little and lifted so the UI survives.
            // His photo is a normal exposure, so it only gets the grade (saturation), not the lift.
            filter:
              p.kind === "victor"
                ? `brightness(${(0.92 + 0.08 * g).toFixed(3)}) saturate(${(0.3 + 0.75 * g).toFixed(3)})`
                : `contrast(0.88) brightness(${(1.32 + 0.18 * g).toFixed(3)}) saturate(${(0.3 + 0.9 * g).toFixed(3)})`,
          }}
        >
          {p.kind === "victor" ? (
            <ClipThumb name="hook" style={cropStyle(p.crop, iw, ih, z, dx)} />
          ) : (
            <Img src={staticFile(p.src as string)} style={cropStyle(p.crop, iw, ih, z, dx)} />
          )}
        </div>
      </div>
    </div>
  );
};

/** The scope trace along the fan's diagonal: idle line, Victor's green voice, Claude's coral packet, the coral strike. */
const Trace: React.FC<{ t: number; cam: Cam }> = ({ t, cam }) => {
  const head = headAt(t);
  const moving = t > STRIKE.a && t < STRIKE.b + 2;
  // Claude's packet: waiting and breathing at the head of the trace, strikes, then rests at the far end.
  const coralAmp = interpolate(t, [0, 14, 16, 18, 27, 31, 48], [10, 12, 20, 25, 25, 12, 9], CLAMP) * (0.86 + 0.14 * Math.sin(t * 0.43));
  const voice = voiceEnv("colorgrade", t) * (13 + 5 * Math.sin(t * 0.61) + 3 * Math.sin(t * 1.37));
  const bumps: ScopeBump[] = [
    { x: head, amp: coralAmp, sigma: moving ? SIG_MOVE : SIG_WAIT, rgb: PH.claudeRgb },
    { x: VOICE_S, amp: voice, sigma: 26, rgb: PH.userRgb },
  ];
  const hum = 1.5;
  const struck = head > STRIKE.from + 2 ? tracePts(STRIKE.from, head, t, bumps, hum) : null;
  const hy = traceY(head, t, bumps, hum);
  return (
    <div style={layerStyle(cam, 1)}>
      <svg width={W} height={SPLIT} viewBox={`0 0 ${W} ${SPLIT}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${A.x} ${A.y}) rotate(${ANGLE.toFixed(4)})`}>
          <Scope frame={t} x0={S0} x1={S1} y={0} bumps={bumps} hum={hum} stroke={3} color={TRACE_INK} />
          {struck ? (
            <>
              {/* a hard dark keyline (no blur) so the coral reads over the screenshots */}
              <polyline points={struck} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" />
              <polyline points={struck} fill="none" stroke={UI.coral} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
            </>
          ) : null}
          <circle cx={head} cy={hy} r={9} fill="rgba(0,0,0,0.55)" />
          <circle cx={head} cy={hy} r={6.5} fill={UI.coral} />
        </g>
      </svg>
    </div>
  );
};

export const ShutterStrike: React.FC<FxProps> = ({ t }) => {
  const cam = camAt(t, CAM);
  // Far plate: the real Color page, pushed in on the viewer and the clip strip, panning slowly left to right.
  const pan = ez(t, 0, 52, EASE.inOut);
  return (
    <AbsoluteFill style={{ background: UI.screen, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: SPLIT, overflow: "hidden" }}>
        <CRT>
          <AbsoluteFill style={{ background: UI.screen }}>
            <Plate cam={cam} k={0.55} src={SHOTS.color} nw={3840} nh={2160} scale={0.6} x={-780 - 110 * pan} y={-70 - 20 * pan} blur={3.5} bright={0.6} />
            <GridLayer cam={cam} k={0.8} t={t} />
            {/* a soft dark scrim under the prints so the coral words read over the far plate */}
            <div style={layerStyle(cam, 1)}>
              <div
                style={{
                  position: "absolute",
                  left: 120,
                  width: W - 240,
                  top: WORDS_Y - 18,
                  height: 104,
                  background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(16,18,23,0.94) 62%, rgba(16,18,23,0) 100%)",
                }}
              />
            </div>
            {PRINTS.map((p, i) => (
              <PrintCard key={i} p={p} i={i} t={t} cam={cam} />
            ))}
            <Trace t={t} cam={cam} />
            <div style={layerStyle(cam, 1)}>
              <Words t={t} y={WORDS_Y} />
            </div>
          </AbsoluteFill>
        </CRT>
      </div>
      {/* His whole head inside the safe rect: s 0.82 (0.837 by t 48), hair top ~1003 (about 40 px under the split), chin
          at most ~1506 (SAFE_IG bottom 1520). tx -22 centres the sharp clip (x ~97..982); the blurred footage fills the sides. */}
      <LowerClip name="colorgrade" t={t} s={0.82} tx={-22} ty={-507} />
    </AbsoluteFill>
  );
};

export const shutterstrike: FxDef = {
  id: "shutterstrike",
  command: "/shutter-strike",
  menu: "Photo cards snap in, then strike through",
  clip: "colorgrade",
  Comp: ShutterStrike,
  thumbT: [24, 32, 44],
};
