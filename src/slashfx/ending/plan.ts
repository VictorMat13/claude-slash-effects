// The ending's plan: its timeline (local frames 0 to ENDING_LEN - 1), the strings it shows, the two grid layouts (inside the result
// card, and full screen) and which of our six effects each grid cell plays. Reference: f0166 to f0223 (16.5 s to 22.3 s).
import { CLIPS, type ClipName } from "../data/clips";
import { FX } from "../fx";
import { UI, CARD, ENDING_LEN, FPS, KEYWORD, PAYLOAD, SAFE_IG, SET, W } from "../theme";

/** The timeline was specced at 30 fps (agent-END.md); every frame is derived from those numbers at the reel's FPS. */
export const at = (f30: number) => Math.round((f30 * FPS) / 30);

/**
 * Local frames (at 24 fps: keys 0/3/6/10/13, fill 16, send 21, sent 22 to 27, spark 27, card 29, resolve 35 to 42,
 * grid fills 42 to 78, push 80 to 88, full-screen CTA 88 to 143).
 */
export const E = {
  keys: [0, 4, 8, 12, 16].map(at),
  /** Pop-up length after each key press. */
  pop: at(4),
  fill: at(20),
  send: at(26),
  sentStart: at(27),
  sentEnd: at(34),
  spark: at(34),
  streamEnd: at(50),
  card: at(36),
  cardIn: at(5),
  resolve: at(44),
  resolveEnd: at(52),
  /** First grid cell starts to resolve from the dither; each next cell 2 (30 fps) frames later, over 6 frames. */
  cellStart: at(52),
  cellStep: (2 * FPS) / 30,
  cellIn: at(6),
  push: at(100),
  full: at(110),
  len: ENDING_LEN,
} as const;

// ---------------------------------------------------------------- strings (keyword and payload come from theme.ts)
export const COMMAND = `/${KEYWORD.toLowerCase()}`;
export const MENU = "Every effect, one prompt each";
export const SPARK_TEXT = `Comment “${KEYWORD}” and I’ll send you the prompts`;
export const CARD_TITLE = "Effect of the Day";
export const CARD_SUB = `${FX.length} effects · made with Claude Code`;
export const HEADLINE = `Comment “${KEYWORD}”`;
/** "for the prompt for every effect" reads badly, so that payload gets the reference's wording. */
export const PILL = PAYLOAD.startsWith("the prompt") ? "for every effect’s prompt" : `for ${PAYLOAD}`;

/** Full-screen background behind the grid, sampled from the reference (f0192, f0200, f0222: #130D11). */
export const FULL_BG = UI.fullBg;

// ---------------------------------------------------------------- what the composer shows (the ending's own key times)
export const typedAt = (f: number) => {
  if (f >= E.fill) return COMMAND;
  const n = E.keys.filter((k, i) => i > 0 && f >= k).length;
  return COMMAND.slice(0, 1 + n);
};
/** Letter whose pop-up shows at frame f (4 frames after each key press), and how far it has risen. */
export const popAt = (f: number) => {
  for (let i = 1; i < E.keys.length; i++) {
    const k = E.keys[i];
    const key = COMMAND[i];
    if (key && f >= k && f < k + E.pop) return { key, p: Math.min(1, 0.6 + 0.4 * (f - k)) };
  }
  return null;
};

// ---------------------------------------------------------------- grid layouts (5 columns x 4 rows of 9:16 cells)
export const COLS = 5;
export const ROWS = 4;
export type GridLayout = { x0: number; y0: number; w: number; h: number; cw: number; ch: number; gap: number };
const layout = (x0: number, y0: number, w: number, gap: number): GridLayout => {
  const cw = (w - gap * (COLS - 1)) / COLS;
  const ch = (cw * 16) / 9;
  return { x0, y0, w, h: ROWS * ch + gap * (ROWS - 1), cw, ch, gap };
};
/** The card's contents were laid out at the first card size (700 x 1240, reference f0186); CARD is now 412 x 732 inside the
 *  safe rect, so every length inside the card (title, subtitle, grid, radii) is multiplied by CARD_K. */
export const CARD_K = CARD.w / 700;
/** Inside the result card, relative to the card's top left. */
export const GRID_CARD = layout(60 * CARD_K, 337 * CARD_K, 580 * CARD_K, 10 * CARD_K);
/** Slow push-in on the full-screen grid (1.6%, about the grid centre). */
export const GRID_ZOOM = 0.016;

/**
 * Full-screen CTA. The first build was laid out on the 1080 frame (headline centre 230 at 72 px, subtitle 302 at 34 px,
 * pill top 290 at 44 px, grid x 94 y 396 w 892 gap 12, cell radius 10). It is shrunk uniformly by CTA_K about the frame's
 * centre line so the headline box (top) and the grid at the end of the push-in (bottom) sit inside SAFE_IG with CTA_M px
 * to spare. One factor for every length, so nothing is stretched.
 */
const CTA_M = 10;
const FIRST = { headY: 230, headSize: 72, subY: 302, subSize: 34, pillTop: 290, pillSize: 44, gridX: 94, gridY: 396, gridW: 892, gap: 12 };
const firstGrid = layout(FIRST.gridX, FIRST.gridY, FIRST.gridW, FIRST.gap);
const firstTop = FIRST.headY - 0.6 * FIRST.headSize;
const firstBottom = firstGrid.y0 + firstGrid.h * (1 + GRID_ZOOM / 2);
export const CTA_K = (SAFE_IG.h - 2 * CTA_M) / (firstBottom - firstTop);
const ctaX = (x: number) => W / 2 + (x - W / 2) * CTA_K;
const ctaY = (y: number) => SAFE_IG.y0 + CTA_M + (y - firstTop) * CTA_K;
export const CTA = {
  headY: ctaY(FIRST.headY),
  headSize: FIRST.headSize * CTA_K,
  subY: ctaY(FIRST.subY),
  subSize: FIRST.subSize * CTA_K,
  pillTop: ctaY(FIRST.pillTop),
  pillSize: FIRST.pillSize * CTA_K,
} as const;
/** Full screen grid: x 169..911 (163..917 at the end of the push-in), y 474..1502 (1510). */
export const GRID_FULL = layout(ctaX(FIRST.gridX), ctaY(FIRST.gridY), FIRST.gridW * CTA_K, FIRST.gap * CTA_K);

export type Box = { x: number; y: number; w: number; h: number };
export const cellBox = (g: GridLayout, i: number): Box => ({
  x: g.x0 + (i % COLS) * (g.cw + g.gap),
  y: g.y0 + Math.floor(i / COLS) * (g.ch + g.gap),
  w: g.cw,
  h: g.ch,
});

// ---------------------------------------------------------------- which effect each cell plays
/** Effect index per cell in reading order, -1 = word cell. Each effect three times, never next to itself. */
const LAYOUT = [
  0, 1, 2, 3, 4,
  3, 4, 5, 0, -1,
  1, 5, 0, 2, 3,
  2, -1, 4, 5, 1,
];

/** Crossfade length between two moments of an effect, and the last t a cell may show (effects stay alive to t 60 at 30 fps). */
export const XF = at(5);
export const T_MAX = at(60);

export type FxPlan = { kind: "fx"; i: number; fx: number; phase: number; len: number; reveal: number };
export type WordPlan = { kind: "word"; i: number; start: number; reveal: number };
export type CellPlan = FxPlan | WordPlan;

const seen: Record<number, number> = {};
let words = 0;
export const CELLS: CellPlan[] = LAYOUT.map((e, i) => {
  const reveal = E.cellStart + Math.round(i * E.cellStep);
  if (e < 0) return { kind: "word", i, start: words++ * 3, reveal };
  const fx = e % FX.length;
  const phase = seen[fx] ?? 0;
  seen[fx] = phase + 1;
  /** Deterministic segment length per cell, 10 to 16 frames at 30 fps (8 to 13 at 24 fps). */
  const lo = at(10);
  const len = lo + ((i * 5 + 2) % (at(16) - lo + 1));
  return { kind: "fx", i, fx, phase, len, reveal };
});

/** First t of segment k of a cell: centred on one of the effect's thumbT values, cycling through them. */
export const segT = (thumbT: number[], phase: number, k: number, len: number) => {
  const target = thumbT.length ? thumbT[(phase + k) % thumbT.length] : 20;
  const span = len + XF;
  return Math.max(0, Math.min(T_MAX - span, Math.round(target - span / 2)));
};

// ---------------------------------------------------------------- the word cells: Victor's spoken words only
/** Returns the word only if Victor says it in that clip (punctuation stripped), so nothing typed here is invented. */
const spoken = (clip: ClipName, word: string) => {
  const list = CLIPS[clip].words as readonly { w: string }[];
  if (!list.some((x) => x.w.replace(/[.,!?]/g, "") === word)) throw new Error(`"${word}" is not spoken in clip ${clip}`);
  return word;
};
// Per take (dispatch/ROTATION.md): sets 1 and 4 play over the DaVinci take, set 2 over the Remotion take, set 3 over ArtCraft.
const WORDS_BY_SET: Record<number, string[]> = {
  2: [spoken("r_hook", "motion"), spoken("r_hook", "AI"), spoken("r_free", "prompts"), spoken("r_skill", "skill"), spoken("r_movement", "movement"), spoken("r_prompts", "specific")],
  3: [spoken("a_hook", "Claude"), spoken("a_hook", "Photoshop"), spoken("a_hook", "free"), spoken("a_build", "build"), spoken("a_shortcuts", "shortcuts"), spoken("a_nocode", "code")],
};
export const WORDS = WORDS_BY_SET[SET] ?? [
  spoken("hook", "edit"),
  spoken("hook", "AI"),
  spoken("hook", "inside"),
  spoken("plate", "plate"),
  spoken("process", "process"),
  spoken("process", "you"),
];
export const WORD_EVERY = at(12);
/** Largest word size in full-screen cell units (48 on the first 168.8 px cells, scaled with the grid). */
export const WORD_SIZE = 48 * CTA_K;

/** Approximate Inter Bold advance widths (em), used to fit a word inside its cell without measuring the DOM. */
const ADV: Record<string, number> = {
  a: 0.57, b: 0.61, c: 0.56, d: 0.61, e: 0.58, f: 0.37, g: 0.61, h: 0.6, i: 0.27, j: 0.27, k: 0.56, l: 0.27, m: 0.9,
  n: 0.6, o: 0.6, p: 0.61, q: 0.61, r: 0.4, s: 0.54, t: 0.37, u: 0.6, v: 0.56, w: 0.82, x: 0.56, y: 0.56, z: 0.53,
  A: 0.71, I: 0.29,
};
export const wordEm = (w: string) => w.split("").reduce((s, ch) => s + (ADV[ch] ?? 0.62), 0);
