import React from "react";
import { PH } from "../theme";

// ===========================================================================
// The CRT Scope oscilloscope trace (from fish8/F8P01LiveWire ScopeTrace),
// generalised for the ArtCraft series. One live line; subjects sit on it.
// A bump is a local wave packet in a color (a voice, a pulse, a data packet).
// Smooth carriers only, no jitter. Render inside an <svg> in world units.
// ===========================================================================

export type ScopeBump = {
  /** center x of the packet */
  x: number;
  /** peak amplitude in px (0 = flat) */
  amp: number;
  /** width (gaussian sigma) in px */
  sigma?: number;
  /** "r,g,b" */
  rgb: string;
};

const gauss = (x: number, c: number, s: number) => Math.exp(-((x - c) ** 2) / (2 * s * s));

export const Scope: React.FC<{
  frame: number;
  x0: number;
  x1: number;
  /** baseline y */
  y: number;
  bumps?: ScopeBump[];
  /** idle hum amplitude in px */
  hum?: number;
  /** carrier speed multiplier */
  speed?: number;
  stroke?: number;
  color?: string;
}> = ({ frame, x0, x1, y, bumps = [], hum = 1.2, speed = 1, stroke = 2.2, color = PH.trace }) => {
  const f = frame * speed;
  const yAt = (x: number) => {
    const carrier = 0.62 * Math.sin(x * 0.085 - f * 0.42) + 0.38 * Math.sin(x * 0.21 + f * 0.31);
    const amp = bumps.reduce((a, b) => a + b.amp * gauss(x, b.x, b.sigma ?? 70), 0);
    return y + carrier * amp + hum * Math.sin(x * 0.05 + f * 0.07);
  };
  const step = 3;
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += step) pts.push(`${x},${yAt(x).toFixed(1)}`);
  return (
    <g>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
      {bumps.map((b, i) => {
        if (b.amp < 0.5) return null;
        const s = b.sigma ?? 70;
        const seg: string[] = [];
        for (let x = Math.max(x0, b.x - 2.6 * s); x <= Math.min(x1, b.x + 2.6 * s); x += step) seg.push(`${x},${yAt(x).toFixed(1)}`);
        if (seg.length < 2) return null;
        return (
          <polyline
            key={i}
            points={seg.join(" ")}
            fill="none"
            stroke={`rgba(${b.rgb},${Math.min(1, 0.35 + b.amp / 30).toFixed(3)})`}
            strokeWidth={stroke + 0.4}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
};
