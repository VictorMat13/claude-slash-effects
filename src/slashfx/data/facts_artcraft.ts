// ArtCraft retarget (set 3, take C0020 "Claude rebuilt Photoshop"). Same export names and cardinalities as facts.ts.
// Real text only. Every string here is verbatim from its source (fetched 2026-10-26) or from public/artcraft/SOURCES.md, which
// lists the URL and fetch date of each one. Never add numbers, quotes or article text that is not in this file.
import type { Article } from "./facts_resolve";

export const LOCK_WORD = "Claude";

/** Pages for /match-cut (the lock word is LOCK_WORD). Each text is one verbatim paragraph of coverage of the ArtCraft apps (the
 *  free Photoshop, Premiere and After Effects rebuilds) and names Claude exactly once. Dates are each page's own dateline. */
export const ARTICLES: Article[] = [
  {
    source: "Ars Technica",
    date: "October 7, 2026",
    text: "In announcing those new apps on Reddit earlier this week, software developer Brandon Thomas said he used Anthropic’s Claude Opus 5.5 to create “clean-room replacements” for Adobe’s closed source software in Rust (with WebAssembly versions available for use in a browser). And while commenters on Hacker News and elsewhere have taken pains to point out the new software’s many current shortcomings, Thomas makes the grandiose promise that the current “super early alpha” state will soon lead to something just as functional as anything Adobe has ever put out.",
    face: "sans",
  },
  {
    source: "Gizmodo",
    date: "October 7, 2026",
    text: "Using Claude Opus 5.5 and the programming language Rust, the creator of these apps, Atlanta-based Brandon Thomas, says he recreated Photoshop, Illustrator, Premiere, Lightroom, Acrobat Pro, After Effects, and InDesign, and made them free to use. The new versions are technically called Photocraft, Vectorcraft, Filmcraft, Lightcraft, Printcraft, Effectcraft, and Designcraft. The overarching umbrella project is titled Artcraft.",
    face: "serif",
  },
  {
    source: "BigGo Finance",
    date: "October 8, 2026",
    text: "An Atlanta-based developer has unveiled a suite of free, open-source applications designed to replicate seven of Adobe's flagship creative tools, declaring that \"software is over\" after using Anthropic's Claude Opus 5.5 to accelerate a reverse-engineering effort that would traditionally require years of work.",
    face: "mono",
  },
  {
    source: "Mezha",
    date: "October 8, 2026",
    text: "The applications were developed using Anthropic's Claude Opus 5.5 and written in Rust. The goal was to recreate familiar interfaces, keystrokes, and functionality without using the original code. The author says that his work was motivated by Adobe's pricing policy. Moreover, the development is not commercial: according to Thomas, ArtCraft's existing business can finance further development.",
    face: "serif",
  },
  {
    source: "VICE",
    date: "October 9, 2026",
    text: "According to Ars Technica, developer Brandon Thomas used Anthropic’s Claude Opus 5.5 and Rust to reverse-engineer Adobe’s core software suite into an open-source clone called ArtCraft. Instead of paying an obnoxious monthly subscription fee for Photoshop, Illustrator, Premiere, and Lightroom, artists can now use free clones called PhotoCraft, VectorCraft, FilmCraft, and LightCraft.",
    face: "sans",
  },
  {
    source: "Linux Compatible",
    date: "October 11, 2026",
    text: "One person built an entire Adobe-suite competitor in a matter of days. Brandon Thomas, a 15-year software veteran based in Atlanta, says he wrote seven creative applications in pure Rust, from scratch, using Claude Opus 5.5 as the main workhorse. There is no team behind the Crafting Apps. Just him and a very capable AI agent.",
    face: "mono",
  },
];

/** Verbatim counts from the PhotoCraft README on GitHub ("16 adjustment layers", "68 tools", "one registry of 500+ commands").
 *  For /crt-graph and /split-flap. */
export const COUNTS = [
  { n: 16, plus: false, label: "adjustment layers" },
  { n: 68, plus: false, label: "tools" },
  { n: 500, plus: true, label: "commands" },
] as const;
export const COUNTS_TITLE = "PhotoCraft";
export const COUNTS_SOURCE = "PhotoCraft README, GitHub, October 25, 2026";

/** Brandon Thomas, the developer who built the Crafting Apps with Claude, verbatim as quoted by Ars Technica (October 7, 2026).
 *  The quote's closing comma (before "Thomas wrote") is a period here, as with Grant Petty in facts.ts.
 *  For /over-the-shoulder-zoom, /ticker-tape, /terminal-quote. */
export const PETTY = {
  name: "Brandon Thomas",
  role: "Founder, ArtCraft",
  quote: "Now you can just create 1:1 functional equivalents, clean room, that are highly performant and cross-platform. Nothing is stopping you.",
  /** Two verbatim fragments for the two proof cards, in order. */
  cards: ["1:1 functional equivalents", "highly performant and cross-platform"],
  /** Verbatim lead-ins from the same sentence (upper-cased like facts.ts), shown above each fragment. */
  kicker: ["NOW YOU CAN JUST CREATE", "CLEAN ROOM, THAT ARE"],
} as const;

/** Real captures of the apps from their own GitHub READMEs, plus a GitHub repo page capture (public/artcraft/shots, see
 *  SOURCES.md). Keys keep the Resolve page names so effects compile unchanged: color = PhotoCraft (the Photoshop rebuild),
 *  edit = FilmCraft (the Premiere rebuild, timeline with named tracks), cut = EffectCraft (the After Effects rebuild),
 *  fusion = FilmCraft timeline close-up, fairlight = github.com/storytold/photocraft, media = FilmCraft Assembly workspace (bins). */
export const SHOTS = {
  color: "artcraft/shots/photocraft-demo.jpg",
  edit: "artcraft/shots/filmcraft-hero.png",
  cut: "artcraft/shots/effectcraft-hero.png",
  fusion: "artcraft/shots/filmcraft-timeline.png",
  fairlight: "artcraft/shots/github-photocraft-repo.png",
  media: "artcraft/shots/filmcraft-assembly.png",
} as const;

/** Real FilmCraft track headers (SHOTS.edit: V2, V1, A1). For /screen-push labels. */
export const TRACKS = ["V2", "V1", "A1"] as const;

/** resolve = the ArtCraft mark, blackmagic = the ArtCraft logo (mark + wordmark, light ink), both from the PhotoCraft repo's
 *  docs/brand (trademarks of the ArtCraft Team, see SOURCES.md). The maker of the Crafting Apps is ArtCraft, so both keys are ArtCraft. */
export const LOGOS = {
  claude: "slashfx/claude.svg",
  resolve: "artcraft/logos/artcraft-mark.svg",
  blackmagic: "artcraft/logos/artcraft-logo-white.svg",
} as const;

/** Adobe's own Photoshop manual (PDF, 1,017 pages): the "Default keyboard shortcuts" section opens on PDF page 184
 *  (printed folio 174). For /page-flip. */
export const MANUAL = {
  name: "Adobe Photoshop Help",
  pages: "1,017",
  page: "184",
  section: "Default keyboard shortcuts",
  source: "Adobe, Last updated 11/5/2019",
} as const;
/** Verbatim from the EffectCraft README ("MCP server: effectcraft-cli mcp speaks the Model Context Protocol"), for /logo-bridge. */
export const MCP = { phrase: "MCP server", expansion: "Model Context Protocol", source: "EffectCraft README, GitHub, October 22, 2026" } as const;
/** Real FilmCraft track names next to those headers (SHOTS.edit: V2 B-roll, V1 Picture, A1 Nat sound), for /timeline-scrub. */
export const TRACK_NAMES = ["B-roll", "Picture", "Nat sound"] as const;

/** Verbatim headlines (og:title of each page, fetched 2026-10-26), with publication and date, for /headline-feed. */
export const HEADLINES = [
  { text: "“Software is over”: Bold AI developer takes aim at Adobe with open source clones", source: "Ars Technica", date: "October 7, 2026" },
  { text: "Someone Vibe Coded a Free Knockoff of Adobe Creative Suite", source: "Gizmodo", date: "October 7, 2026" },
  { text: "Dev Uses AI To Build Clones Of Photoshop And Entire Adobe Suite For Free", source: "HotHardware", date: "October 8, 2026" },
  { text: "Everything We Know About the Free Adobe Clones Built With AI. Do They Actually Work?", source: "VICE", date: "October 9, 2026" },
  { text: "ArtCraft: The Free, Open-Source Adobe Suite That Racked Up 43,000 Stars in Days", source: "Linux Compatible", date: "October 11, 2026" },
  { text: "How AI apps are offering free substitutes for Big Tech software", source: "Al Jazeera", date: "October 14, 2026" },
  { text: "Developer Who Cloned Photoshop With AI Just Did the Same to Microsoft Office", source: "Decrypt", date: "October 14, 2026" },
] as const;
/** Three real names: Claude (FilmCraft README, "so Claude or any agent can cut, trim, grade, mix and export"), Claude Code
 *  (FilmCraft docs/agents.md), Claude Opus 5.5 (ARTICLES[1], and the Co-Authored-By trailers on PhotoCraft commits). For /two-tubes. */
export const ASSISTANTS = ["Claude", "Claude Code", "Claude Opus 5.5"] as const;
/** Verbatim list from ARTICLES[1] (Gizmodo): the seven Adobe apps Thomas says he recreated with Claude Opus 5.5. For /focus-pull, /two-tubes. */
export const JOBS = ["Photoshop", "Illustrator", "Premiere", "Lightroom", "Acrobat Pro", "After Effects", "InDesign"] as const;
