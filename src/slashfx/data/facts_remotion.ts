// Set 2 (Remotion tips take C0023). Real text only. Every string here is verbatim from its source (fetched 2026-10-26) or
// from public/remotion/SOURCES.md. Same export names and cardinalities as facts.ts. Never add numbers, quotes or article
// text that is not in this file.

import type { Article } from "./facts_resolve";

export const LOCK_WORD = "Remotion";

/** Pages for /match-cut (the lock word is LOCK_WORD). Each paragraph is verbatim and contains "Remotion" (the first
 *  occurrence is locked unless `lock` says otherwise). Fetched 2026-10-26. ARTICLES[1] is a contiguous excerpt of one
 *  interview answer (the "Jonny:" speaker label and the answer's first three sentences are left off). */
export const ARTICLES: Article[] = [
  {
    source: "StartupHub.ai",
    date: "January 22, 2026",
    text: "In early January 2026, Remotion launched Agent Skills, a powerful integration that supercharges Anthropic’s Claude Code to handle end-to-end video generation. This move effectively turns the complex process of defining animations in React and TypeScript into a straightforward natural language prompt. The result is a deterministic, scalable video production pipeline that bypasses traditional editing software entirely.",
    face: "sans",
  },
  {
    source: "Decibel",
    date: "February 5, 2023",
    text: "I learned the Adobe suite of tools and started creating promotional videos for my apps. But, I was enormously frustrated by how much time it took me to create videos and started looking for tools that would allow me to use code to create videos quickly and easily - I found none. So, I built a prototype that could edit videos programmatically and released it on GitHub. The reception from the community took me completely by surprise - I knew that some others had a similar need, but in no way was I prepared for the massive blast that Remotion has been since then!",
    face: "serif",
  },
  {
    source: "The New Stack",
    date: "September 11, 2024",
    text: "React is known for its ability to create frontend web animations and special effects. Programmer Jonny Burger found video editors challenging to use, so he decided to take React’s animation capabilities and build a framework that uses React code to create videos. It’s called Remotion.",
    face: "mono",
  },
  {
    source: "MindStudio",
    date: "July 9, 2026",
    text: "This kind of composition is what typically takes a motion designer an afternoon to produce in After Effects. With Claude Code and Remotion, it’s a 10-minute conversation.",
    face: "serif",
  },
  {
    source: "Tella",
    date: "August 27, 2026",
    text: "Remotion is a framework for making videos with React. A composition is code: React components define the frames, animations, text, images, audio, and timing. Claude Code can write that code, but a general coding agent does not automatically know every Remotion convention.",
    face: "sans",
  },
  {
    source: "Remotion docs",
    date: "October 26, 2026",
    text: "Best practices for writing Remotion React markup. Use this for knowledge about compositions, animations, layout, typography, media elements, effects, audio, fonts, timing.",
    face: "mono",
  },
];

/** Verified counts from the remotion.dev homepage (SOURCES.md). For /crt-graph. */
export const COUNTS = [
  { n: 300, plus: true, label: "contributors" },
  { n: 800, plus: true, label: "customers" },
  { n: 1000, plus: false, label: "pages of docs" },
] as const;
export const COUNTS_TITLE = "Remotion";
export const COUNTS_SOURCE = "remotion.dev, October 26, 2026";

/** Jonny Burger, verbatim (Decibel OSS Spotlight interview). Key name kept from facts.ts. For /over-the-shoulder-zoom. */
export const PETTY = {
  name: "Jonny Burger",
  role: "Chief Hacker @ Remotion",
  quote:
    "I was enormously frustrated by how much time it took me to create videos and started looking for tools that would allow me to use code to create videos quickly and easily - I found none.",
  /** Two verbatim fragments for the two proof cards, in order. */
  cards: ["how much time it took me to create videos", "create videos quickly and easily"],
  /** Verbatim lead-ins from the same sentence, shown above each fragment. */
  kicker: ["I WAS ENORMOUSLY FRUSTRATED BY", "USE CODE TO"],
} as const;

/** Playwright captures (3840x2160, 1920x1080 viewport at 2x) of remotion.dev, the Remotion Studio and GitHub
 *  (public/remotion/shots, see SOURCES.md). Keys kept from facts.ts. For /shutter-strike photo cards. */
export const SHOTS = {
  color: "remotion/shots/remotion-site-hero.png",
  edit: "remotion/shots/remotion-studio-helloworld.png",
  cut: "remotion/shots/remotion-studio-timeline.png",
  fusion: "remotion/shots/remotion-docs-agent-skills.png",
  fairlight: "remotion/shots/remotion-github-repo.png",
  media: "remotion/shots/remotion-player.png",
} as const;

/** Real Remotion Studio timeline track names (Hello World template, top to bottom). For /screen-push labels. */
export const TRACKS = ["Remotion logo", "Welcome title", "Editing hint"] as const;

/** Keys kept from facts.ts: resolve = the product logo, blackmagic = the maker's mark (Remotion AG uses the same mark,
 *  here as the official wordmark banner). Both from Remotion's official brand assets zip. */
export const LOGOS = {
  claude: "slashfx/claude.svg",
  resolve: "remotion/logos/remotion-logo-compact-blue.svg",
  blackmagic: "remotion/logos/remotion-banner-dark.svg",
} as const;

/** For /page-flip. Remotion's docs have no page numbers: pages and page are both the verified docs page count ("1000
 *  pages of docs", remotion.dev); section is the real title of the docs page about skills. See SOURCES.md. */
export const MANUAL = {
  name: "Remotion docs",
  pages: "1000",
  page: "1000",
  section: "Agent Skills",
  source: "remotion.dev, October 26, 2026",
} as const;
/** Verbatim from remotion.dev/docs/ai: the bridge between the coding agents and Remotion, for /logo-bridge. */
export const MCP = { phrase: "Agent Skills", expansion: "Give coding agents current Remotion guidance", source: "Remotion docs, October 26, 2026" } as const;
/** Real Remotion Studio track names (Hello World template timeline), for /timeline-scrub. */
export const TRACK_NAMES = ["Remotion logo", "Welcome title", "Editing hint"] as const;

/** Verbatim headlines (og:title of each page, fetched 2026-10-26), with publication and date, for /headline-feed. */
export const HEADLINES = [
  { text: "Remotion AI video makes production code from plain prompts", source: "StartupHub.ai", date: "January 22, 2026" },
  { text: "Claude Code + Remotion: Generate Pro Videos with AI", source: "Bruce on AI Engineering", date: "January 25, 2026" },
  { text: "Remotion Skills 2026: Create React Videos via Claude Code", source: "Gaga AI", date: "January 26, 2026" },
  { text: "Remotion Claude Code Skill: Generate Videos with React", source: "JonathansBlog", date: "April 2, 2026" },
  { text: "Remotion Codex Motion Graphics: My 30-Min Video Test", source: "Engr Mejba Ahmed", date: "April 25, 2026" },
  { text: "Making Videos with Claude Code and Remotion", source: "OpenReplay", date: "June 4, 2026" },
  { text: "How to Use Remotion Agent Skills With Claude Code", source: "Tella", date: "August 27, 2026" },
] as const;
/** Verbatim from remotion.dev/docs/studio ("a coding agent such as Claude Code, Codex or Cursor"), for /two-tubes. */
export const ASSISTANTS = ["Claude Code", "Codex", "Cursor"] as const;
/** 7 of the 9 verbatim items in ARTICLES[5] (Remotion docs, /remotion-markup): what the skill teaches the agent, in page
 *  order ("compositions" and "audio" left out). For /focus-pull, /two-tubes. */
export const JOBS = ["animations", "layout", "typography", "media elements", "effects", "fonts", "timing"] as const;
