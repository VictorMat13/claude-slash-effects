# Remotion (set 2, take C0023 "remotion tips") - sources and assets

Gathered 2026-10-26 by the DATA agent. Every string in src/slashfx/data/facts_remotion.ts was checked character for character
against the raw HTML of its page (fetched with curl on 2026-10-26, HTML-unescaped, whitespace-normalized; a script asserted each
string is present). Key pages were also cross-checked with WebFetch. Nothing here was rendered. Downloaded files were treated as
untrusted data. No em dashes anywhere in the strings.

## 1. Verified facts (export by export)

| Export | Value | Source URL | Notes |
|---|---|---|---|
| LOCK_WORD | "Remotion" | all ARTICLES | Present in every ARTICLES text; the first occurrence is locked (no `lock` set). |
| ARTICLES[0] | StartupHub.ai, January 22, 2026, sans | https://www.startuphub.ai/ai-news/general/2026/remotion-ai-video-makes-production-code-from-plain-prompts | One full paragraph. article:published_time 2026-01-22T14:09:20Z (modified 2026-06-10). Curly apostrophe in "Anthropic’s" is the page's. |
| ARTICLES[1] | Decibel, February 5, 2023, serif | https://www.decibel.vc/articles/remotion-create-videos-with-code-using-react | Jonny Burger's answer to "What was your reason to start Remotion?" (Decibel OSS Spotlight, interviewer Sudip Chakrabarti). Contiguous excerpt: the "Jonny:" label and the answer's first three sentences are left off. Date from the page's meta description ("Feb 05, 2023"); no visible dateline. The " - " is a plain hyphen on the page. |
| ARTICLES[2] | The New Stack, September 11, 2024, mono | https://thenewstack.io/?p=22758554 | Opening paragraph of "Framework Lets React Developers Create Video With Code" by Loraine Lawson. datePublished 2024-09-11T16:23Z. |
| ARTICLES[3] | MindStudio, July 9, 2026, serif | https://mindstudio.ai/blog/remotion-claude-code-animated-logo-reveals-motion-graphics | One full paragraph, author Luis Chavez-Mattos. Chosen because it matches his line "Motion graphics used to take me hours". Other paragraphs on this page contain em dashes and were not used. |
| ARTICLES[4] | Tella, August 27, 2026, sans | https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code | One full paragraph (section "What are Remotion Agent Skills?"). datePublished 2026-08-27, modified 2026-10-12. |
| ARTICLES[5] | Remotion docs, October 26, 2026, mono | https://www.remotion.dev/docs/ai/skills | The two lines under the "/remotion-markup" heading. Date is the page's "Last updated on Oct 26, 2026". Same text in https://github.com/remotion-dev/skills README. |
| COUNTS | 300+ contributors, 800+ customers, 1000 pages of docs | https://www.remotion.dev/ | Homepage "Never build alone" block: "300+" / "contributors", "1000" / "pages of docs". Homepage sentence: "Over 800 customers put their trust into Remotion." and https://www.remotion.dev/about says "800+ customers". Other homepage stats not used: 5M+ installs per month, 35 templates & examples, 67K GitHub stars, 10K+ Discord members. |
| COUNTS_TITLE | "Remotion" | | |
| COUNTS_SOURCE | "remotion.dev, October 26, 2026" | https://www.remotion.dev/ | The homepage is undated; the date is the fetch date. |
| PETTY.name / role | "Jonny Burger" / "Chief Hacker @ Remotion" | role: https://www.remotion.dev/blog/deployable-studio (byline "Jonny Burger, Chief Hacker @ Remotion"); https://www.remotion.dev/about lists "Jonny Burger, Chief Hacker" | Decibel calls him "creator of Remotion". |
| PETTY.quote | "I was enormously frustrated by how much time it took me to create videos and started looking for tools that would allow me to use code to create videos quickly and easily - I found none." | https://www.decibel.vc/articles/remotion-create-videos-with-code-using-react | Verbatim sentence; the page's sentence opens with "But, " which is left off. |
| PETTY.cards | "how much time it took me to create videos", "create videos quickly and easily" | same | Each occurs once in the quote. |
| PETTY.kicker | "I WAS ENORMOUSLY FRUSTRATED BY", "USE CODE TO" | same | Uppercased verbatim lead-ins that directly precede each card. |
| TRACKS, TRACK_NAMES | "Remotion logo", "Welcome title", "Editing hint" | https://remotion-helloworld.vercel.app/ (deployed Remotion Studio of the Hello World template, linked from https://www.remotion.dev/blog/deployable-studio) | Visible in the Studio timeline (shots/remotion-studio-helloworld.png). Also the `name=` props in https://github.com/remotion-dev/template-helloworld/blob/main/src/HelloWorld.tsx . The full track list is "<AbsoluteFill>", "Content fade", "Remotion logo", "Welcome title", "Editing hint". |
| MANUAL | name "Remotion docs", pages "1000", page "1000", section "Agent Skills" | https://www.remotion.dev/ ("1000" / "pages of docs"); https://github.com/remotion-dev/remotion README ("Remotion is extensively documented over more than 1000 pages."); name from https://www.remotion.dev/docs/ai ("Remotion docs are optimized for AI agents"); section = title of https://www.remotion.dev/docs/ai/skills | FLAG: Remotion's docs are a website with no page numbers. `page` is the verified docs page count, not the page number of "Agent Skills". |
| MCP | phrase "Agent Skills", expansion "Give coding agents current Remotion guidance" | https://www.remotion.dev/docs/ai (the "Agent Skills" entry of "Building with Remotion and AI") | Not MCP: Remotion's hosted MCP server was shut down on October 26, 2026 (https://www.remotion.dev/docs/ai/mcp: "The hosted Remotion MCP server was shut down on October 26, 2026 and is no longer available. Install Remotion Agent Skills and use /remotion-docs instead."). Agent Skills is Remotion's own bridge to coding agents and matches his "skill" line. |
| ASSISTANTS | "Claude Code", "Codex", "Cursor" | https://www.remotion.dev/docs/studio ("If you use a coding agent such as Claude Code, Codex or Cursor, install the Remotion plugin for it.") | Also https://www.remotion.dev/docs/ai/skills: "These skills are useful for AI agents like Claude Code, Codex, Kimi Code or Cursor." |
| JOBS | "animations", "layout", "typography", "media elements", "effects", "fonts", "timing" | ARTICLES[5], https://www.remotion.dev/docs/ai/skills | FLAG: the paragraph lists 9 items ("compositions, animations, layout, typography, media elements, effects, audio, fonts, timing"); 7 are kept in page order, "compositions" and "audio" left out. Alternative with exactly 7: the Tella table row for /remotion-markup, "Layout, animation, typography, media, audio, fonts, and timing" (a table cell, not a paragraph, so not used). |

### HEADLINES (og:title, verbatim)
| Text | Publication | Date | URL |
|---|---|---|---|
| Remotion AI video makes production code from plain prompts | StartupHub.ai | January 22, 2026 | https://www.startuphub.ai/ai-news/general/2026/remotion-ai-video-makes-production-code-from-plain-prompts (the H1 is longer: "Make videos with Claude Code: Remotion AI video makes production code from plain prompts") |
| Claude Code + Remotion: Generate Pro Videos with AI | Bruce on AI Engineering (og:site_name) | January 25, 2026 | https://www.heyuan110.com/posts/ai/2026-01-26-claude-code-remotion-video/ |
| Remotion Skills 2026: Create React Videos via Claude Code | Gaga AI | January 26, 2026 | https://gaga.art/blog/?p=1287 |
| Remotion Claude Code Skill: Generate Videos with React | JonathansBlog | April 2, 2026 | https://jonathansblog.co.uk/the-remotion-claude-code-skill-generate-videos-programmatically-with-ai |
| Remotion Codex Motion Graphics: My 30-Min Video Test | Engr Mejba Ahmed | April 25, 2026 | https://www.mejba.me/blog/remotion-codex-motion-graphics-ai-video |
| Making Videos with Claude Code and Remotion | OpenReplay | June 4, 2026 | https://blog.openreplay.com/making-videos-claude-code-remotion/ |
| How to Use Remotion Agent Skills With Claude Code | Tella | August 27, 2026 | https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code |

Not used: TIMEWELL's og:title contains an em dash; MindStudio's is 92 characters; Blotato's carries a " - Blotato" suffix; The New Stack ("Framework Lets React Developers Create Video With Code", September 11, 2024) and Decibel ("Remotion: Create Videos With Code Using React", February 5, 2023) are real alternates.

### Other verified context (not exported)
- Remotion launched Agent Skills in January 2026; StartupHub.ai says a demo posted by the official Remotion X account on January 20, 2026 "racked up over 6 million views in days".
- remotion.dev/about: started as a side project in 2021, company in Zurich, "2M+ videos/month", "67,000+ GitHub stars", "800+ customers". GitHub repo page on 2026-10-26: Star 67.8k, Fork 5.5k, 39,830 commits, latest release v4.0.539.
- Pricing (homepage): "Remotion is completely free to use for any individual or small company - no catch." Free License is "For individuals and companies of up to 3 people"; bigger companies need a Company License. His "a free tool" matches that, with this condition.

## 2. Files

### shots/ (Playwright captures, Chromium, 1920x1080 viewport at device scale 2, dark color scheme, 2026-10-26)
| File | Key | Page | Shows | Pixels |
|---|---|---|---|---|
| remotion-site-hero.png | color | https://www.remotion.dev/ | Homepage hero "Make videos agentically.", npx create-video, GitHub 67k, demo panel: agent chat with /remotion-best-practices and Remotion Studio with timeline (Chapters, <Video>, <BasicCaptions>, Soundtrack, Endcard). | 3840x2160 |
| remotion-studio-helloworld.png | edit | https://remotion-helloworld.vercel.app/ (HelloWorld composition, frame 93) | Full Remotion Studio: compositions panel, "Welcome to Remotion" canvas with the React-atom logo, Inspector (1920x1080, 30fps, 00:05.00, props), timeline with tracks <AbsoluteFill>, Content fade, Remotion logo, Welcome title, Editing hint. | 3840x2160 |
| remotion-studio-timeline.png | cut | same Studio, frame 80, timeline panel dragged taller | Timeline-dominant Studio view (canvas smaller on top, the five tracks and ruler large). | 3840x2160 |
| remotion-docs-agent-skills.png | fusion | https://www.remotion.dev/docs/ai/skills | Docs page "Agent Skills": sidebar with AI section, intro naming Claude Code, Codex, Kimi Code, Cursor, the npx skills add command, skills list. | 3840x2160 |
| remotion-github-repo.png | fairlight | https://github.com/remotion-dev/remotion | GitHub repo (logged out, dark): Star 67.8k, Fork 5.5k, 39,830 commits, file list (.agents/skills, .claude, packages), About "Make videos programmatically with React". | 3840x2160 |
| remotion-player.png | media | https://www.remotion.dev/player | "@remotion/player, Dynamic embedded videos in React." with the live Player (".play()", controls 0:03 / 0:59). | 3840x2160 |
| remotion-studio-timeline-strip.png | (extra) | same Studio, frame 70 | Crop of just the Studio controls + timeline panel. | 3840x536 |

The Playwright MCP tools did not respond (the server runs in --extension mode and hung for 30 minutes per call), so the captures were taken with the same Playwright library (playwright-core 1.64, cached Chromium build 1243) driven from a node script.

### logos/ (official, from Remotion's brand assets zip)
Source: https://remotion.media/remotion-brand-assets.zip , linked from the remotion.dev header menu item "Download brand assets (.zip)" (files dated 2026-09-17). Self-containment check: no script, image, href, @import or external url() in any SVG.
| File | Key | What it is |
|---|---|---|
| remotion-logo-compact-blue.svg | LOGOS.resolve | Official Remotion mark (blue play-triangle with translucent rings), transparent background, made for dark backgrounds. 410x425 viewBox. Zip name compact-blue.svg. |
| remotion-banner-dark.svg | LOGOS.blackmagic | Official Remotion banner: white mark + white "remotion" wordmark, transparent background, for dark backgrounds. 2000x800 viewBox. Zip name banner-dark.svg. |
| remotion-logo-compact-blue-on-white.svg | (extra) | Same mark with opaque light rings (for light backgrounds). Zip name compact-blue-on-white.svg. |

FLAG: Remotion AG has one mark; there is no separate company logo. The "blackmagic" key (the maker's mark) uses the official wordmark banner of the same brand.
LOGOS.claude stays slashfx/claude.svg.

Existing Remotion files already on disk (not reused, source unrecorded): public/motiontips/logos/remotion-*.png/svg and public/sketchcrt/remotion-mark.svg. The remotion tips graphics folder holds only rendered reel parts, no captures.

## 3. Flags / caveats
- MANUAL: no page numbers exist in Remotion's docs; page = the docs page count (1000).
- JOBS: 7 of 9 items from ARTICLES[5].
- MCP slot holds "Agent Skills" (Remotion's MCP server was shut down today, 2026-10-26).
- ARTICLES[1] is an excerpt of a longer answer; PETTY.quote drops the leading "But, ".
- Decibel's date comes from its meta description only.
- COUNTS_SOURCE / MANUAL.source / ARTICLES[5] dates are fetch dates (undated pages) or the docs' "Last updated" date.
- Most 2026 coverage of Remotion is blogs and tutorials, not major outlets; The New Stack (2024) is the one established tech publication used.
