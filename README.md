# Claude slash effects

Six video effects, each one a Claude Code slash command, rendered with [Remotion](https://remotion.dev) in a CRT Scope look.
This is the source of the "prompt video" reel by [@victormatevski.ai](https://www.instagram.com/victormatevski.ai/): the Claude
app on screen, a command typed, and the talking-head clip turned into an effect.

The guide with the paste-ready prompt for every effect lives here:
https://fishy-jaw-770.notion.site/Six-Slash-Command-Effects-the-Claude-Code-prompt-for-every-effect-EFFECTS-4059c1cbbaa1817cad44c4bab7cbfce4

## The six effects

| Command | Folder | What it does |
|---|---|---|
| `/crt-graph` | [`src/slashfx/fx/crtgraph.tsx`](src/slashfx/fx/crtgraph.tsx) | A CRT tube under your chin, three columns climbing to real numbers on a live trace |
| `/screen-push` | [`src/slashfx/fx/screenpush.tsx`](src/slashfx/fx/screenpush.tsx) | Split frame, coral beads pour into a timeline box on a CRT screen |
| `/match-cut` | [`src/slashfx/fx/matchcut.tsx`](src/slashfx/fx/matchcut.tsx) | Real article pages cut every 5 frames with one word locked in place |
| `/over-the-shoulder-zoom` | [`src/slashfx/fx/shoulderzoom.tsx`](src/slashfx/fx/shoulderzoom.tsx) | A slow push on your head while two see-through CRT panes land beside it |
| `/screen-push-digital` | [`src/slashfx/fx/pushdigital.tsx`](src/slashfx/fx/pushdigital.tsx) | Your spoken words push through an LED wall one at a time |
| `/shutter-strike` | [`src/slashfx/fx/shutterstrike.tsx`](src/slashfx/fx/shutterstrike.tsx) | Photo prints fan in on a CRT screen and one coral strike grades them |

The prompts that produced them are in [`.claude/commands/`](.claude/commands): one file per command, plus `setup-kit.md`
for the shared look. Copy that folder into your own project and run `/crt-graph public/your-clip.mp4` in Claude Code.

## What else is in here

- `src/slashfx/app/Phone.tsx`: the Claude iOS app UI (Code tab) drawn in the reference's 720 px space, mapped into the
  Instagram safe zone (`APP` in `theme.ts`).
- `src/slashfx/Cycle.tsx` and `Reel.tsx`: one command cycle (typing, send, dither, result card, push to full screen) and
  the whole reel with an eased scroll between prompts.
- `src/slashfx/ending/`: the "Effect of the Day" grid and the comment CTA.
- `src/slashfx/kit.tsx`, `src/artcraft/kit/`, `src/fish8/crt.tsx`: the shared pieces: CRT pass, scope trace, grid, captions.
- `src/slashfx/theme.ts`: the timing contract (24 fps, 76-frame cycles), the safe zone and the colors.
- `src/slashfx/data/facts.ts`: every string on screen, verbatim from its source. Nothing invented.

## Run it

```bash
npm install
npm run studio                      # Remotion Studio
npm run still                       # one frame of one effect
npm run render                      # the whole reel to out/SlashFx.mp4
```

Compositions: `SlashFx` (the reel), `SlashFxProbe` (one effect alone, props `{"fx": "<id>", "stage": "full"}`),
`SlashFxEnding`.

## What you have to bring

The footage, the product screenshots and the logos used in the published reel are not in this repo. See the README
files in `public/slashfx/clips`, `public/slashfx/thumbs` and `public/resolve` for what goes where. The renders will fail
to load media until you add your own and point `src/slashfx/data/clips.ts` and `facts.ts` at it.

## Rules the effects follow

Real material only. One camera per effect that holds, travels, holds. Bezier easing with no overshoot. Every frame
moving. Content inside the Instagram safe zone (x 100..980, y 290..1520 on 1080x1920); footage may bleed.

MIT license. Not affiliated with Anthropic or Blackmagic Design.
