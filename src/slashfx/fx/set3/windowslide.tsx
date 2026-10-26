// /window-slide (set 3 on the ArtCraft take, Victor 2026-10-26): his footage full frame with a dark CRT pane above his head,
// the size of the safe rect's upper half. The pane is two door halves: the ArtCraft mark (LOGOS.resolve), "PhotoCraft"
// (COUNTS_TITLE) and "MCP server" (MCP.phrase, coral) typed across the seam. On "features" a green packet leaves his voice
// on the live scope trace that runs along the pane's bottom edge and splits in two; the halves follow the two packets apart
// (eased, each half sliding into its pocket and receding a touch) to reveal the real PhotoCraft capture (SHOTS.color)
// behind them, pushed in on the canvas and the Curves and Layers panels, racking into focus and panning slowly toward the
// panels. The frame answers in coral when the halves land. On "to" (t 30) the packets run back in from the edges and the
// halves close behind them, shut by t 40 as "keyboard shortcuts." comes up, before the reel has scrolled the effect out
// (it is mounted for t 0..41 and scrolls out from t 32).
// Timing: "features" and "shortcuts" are 1.7 s (41 frames) apart in the take, longer than the whole mount, so the clip
// starts OFFSET frames in (at "same features"); the reel is muted, his lips and the caption follow the offset.
// Face rule: over that span his head spans x 315..810 and y 385..945, so a pane this size would cover it where it was shot.
// The take is lowered by DROP px instead (no extra zoom): the smallest drop that keeps his hair under the trace's peak.
// A blurred copy of the same take fills the band above, so the footage still runs edge to edge.
// 2.5D: room (far), pane and trace (near, 1.25x the drift), the capture recessed behind the halves (moves against the drift).
// Camera: hold, one push 1.0 to 1.04 anchored on the seam above his head, hold; a small sine drift throughout.
// Safe zone: the pane, its packets and the caption stay inside SAFE_IG at every t, including the push and the drift.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { CRT } from "../../../artcraft/kit/Tube";
import type { ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { COUNTS_TITLE, LOGOS, MCP, SHOTS } from "../../data/facts";
import { Caption, Clip, DarkGrid, MONO } from "../../kit";
import { CLAMP, EASE, H, SAFE_IG, UI, W, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { TRACE_INK, tracePts, traceY, voiceEnv } from "../shutterstrike";

// ---------------------------------------------------------------- layout (pre-camera px)
/** The pane: centered, its top far enough under the safe top to survive the 1.04 push about the seam. */
const WIN = { x0: 132, x1: 948, y0: 322, y1: 730, r: 16 } as const;
const WW = WIN.x1 - WIN.x0;
const WH = WIN.y1 - WIN.y0;
const HALF = WW / 2;
const CX = W / 2;
/** The live trace runs just under the pane's bottom edge, the length of the frame. */
const TRACE_Y = WIN.y1 + 14;
/** His take, lowered so his hair (385 at its highest) clears the trace and its voice peak (about 762): hair from about 775,
 *  chin about 1335 (1360 at the end of the push), well above the caption. */
const DROP = 390;
/** The clip starts this many frames in (24 fps), at "same features". */
const OFFSET = 44;
const CLIP = "a_shortcuts" as const;
const FEATHER = "linear-gradient(to bottom, rgba(0,0,0,0) 0px, #000 170px)";
/** Footage overscan so the drift never shows an edge (1.012 x 1.04 = 1.052, under the 1.07 cap). */
const OVERSCAN = 1.012;

// ---------------------------------------------------------------- camera
const KEY_T = [0, 8, 30, 48];
const ZOOM = [1.0, 1.0, 1.04, 1.04];
const ANCHOR = { x: CX, y: TRACE_Y };
const NEAR = 1.25;
const camAt = (t: number) => ({
  z: interpolate(t, KEY_T, ZOOM, { ...CLAMP, easing: EASE.travel }),
  dx: 4 * Math.sin(t * 0.08 + 0.5),
  dy: 2 * Math.sin(t * 0.061 + 1.2),
});

// ---------------------------------------------------------------- beats (24 fps, CLIPS.a_shortcuts word timings less OFFSET)
/** "features" starts at t 3.5: the packets split and run out; the halves follow LAG frames behind (open by t 17). */
const OPEN = { a: 3.5, b: 15.5 } as const;
/** "to" starts at t 30.2: the packets run back in from the edges, the halves close behind them, shut at CLOSE.b + LAG = 40
 *  as "keyboard" (t 37.2) brings up the caption "keyboard shortcuts." ("shortcuts" itself is at t 44.4, after the mount). */
const CLOSE = { a: 30, b: 38.5 } as const;
const LAG = 1.5;
const progress = (t: number, lag: number) => ez(t, OPEN.a + lag, OPEN.b + lag, EASE.travel) - ez(t, CLOSE.a + lag, CLOSE.b + lag, EASE.travel);
/** Each half recedes a touch mid-travel (scaled about its outer edge). */
const recede = (g: number) => 1 - 0.04 * Math.sin(Math.PI * g);
/** Distance of a half's inner edge from the center line at progress g. */
const edgeOff = (g: number) => HALF * (g + 1 - recede(g));

// ---------------------------------------------------------------- the trace
const HUM = 1.4;
const bumpsAt = (t: number) => {
  const green = PH.userRgb;
  const bumps: ScopeBump[] = [];
  // His voice, above his head at the center of the line.
  bumps.push({ x: CX, amp: 2.5 + 14 * voiceEnv(CLIP, t + OFFSET) + 1.2 * Math.sin(t * 0.37), sigma: 54, rgb: green });
  const packets: { x: number; env: number }[] = [];
  const pOpen = ez(t, OPEN.a, OPEN.b, EASE.travel);
  const envOpen = interpolate(t, [OPEN.a - 1, OPEN.a + 2, OPEN.b - 1, OPEN.b + 4], [0, 1, 1, 0], CLAMP);
  const pClose = ez(t, CLOSE.a, CLOSE.b, EASE.travel);
  const envClose = interpolate(t, [CLOSE.a - 1, CLOSE.a + 2, CLOSE.b - 1, CLOSE.b + 4], [0, 1, 1, 0], CLAMP);
  for (const s of [-1, 1]) {
    if (envOpen > 0.01) packets.push({ x: CX + s * edgeOff(pOpen), env: envOpen });
    if (envClose > 0.01) packets.push({ x: CX + s * edgeOff(1 - pClose), env: envClose });
  }
  for (const p of packets) bumps.push({ x: p.x, amp: 15 * p.env, sigma: 26, rgb: green });
  // The frame answers in coral once the halves land, then settles to a hum; it lets go as they close.
  const ans = interpolate(t, [OPEN.b + LAG - 2, OPEN.b + LAG + 1, OPEN.b + LAG + 16], [0, 1, 0.3], CLAMP) * (1 - pClose);
  if (ans > 0.01) for (const x of [WIN.x0 + 28, WIN.x1 - 28]) bumps.push({ x, amp: 10 * ans, sigma: 30, rgb: PH.claudeRgb });
  return { bumps, packets };
};

const Trace: React.FC<{ t: number }> = ({ t }) => {
  const { bumps, packets } = bumpsAt(t);
  const g = progress(t, 0);
  const lit = edgeOff(Math.max(0, g));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <polyline points={tracePts(-80, W + 80, t, bumps, HUM, TRACE_Y)} fill="none" stroke={TRACE_INK} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {/* the span the packets have opened is lit brighter: the line is what opens the pane */}
      {lit > 3 ? (
        <polyline points={tracePts(CX - lit, CX + lit, t, bumps, HUM, TRACE_Y)} fill="none" stroke="rgba(243,241,236,0.9)" strokeWidth={3.4} strokeLinejoin="round" strokeLinecap="round" />
      ) : null}
      {bumps.map((b, i) => {
        if (b.amp < 0.5) return null;
        const s = b.sigma ?? 70;
        return (
          <polyline
            key={i}
            points={tracePts(b.x - 2.6 * s, b.x + 2.6 * s, t, bumps, HUM, TRACE_Y)}
            fill="none"
            stroke={`rgba(${b.rgb},${Math.min(1, 0.4 + b.amp / 26).toFixed(3)})`}
            strokeWidth={3.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
      {packets.map((p, i) => {
        const y = TRACE_Y + traceY(p.x, t, bumps, HUM);
        return (
          <g key={i} opacity={p.env}>
            <circle cx={p.x} cy={y} r={9} fill="rgba(0,0,0,0.55)" />
            <circle cx={p.x} cy={y} r={6.5} fill={PH.user} />
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- inside the pane
/** The PhotoCraft capture (2400 x 1500): pushed in on the Properties and Layers panels with the wave's edge beside them,
 *  racking into focus as the halves open, panning down from the Curves graph to the layer list. px moves it against the
 *  camera drift (it sits deeper than the pane). The cream canvas is held down so it does not bloom in the tube. */
const PlateShot: React.FC<{ t: number; px: number }> = ({ t, px }) => {
  const life = ez(t, 4, 48, EASE.inOut);
  // Natural px: x 1560..2360, y 620..1020 (the wave's edge, Reset to defaults, the Layers tab) down to x 1646..2374,
  // y 968..1332 (the boats and foam beside the layer list: Curves 1, Vibrance 1, Credit, Title, Caption Card).
  const k = (WW / 800) * lerp(1.0, 1.1, life);
  const cx = lerp(1960, 2010, life);
  const cy = lerp(820, 1150, life);
  const focus = ez(t, OPEN.a, OPEN.b + 6, EASE.inOut);
  return (
    <Img
      src={staticFile(SHOTS.color)}
      style={{
        position: "absolute",
        width: 2400 * k,
        height: 1500 * k,
        left: WW / 2 - cx * k + px,
        top: WH / 2 - cy * k,
        maxWidth: "none",
        filter: `blur(${lerp(2.6, 0.35, focus).toFixed(2)}px) contrast(0.98) brightness(${lerp(0.5, 0.76, focus).toFixed(3)}) saturate(${lerp(0.6, 1, focus).toFixed(3)})`,
      }}
    />
  );
};

const TITLE_SIZE = 50;
const TITLE_TOP = 238;
const TITLE_W = COUNTS_TITLE.length * 0.6 * TITLE_SIZE; // JetBrains Mono advances 0.6 em
const SUB_SIZE = 32;
const SUB_TOP = 308;
const SUB_W = MCP.phrase.length * 0.6 * SUB_SIZE;

/** The closed face, drawn across the full pane and cut in two by the halves: the ArtCraft mark, PhotoCraft typed in. */
const DoorFace: React.FC<{ t: number }> = ({ t }) => {
  const n1 = Math.round(COUNTS_TITLE.length * ez(t, -12, -1, EASE.inOut));
  const n2 = Math.round(MCP.phrase.length * ez(t, -2, 3, EASE.inOut));
  const caretOn = 0.5 + 0.5 * Math.cos(t * 0.55);
  const caretFade = 1 - ez(t, OPEN.a, OPEN.a + 4, EASE.inOut);
  const typing2 = n2 > 0;
  const caretX = typing2 ? HALF - SUB_W / 2 + n2 * 0.6 * SUB_SIZE : HALF - TITLE_W / 2 + n1 * 0.6 * TITLE_SIZE;
  const caretTop = typing2 ? SUB_TOP : TITLE_TOP;
  const caretH = typing2 ? SUB_SIZE : TITLE_SIZE;
  const breathe = 1 + 0.012 * Math.sin(t * 0.21);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: WW, height: WH, background: "#121419", overflow: "hidden" }}>
      <DarkGrid shift={t * 0.3} pitch={34} style={{ backgroundColor: "transparent" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 70% at 50% 45%, rgba(255,255,255,0.04), rgba(0,0,0,0.28))" }} />
      <Img
        src={staticFile(LOGOS.resolve)}
        style={{ position: "absolute", left: HALF - 62, top: 92, width: 124, height: 124, transform: `scale(${breathe.toFixed(4)})` }}
      />
      <div
        style={{
          position: "absolute",
          left: HALF - TITLE_W / 2,
          top: TITLE_TOP,
          fontFamily: MONO,
          fontWeight: 500,
          fontSize: TITLE_SIZE,
          lineHeight: 1,
          color: UI.screenInk,
          whiteSpace: "pre",
        }}
      >
        {COUNTS_TITLE.slice(0, n1)}
      </div>
      <div
        style={{
          position: "absolute",
          left: HALF - SUB_W / 2,
          top: SUB_TOP,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: SUB_SIZE,
          lineHeight: 1,
          color: UI.coral,
          whiteSpace: "pre",
        }}
      >
        {MCP.phrase.slice(0, n2)}
      </div>
      <div
        style={{
          position: "absolute",
          left: caretX + 3,
          top: caretTop,
          width: caretH * 0.5,
          height: caretH,
          background: typing2 ? UI.coral : UI.screenInk,
          opacity: caretOn * caretFade * 0.85,
        }}
      />
    </div>
  );
};

/** One half: the face cut at the seam, sliding into its pocket (clipped by the pane) and receding about its outer edge. */
const Half: React.FC<{ side: -1 | 1; g: number; t: number }> = ({ side, g, t }) => {
  const s = recede(g);
  const shade = 1 - 0.32 * g;
  return (
    <div
      style={{
        position: "absolute",
        left: side < 0 ? 0 : HALF,
        top: 0,
        width: HALF,
        height: WH,
        overflow: "hidden",
        transformOrigin: side < 0 ? "0% 50%" : "100% 50%",
        transform: `translateX(${(side * g * HALF).toFixed(2)}px) scale(${s.toFixed(4)})`,
        boxShadow: "0 0 40px rgba(0,0,0,0.6)",
        filter: `brightness(${shade.toFixed(3)})`,
      }}
    >
      <div style={{ position: "absolute", left: side < 0 ? 0 : -HALF, top: 0, width: WW, height: WH }}>
        <DoorFace t={t} />
      </div>
      {/* the meeting edge: a light keyline and a bevel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: 22,
          [side < 0 ? "right" : "left"]: 0,
          background: `linear-gradient(${side < 0 ? "to left" : "to right"}, rgba(236,233,226,0.12), rgba(236,233,226,0))`,
        }}
      />
      <div style={{ position: "absolute", top: 0, bottom: 0, width: 2, [side < 0 ? "right" : "left"]: 0, background: "rgba(236,233,226,0.55)" }} />
    </div>
  );
};

/** The pane: the press shot recessed behind the two halves, all through the CRT tube, with a keyline frame. */
const Pane: React.FC<{ t: number; px: number }> = ({ t, px }) => {
  const g = Math.max(0, progress(t, LAG));
  const eL = HALF - edgeOff(g);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: WIN.x0,
          top: WIN.y0,
          width: WW,
          height: WH,
          borderRadius: WIN.r,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 6px 16px rgba(0,0,0,0.4)",
        }}
      >
        <CRT bloom={0.35}>
          <AbsoluteFill style={{ background: UI.screen }}>
            <PlateShot t={t} px={px} />
            {/* the recess: the pane's inner shadow, and the shadow each half casts on the shot behind it */}
            <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 60px rgba(0,0,0,0.65)" }} />
            {g > 0.002 ? (
              <>
                <div style={{ position: "absolute", top: 0, bottom: 0, left: eL, width: 70, background: "linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0))" }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, left: WW - eL - 70, width: 70, background: "linear-gradient(to left, rgba(0,0,0,0.6), rgba(0,0,0,0))" }} />
              </>
            ) : null}
            {g < 0.999 ? (
              <>
                <Half side={-1} g={g} t={t} />
                <Half side={1} g={g} t={t} />
              </>
            ) : null}
          </AbsoluteFill>
        </CRT>
      </div>
      <div
        style={{
          position: "absolute",
          left: WIN.x0,
          top: WIN.y0,
          width: WW,
          height: WH,
          borderRadius: WIN.r,
          boxShadow: "inset 0 0 0 2px rgba(233,231,226,0.42)",
          pointerEvents: "none",
        }}
      />
    </>
  );
};

// ---------------------------------------------------------------- the effect
export const WindowSlide: React.FC<FxProps> = ({ t }) => {
  const cam = camAt(t);
  const camera = (k: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    transformOrigin: `${ANCHOR.x}px ${ANCHOR.y}px`,
    transform: `translate(${(cam.dx * k).toFixed(2)}px, ${(cam.dy * k).toFixed(2)}px) scale(${cam.z.toFixed(5)})`,
  });
  return (
    <AbsoluteFill style={{ background: UI.bg, overflow: "hidden" }}>
      {/* Far: the room. A blurred copy of the take fills the band above; the take itself, lowered by DROP, feathers into it. */}
      <div style={camera(1)}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${CX}px ${TRACE_Y}px`, transform: `scale(${OVERSCAN})` }}>
          <Clip name={CLIP} offset={OFFSET} style={{ filter: "blur(26px) brightness(0.5) saturate(0.85)" }} />
          <div style={{ position: "absolute", left: 0, top: DROP, width: W, height: H, WebkitMaskImage: FEATHER, maskImage: FEATHER }}>
            <Clip name={CLIP} offset={OFFSET} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 62%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.3) 100%)" }} />
      {/* Near: the pane and the trace. */}
      <div style={camera(NEAR)}>
        <Pane t={t} px={-cam.dx * 0.8} />
        <Trace t={t} />
      </div>
      {/* His words under his chin, four at a time ("the exact same features," then "right down to the"), anchored by the
          bottom edge so a wrap grows up, never past the safe bottom. */}
      <Caption name={CLIP} t={t} offset={OFFSET} size={58} chunk={4} maxWidth={SAFE_IG.w - 40} style={{ top: undefined, bottom: H - (SAFE_IG.y1 - 12) }} />
    </AbsoluteFill>
  );
};

export const windowslide: FxDef = {
  id: "windowslide",
  command: "/window-slide",
  menu: "A CRT pane slides open on the app",
  clip: CLIP,
  Comp: WindowSlide,
  thumbT: [18, 24, 28],
};
