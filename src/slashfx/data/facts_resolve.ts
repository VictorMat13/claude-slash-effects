// The DaVinci Resolve facts (sets 1 and 4). facts.ts switches between this, facts_remotion.ts (set 2) and facts_artcraft.ts (set 3).
// Real text only. Every string here is verbatim from its source (fetched 2026-10-25) or from public/resolve/SOURCES.md.
// Never add numbers, quotes or article text that is not in this file.

export type Article = {
  /** Publication and dateline, shown small at the top of the page. */
  source: string;
  date: string;
  /** Verbatim paragraph. Must contain the locked word once ("Claude"). */
  text: string;
  /** Typeface family for the page: serif, mono or sans. */
  face: "serif" | "mono" | "sans";
  /** Which occurrence of the lock word to lock on (1 = first). */
  lock?: number;
};

export const LOCK_WORD = "Anthropic";

/** Pages for /match-cut (the lock word is LOCK_WORD). Each paragraph is verbatim coverage of the Resolve 21.1 update and names Anthropic
 *  (Victor, 2026-10-25: lock on "Anthropic", not "Claude", so it is not Corbin's exact cut). Fetched 2026-10-25. */
export const ARTICLES: Article[] = [
  {
    source: "Y.M.Cinema Magazine",
    date: "September 17, 2026",
    text: "Blackmagic Design has published the September 2026 DaVinci Resolve 21.1 Reference Manual, a document extending beyond 4,300 pages. Buried near the end of that manual is one of the more important additions to Resolve 21.1: a section on page 4,318 titled “Using DaVinci Resolve with AI Assistants.” MCP stands for Model Context Protocol. It is an open standard originally introduced by Anthropic in 2024 to give AI applications a common way to connect with external software, tools, and data.",
    face: "sans",
  },
  {
    source: "PTTL.gr",
    date: "September 11, 2026",
    text: "The new feature is not an exclusive Claude integration. Blackmagic specifically names Claude, Claude Code and ChatGPT Codex as examples of AI assistants that can connect to DaVinci Resolve Studio 21.1 through its new MCP server. The Model Context Protocol, or MCP, was originally introduced by Anthropic as an open standard for connecting AI applications with external data and tools. An MCP server can expose information and specific functions to a compatible AI client, allowing a model to go beyond text responses and call tools or perform actions. In Resolve’s case, that distinction is important. Resolve is gaining a standardized bridge to AI assistants, while Claude, Claude Code and ChatGPT Codex are the solutions Blackmagic currently names.",
    face: "serif",
  },
  {
    source: "StreamingMeme",
    date: "September 14, 2026",
    text: "Blackmagic Design has integrated Claude and ChatGPT into DaVinci Resolve 21.1 to automate repetitive editorial tasks like media organization and highlight reel generation. DaVinci Resolve 21.1 now integrates Anthropic's Claude and OpenAI's ChatGPT to assist with editorial workflows. By focusing on assistive AI rather than generative tools, the company aims to help editors manage massive volumes of high-resolution footage while maintaining their creative control.",
    face: "mono",
  },
  {
    source: "PTTL.gr",
    date: "September 11, 2026",
    text: "Does DaVinci Resolve 21.1 only work with Claude? No. Blackmagic names AI assistants such as Claude, Claude Code and ChatGPT Codex. The new architecture is based on a native MCP server and is not presented as an Anthropic-exclusive integration. What can AI assistants do inside DaVinci Resolve? Blackmagic lists project analysis, media organization, settings changes, batch rendering, highlight-edit creation from long-form video, removal of unwanted clips and rendering of deliverables.",
    face: "serif",
  },
  {
    source: "Black Hat Editor Tools",
    date: "October 2, 2026",
    text: "What did DaVinci Resolve 21.1 actually add? A native MCP server. MCP is the open standard Anthropic published in 2024. It lets an AI assistant call functions inside other software. Blackmagic's release lists: Assistants. Claude, Claude Code and ChatGPT Codex. Named jobs. Analyze projects, organize media, adjust settings, batch render. Examples. Highlight edits from long videos, removing unwanted clips, rendering deliverables.",
    face: "sans",
  },
  {
    source: "Y.M.Cinema Magazine",
    date: "September 17, 2026",
    lock: 2,
    text: "MCP stands for Model Context Protocol. It is an open standard originally introduced by Anthropic in 2024 to give AI applications a common way to connect with external software, tools, and data. Anthropic describes the idea as something similar to USB-C for AI: one standardized connection rather than a completely different custom integration for every application. Blackmagic did not develop MCP. What it has done is build an MCP server into DaVinci Resolve Studio. The manual makes clear that this is more than asking an AI how to use Resolve. Blackmagic says users can control Resolve through natural language conversation. The AI assistant can organize timelines, create custom looks, create and run scripts, with those actions reflected directly inside Resolve.",
    face: "mono",
  },

];

/** Verified counts from the Blackmagic press release and CineD (SOURCES.md). For /crt-graph. */
export const COUNTS = [
  { n: 20, plus: false, label: "new scripting APIs" },
  { n: 25, plus: true, label: "new Krokodove Fusion tools" },
  { n: 100, plus: true, label: "new tools and controls" },
] as const;
export const COUNTS_TITLE = "DaVinci Resolve 21.1";
export const COUNTS_SOURCE = "Blackmagic Design, September 8, 2026";

/** Grant Petty, verbatim (press release). For /over-the-shoulder-zoom. */
export const PETTY = {
  name: "Grant Petty",
  role: "CEO, Blackmagic Design",
  quote:
    "With AI assistant support, our customers can now ask Claude or ChatGPT to handle repetitive tasks such as create highlight edits, organizing media or batch rendering, which frees them up to focus on creative decisions.",
  /** Two verbatim fragments for the two proof cards, in order. */
  cards: ["handle repetitive tasks", "focus on creative decisions"],
  /** Verbatim lead-ins from the same sentence, shown above each fragment. */
  kicker: ["ASK CLAUDE OR CHATGPT TO", "WHICH FREES THEM UP TO"],
} as const;

/** Official Blackmagic press-kit screenshots of Resolve 21 (public/resolve/shots, see SOURCES.md). For /shutter-strike photo cards. */
export const SHOTS = {
  color: "resolve/shots/bmd-resolve21-Color-hires.png",
  edit: "resolve/shots/bmd-resolve21-Edit-hires.png",
  cut: "resolve/shots/bmd-resolve21-Cut-hires.png",
  fusion: "resolve/shots/bmd-resolve21-Fusion-hires.png",
  fairlight: "resolve/shots/bmd-resolve21-Fairlight-hires.png",
  media: "resolve/shots/bmd-product-media-media-xl.jpg",
} as const;

/** Real Resolve timeline track names. For /screen-push labels. */
export const TRACKS = ["V2", "V1", "A1"] as const;

export const LOGOS = {
  claude: "slashfx/claude.svg",
  resolve: "slashfx/davinci-resolve-icon.svg",
  blackmagic: "slashfx/blackmagic-design-logo-official.svg",
} as const;

/** Verbatim fragments of the Y.M.Cinema paragraph (ARTICLES[0]) for /page-flip. */
export const MANUAL = {
  name: "DaVinci Resolve 21.1 Reference Manual",
  pages: "4,300",
  page: "4,318",
  section: "Using DaVinci Resolve with AI Assistants",
  source: "Y.M.Cinema Magazine, September 17, 2026",
} as const;
/** Verbatim from PTTL.gr (ARTICLES[1]): the bridge between the assistants and Resolve, for /logo-bridge. */
export const MCP = { phrase: "MCP server", expansion: "Model Context Protocol", source: "PTTL.gr, September 11, 2026" } as const;
/** Real Resolve track names (the Edit page), for /timeline-scrub. */
export const TRACK_NAMES = ["V2", "V1", "A1"] as const;

/** Verbatim headlines (og:title of each page, fetched 2026-10-25), with publication and date, for /headline-feed. */
export const HEADLINES = [
  { text: "DaVinci Resolve 21.1 opens editing workflows to AI assistants through MCP", source: "PTTL.gr", date: "September 11, 2026" },
  { text: "DaVinci Resolve 21.1 Introduces Claude and ChatGPT Assistant", source: "VP Land", date: "September 9, 2026" },
  { text: "Blackmagic Design Adds Claude and ChatGPT to DaVinci Resolve", source: "StreamingMeme", date: "September 14, 2026" },
  { text: "Resolve 21.1 Adds MCP and Presets for Automation", source: "DIGITAL PRODUCTION", date: "September 8, 2026" },
  { text: "DaVinci Resolve 21.1 Uses MCP to Let AI Assistants Control the Edit", source: "Y.M.Cinema Magazine", date: "September 17, 2026" },
  { text: "Blackmagic Design releases DaVinci Resolve 21.1", source: "CG Channel", date: "September 2026" },
  { text: "Claude in DaVinci Resolve 21.1, and in Premiere Pro?", source: "Black Hat Editor Tools", date: "October 2, 2026" },
] as const;
/** Verbatim from PTTL.gr (ARTICLES[1]): the three assistants Blackmagic names, for /two-tubes. */
export const ASSISTANTS = ["Claude", "Claude Code", "ChatGPT Codex"] as const;
/** Verbatim job list from ARTICLES[3] (PTTL.gr): what Blackmagic lists the assistants can do. For /focus-pull, /two-tubes. */
export const JOBS = ["project analysis", "media organization", "settings changes", "batch rendering", "highlight-edit creation from long-form video", "removal of unwanted clips", "rendering of deliverables"] as const;
