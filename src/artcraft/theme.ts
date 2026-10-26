// ===========================================================================
// ArtCraft x Victor (organic reel, Oct 2026). Shared series tokens.
// READ-ONLY for builders: import from here, build layouts in your own file.
//
// Style: CRT Scope (CREATORS/Styles/CRT Scope/STYLE.md). Every part is a clean
// 2D scene on black, wrapped in <CRT> from ../fish8/crt. One live oscilloscope
// trace grounds the subjects. Dark panels (#101217) with light ink. No 3D.
// Real assets only: public/artcraft/site (the 12 Craft app icons + real
// screenshots from getartcraft.com/apps), public/artcraft/logos (official Adobe
// Ps/Pr/Ae icons from Wikimedia, the Claude mark), public/artcraft/data (real
// GitHub data for storytold/photocraft, pulled Oct 13).
// ===========================================================================
export { EASE, FONT_UI, FONT_MONO } from "../invideo/theme";
export { CRT } from "./kit/Tube";

export const FPS = 30;

// Victor, Oct 13: 8% padding on top, left and right. Only the black tube bleeds.
// Bottom: 4% on 9:8 (sits above the talking head), 12% on 9:16 (IG caption UI).
export const SAFE = { top: 0.08, side: 0.08, bottom9x8: 0.04, bottom9x16: 0.12 } as const;
export const safeRect = (width: number, height: number) => {
  const tall = height > width * 1.2;
  const left = Math.round(width * SAFE.side);
  const top = Math.round(height * SAFE.top);
  const bottom = Math.round(height * (tall ? SAFE.bottom9x16 : SAFE.bottom9x8));
  return { left, top, right: width - left, bottom: height - bottom, width: width - 2 * left, height: height - top - bottom };
};

// Script parts (VO is Victor's, never on screen). Frames at the script's own timing.
export const PARTS = {
  p1: { id: "AcP1Hook", fmt: "9x8", frames: 240, line: "Somebody just used Claude to rebuild Photoshop, Premiere and After Effects, and he's giving every one of them away for free. Let me show you what that means for you." },
  p2: { id: "AcP2SameShortcuts", fmt: "9x16", frames: 240, line: "These are apps people pay Adobe hundreds of dollars a year for, and the free copies have almost every feature, right down to the same keyboard shortcuts. If you know Photoshop, you already know how to use this." },
  p3: { id: "AcP3ThirtyYears", fmt: "9x8", frames: 180, line: "But here's where it gets crazy. Adobe spent over thirty years building these apps, and Claude rebuilt them in a couple of weeks." },
  p4: { id: "AcP4OpenSource", fmt: "9x16", frames: 210, line: "I mean, this is the future of AI. More and more software is going open source, which means anyone can grab the code and use it for free." },
  p5: { id: "AcP5PayMonthly", fmt: "9x8", frames: 150, line: "So if there's an app you pay for every month, you can just ask Claude to build your own." },
  p6: { id: "AcP6NoCode", fmt: "9x16", frames: 240, line: "And you can do this even if you've never written a line of code. If you can describe what you want, Claude can make a simple version of it." },
  p7: { id: "AcP7WhereHeading", fmt: "9x8", frames: 300, line: "And this is where everything's heading. You won't need to download and pay for apps anymore. You'll just tell AI what you need, and it'll build it for you, fully custom, with exactly the features you want." },
} as const;

// Hook overlay (P1 only). PLACEHOLDER until Victor picks; builders read this constant, never hardcode.
export const HOOK_OVERLAY = "Claude rebuilt Adobe for free";

// CRT Scope palette (fish8 CARD_DARK + phosphor inks). Content is bright on black.
export const PH = {
  black: "#000000",
  panel: "#101217", // dark UI panel (never white panels inside the tube)
  panel2: "#1C1F26", // raised row / input
  hair: "rgba(255,255,255,0.14)",
  ink: "#E9E7E2",
  muted: "#8E939E",
  faint: "#5A606C",
  trace: "rgba(243,241,236,0.34)", // idle scope line
  claude: "#D97757", // Claude coral (official mark color)
  claudeRgb: "217,119,87",
  user: "#3BE08A", // the person (Victor/viewer) side of the trace, fish8 green
  userRgb: "59,224,138",
} as const;

// The 12 Craft apps (real names, real icons + screenshots from getartcraft.com/apps).
// accent = the icon's background color, sampled.
export const APPS = [
  { id: "photocraft", name: "PhotoCraft", replaces: "Photoshop", accent: "#2E7CF6" },
  { id: "filmcraft", name: "FilmCraft", replaces: "Premiere Pro", accent: "#8A5CF6" },
  { id: "effectcraft", name: "EffectCraft", replaces: "After Effects", accent: "#E13592" },
  { id: "vectorcraft", name: "VectorCraft", replaces: "Illustrator", accent: "#E7573E" },
  { id: "lightcraft", name: "LightCraft", replaces: "Lightroom", accent: "#F3A617" },
  { id: "designcraft", name: "DesignCraft", replaces: "InDesign", accent: "#7AB51B" },
  { id: "pdfcraft", name: "PdfCraft", replaces: "Acrobat", accent: "#11A58A" },
  { id: "soundcraft", name: "SoundCraft", replaces: "Audition", accent: "#14AAC5" },
  { id: "wordcraft", name: "WordCraft", replaces: "Word", accent: "#3C5BDC" },
  { id: "gridcraft", name: "GridCraft", replaces: "Excel", accent: "#1D9D54" },
  { id: "deckcraft", name: "DeckCraft", replaces: "PowerPoint", accent: "#F26B1E" },
  { id: "cadcraft", name: "CADCraft", replaces: "AutoCAD", accent: "#11A1C5" },
] as const;
export type AppId = (typeof APPS)[number]["id"];
export const appIcon = (id: AppId) => `artcraft/site/${id}-icon.webp`; // 256x256
export const appShot = (id: AppId) => `artcraft/site/${id}-hero.webp`; // 1600x1000 (effectcraft 1600x972)
export const FILMCRAFT_COLOR_SHOT = "artcraft/site/filmcraft-color.webp"; // 1600x1000, color page
export const ARTCRAFT_MARK = "artcraft/site/artcraft-icon.svg";

// Official marks (Wikimedia / Anthropic). Use with staticFile().
export const LOGOS = {
  claude: "artcraft/logos/claude.svg",
  photoshop: "artcraft/logos/Adobe_Photoshop_CC_icon.svg",
  premiere: "artcraft/logos/Adobe_Premiere_Pro_CC_icon.svg",
  afterEffects: "artcraft/logos/Adobe_After_Effects_CC_icon.svg",
} as const;

// Adobe's first releases (public record): Photoshop 1.0 Feb 1990, Premiere 1.0 Dec 1991, After Effects 1.0 Jan 1993.
export const ADOBE_FIRST = [
  { app: "Photoshop", year: 1990, logo: LOGOS.photoshop, twin: "photocraft" as AppId },
  { app: "Premiere Pro", year: 1991, logo: LOGOS.premiere, twin: "filmcraft" as AppId },
  { app: "After Effects", year: 1993, logo: LOGOS.afterEffects, twin: "effectcraft" as AppId },
] as const;

// Real GitHub data, storytold/photocraft (gh api, Oct 13 2026).
export const REPO = {
  owner: "storytold",
  name: "photocraft",
  description: "PhotoCraft: An open-source, photo editor written by scratch in pure Rust",
  url: "https://github.com/storytold/photocraft",
  clone: "https://github.com/storytold/photocraft.git",
  branch: "main",
  stars: "54.5k",
  forks: "9.1k",
  commits: 2012,
  license: "Apache-2.0",
  language: "Rust",
  created: "2026-09-30", // first commit "init repo", 2026-09-30 06:12 UTC
  topics: ["art", "image-editing", "image-editor", "photo-editing", "rust"],
  files: [
    { dir: true, name: ".cargo" }, { dir: true, name: ".config" }, { dir: true, name: ".github" },
    { dir: true, name: "apps" }, { dir: true, name: "assets" }, { dir: true, name: "book" },
    { dir: true, name: "contributors" }, { dir: true, name: "crates" }, { dir: true, name: "docs" },
    { dir: true, name: "examples" }, { dir: true, name: "packaging" }, { dir: true, name: "perf" },
    { dir: true, name: "scorecard" }, { dir: true, name: "scripts" }, { dir: true, name: "xtask" },
    { dir: false, name: ".gitignore" }, { dir: false, name: "AGENTS.md" }, { dir: false, name: "Cargo.lock" },
    { dir: false, name: "Cargo.toml" }, { dir: false, name: "Dockerfile" }, { dir: false, name: "LICENSE-APACHE" },
    { dir: false, name: "LICENSE-MIT" }, { dir: false, name: "README.md" }, { dir: false, name: "ROADMAP.md" },
  ],
  // README line (real): "The menus, shortcuts, panels and tools are where your hands expect them, from ⌘J to ⇧⌘D."
  readmeFamiliar: "The menus, shortcuts, panels and tools are where your hands expect them, from ⌘J to ⇧⌘D. If you know Photoshop, you already know PhotoCraft.",
} as const;

// Other Craft repos (stars / created), same pull.
export const REPOS = [
  { name: "photocraft", stars: "54.5k", created: "2026-09-30" },
  { name: "filmcraft", stars: "11.7k", created: "2026-09-30" },
  { name: "pdfcraft", stars: "11.7k", created: "2026-09-30" },
  { name: "lightcraft", stars: "11.4k", created: "2026-09-30" },
  { name: "wordcraft", stars: "9.6k", created: "2026-10-07" },
  { name: "vectorcraft", stars: "8.0k", created: "2026-09-30" },
  { name: "effectcraft", stars: "5.9k", created: "2026-10-01" },
  { name: "gridcraft", stars: "4.0k", created: "2026-10-07" },
  { name: "cadcraft", stars: "3.6k", created: "2026-10-07" },
  { name: "designcraft", stars: "3.5k", created: "2026-10-01" },
  { name: "deckcraft", stars: "2.7k", created: "2026-10-07" },
  { name: "soundcraft", stars: "2.3k", created: "2026-10-07" },
] as const;

// PhotoCraft commits per day, Sep 30 to Oct 13 (sums to 2,012). Source: data/photocraft-commits-per-day.txt.
export const COMMITS_PER_DAY = [
  { day: "Sep 30", n: 6 }, { day: "Oct 1", n: 10 }, { day: "Oct 2", n: 18 }, { day: "Oct 3", n: 35 },
  { day: "Oct 4", n: 57 }, { day: "Oct 5", n: 108 }, { day: "Oct 6", n: 36 }, { day: "Oct 7", n: 200 },
  { day: "Oct 8", n: 226 }, { day: "Oct 9", n: 376 }, { day: "Oct 10", n: 262 }, { day: "Oct 11", n: 226 },
  { day: "Oct 12", n: 277 }, { day: "Oct 13", n: 175 },
] as const;
// Real commit messages live in public/artcraft/data/*-commits.tsv (sha, date, subject). Read them, never invent.

// GitHub dark (github.com dark default), for P4.
export const GH = {
  bg: "#0D1117",
  panel: "#161B22",
  border: "#30363D",
  text: "#E6EDF3",
  muted: "#7D8590",
  link: "#2F81F7",
  green: "#238636",
  greenText: "#FFFFFF",
  badge: "#21262D",
} as const;

// claude.ai dark mode (approximate, sampled by eye from the app). Coral send button, serif reply.
export const CLAUDE_DARK = {
  bg: "#262624",
  sidebar: "#1F1E1D",
  composer: "#30302E",
  border: "rgba(255,255,255,0.10)",
  bubble: "#141413",
  text: "#F5F4EF",
  muted: "#A6A39A",
  send: "#C6613F",
} as const;

// The build-your-own prompt from the CRAFT guide, filled in with a concrete example.
export const BUILD_PROMPT =
  "I pay for Photoshop every month, but I only use it to crop and resize photos. Build me my own simple version that does just that.";
