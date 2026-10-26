// Registry of the six effects the reel plays. Set 1 is the first reel (2026-10-25); sets 2 to 4 are the follow-ups
// (Victor, 2026-10-26 00:30). Pick with REMOTION_SLASHFX_SET (theme.ts SET).
import type { FxDef } from "../theme";
import { SET } from "../theme";
import { matchcut } from "./matchcut";
import { shutterstrike } from "./shutterstrike";
import { screenpush } from "./screenpush";
import { shoulderzoom } from "./shoulderzoom";
import { pushdigital } from "./pushdigital";
import { crtgraph } from "./crtgraph";
import { SET2 } from "./set2";
import { SET3 } from "./set3";
import { SET4 } from "./set4";

// Set 1 order is ours, not the reference's (Victor, 16:05): CRT graph, pour, match cut, proof cards, pixel words, prints.
export const SET1: FxDef[] = [crtgraph, screenpush, matchcut, shoulderzoom, pushdigital, shutterstrike];
const SETS: Record<number, FxDef[]> = { 1: SET1, 2: SET2, 3: SET3, 4: SET4 };
export const FX: FxDef[] = SETS[SET] ?? SET1;

export const fxById = (id: string) => FX.find((f) => f.id === id) ?? FX[0];
