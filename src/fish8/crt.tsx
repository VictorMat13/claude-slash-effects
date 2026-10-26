import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

// Color-CRT screen pass (refs: Victor's Pinterest "Free CRT Template" green
// phosphor tube + the dispersive glass cube). Built from the components real
// CRT shaders emulate: black-crush grade, phosphor halation (two blur radii,
// screen-blended), convergence error (R/B channels nudged apart), aperture
// grille, scanlines with interlace, grain, flicker, a slow refresh band,
// vignette + tube corner mask. Tracking glitches only fire on `glitchAt`
// beats, never as decoration.

export type CrtProps = {
  children: React.ReactNode;
  /** frames where a short horizontal tracking glitch fires (8f each) */
  glitchAt?: number[];
  /** px the red/blue channels separate */
  convergence?: number;
  /** "black" crushes the ground to black (Fish 8 CRT take); "soft" keeps the gray world */
  /** "readable" (ArtCraft, Oct 13): same black ground, mid-grey UI text lifted so small type survives */
  grade?: "black" | "soft" | "readable";
  /** halation strength multiplier (lower for scenes with white panels) */
  bloom?: number;
  /** loop length in frames: the refresh band wraps exactly once per loop (seamless loops) */
  loop?: number;
};

const GLITCH_LEN = 6; // soft: a brief tracking wobble, not a tear (Victor: glitch was too hard)

export const CRT: React.FC<CrtProps> = ({ children, glitchAt = [], convergence = 1.6, grade = "black", bloom = 1, loop }) => {
  const G =
    grade === "black"
      ? { amp: 1.4, exp: 2.5, off: -0.035 }
      : grade === "readable"
        ? { amp: 1.25, exp: 1.8, off: -0.03 }
        : { amp: 1.06, exp: 1.25, off: -0.01 };
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // strongest active glitch 0..1 (fast attack, soft decay)
  const g = Math.max(
    0,
    ...glitchAt.map((at) => interpolate(frame, [at, at + 1, at + GLITCH_LEN], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
  );
  const flicker = 0.97 + 0.03 * random(`flk-${frame}`);
  const seed = Math.floor(random(`seed-${frame}`) * 1000);
  const bandY = loop ? (frame / loop) * (height + 400) - 200 : ((frame * 7) % (height + 400)) - 200; // slow refresh roll
  const field = frame % 2; // interlace

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="crt-grade" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {/* crush the gray ground to black, lift highlights like phosphor */}
            <feComponentTransfer in="SourceGraphic" result="grade">
              <feFuncR type="gamma" amplitude={G.amp} exponent={G.exp} offset={G.off} />
              <feFuncG type="gamma" amplitude={G.amp} exponent={G.exp} offset={G.off} />
              <feFuncB type="gamma" amplitude={G.amp} exponent={G.exp} offset={G.off} />
            </feComponentTransfer>
            {/* tracking glitch: horizontal band displacement, only while g > 0 */}
            <feTurbulence type="fractalNoise" baseFrequency="0 0.02" numOctaves="1" seed={seed} result="noise" />
            {/* quantize into hard horizontal bands: only some rows tear */}
            <feComponentTransfer in="noise" result="bands">
              <feFuncR type="discrete" tableValues="0.5 0.5 0.5 0.62 0.5 0.5 0.4 0.5 0.5 0.5" />
            </feComponentTransfer>
            <feDisplacementMap in="grade" in2="bands" scale={28 * g} xChannelSelector="R" yChannelSelector="A" result="disp" />
            {/* convergence error: split channels, nudge R right and B left */}
            <feColorMatrix in="disp" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={convergence + 2.5 * g} dy="0" result="r2" />
            <feColorMatrix in="disp" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gch" />
            <feColorMatrix in="disp" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="b" dx={-convergence - 2.5 * g} dy="0" result="b2" />
            <feBlend in="r2" in2="gch" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" result="rgb" />
            {/* phosphor halation: tight + wide bloom */}
            <feGaussianBlur in="rgb" stdDeviation="3" result="h1raw" />
            <feComponentTransfer in="h1raw" result="h1">
              <feFuncR type="linear" slope={Math.min(1, bloom)} />
              <feFuncG type="linear" slope={Math.min(1, bloom)} />
              <feFuncB type="linear" slope={Math.min(1, bloom)} />
            </feComponentTransfer>
            <feGaussianBlur in="rgb" stdDeviation="14" result="h2" />
            <feGaussianBlur in="rgb" stdDeviation="42" result="h3" />
            <feComponentTransfer in="h2" result="h2d">
              <feFuncR type="linear" slope={0.9 * bloom} />
              <feFuncG type="linear" slope={0.9 * bloom} />
              <feFuncB type="linear" slope={0.9 * bloom} />
            </feComponentTransfer>
            <feComponentTransfer in="h3" result="h3d">
              <feFuncR type="linear" slope={0.6 * bloom} />
              <feFuncG type="linear" slope={0.6 * bloom} />
              <feFuncB type="linear" slope={0.6 * bloom} />
            </feComponentTransfer>
            <feBlend in="rgb" in2="h1" mode="screen" result="s1" />
            <feBlend in="s1" in2="h2d" mode="screen" result="s2" />
            <feBlend in="s2" in2="h3d" mode="screen" />
          </filter>
          <filter id="crt-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      {/* picture */}
      <AbsoluteFill style={{ filter: "url(#crt-grade)", opacity: flicker }}>{children}</AbsoluteFill>

      {/* aperture grille: fine vertical phosphor stripes */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,60,60,0.07) 0px, rgba(255,60,60,0.07) 1px, rgba(60,255,90,0.07) 1px, rgba(60,255,90,0.07) 2px, rgba(70,110,255,0.07) 2px, rgba(70,110,255,0.07) 3px, rgba(0,0,0,0.42) 3px, rgba(0,0,0,0.42) 4px)",
          mixBlendMode: "multiply",
        }}
      />
      {/* scanlines, interlaced field alternates each frame */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 4px)`,
          backgroundPosition: `0 ${field * 2}px`,
        }}
      />
      {/* slow refresh band */}
      <div
        style={{
          position: "absolute", left: 0, width, top: bandY, height: 220,
          background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.035) 50%, rgba(255,255,255,0) 100%)",
          mixBlendMode: "screen",
        }}
      />
      {/* grain */}
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "screen" }}>
        <svg width={width} height={height}><rect width={width} height={height} filter="url(#crt-grain)" /></svg>
      </AbsoluteFill>
      {/* glass: vignette + tube corners */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 78% 74% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.92) 100%)" }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 0 14px #000, inset 0 0 70px 30px rgba(0,0,0,0.85)", borderRadius: 46 }} />
    </AbsoluteFill>
  );
};
