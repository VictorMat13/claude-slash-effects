// /pixel-portrait (set 3, builder S3-A). Victor's footage full frame, drawn through the CRT tube as an LED dot matrix:
// every 14 px cell of the take gets one lit dot whose radius follows the cell's mean brightness, in the cell's color,
// over a faint unlit LED on every cell (a fixed-resolution canvas, painted from each decoded frame). Where his voice is loud the dots resolve into the real footage in a soft
// circle around his face (the circle breathes with each word's loudness, from the real word timings of the take);
// when he pauses it falls back to dots. The live scope trace runs under the portrait: his voice is the green amplitude
// under his face, every word sends two green packets out along the line, and Claude's coral packet runs in on "editing".
// Camera: one slow push 1.0 to 1.04 on his face (eased), with a 3 px drift hidden under the tube bezel.
// His words as the caption at the bottom, inside SAFE_IG (x 100..980, y 290..1520) at every t.
import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile } from "remotion";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { CRT } from "../../../artcraft/kit/Tube";
import { CLIPS } from "../../data/clips";
import { Caption, Clip } from "../../kit";
import { CLAMP, EASE, FPS, H, SAFE_IG, W, ez, lerp, type FxDef, type FxProps } from "../../theme";

const CLIP = "boring" as const;
const BG = "#0E0D10";

// ---------------------------------------------------------------- the LED wall
// Drawn into one canvas at a fixed 1080 x 1920 from each decoded frame of the take (OffthreadVideo onVideoFrame), so the
// grid is exact at every size the reel shows it (the result card at 38%, the push, the ending grid): the reel's scale
// only resamples a finished bitmap. (An SVG filter grid was rasterized at the device scale and seamed there.)
/** LED pitch (px) and the largest lit dot, as a fraction of the cell (dots never touch). */
const P = 14;
const MAX_DOT = 0.84;
const COLS = Math.ceil(W / P);
const ROWS = Math.ceil(H / P);
/** Unlit LEDs: a faint dot on every cell, bright enough to survive the tube's black crush. */
const UNLIT = "rgba(255,255,255,0.11)";
const UNLIT_R = 2.4;
/** Brightness to dot size: a small floor, then close to linear so his face keeps its shading; capped at MAX_DOT. */
const dotSize = (lum: number) => Math.min(MAX_DOT, 0.08 + 1.2 * Math.pow(lum, 0.92));
/** LED ink: the cell's color, lifted like a lit diode. */
const LIFT = { slope: 1.35, add: 0.03 * 255 };
const lift = (c: number) => Math.min(255, Math.round(c * LIFT.slope + LIFT.add));

/** Paint the wall for one frame: the unlit grid, then one dot per cell sized by the cell's mean brightness, in its color. */
const paintWall = (frame: CanvasImageSource, wall: HTMLCanvasElement, cells: HTMLCanvasElement) => {
  const cx = cells.getContext("2d", { willReadFrequently: true });
  const ctx = wall.getContext("2d");
  if (!cx || !ctx) return;
  // the mean color of every cell: the frame scaled down by exactly 1 / P, high-quality resampling
  cx.clearRect(0, 0, COLS, ROWS);
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = "high";
  cx.drawImage(frame, 0, 0, W / P, H / P);
  const px = cx.getImageData(0, 0, COLS, ROWS).data;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = UNLIT;
  ctx.beginPath();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x = c * P + P / 2;
    const y = r * P + P / 2;
    ctx.moveTo(x + UNLIT_R, y);
    ctx.arc(x, y, UNLIT_R, 0, Math.PI * 2);
  }
  ctx.fill();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = (r * COLS + c) * 4;
      const a = px[k + 3] / 255;
      if (a < 0.05) continue;
      const lum = (0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2]) / 255 / a;
      const rad = (dotSize(lum) * P) / 2;
      if (rad < 0.35) continue;
      ctx.fillStyle = `rgb(${lift(px[k] / a)},${lift(px[k + 1] / a)},${lift(px[k + 2] / a)})`;
      ctx.beginPath();
      ctx.arc(c * P + P / 2, r * P + P / 2, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

const LedWall: React.FC = () => {
  const wall = React.useRef<HTMLCanvasElement>(null);
  const cells = React.useRef<HTMLCanvasElement | null>(null);
  const onVideoFrame = React.useCallback((frame: CanvasImageSource) => {
    if (!wall.current) return;
    if (!cells.current) {
      cells.current = document.createElement("canvas");
      cells.current.width = COLS;
      cells.current.height = ROWS;
    }
    paintWall(frame, wall.current, cells.current);
  }, []);
  return (
    <>
      <canvas ref={wall} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
      {/* the decoded take, unseen: it only feeds the wall */}
      <OffthreadVideo src={staticFile(CLIPS[CLIP].file)} muted onVideoFrame={onVideoFrame} style={{ position: "absolute", left: 0, top: 0, width: 2, height: 2, opacity: 0 }} />
    </>
  );
};

// ---------------------------------------------------------------- his voice
/** Where his face sits in this take (head about x 390..870, hair top 480, chin 1080): the resolve circle's center. */
const FACE = { x: 636, y: 812 };
const R_MAX = 400;
/** Loudness per word (stress), from the real word timings: "boring" and "editing" carry the line. */
const LOUD: Record<string, number> = { to: 0.6, do: 0.68, the: 0.58, boring: 1, editing: 0.96, for: 0.74, "you.": 0.9 };
const WORDS = CLIPS[CLIP].words;
const loudAt = (sec: number) => {
  let v = 0;
  for (const w of WORDS) {
    const k = LOUD[w.w] ?? 0.7;
    const shape = interpolate(sec, [w.s - 0.05, w.s + 0.05, w.e, w.e + 0.14], [0, 1, 0.72, 0], CLAMP);
    v = Math.max(v, k * shape);
  }
  return v;
};
/** Smoothed over the last 5 frames (a little lag, never jitter). */
const loudness = (t: number) => {
  let s = 0;
  let n = 0;
  for (let k = 0; k <= 4; k++) {
    const wgt = 5 - k;
    s += wgt * loudAt((t - k) / FPS);
    n += wgt;
  }
  return s / n;
};

// ---------------------------------------------------------------- the trace
const TRACE_Y = 1296;
const TRACE_INK = "rgba(243,241,236,0.6)";
/** Claude's packet: runs in from the right edge and lands under his face on "editing". */
const EDITING = WORDS.find((w) => w.w === "editing") ?? WORDS[0];
const CLAUDE_LAND = EDITING.s * FPS + 2;
const bumpsAt = (t: number, loud: number): ScopeBump[] => {
  const out: ScopeBump[] = [];
  // his voice under his face
  out.push({ x: FACE.x, amp: 3 + 20 * loud * (0.88 + 0.12 * Math.sin(t * 0.9)), sigma: 74, rgb: PH.userRgb });
  // each word sends two packets out along the line
  for (const w of WORDS) {
    const s = w.s * FPS;
    if (t < s) continue;
    const u = ez(t, s, s + 16, EASE.decel);
    const amp = 13 * (LOUD[w.w] ?? 0.7) * ez(t, s, s + 2, EASE.enter) * (1 - ez(t, s + 6, s + 16, EASE.inOut));
    if (amp > 0.4) {
      out.push({ x: FACE.x - 620 * u, amp, sigma: 40, rgb: PH.userRgb });
      out.push({ x: FACE.x + 620 * u, amp, sigma: 40, rgb: PH.userRgb });
    }
  }
  // Claude's packet in from the right, then it keeps talking quietly under his face
  const run = ez(t, CLAUDE_LAND - 12, CLAUDE_LAND, EASE.travel);
  const env = interpolate(t, [CLAUDE_LAND - 12, CLAUDE_LAND - 9, CLAUDE_LAND, CLAUDE_LAND + 16], [0, 1, 1, 0.35], CLAMP);
  if (env > 0.01) out.push({ x: lerp(W + 60, FACE.x + 70, run), amp: 17 * env * (0.9 + 0.1 * Math.sin(t * 0.7)), sigma: 34, rgb: PH.claudeRgb });
  return out;
};

// ---------------------------------------------------------------- camera
const PUSH: [number, number] = [1.0, 1.04];
/** The trace and the caption sit on the glass, nearer than the wall: they ride the drift this much more (parallax). */
const NEAR = 1.8;
const CAPTION_BOTTOM = SAFE_IG.y1 - 24;
/** A soft dark band behind the caption, so his words read over the lit hands. */
const SCRIM_TOP = 1330;
/** One soft tracking wobble as the face resolves on "boring" (a story beat, CRT Scope rule). */
const BORING = WORDS.find((w) => w.w === "boring") ?? WORDS[0];
const GLITCH = [Math.round(BORING.s * FPS)];

export const PixelPortrait: React.FC<FxProps> = ({ t }) => {
  const z = interpolate(t, [0, 48], PUSH, { ...CLAMP, easing: EASE.inOut });
  // a 3 px drift: the tube's bezel (14 px black plus the vignette) hides the frame edge at zoom 1.0
  const dx = 3 * Math.sin(t * 0.07 + 0.5);
  const dy = 2 * Math.sin(t * 0.055 + 1.1);
  const loud = loudness(t);
  const r = R_MAX * EASE.decel(Math.min(1, loud));
  const camera: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${z.toFixed(5)})`,
    transformOrigin: `${FACE.x}px ${FACE.y}px`,
  };
  const mask = `radial-gradient(circle ${r.toFixed(1)}px at ${FACE.x}px ${FACE.y}px, #000 ${(r * 0.5).toFixed(1)}px, rgba(0,0,0,0) ${r.toFixed(1)}px)`;
  return (
    <CRT bloom={0.7} glitchAt={GLITCH}>
      <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
        <div style={camera}>
          <LedWall />
          {r > 2 ? (
            <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
              <Clip name={CLIP} style={{ filter: "brightness(1.12)" }} />
            </AbsoluteFill>
          ) : null}
        </div>
        <AbsoluteFill
          style={{
            top: SCRIM_TOP,
            background: "linear-gradient(180deg, rgba(8,7,10,0) 0%, rgba(8,7,10,0.62) 34%, rgba(8,7,10,0.62) 80%, rgba(8,7,10,0.3) 100%)",
          }}
        />
        <AbsoluteFill style={{ transform: `translate(${(dx * (NEAR - 1)).toFixed(2)}px, ${(dy * (NEAR - 1)).toFixed(2)}px)` }}>
          <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
            <Scope frame={t} x0={-40} x1={W + 40} y={TRACE_Y} bumps={bumpsAt(t, loud)} hum={1.5} stroke={3.2} color={TRACE_INK} />
          </svg>
          <Caption name={CLIP} t={t} size={60} chunk={3} maxWidth={SAFE_IG.w - 40} style={{ top: undefined, bottom: H - CAPTION_BOTTOM }} />
        </AbsoluteFill>
      </AbsoluteFill>
    </CRT>
  );
};

export const pixelportrait: FxDef = {
  id: "pixelportrait",
  command: "/pixel-portrait",
  menu: "Your face as an LED wall that resolves when you talk",
  clip: CLIP,
  Comp: PixelPortrait,
  thumbT: [6, 20, 34],
};
