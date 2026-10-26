// /track-glitch (set 4, Victor 2026-10-26, retimed after red team): Victor's clip "hook" full frame; his face is the home
// picture. On his beats the picture swaps to a real Resolve 21 press shot, pushed in, and back: the Color page on
// "DaVinci", back to him on "Resolve", the Edit page on "edit" (it stays through the reel's scroll-out), back to him on
// "AI" so the probe and the ending grid end on him. Every swap is a CRT tracking glitch built like the fish8 tube's
// (src/fish8/crt.tsx, copied, not imported): horizontal band displacement (fractal noise quantized into bands that roll
// down the picture, one fixed seed per glitch) and a convergence split (red right, blue left). Each glitch is 6 frames:
// 2 frames in, 1 swap frame (the only frame where two pictures mix, 50/50, at the glitch peak), 3 frames out. The swap
// frame is the frame his word lands in. Each press shot pans slowly while it is up (EASE.travel).
// The live scope trace runs under the picture, inside the same tube, so it tears with it: his voice is the green wave
// under him; before each glitch Claude's coral packet runs in from the left edge and spikes on the swap.
// Camera (KEY_T, one timeline, the whole picture stack): opens tight on his face (1.06), holds, pulls out (t 9 to 25)
// to 1.012, holds; a 2.4 px drift. The caption and the trace sit nearer the lens and ride the drift more (2.5D).
// Safe zone: the caption (under his chin) and the trace's spikes stay inside SAFE_IG; the picture is the background.
import React, { useId } from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { CLIPS } from "../../data/clips";
import { SHOTS } from "../../data/facts";
import { Caption, Clip } from "../../kit";
import { CLAMP, EASE, FPS, H, SAFE_IG, W, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { voiceEnv } from "../shutterstrike";

// ---------------------------------------------------------------- the beats (his real word timings)
const word = (w: string) => {
  const hit = CLIPS.hook.words.find((x) => x.w.replace(/[.,]/g, "") === w);
  if (!hit) throw new Error(`trackglitch: "${w}" is not spoken in clip hook`);
  return hit;
};
const within = (w: string, f: number) => {
  const x = word(w);
  return (x.s + f * (x.e - x.s)) * FPS;
};
/** The swap frame of each glitch: the frame his word lands in. At 24 fps: 10 ("DaVinci" at 10.6), 20 ("Resolve" at
 *  20.5), 32 ("edit" at 32.2), 42 ("AI" at 42.3). Pictures: him, Color, him, Edit, him. */
const PEAKS = [within("DaVinci", 0.3), within("Resolve", 0.55), word("edit").s * FPS, word("AI").s * FPS].map(Math.floor);
/** g > 0 on frames P - 2, P - 1 (in), P (swap, peak), P + 1..P + 3 (out); P - 3 and P + 4 are clean */
const GROW = 3;
const SETTLE = 4;
/** 0..1 strength of glitch k at t */
const glitchK = (t: number, k: number) => {
  const p = PEAKS[k];
  if (t < p) return interpolate(t, [p - GROW, p], [0, 1], { ...CLAMP, easing: EASE.inOut });
  return 1 - ez(t, p, p + SETTLE, EASE.decel);
};
/** the new picture dissolves in across the swap frame: 0 on P - 1, 0.5 on P, 1 on P + 1 */
const swap = (t: number, p: number) => ez(t, p - 1, p + 1, EASE.inOut);

// ---------------------------------------------------------------- the press shots, pushed in (source px)
type Shot = { src: string; w: number; h: number; s: [number, number]; cx: [number, number]; cy: [number, number] };
/** Color page: the viewer, the clip strip and the wheels */
const COLOR: Shot = { src: SHOTS.color, w: 3840, h: 2160, s: [1.12, 1.17], cx: [1520, 1420], cy: [1240, 1265] };
/** Edit page: the program viewer and the timeline under the playhead */
const EDIT: Shot = { src: SHOTS.edit, w: 5120, h: 2880, s: [0.92, 0.97], cx: [3620, 3770], cy: [1580, 1620] };
/** the press shots and the glitches that bring them in and take them out (indexes into PEAKS) */
const VISITS = [
  { shot: COLOR, a: 0, b: 1 },
  { shot: EDIT, a: 2, b: 3 },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const PressShot: React.FC<{ shot: Shot; u: number; opacity: number }> = ({ shot, u, opacity }) => {
  const s = lerp(shot.s[0], shot.s[1], u);
  const left = clamp(W / 2 - lerp(shot.cx[0], shot.cx[1], u) * s, W - shot.w * s, 0);
  const top = clamp(H / 2 - lerp(shot.cy[0], shot.cy[1], u) * s, H - shot.h * s, 0);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity, background: "#000" }}>
      <Img src={staticFile(shot.src)} style={{ position: "absolute", left, top, width: shot.w * s, height: shot.h * s, maxWidth: "none", display: "block" }} />
    </div>
  );
};

// ---------------------------------------------------------------- camera (the whole picture stack)
const KEY_T = [0, 9, 25, 48];
const key = (t: number, v: number[]) => interpolate(t, KEY_T, v, { ...CLAMP, easing: EASE.travel });
/** his face in the clip: the camera grows him in place */
const ORIGIN = { x: 560, y: 840 };
const camAt = (t: number) => ({
  z: key(t, [1.06, 1.055, 1.012, 1.008]),
  // at z 1.008 the footage overscans 4 px or more on every side, so the drift never shows an edge
  dx: 2.4 * Math.sin(t * 0.08 + 0.3),
  dy: 2 * Math.sin(t * 0.06 + 1.1),
});
/** the caption and the trace sit nearer the lens */
const NEAR = 1.35;

// ---------------------------------------------------------------- the trace
const TY = 1452;
const VOICE_X = 560;
/** where each glitch's packet spikes, alternating either side of him */
const SPIKE_X = [360, 720, 440, 640];
const RUN = 8;
const bumpsAt = (t: number): ScopeBump[] => {
  const out: ScopeBump[] = [
    { x: VOICE_X, amp: voiceEnv("hook", t) * (14 + 4 * Math.sin(t * 0.61) + 2 * Math.sin(t * 1.37)), sigma: 34, rgb: PH.userRgb },
  ];
  // one packet per glitch: it runs in from the left edge, spikes on the swap frame, then fades where it stopped
  PEAKS.forEach((p, k) => {
    const a = p - GROW - RUN;
    const env = interpolate(t, [a, a + 3, p + SETTLE, p + SETTLE + 6], [0, 1, 1, 0], CLAMP);
    if (env <= 0.001) return;
    const x = lerp(-30, SPIKE_X[k], ez(t, a, p - 1, EASE.travel));
    out.push({ x, amp: 16 * env + 52 * glitchK(t, k), sigma: 24, rgb: PH.claudeRgb });
  });
  return out;
};

// ---------------------------------------------------------------- the glitch (fish8 tube recipe, own ids)
/** px of horizontal tear per unit of band value away from 0.5 */
const DISP = 300;
/** px the red and blue channels split at the peak */
const CONV = 14;
/** px per frame the bands roll down */
const ROLL = 30;

const GlitchFilter: React.FC<{ id: string; g: number; k: number; t: number }> = ({ id, g, k, t }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        {/* noise that only varies down the frame, quantized into hard bands: only some rows tear */}
        <feTurbulence type="fractalNoise" baseFrequency="0 0.011" numOctaves={1} seed={7 + 13 * k} result="noise" />
        <feComponentTransfer in="noise" result="bands">
          <feFuncR type="discrete" tableValues="0.5 0.5 0.66 0.56 0.5 0.5 0.43 0.33 0.5 0.5" />
          <feFuncG type="discrete" tableValues="0.5" />
          <feFuncB type="discrete" tableValues="0.5" />
          <feFuncA type="discrete" tableValues="1" />
        </feComponentTransfer>
        {/* the bands roll down; rows above them stay put */}
        <feFlood floodColor="rgb(128,128,128)" result="still" />
        <feOffset in="bands" dx={0} dy={Math.max(0, t - (PEAKS[k] - GROW)) * ROLL} result="rolled" />
        <feMerge result="map">
          <feMergeNode in="still" />
          <feMergeNode in="rolled" />
        </feMerge>
        <feDisplacementMap in="SourceGraphic" in2="map" scale={DISP * g} xChannelSelector="R" yChannelSelector="G" result="disp" />
        {/* convergence error: red right, blue left */}
        <feColorMatrix in="disp" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={CONV * g} dy={0} result="r2" />
        <feColorMatrix in="disp" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gch" />
        <feColorMatrix in="disp" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-CONV * g} dy={0} result="b2" />
        <feBlend in="r2" in2="gch" mode="screen" result="rg" />
        <feBlend in="rg" in2="b2" mode="screen" />
      </filter>
    </defs>
  </svg>
);

export const TrackGlitch: React.FC<FxProps> = ({ t }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const filterId = `trackglitch-${uid}`;
  const cam = camAt(t);
  // the strongest glitch at t
  let g = 0;
  let k = 0;
  PEAKS.forEach((_, i) => {
    const v = glitchK(t, i);
    if (v > g) {
      g = v;
      k = i;
    }
  });
  // each press shot dissolves in over him on its swap frame in and back out to him on its swap frame out
  const press = VISITS.map(({ shot, a, b }) => {
    const opacity = swap(t, PEAKS[a]) * (1 - swap(t, PEAKS[b]));
    const u = ez(t, PEAKS[a] - 1, PEAKS[b] + 1, EASE.travel);
    return { shot, opacity, u };
  });
  const onPress = Math.max(...press.map((p) => p.opacity));
  const near = { x: cam.dx * NEAR, y: cam.dy * NEAR };
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {g > 0.002 ? <GlitchFilter id={filterId} g={g} k={k} t={t} /> : null}
      {/* the tube: picture and trace glitch together */}
      <AbsoluteFill style={{ background: "#000", filter: g > 0.002 ? `url(#${filterId})` : undefined }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
            transform: `translate(${cam.dx.toFixed(2)}px, ${cam.dy.toFixed(2)}px) scale(${cam.z.toFixed(5)})`,
          }}
        >
          <Clip name="hook" />
          {press.map((p) => (p.opacity > 0.001 ? <PressShot key={p.shot.src} shot={p.shot} u={p.u} opacity={p.opacity} /> : null))}
        </div>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", transform: `translate(${near.x.toFixed(2)}px, ${near.y.toFixed(2)}px)` }}>
          {/* a dark keyline under the trace so it reads over his shirt and the bright UI */}
          <Scope frame={t} x0={-30} x1={W + 30} y={TY} bumps={bumpsAt(t)} hum={1.6} stroke={7} color="rgba(0,0,0,0.32)" />
          <Scope frame={t} x0={-30} x1={W + 30} y={TY} bumps={bumpsAt(t)} hum={1.6} stroke={3.2} color="rgba(243,241,236,0.8)" />
        </svg>
      </AbsoluteFill>
      {/* tube surface: scanlines show on the press shots and swell with the glitch */}
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.32) 0px, rgba(0,0,0,0.32) 1px, transparent 1px, transparent 4px)",
          backgroundPosition: `0 ${(t % 2) * 2}px`,
          opacity: Math.min(1, 0.22 * onPress + 0.7 * g),
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${near.x.toFixed(2)}px, ${near.y.toFixed(2)}px)` }}>
        <Caption name="hook" t={t} y={1112} size={62} chunk={3} maxWidth={SAFE_IG.w - 40} />
      </div>
    </AbsoluteFill>
  );
};

export const trackglitch: FxDef = {
  id: "trackglitch",
  command: "/track-glitch",
  menu: "Press shots swap in on a tracking glitch",
  clip: "hook",
  Comp: TrackGlitch,
  thumbT: [16, 28, 36],
};
