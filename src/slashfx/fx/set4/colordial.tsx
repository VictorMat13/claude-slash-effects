// /color-dial (set 4, Victor 2026-10-26): Victor's clip "plate" full frame. Under his chin (crtgraph placement) a
// see-through CRT pane: dark glass over his footage, and in it the Global color wheel cut out of the real Resolve 21
// Color page press shot (SHOTS.color), pushed in, with the rest of the wheel panel far behind it (blurred, dim, slower
// pan). The tube's black ground turns into glass (luminance to alpha), so only the phosphor ink sits over him.
// On his beats ("it's", "take", "off", "plate") Claude's coral packet runs in along the live scope trace, reaches the
// wheel's foot and the wheel turns (EASE.travel, 6 frames). His footage grades live with the dial: one angle drives
// both, temperature = sin(angle) (hue-rotate up to 8 degrees, a touch of sepia on the warm side) and saturation from
// cos(angle) (0.6 to 1.2). It opens flat (0.6) and ends rich and warm. His voice is the green wave at the
// right end of the trace. His real words as the caption above the pane.
// Camera (KEY_T, one timeline, same as crtgraph): opens tight on the pane (zoom 1.1 anchored on its top edge, tilted
// back 6 degrees), holds, then pulls out (t 9 to 25) to reveal him: the pane settles to 1.0, his clip (the far plane)
// moves less (1.07 to 1.035) and racks into focus; inside the pane the wheel slides to center and pulls out slower than
// the pane, the far panel slower still (2.5D parallax).
// Safe zone: the pane's worst frame (t 0: zoom and tilt peak) is sized into SAFE_IG; the caption sits between his chin
// and the pane's top edge. The trace stays inside the pane.
import React, { useId } from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { CRT } from "../../../artcraft/kit/Tube";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { CLIPS } from "../../data/clips";
import { SHOTS } from "../../data/facts";
import { Caption, Clip } from "../../kit";
import { CLAMP, EASE, FPS, SAFE_IG, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { voiceEnv } from "../shutterstrike";

// ---------------------------------------------------------------- the real material
/** The Color page press shot (3840 x 2160) and its Global wheel (source px): center, the turning disc's radius (the
 *  hue ring, the black bezel and both side arcs, clear of the "Global" label above it). */
const SHOT = { src: SHOTS.color, w: 3840, h: 2160 } as const;
const WHEEL = { x: 1251, y: 1741, r: 116, label: 140 } as const;

// ---------------------------------------------------------------- camera: one keyframe timeline
const KEY_T = [0, 9, 25, 48];
const key = (t: number, v: number[]) => interpolate(t, KEY_T, v, { ...CLAMP, easing: EASE.travel });
/** pane zoom (anchored on its top center) and tilt; both peak at t 0 */
const Z_KEYS = [1.1, 1.094, 1.0, 0.988];
const RX_KEYS = [6, 5.4, 1.4, 1.1];
const FLOAT = 3;
const RY = 0.6;
const PERSP = 1600;
/** the wheel's scale inside the pane (pane px per source px): pulls out slower than the pane */
const S_KEYS = [1.42, 1.41, 1.33, 1.32];
const camAt = (t: number) => ({
  z: key(t, Z_KEYS),
  rx: key(t, RX_KEYS),
  /** far plane (his clip): parallax 1.07 to 1.035, racks into focus */
  clipS: key(t, [1.07, 1.068, 1.035, 1.033]),
  clipBlur: key(t, [1.6, 1.4, 0, 0]),
  clipBright: key(t, [0.84, 0.86, 1, 1]),
  /** source x at the pane center: the wheel slides in to center */
  shotX: key(t, [1296, 1290, 1258, 1251]),
  shotS: key(t, S_KEYS),
});
/** Clip scale origin near the bottom edge: the frame stays covered and his face sits high. */
const CLIP_ORIGIN = "540px 1840px";

// ---------------------------------------------------------------- pane size (crtgraph's fit, our own keys)
/** The pane's top edge, under his jaw (chin about 1033 on screen at the rest push); the caption sits between. */
const CARD_TOP = 1126;
const EDGE = 8;
const project = (x: number, y: number, z: number, rx: number, ry: number) => {
  const a = (rx * Math.PI) / 180;
  const b = (ry * Math.PI) / 180;
  const x1 = x * z * Math.cos(b);
  const z1 = -x * z * Math.sin(b);
  const y2 = y * z * Math.cos(a) - z1 * Math.sin(a);
  const z2 = y * z * Math.sin(a) + z1 * Math.cos(a);
  const k = PERSP / (PERSP - z2);
  return { x: x1 * k, y: y2 * k };
};
const reach = (w: number, h: number) => {
  let side = 0;
  let bottom = 0;
  for (const ry of [-RY, RY])
    for (const sx of [-1, 1])
      for (const y of [0, h]) {
        const p = project((sx * w) / 2, y, Z_KEYS[0], RX_KEYS[0], ry);
        side = Math.max(side, Math.abs(p.x));
        bottom = Math.max(bottom, p.y + FLOAT);
      }
  return { side, bottom };
};
const fit = (ok: (v: number) => boolean, lo: number, hi: number) => {
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (ok(m)) lo = m;
    else hi = m;
  }
  return Math.floor(lo);
};
const CARD_H = fit((h) => CARD_TOP + reach(SAFE_IG.w, h).bottom <= SAFE_IG.y1 - EDGE, 100, SAFE_IG.h);
const CARD_W = fit((w) => reach(w, CARD_H).side <= SAFE_IG.w / 2 - EDGE, 100, SAFE_IG.w);
const CARD_R = 28;
const CARD_LEFT = (SAFE_IG.x0 + SAFE_IG.x1 - CARD_W) / 2;
const CAPTION_SIZE = 60;
const CAPTION_Y = Math.round(CARD_TOP - FLOAT - 8 - CAPTION_SIZE * 1.12);
/** The CRT pass sizes itself to the composition: draw the tube 1080 wide and scale it into a field a little larger
 *  than the pane, so the tube's vignette and corner mask fall outside the glass (they would fade the ink at its edges). */
const OVER_X = 0.16;
const OVER_Y = 0.26;
const FIELD_W = CARD_W * (1 + 2 * OVER_X);
const FIELD_H = CARD_H * (1 + 2 * OVER_Y);
const TUBE_W = 1080;
const K = FIELD_W / TUBE_W;
const TUBE_H = FIELD_H / K;

// ---------------------------------------------------------------- pane layout (pane px)
/** wheel center height: at rest the label clears the top edge and the disc stands on the trace */
const WY = Math.round(CARD_H * 0.515);
/** the trace the wheel stands on (its foot at the opening, a small gap at rest) */
const TY = Math.round(WY + WHEEL.r * S_KEYS[0] + 6);
/** his voice at the right end of the trace, Claude's packets come in from the left */
const VOICE_X = Math.round(CARD_W * 0.84);
/** the far panel: smaller and slower than the wheel */
const FAR = 0.6;
const FAR_PAN = 0.6;

// ---------------------------------------------------------------- the beats (his real word timings)
const beat = (w: string) => {
  const hit = CLIPS.plate.words.find((x) => x.w.replace(/[.,]/g, "") === w);
  if (!hit) throw new Error(`colordial: "${w}" is not spoken in clip plate`);
  return hit.s * FPS;
};
/** each turn: when (frames) and how far the dial turns (degrees) */
const TURNS = [
  { at: beat("it's"), d: 65 },
  { at: beat("take"), d: 70 },
  { at: beat("off"), d: 60 },
  { at: beat("plate"), d: 45 },
];
const TURN_LEN = 6;
/** a packet leaves the left edge this many frames before its turn */
const RUN = 10;
/** dial angle: 180 is flat (saturation 0.6), it ends at 420 (rich, warm) */
const THETA0 = 180;
const thetaAt = (t: number) => TURNS.reduce((a, k) => a + k.d * ez(t, k.at, k.at + TURN_LEN, EASE.travel), THETA0);
/** The grade the dial sets on his footage: one angle, two axes. */
const gradeAt = (t: number) => {
  const th = (thetaAt(t) * Math.PI) / 180;
  const temp = Math.sin(th);
  // saturation 0.6 (flat) to 1.2 (rich): capped at 1.2 so the red rim light on his cheek never clips (red team)
  const c = Math.cos(th);
  return { hue: 8 * temp, sat: 0.95 + (c > 0 ? 0.25 : 0.35) * c, sepia: 0.12 * Math.max(0, temp) };
};

const bumpsAt = (t: number, wheelX: number): ScopeBump[] => {
  const out: ScopeBump[] = TURNS.map((k, i) => {
    const breathe = 0.88 + 0.12 * Math.sin(t * 0.4 + i * 1.7);
    if (t < k.at) {
      const u = ez(t, k.at - RUN, k.at, EASE.travel);
      const env = interpolate(t, [k.at - RUN, k.at - RUN + 3], [0, 1], CLAMP);
      return { x: lerp(-30, wheelX, u), amp: 16 * env * breathe, sigma: 30, rgb: PH.claudeRgb };
    }
    // it reaches the wheel's foot as the wheel turns, then fades there
    return { x: wheelX, amp: 16 * (1 - ez(t, k.at, k.at + 12, EASE.decel)) * breathe, sigma: 30, rgb: PH.claudeRgb };
  });
  out.push({ x: VOICE_X, amp: voiceEnv("plate", t) * (12 + 3 * Math.sin(t * 0.61) + 1.5 * Math.sin(t * 1.37)), sigma: 34, rgb: PH.userRgb });
  return out;
};

/** The press shot placed so source point (sx, sy) lands at pane point (px, py), at scale s. */
const ShotImg: React.FC<{ s: number; sx: number; sy: number; px: number; py: number }> = ({ s, sx, sy, px, py }) => (
  <Img
    src={staticFile(SHOT.src)}
    style={{ position: "absolute", left: px - sx * s, top: py - sy * s, width: SHOT.w * s, height: SHOT.h * s, maxWidth: "none", display: "block" }}
  />
);

/** What the tube shows (pane px), light ink on black; the black becomes glass after the CRT pass. */
const Screen: React.FC<{ t: number; shotX: number; shotS: number }> = ({ t, shotX, shotS }) => {
  const on = ez(t, -6, 3, EASE.decel);
  const S = shotS;
  const wheelX = CARD_W / 2 - (shotX - WHEEL.x) * S;
  const farS = S * FAR;
  const farSX = WHEEL.x + (shotX - WHEEL.x) * FAR_PAN;
  const R = WHEEL.r * S;
  const rot = thetaAt(t) - THETA0;
  // the disc leans in a hair while it turns (eased up and down, no overshoot)
  const kick = TURNS.reduce((a, k) => a + Math.sin(Math.PI * ez(t, k.at, k.at + TURN_LEN, EASE.inOut)), 0);
  const nearMask = `radial-gradient(ellipse ${(190 * S).toFixed(1)}px ${(160 * S).toFixed(1)}px at ${wheelX.toFixed(1)}px ${(WY - 35 * S).toFixed(1)}px, #000 72%, transparent 100%)`;
  const farMask = `radial-gradient(circle at ${wheelX.toFixed(1)}px ${WY}px, transparent ${(150 * S).toFixed(1)}px, #000 ${(235 * S).toFixed(1)}px)`;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scaleY(${lerp(0.02, 1, on).toFixed(4)})`,
          filter: on < 0.999 ? `brightness(${(1 + 1.4 * (1 - on)).toFixed(3)})` : undefined,
        }}
      >
        {/* far: the rest of the wheel panel (Highlight wheel left, ColorSlice right), soft and dim, panning slower */}
        <div style={{ position: "absolute", inset: 0, filter: "blur(1.3px) brightness(0.96)", WebkitMaskImage: farMask, maskImage: farMask }}>
          <ShotImg s={farS} sx={farSX} sy={WHEEL.y} px={CARD_W / 2} py={WY} />
        </div>
        {/* near: the Global wheel and its label, cut out of the page */}
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: nearMask, maskImage: nearMask }}>
          <ShotImg s={S} sx={shotX} sy={WHEEL.y} px={CARD_W / 2} py={WY} />
        </div>
        {/* the dial: the wheel itself (ring, bezel, side arcs) turns on the beats */}
        <div
          style={{
            position: "absolute",
            left: wheelX - R,
            top: WY - R,
            width: 2 * R,
            height: 2 * R,
            borderRadius: "50%",
            overflow: "hidden",
            transform: `rotate(${rot.toFixed(3)}deg) scale(${(1 + 0.014 * kick).toFixed(4)})`,
          }}
        >
          <ShotImg s={S} sx={WHEEL.x} sy={WHEEL.y} px={R} py={R} />
        </div>
        <svg width={CARD_W} height={CARD_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Scope frame={t} x0={-10} x1={CARD_W + 10} y={TY} bumps={bumpsAt(t, wheelX)} hum={1.4} stroke={3.4} color="rgba(243,241,236,0.86)" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const ColorDial: React.FC<FxProps> = ({ t }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const glassId = `colordial-glass-${uid}`;
  const c = camAt(t);
  const g = gradeAt(t);
  // ambient: the clip drifts a hair (never down: the bottom edge has little slack), the pane floats and turns
  const dx = 3 * Math.sin(t * 0.07);
  const dy = 1.5 * Math.sin(t * 0.05) - 1.5;
  const float = FLOAT * Math.sin(t * 0.14);
  const ry = RY * Math.sin(t * 0.06);
  const clipFilter = [
    c.clipBlur > 0.05 ? `blur(${c.clipBlur.toFixed(2)}px)` : "",
    `brightness(${c.clipBright.toFixed(3)})`,
    `sepia(${g.sepia.toFixed(4)})`,
    `saturate(${g.sat.toFixed(4)})`,
    `hue-rotate(${g.hue.toFixed(3)}deg)`,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {/* luminance to alpha: the tube's black ground becomes glass, its ink stays */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id={glassId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.6 0.8 0.45 0 0" />
          </filter>
        </defs>
      </svg>
      {/* his footage, graded live by the dial */}
      <AbsoluteFill style={{ transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${c.clipS.toFixed(4)})`, transformOrigin: CLIP_ORIGIN, filter: clipFilter }}>
        <Clip name="plate" />
      </AbsoluteFill>
      <Caption name="plate" t={t} y={CAPTION_Y} size={CAPTION_SIZE} maxWidth={SAFE_IG.w} />
      <div
        style={{
          position: "absolute",
          left: CARD_LEFT,
          top: CARD_TOP,
          width: CARD_W,
          height: CARD_H,
          transformOrigin: `${CARD_W / 2}px 0px`,
          transform: `perspective(${PERSP}px) translateY(${float.toFixed(2)}px) rotateX(${c.rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${c.z.toFixed(4)})`,
        }}
      >
        {/* see-through glass: dark tint over his blurred footage, a keyline */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: CARD_R,
            // darker along the top edge, where his neck sits behind the glass
            background: "linear-gradient(180deg, rgba(10, 12, 16, 0.76) 0%, rgba(10, 12, 16, 0.58) 42%, rgba(10, 12, 16, 0.52) 100%)",
            backdropFilter: "blur(12px) saturate(0.85) brightness(0.6)",
            WebkitBackdropFilter: "blur(12px) saturate(0.85) brightness(0.6)",
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.24), inset 0 0 28px rgba(0,0,0,0.35), 0 24px 54px rgba(0,0,0,0.38)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, borderRadius: CARD_R, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: -OVER_X * CARD_W,
              top: -OVER_Y * CARD_H,
              width: TUBE_W,
              height: TUBE_H,
              overflow: "hidden",
              transform: `scale(${K})`,
              transformOrigin: "0 0",
              filter: `url(#${glassId})`,
            }}
          >
            <CRT loop={150} bloom={0}>
              <div style={{ position: "absolute", left: (OVER_X * CARD_W) / K, top: (OVER_Y * CARD_H) / K, width: CARD_W, height: CARD_H, transform: `scale(${1 / K})`, transformOrigin: "0 0" }}>
                <Screen t={t} shotX={c.shotX} shotS={c.shotS} />
              </div>
            </CRT>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const colordial: FxDef = {
  id: "colordial",
  command: "/color-dial",
  menu: "A color wheel grades your footage live",
  clip: "plate",
  Comp: ColorDial,
  thumbT: [18, 30, 44],
};
