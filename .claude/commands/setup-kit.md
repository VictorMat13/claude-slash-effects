Set up a Remotion project for 1080x1920 vertical video at 24 fps (npx create-video@latest, blank template). Create a shared kit in src/kit that every effect will import:

1. A CRT pass: an opaque near-black screen, soft scanlines, a slight barrel curve at the edges, a light phosphor glow on text only, a subtle flicker, graded so text stays crisp and readable.
2. A live scope trace: one thin horizontal line across the frame carrying a quiet carrier wave. It reacts to what happens on screen: green amplitude for my voice (driven by my clip's word timings), and coral packets that travel along the line on beats.
3. A dark grid background with faint lines.
4. A caption component that shows my spoken words three at a time, white, bold, with a soft shadow, timed from a words.json file (word, start, end).
5. A Clip component that loads my video from public/ with OffthreadVideo, trimmed to the range I give it.

Motion rules for everything you build from now on: drive every value from useCurrentFrame. Bezier easing only: travel (0.65, 0, 0.35, 1), enter (0.05, 0.7, 0.1, 1), decelerate (0.2, 0, 0, 1). No springs, no overshoot, no CSS animation. Staggered entrances. Every frame has something moving. One camera per effect that holds, travels, then holds, with the action happening during the holds. Depth layers that sit farther back move less (2.5D parallax). No glow on elements, no gradient washes. All content inside an 8 percent safe area. Colors: coral #D97757 for Claude, phosphor green for my voice, light ink #ECE9E2 on #101217.

Then create .claude/commands/ and tell me it is ready for the six effect commands.
