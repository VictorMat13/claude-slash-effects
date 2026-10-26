// Registry of the six effects in reel order (all six wired 2026-10-25).
import type { FxDef } from "../theme";
import { matchcut } from "./matchcut";
import { shutterstrike } from "./shutterstrike";
import { screenpush } from "./screenpush";
import { shoulderzoom } from "./shoulderzoom";
import { pushdigital } from "./pushdigital";
import { crtgraph } from "./crtgraph";

// Order is ours, not the reference's (Victor, 16:05): CRT graph, pour, match cut, proof cards, pixel words, prints.
export const FX: FxDef[] = [
  crtgraph,
  screenpush,
  matchcut,
  shoulderzoom,
  pushdigital,
  shutterstrike,
];

export const fxById = (id: string) => FX.find((f) => f.id === id) ?? FX[0];
