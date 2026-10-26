// Claude slash effects reel (Victor, 2026-10-25). Tokens, timing contract and shared types.
// Reference: @corbinsylk DeuQkT1BzGV, measured at 720 px wide; the phone UI is drawn in that space and scaled by R.
import { Easing, interpolate } from "remotion";
import type React from "react";
import type { ClipName } from "./data/clips";

export const W = 1080;
export const H = 1920;
export const FPS = 24; // Victor, 2026-10-25 14:30: 24 fps
/** Reference pixels (720 wide) to output pixels (1080 wide). */
export const R = 1.5;

/** The comment keyword and what commenters get. Placeholder until Victor answers (BRIEF.md question 1). */
export const KEYWORD = "EFFECTS";
export const PAYLOAD = "the prompt for every effect";
export const NAME = "Victor";
export const GREETING = "Evening";

/** Colors sampled from the reference frames (see dispatch/REFERENCE-STUDY.md). */
export const UI = {
  bg: "#1A171A",
  panel: "#242125",
  menuPanel: "#2F2C2D",
  line: "rgba(255,255,255,0.08)",
  seg: "#1E191B",
  segOn: "#342F2E",
  tray: "#201D22",
  key: "#3E3B41",
  keyPop: "#5C595F",
  text: "#F5F3EE",
  muted: "#8E8B90",
  coral: "#D97757",
  pill: "#33231B",
  replyBar: "#1D1A1E",
  replySend: "#3A373C",
  dither: "#221C20",
  white: "#FFFFFF",
  paper: "#F7F5F0",
  gridLine: "#E4E1DC",
  ink: "#141313",
  red: "#B5361F",
  /** CRT screen panel and its light ink (Victor, 2026-10-25 16:05: the whole set in his CRT Scope look). */
  screen: "#101217",
  screenInk: "#ECE9E2",
  screenLine: "rgba(255,255,255,0.07)",
} as const;

export const FONT_UI = `-apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif`;

export const EASE = {
  travel: Easing.bezier(0.65, 0, 0.35, 1),
  enter: Easing.bezier(0.05, 0.7, 0.1, 1),
  decel: Easing.bezier(0.2, 0, 0, 1),
  accel: Easing.bezier(0.4, 0, 1, 1),
  inOut: Easing.bezier(0.42, 0, 0.58, 1),
} as const;

export const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

/** 0 to 1 between frames a and b, clamped, eased. */
export const ez = (frame: number, a: number, b: number, easing: (t: number) => number = EASE.enter) =>
  interpolate(frame, [a, b], [0, 1], { ...CLAMP, easing });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Instagram safe zone (Victor, 2026-10-25 22:00: the reel was cut off on IG at the top, bottom and sides).
 *  The feed shows a 4:5 crop (top and bottom 285 px hidden); the Reels UI covers the bottom ~400 px and the right edge.
 *  Every piece of CONTENT (app chrome, text, panes, boxes, graphs, prints, the locked word, the CTA) stays inside
 *  SAFE_IG. Footage, grids and screens may bleed to the frame edge. */
export const IG = { left: 100, right: 100, top: 290, bottom: 400 } as const;
export const SAFE_IG = { x0: IG.left, x1: W - IG.right, y0: IG.top, y1: H - IG.bottom, w: W - IG.left - IG.right, h: H - IG.top - IG.bottom } as const; // 100..980 x 290..1520
/** Same rect in the older {top, side, bottom} shape the effects read. */
export const SAFE = { top: IG.top, side: IG.left, bottom: IG.bottom } as const;
/** The app UI (720 x 1280 reference space) is scaled to the safe width and pinned to the safe top. The typing state
 *  lifts the slash menu, composer and keyboard by APP.lift reference px so the keyboard ends on the safe bottom;
 *  the sent state ends its reply bar there too (reference rows above APP.refH are visible, 1006 ref px). */
export const APP = { scale: SAFE_IG.w / 720, left: SAFE_IG.x0, top: SAFE_IG.y0, refH: Math.round(SAFE_IG.h / (SAFE_IG.w / 720)), lift: 274 } as const;

/** One command cycle, in frames (24 fps). Six cycles, then the ending. */
export const CYCLE = {
  len: 76, // Victor, 2026-10-25 21:15: hold the result longer (was 64). Full screen 48..76 = 28 frames, result 42.
  /** "/" at 0, then three letters with key pop-ups. */
  keys: [0, 3, 6, 10],
  /** The full command fills in (a tap on the slash menu row). */
  fill: 13,
  /** Send pressed (click SFX). */
  send: 18,
  /** Message slides up, keyboard drops, composer collapses. */
  sentStart: 19,
  sentEnd: 24,
  spark: 23,
  dither: 24,
  /** Effect t = frame - resolve. */
  resolve: 34,
  resolveEnd: 37,
  push: 43,
  full: 48,
} as const;
export const FX_START = CYCLE.resolve;
/** Frames the reel takes to scroll from one prompt to the next (Victor, 16:50: smooth switching, no hard cuts). The
 *  outgoing full-screen effect slides up while the next app screen slides in from below, one eased sheet. */
export const SCROLL = 10;
export const CYCLES = 6;
export const ENDING_START = CYCLES * CYCLE.len; // 456
export const ENDING_LEN = 144;
export const TOTAL = ENDING_START + ENDING_LEN; // 600 frames = 25 s

/** Result card rectangle in output pixels: reference x 27, y 301 at 720 wide, kept 9:16 but shortened so the reply bar
 *  (ref 914..1006) still fits above the safe bottom: ref 337 x 599, mapped through APP. */
export const CARD = {
  x: Math.round(APP.left + 27 * APP.scale),
  y: Math.round(APP.top + 301 * APP.scale),
  w: Math.round(337 * APP.scale),
  h: Math.round(599 * APP.scale),
  r: Math.round(18 * APP.scale),
} as const; // 133, 658, 412 x 732, r 22

export type FxStage = "card" | "full";
/** t equals useCurrentFrame() inside the effect (0 at the dither resolve). stage is "card" until the push, then "full". */
export type FxProps = { t: number; stage: FxStage };
export type FxDef = {
  id: string;
  /** Typed command, e.g. "/match-cut". */
  command: string;
  /** One-line description shown in the slash menu row. */
  menu: string;
  /** Victor's clip used as the composer attachment thumbnail and (usually) inside the effect. */
  clip: ClipName;
  Comp: React.FC<FxProps>;
  /** Frames (t values) that make good thumbnails for the ending grid. */
  thumbT: number[];
};
