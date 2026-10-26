// Shared pieces for the effects: Victor's clip, word-timed captions, the white grid, the dither field, the Claude mark.
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSerif } from "@remotion/google-fonts/Newsreader";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { CLIPS, type ClipName } from "./data/clips";
import { LOGOS } from "./data/facts";
import { CLAMP, EASE, FONT_UI, FPS, H, UI, W, ez } from "./theme";
import { interpolate } from "remotion";

export const INTER = loadInter("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const SERIF = loadSerif("normal", { weights: ["400", "500", "600"], subsets: ["latin"] }).fontFamily;
export const MONO = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] }).fontFamily;

/**
 * Victor's clip, full frame 1080x1920, playing from its first frame at t = 0 (mount it at the effect's t = 0).
 * `offset` shifts the clip start (in frames) if an effect wants to begin later in the take.
 */
export const Clip: React.FC<{
  name: ClipName;
  offset?: number;
  style?: React.CSSProperties;
}> = ({ name, offset = 0, style }) => (
  <OffthreadVideo
    src={staticFile(CLIPS[name].file)}
    muted
    trimBefore={offset}
    style={{ position: "absolute", left: 0, top: 0, width: W, height: H, objectFit: "cover", ...style }}
  />
);

/** Still thumbnail of a clip (first frames). */
export const ClipThumb: React.FC<{ name: ClipName; style?: React.CSSProperties }> = ({ name, style }) => (
  <Img src={staticFile(CLIPS[name].thumb)} style={{ objectFit: "cover", ...style }} />
);

/**
 * Word-timed caption of Victor's real line. Shows the phrase chunk (up to `chunk` words) that contains the word being
 * spoken at frame t (t = frames since the clip started). White, bold, soft shadow, like the main captions on his reels.
 */
export const Caption: React.FC<{
  name: ClipName;
  t: number;
  offset?: number;
  y?: number;
  size?: number;
  chunk?: number;
  color?: string;
  maxWidth?: number;
  style?: React.CSSProperties;
}> = ({ name, t, offset = 0, y = 1180, size = 64, chunk = 3, color = UI.white, maxWidth = 900, style }) => {
  const words = CLIPS[name].words;
  const sec = (t + offset) / FPS;
  const groups: { s: number; e: number; words: string[] }[] = [];
  for (let i = 0; i < words.length; i += chunk) {
    const g = words.slice(i, i + chunk);
    groups.push({ s: g[0].s, e: g[g.length - 1].e, words: g.map((w) => w.w) });
  }
  const gi = groups.findIndex((g, i) => sec >= g.s && (i === groups.length - 1 || sec < groups[i + 1].s));
  if (gi < 0) return null;
  const g = groups[gi];
  const inF = (sec - g.s) * FPS;
  const pop = interpolate(inF, [0, 5], [0.92, 1], { ...CLAMP, easing: EASE.enter });
  const op = interpolate(inF, [0, 3], [0, 1], CLAMP);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          maxWidth,
          textAlign: "center",
          fontFamily: FONT_UI,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.12,
          color,
          textShadow: "0 3px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)",
          transform: `scale(${pop})`,
          opacity: op,
          letterSpacing: -0.5,
        }}
      >
        {g.words.join(" ")}
      </div>
    </div>
  );
};

/** Paper-white surface with a faint grid (the reference's "white grid"). The grid drifts by `shift` px so it never freezes. */
export const Grid: React.FC<{ shift?: number; pitch?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  shift = 0,
  pitch = 60,
  style,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: UI.paper,
      backgroundImage: `linear-gradient(${UI.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${UI.gridLine} 1px, transparent 1px)`,
      backgroundSize: `${pitch}px ${pitch}px`,
      backgroundPosition: `${shift}px ${shift * 0.6}px`,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Dark CRT screen with a faint grid (the white grid's CRT twin). Drifts by `shift` px so it never freezes. */
export const DarkGrid: React.FC<{ shift?: number; pitch?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  shift = 0,
  pitch = 60,
  style,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: UI.screen,
      backgroundImage: `linear-gradient(${UI.screenLine} 1px, transparent 1px), linear-gradient(90deg, ${UI.screenLine} 1px, transparent 1px)`,
      backgroundSize: `${pitch}px ${pitch}px`,
      backgroundPosition: `${shift}px ${shift * 0.6}px`,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Victor's approved CRT pass (phosphor halation, scanlines, convergence split, refresh band, tube corners). */
export { CRT } from "../artcraft/kit/Tube";

/** The halftone field the result card shows while Claude "edits": a dense random dot field (deterministic hash per
 *  cell) whose dots breathe and sparkle with t. Drawn at the card's size in output pixels. */
const hash = (i: number, j: number, k: number) => {
  const x = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453;
  return x - Math.floor(x);
};
export const Dither: React.FC<{ t: number; w?: number; h?: number; pitch?: number; style?: React.CSSProperties }> = ({ t, w = 700, h = 1240, pitch = 10, style }) => {
  const cols = Math.ceil(w / pitch) + 1;
  const rows = Math.ceil(h / pitch) + 1;
  const dots: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = hash(i, j, 1);
      const b = hash(i, j, 2);
      const phase = hash(i, j, 3) * 6.283;
      const pulse = 0.5 + 0.5 * Math.sin(t * (0.35 + b * 0.5) + phase);
      const r = (0.5 + a * 1.5) * (0.6 + 0.4 * pulse);
      if (r < 0.7) continue;
      const coral = a > 0.62;
      const op = (0.12 + 0.3 * pulse) * (coral ? 1 : 0.6);
      dots.push(
        <circle
          key={`${i}-${j}`}
          cx={i * pitch + (hash(i, j, 4) - 0.5) * pitch * 0.35}
          cy={j * pitch + (hash(i, j, 5) - 0.5) * pitch * 0.35}
          r={r}
          fill={coral ? "#D97757" : "#E8E2DC"}
          opacity={op}
        />,
      );
    }
  }
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: UI.dither, overflow: "hidden", ...style }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        {dots}
      </svg>
    </div>
  );
};

/** The official Claude mark (coral spark). */
export const Spark: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <Img src={staticFile(LOGOS.claude)} style={{ width: size, height: size, display: "block", ...style }} />
);

/** Full-frame wrapper with the app font. */
export const Frame: React.FC<{ bg?: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ bg = UI.bg, children, style }) => (
  <AbsoluteFill style={{ background: bg, fontFamily: FONT_UI, overflow: "hidden", ...style }}>{children}</AbsoluteFill>
);

/** Slow continuous drift (ambient motion) so no frame is identical to the last. */
export const useDrift = (amp = 6, speed = 0.08) => {
  const f = useCurrentFrame();
  return { x: Math.sin(f * speed) * amp, y: Math.cos(f * speed * 0.8) * amp * 0.6, s: 1 + 0.004 * Math.sin(f * speed * 0.5) };
};

export { ez };
