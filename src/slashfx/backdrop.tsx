// White-grid CRT backdrop (Victor, 2026-10-25 23:40: "the CRT grid pattern background, the one that looks kind of 3D").
// Ported from the white grid look test (madebyai01/whitegrid.tsx, the Opus motion v2 white-grid CRT pass): a lit
// off-white grid paper with a warm hotspot as the ground, and one full-frame tube over the whole picture: convergence
// split, halation, pixel mask, interlaced scanlines, a rolling refresh band, flicker, glass vignette and the rounded
// tube edge. Wrap the whole reel once (Reel.tsx), never per element. Enabled with REMOTION_SLASHFX_BG=whitegrid.
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { H, LIGHT, W } from "./theme";

const CELL = 90;

/** Grid paper: lit off-white with a warm hotspot, 90 px cells, drifting slowly so no frame is still. */
export const WhiteGrid: React.FC<{ f: number; style?: React.CSSProperties }> = ({ f, style }) => {
  const drift = (f * 0.35) % CELL;
  const cols: number[] = [];
  const rows: number[] = [];
  for (let x = -CELL + 12; x <= W + CELL; x += CELL) cols.push(x);
  for (let y = -CELL + 18 + drift; y <= H + CELL; y += CELL) rows.push(y);
  return (
    <AbsoluteFill style={{ background: "#E9E8E7", ...style }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 46% 30% at 50% 46%, #FFFFFF 0%, #F7F7F6 40%, rgba(240,239,238,0) 100%), radial-gradient(ellipse 70% 60% at 50% 50%, #F1F0EF 0%, #E6E4E2 70%, #D6D3D0 100%)",
        }}
      />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g stroke="rgba(78,74,72,0.40)" strokeWidth={2.4} fill="none">
          {cols.map((x) => (
            <line key={`c${x}`} x1={x} y1={0} x2={x} y2={H} />
          ))}
          {rows.map((y) => (
            <line key={`r${y.toFixed(1)}`} x1={0} y1={y} x2={W} y2={y} />
          ))}
        </g>
      </svg>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(226,196,186,0.34) 0%, rgba(232,212,204,0.12) 30%, rgba(0,0,0,0) 46%)" }} />
    </AbsoluteFill>
  );
};

/** The white-grid CRT tube at full 1080x1920. `t` is the frame, `loop` the frame count (the refresh band is periodic). */
export const CrtWhiteFull: React.FC<{ t: number; loop: number; glitch?: number; children: React.ReactNode }> = ({ t, loop, glitch = 0, children }) => {
  const flicker = 0.982 + 0.018 * random(`sfx-flk-${t}`);
  const field = Math.round(t) % 2;
  const bandY = (t / loop) * (H + 500) * 6 - 250;
  const g = Math.max(0, Math.min(1, glitch));
  const conv = 1.5 + 3 * g;
  return (
    <AbsoluteFill style={{ background: "#E9E7E4", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="sfx-crtw" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0 0.018" numOctaves="1" seed={Math.floor(random(`sfx-gs-${t}`) * 999)} result="noise" />
            <feComponentTransfer in="noise" result="bands">
              <feFuncR type="discrete" tableValues="0.5 0.5 0.5 0.6 0.5 0.5 0.42 0.5 0.5 0.5" />
            </feComponentTransfer>
            <feDisplacementMap in="SourceGraphic" in2="bands" scale={24 * g} xChannelSelector="R" yChannelSelector="A" result="disp" />
            <feColorMatrix in="disp" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={conv} dy="0" result="r2" />
            <feColorMatrix in="disp" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gch" />
            <feColorMatrix in="disp" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="b" dx={-conv} dy="0" result="b2" />
            <feBlend in="r2" in2="gch" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" result="rgb" />
            <feGaussianBlur in="rgb" stdDeviation="2.2" result="h1" />
            <feGaussianBlur in="rgb" stdDeviation="9" result="h2raw" />
            <feComponentTransfer in="h1" result="h1d">
              <feFuncR type="linear" slope="0.32" />
              <feFuncG type="linear" slope="0.32" />
              <feFuncB type="linear" slope="0.32" />
            </feComponentTransfer>
            <feComponentTransfer in="h2raw" result="h2d">
              <feFuncR type="linear" slope="0.16" />
              <feFuncG type="linear" slope="0.16" />
              <feFuncB type="linear" slope="0.16" />
            </feComponentTransfer>
            <feBlend in="rgb" in2="h1d" mode="screen" result="s1" />
            <feBlend in="s1" in2="h2d" mode="screen" />
          </filter>
        </defs>
      </svg>
      {/* the 1.2 lift keeps the white grid white under the mask; the light app has no dark ground to lift and washes out */}
      <AbsoluteFill style={{ filter: `url(#sfx-crtw) brightness(${LIGHT ? 1.0 : 1.2})`, opacity: flicker }}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,80,70,0.07) 0px, rgba(255,80,70,0.07) 1px, rgba(80,255,120,0.07) 1px, rgba(80,255,120,0.07) 2px, rgba(90,130,255,0.07) 2px, rgba(90,130,255,0.07) 3px, rgba(16,12,10,0.44) 3px, rgba(16,12,10,0.44) 4px)",
          mixBlendMode: "multiply",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(16,12,10,0.38) 0px, rgba(16,12,10,0.38) 1px, transparent 1px, transparent 4px)",
          backgroundPosition: `0 ${field * 2}px`,
          mixBlendMode: "multiply",
        }}
      />
      <div style={{ position: "absolute", left: 0, width: W, top: bandY % (H + 500), height: 420, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(40,30,25,0.06) 50%, rgba(0,0,0,0) 100%)", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 74% 66% at 50% 48%, rgba(0,0,0,0) 52%, rgba(26,18,14,0.22) 78%, rgba(18,12,10,0.55) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 28%)", mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 0 6px rgba(14,10,8,0.85), inset 0 0 50px 18px rgba(18,12,10,0.45)", borderRadius: 32 }} />
    </AbsoluteFill>
  );
};
