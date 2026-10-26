# ArtCraft set (slash effects Video 3, take C0020): sources for src/slashfx/data/facts_artcraft.ts

Gathered 2026-10-26 (all "fetched" dates below are 2026-10-26 unless noted). Text was pulled from the raw HTML with curl or from
GitHub with `gh api` and copied character for character (curly quotes kept). Nothing was rendered. The take: Victor's
SCRIPT_artcraft-adobe.md ("Somebody just used Claude to rebuild Photoshop, Premiere and After Effects ... Adobe spent over thirty
years ... Claude rebuilt them in a couple of weeks ... more and more software is going open source ... Comment CRAFT").

## Who built it
- Brandon Thomas, founder of ArtCraft (the Storyteller.ai team, GitHub org `storytold`). "Founder Brandon Thomas" (tbreak,
  Oct 8 2026, https://tbreak.com/artcraft-open-source-adobe-alternatives/); "the creator of these apps, Atlanta-based Brandon Thomas"
  (Gizmodo); "Brandon Thomas, developer of ArtCraft" and "u/ai_art_is_art is Brandon Thomas" (Tom's Hardware, Oct 11 2026,
  https://www.tomshardware.com/software/microsoft-office/creator-of-free-adobe-clones-unveils-open-source-microsoft-office-excel-powerpoint-and-word-replications-autodesk-tools-and-other-subscription-based-services-may-come-next).
  On Hacker News he posts as `echelon` (Ars Technica and tbreak quote his HN comment 49961661 word for word).
- Kirk Yuhnke (SOURCE_kirkyuhnke_transcript.txt in the artcraft adobe reel folder) is NOT the developer: he is the tech-news
  creator whose Instagram reel (@kirkyuhnke, DeSc0RdzvB4, per CREATORS/Victor/Hook Bank/sandcastles-reel-hook-bank.md) covered the
  apps ("I'm Kirk, your tech guy"; "A single developer used AI to mirror, Photoshop, Premiere, After Effects, and more."). No web page
  confirming his name or role could be found (web search returned nothing). His words are not used in facts_artcraft.ts.

## LOCK_WORD = "Claude"; ARTICLES (6 verbatim paragraphs, each contains "Claude" exactly once)
| # | Source, date (page dateline) | URL | Paragraph |
|---|---|---|---|
| 0 | Ars Technica, October 7, 2026 ("Oct 7, 2026 5:56 pm") | https://arstechnica.com/ai/2026/10/software-is-over-bold-ai-developer-takes-aim-at-adobe-with-open-source-clones/ | 4th body paragraph, "In announcing those new apps on Reddit ..." |
| 1 | Gizmodo, October 7, 2026 ("Published October 7, 2026, 8:08 pm ET") | https://gizmodo.com/someone-vibe-coded-a-free-knockoff-of-adobe-creative-suite-2000823322 | 2nd paragraph, "Using Claude Opus 5.5 and the programming language Rust ..." (holds JOBS) |
| 2 | BigGo Finance, October 8, 2026 (article:published_time 2026-10-08T18:20:37Z) | https://finance.biggo.com/news/3969ffe0-e181-451e-8cc7-f21136f246ed | lead paragraph, "An Atlanta-based developer has unveiled ..." |
| 3 | Mezha, October 8, 2026 (article:published_time 2026-10-08T15:46+03:00) | https://mezha.ua/en/news/artcraft-adobe-photoshop-clone-315969/ | "The applications were developed using Anthropic's Claude Opus 5.5 ..." (the "familiar interfaces, keystrokes" line) |
| 4 | VICE, October 9, 2026 ("October 9, 2026, 1:19pm") | https://www.vice.com/en/article/everything-we-know-about-the-free-adobe-clones-built-with-ai-do-they-actually-work/ | "According to Ars Technica, developer Brandon Thomas used ..." |
| 5 | Linux Compatible, October 11, 2026 ("Published 2026-10-11 09:07") | https://www.linuxcompatible.org/story/artcraft-the-free-opensource-adobe-suite-that-racked-up-43000-stars-in-days/ | "One person built an entire Adobe-suite competitor in a matter of days. ..." |

## JOBS (from ARTICLES[1], Gizmodo)
"... says he recreated Photoshop, Illustrator, Premiere, Lightroom, Acrobat Pro, After Effects, and InDesign, and made them free to use."
The seven items, in that order. (Ars Technica lists the same seven in its 3rd paragraph in a different order.)

## COUNTS, COUNTS_TITLE, COUNTS_SOURCE
PhotoCraft README, https://github.com/storytold/photocraft (raw via `gh api repos/storytold/photocraft/readme`; README last changed
in commit d73c911, 2026-10-25, which is the date in COUNTS_SOURCE). Verbatim: "<b>16 adjustment layers</b> that also apply
directly to pixels", "<h4>🧰 68 tools</h4>", "Every menu item, tool and dialog runs a command from one registry of 500+ commands."
COUNTS_TITLE "PhotoCraft" is the app's name (README h1). Other real counts on the same pages if a builder wants a swap: "27 Photoshop
blend modes" (README), "70+ live-preview filters" and "134 of 135 real-world test files round-trip byte for byte"
(https://getartcraft.com/apps/photocraft), "259 effects" (https://getartcraft.com/apps/effectcraft), "more than 650 engine commands"
(FilmCraft README). GitHub API counts at fetch time (2026-10-26 16:00 UTC): photocraft 73,216 stars / 12,960 forks, filmcraft 16,370
stars, effectcraft 7,942 stars, artcraft 36,824 stars; the repo page capture shows "Star 73.2k" and "6,301 Commits".

## PETTY (Brandon Thomas quote)
Ars Technica, October 7, 2026 (URL above), 9th paragraph: “Now you can just create 1:1 functional equivalents, clean room, that are
highly performant and cross-platform. Nothing is stopping you,” Thomas wrote.
facts_artcraft.ts keeps that sentence and turns the closing comma into a period (same treatment as Grant Petty in facts.ts).
cards: "1:1 functional equivalents", "highly performant and cross-platform". kicker (upper-cased, as in facts.ts): "Now you can just
create", "clean room, that are" (each is the words right before its card). role "Founder, ArtCraft" from tbreak ("Founder Brandon
Thomas"). Other verbatim Thomas lines on fetched pages: HN 49959605 (https://news.ycombinator.com/item?id=49958850): "These are still
super early alpha. All MIT/Apache licensed. No telemetry." and "It's not just SaaSocalypse. Everything can be open source
multiplatform Rust now."; HN 49961661: "99% parity will take a while, but I'm sure it'll be measured in months and not years."

## MANUAL
Adobe's Photoshop manual PDF, https://helpx.adobe.com/pdf/photoshop_reference.pdf . The live URL answers 403 to scripted clients, so
the copy read is the Internet Archive capture of that URL from 2025-11-22:
https://web.archive.org/web/20251122021605id_/https://helpx.adobe.com/pdf/photoshop_reference.pdf (51,842,828 bytes).
Page 1 reads "Adobe Photoshop Help"; the PDF has 1,017 pages; its outline entry "Default keyboard shortcuts" points to PDF page 184,
where the section heading "Default keyboard shortcuts" is printed (printed folio on that page: 174). Every page footer reads
"Last updated 11/5/2019" (PDF metadata: Title "Adobe Photoshop", Author "Adobe Systems Incorporated", created 2019-11-05).

## MCP
EffectCraft README, https://github.com/storytold/effectcraft (README last changed in commit 7d68a74, 2026-10-22): "**MCP server:**
`effectcraft-cli mcp` speaks the Model Context Protocol over stdio". Same "MCP server" wording on https://getartcraft.com/apps
("Drive every app from a CLI, a JSON control channel or an MCP server, built for automation and AI agents.") and in the PhotoCraft
and FilmCraft READMEs. Decrypt (Oct 14 2026) also writes "They plug in through MCP, the Model Context Protocol, a standard Anthropic
created so AI models can operate outside tools."

## HEADLINES (og:title of each page; for Decrypt the og:title minus its " - Decrypt" site suffix, identical to the page h1)
| Text | Source, date | URL |
|---|---|---|
| “Software is over”: Bold AI developer takes aim at Adobe with open source clones | Ars Technica, October 7, 2026 | Ars URL above |
| Someone Vibe Coded a Free Knockoff of Adobe Creative Suite | Gizmodo, October 7, 2026 | Gizmodo URL above |
| Dev Uses AI To Build Clones Of Photoshop And Entire Adobe Suite For Free | HotHardware, October 8, 2026 | https://hothardware.com/news/dev-uses-ai-to-build-clones-of-photoshop-and-entire-adobe-suite-for-free |
| Everything We Know About the Free Adobe Clones Built With AI. Do They Actually Work? | VICE, October 9, 2026 | VICE URL above |
| ArtCraft: The Free, Open-Source Adobe Suite That Racked Up 43,000 Stars in Days | Linux Compatible, October 11, 2026 | Linux Compatible URL above |
| How AI apps are offering free substitutes for Big Tech software | Al Jazeera, October 14, 2026 | https://www.aljazeera.com/news/2026/10/14/how-ai-apps-are-offering-free-substitutes-for-big-tech-software |
| Developer Who Cloned Photoshop With AI Just Did the Same to Microsoft Office | Decrypt, October 14, 2026 | https://decrypt.co/380991/developer-cloned-photoshop-ai-just-did-same-microsoft-office |
Also fetched, not used (too long, or the title carries a dash): Mezha, Lumien, GRAINZILLA (Oct 17, "Filmcraft Is a Free Open-Source
Premiere Pro Clone Built With Claude, ..."), AI Tamer, tbreak, Plagiarism Today, Digital Camera World, ATLABYTE, BigGo, Tom's Hardware.

## ASSISTANTS
"Claude": FilmCraft README, "so Claude or any agent can cut, trim, grade, mix and export exactly the way a person does"
(https://github.com/storytold/filmcraft). "Claude Code": FilmCraft docs/agents.md, "**Claude Code.** The repository's `.mcp.json`
registers both servers" (https://github.com/storytold/filmcraft/blob/main/docs/agents.md, last changed 2026-10-25). "Claude Opus 5.5":
ARTICLES[0] to [5], and 14 of the last 30 PhotoCraft commits carry "Co-Authored-By: Claude Opus 5.5 (1M context)".

## TRACKS, TRACK_NAMES
Read off shots/filmcraft-hero.png (FilmCraft's own README capture): track headers V3 "Titles", V2 "B-roll", V1 "Picture", A1 "Nat
sound", A2 "Mission audio", A3 "Music". TRACKS = V2, V1, A1; TRACK_NAMES = B-roll, Picture, Nat sound (the names on those same
three tracks). The other captures (filmcraft-timeline.png, filmcraft-assembly.png) show the default names Video 3, Video 2,
Video 1, Audio 1, Audio 2.

## Files
### shots/ (SHOTS)
| Key | File | Source | What it shows | Pixels |
|---|---|---|---|---|
| color | photocraft-demo.jpg | https://raw.githubusercontent.com/storytold/photocraft/main/docs/images/photocraft-demo.jpg (README hero) | PhotoCraft (the Photoshop rebuild): The Great Wave with Curves open, Layers panel (Curves 1, Vibrance 1, Credit, Title, Caption Card, Background) | 2400x1500 |
| edit | filmcraft-hero.png | https://raw.githubusercontent.com/storytold/filmcraft/main/docs/images/filmcraft-hero.png (README hero) | FilmCraft (the Premiere rebuild), Color workspace: Apollo 11 cut, Effect Controls, Lumetri Color, project bins, timeline with named tracks | 2400x1285 |
| cut | effectcraft-hero.png | https://raw.githubusercontent.com/storytold/effectcraft/main/docs/images/effectcraft-hero.png (README hero) | EffectCraft (the After Effects rebuild): EFFECTCRAFT title comp, 8-layer timeline, Properties | 2400x1457 |
| fusion | filmcraft-timeline.png | https://raw.githubusercontent.com/storytold/filmcraft/main/docs/images/filmcraft-timeline.png | FilmCraft timeline close-up: V1-V3, A1-A2, markers, loudness meter | 2200x849 |
| fairlight | github-photocraft-repo.png | https://github.com/storytold/photocraft, captured 2026-10-26 with headless Google Chrome (1600x1000 window, 2x, dark mode, logged out) | GitHub repo page: storytold / photocraft, Star 73.2k, Fork 13k, 6,301 Commits, file list, About | 3200x2000 |
| media | filmcraft-assembly.png | https://raw.githubusercontent.com/storytold/filmcraft/main/docs/images/filmcraft-assembly.png | The developer's own demo capture: FilmCraft Assembly workspace (bins of film thumbnails, Source and Program monitors, timeline) | 2400x1500 |
README note on these captures (PhotoCraft): "Every screenshot here is the real app at work on public-domain art, rendered offscreen
through its control channel." The same images (1600 px webp) are on getartcraft.com/apps/*; public/artcraft/site/* from the Oct 13
reel are byte-identical to today's site copies.

### logos/ (LOGOS)
| Key | File | Source | Notes |
|---|---|---|---|
| claude | ../slashfx/claude.svg | unchanged | Claude spark |
| resolve | artcraft-mark.svg | https://raw.githubusercontent.com/storytold/photocraft/main/docs/brand/artcraft-mark.svg | ArtCraft mark, #4e7bfb, 341 bytes, single path; same path data as https://getartcraft.com/artcraft-icon.svg (site/artcraft-icon.svg) |
| blackmagic | artcraft-logo-white.svg | https://raw.githubusercontent.com/storytold/photocraft/main/docs/brand/artcraft-logo-white.svg | ArtCraft mark + wordmark in #f2f1ee (for dark backgrounds), viewBox 1038x108 |
Both SVGs: no href, image, script or external url. There is no separate maker logo (the maker is the ArtCraft team), so both
non-Claude keys are ArtCraft marks. docs/brand/LICENSE-brand.txt: the ArtCraft name, wordmark and mark are trademarks of the ArtCraft
Team, NOT open source, licensed only for use within PhotoCraft, "used exactly as supplied ... Do not redraw, recolor, crop, stretch,
rotate, animate, outline or add effects to them". Editorial use in Victor's reel is outside that permission; the Oct 13 ArtCraft reel
already used site/artcraft-icon.svg the same way.
