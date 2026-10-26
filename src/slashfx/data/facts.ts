// Facts switch (Victor, 2026-10-26: each video on a different take, so the on-screen facts follow the take).
// Sets 1 and 4 play over the DaVinci take, set 2 over the Remotion take, set 3 over the ArtCraft take. Every file exports the
// same names and cardinalities (dispatch/ROTATION.md), so the effects compile unchanged and only the words change.
import { SET } from "../theme";
import * as RESOLVE from "./facts_resolve";
import * as ARTCRAFT from "./facts_artcraft";
import * as REMOTION from "./facts_remotion";
export type { Article } from "./facts_resolve";

const F = SET === 3 ? ARTCRAFT : SET === 2 ? REMOTION : RESOLVE;

export const LOCK_WORD = F.LOCK_WORD;
export const ARTICLES = F.ARTICLES;
export const COUNTS = F.COUNTS;
export const COUNTS_TITLE = F.COUNTS_TITLE;
export const COUNTS_SOURCE = F.COUNTS_SOURCE;
export const PETTY = F.PETTY;
export const SHOTS = F.SHOTS;
export const TRACKS = F.TRACKS;
export const LOGOS = F.LOGOS;
export const MANUAL = F.MANUAL;
export const MCP = F.MCP;
export const TRACK_NAMES = F.TRACK_NAMES;
export const HEADLINES = F.HEADLINES;
export const ASSISTANTS = F.ASSISTANTS;
export const JOBS = F.JOBS;
