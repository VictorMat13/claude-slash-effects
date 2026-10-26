// Claude slash effects reel (Victor, 2026-10-25). Tokens, timing contract and shared types.
// Reference: @corbinsylk DeuQkT1BzGV, measured at 720 px wide; the phone UI is drawn in that space and scaled by R.
import { Easing, interpolate } from "remotion";
import type React from "react";
import type { ClipName } from "./data/clips";

export const W = 1080;
export const H = 1920;
/** Variant switches (Victor, 2026-10-25 23:00: "speed it up to 1.1 ... white background ... no music"). Set at render time:
 *  REMOTION_SLASHFX_LIGHT=1 for the light (white) app UI, REMOTION_SLASHFX_SPEED=1.1 to play every frame 1.1x faster.
 *  Timing stays in frames; a faster composition fps speeds up the UI, the effects and the footage together. */
export const LIGHT = process.env.REMOTION_SLASHFX_LIGHT === "1";
export const SPEED = Number(process.env.REMOTION_SLASHFX_SPEED || 1);
/** REMOTION_SLASHFX_BG=whitegrid: the white-grid CRT backdrop (backdrop.tsx) under the dark app, the whole reel in one tube. */
export const WHITEGRID = process.env.REMOTION_SLASHFX_BG === "whitegrid";
export const FPS = 24 * SPEED; // Victor, 2026-10-25 14:30: 24 fps (x SPEED for the fast variant)
/** Reference pixels (720 wide) to output pixels (1080 wide). */
export const R = 1.5;

/** The comment keyword and what commenters get. Placeholder until Victor answers (BRIEF.md question 1). */
/** Which set of six effects the reel plays (Victor, 2026-10-26 00:30: three more videos). REMOTION_SLASHFX_SET=2|3|4. */
export const SET = Number(process.env.REMOTION_SLASHFX_SET || 1);
const KEYWORDS: Record<number, string> = { 1: "EFFECTS", 2: "PROMPTS", 3: "SLASH", 4: "COMMANDS" };
export const KEYWORD = KEYWORDS[SET] ?? "EFFECTS";
export const PAYLOAD = "the prompt for every effect";
export const NAME = "Victor";
export const GREETING = "Evening";

/** Colors sampled from the reference frames (see dispatch/REFERENCE-STUDY.md). */
const UI_DARK = {
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
  /** keyboard tray details and the thumb badge */
  trayLine: "rgba(255,255,255,0.14)",
  trayText: "#D4D2D6",
  space: "#4A474D",
  badge: "#1C1A1C",
  badgeRing: "rgba(255,255,255,0.08)",
  ditherDot: "#E8E2DC",
  fullBg: "#130D11",
  keyInk: "#FFFFFF",
  headline: "#FFFFFF",
  replyInk: "#FFFFFF",
} as const;
/** The Claude iOS app in light mode (sampled from the app, 2026-10-25 23:05). CRT screens stay dark. */
const UI_LIGHT = {
  ...UI_DARK,
  bg: "#FAF9F5",
  panel: "#ECE9E1",
  menuPanel: "#E6E3DA",
  line: "rgba(0,0,0,0.08)",
  seg: "#E6E3DA",
  segOn: "#FFFFFF",
  tray: "#C9CBD1",
  key: "#FFFFFF",
  keyPop: "#FFFFFF",
  text: "#1C1A17",
  muted: "#7B7873",
  pill: "#F5E6DD",
  replyBar: "#ECE9E1",
  replySend: "#DEDBD3",
  dither: "#ECEAE2",
  trayLine: "rgba(0,0,0,0.15)",
  trayText: "#3A3A3C",
  space: "#FFFFFF",
  badge: "#FFFFFF",
  badgeRing: "rgba(0,0,0,0.10)",
  ditherDot: "#8C8780",
  fullBg: "#FAF9F5",
  keyInk: "#1C1A17",
  headline: "#1C1A17",
  replyInk: "#1C1A17",
} as const;
type UiTokens = { readonly [K in keyof typeof UI_DARK]: string };
export const UI: UiTokens = LIGHT ? UI_LIGHT : UI_DARK;

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
export const IG = { left: 60, right: 80, top: 270, bottom: 340 } as const; // Victor, 2026-10-26 00:50: "safe zone is way too far out, zoom in on the card"; was 100/100/290/400
export const SAFE_IG = { x0: IG.left, x1: W - IG.right, y0: IG.top, y1: H - IG.bottom, w: W - IG.left - IG.right, h: H - IG.top - IG.bottom } as const; // 60..1000 x 270..1580
/** Same rect in the older {top, side, bottom} shape the effects read. */
export const SAFE = { top: IG.top, side: IG.left, bottom: IG.bottom } as const;
/** The app UI (720 x 1280 reference space) is scaled to the safe width and pinned to the safe top. The typing state
 *  lifts the slash menu, composer and keyboard by APP.lift reference px so the keyboard ends on the safe bottom;
 *  the sent state ends its reply bar there too (reference rows above APP.refH are visible, 1006 ref px). */
const APP_SCALE = SAFE_IG.w / 720;
const APP_REF_H = Math.round(SAFE_IG.h / APP_SCALE);
/** lift = how far the typing group moves up so the keyboard (ref bottom 1280) ends on the safe bottom. */
export const APP = { scale: APP_SCALE, left: SAFE_IG.x0, top: SAFE_IG.y0, refH: APP_REF_H, lift: 1280 - APP_REF_H } as const;

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
  resolveEnd: 39, // smoothness pass 2026-10-26: 5-frame crossfade out of the dither (was 37)
  push: 40, // smoothness pass: the card grows over 8 frames with a bell ease, t 6..14 (was 43, five frames)
  full: 48,
} as const;
export const FX_START = CYCLE.resolve;
/** Frames the reel takes to scroll from one prompt to the next (Victor, 16:50: smooth switching, no hard cuts). The
 *  outgoing full-screen effect slides up while the next app screen slides in from below, one eased sheet. */
export const SCROLL = 12;
/** Smoothness pass (Victor, 2026-10-26, reference Detu9zAKHHa): the switch is a short slide plus a fade, not a full-height whip.
 *  The incoming sheet rises SCROLL_TRAVEL px while fading in over the outgoing one, which eases up by the same amount. */
export const SCROLL_TRAVEL = 420;
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
