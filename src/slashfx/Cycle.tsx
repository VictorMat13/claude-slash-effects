// One command cycle (CYCLE.len frames at 24 fps, 76): typing, send, Claude edits, the result card resolves, pushes to full screen.
// The app sits in the Instagram safe rect (AppLayer); the result card is CARD and lerps to the full frame on the push.
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { AppLayer, Composer, Header, Keyboard, ReplyBar, SentMessage, SlashMenu, SparkLine, TYPING } from "./app/Phone";
import { CLIPS } from "./data/clips";
import { Dither } from "./kit";
import { CARD, CLAMP, CYCLE, EASE, FX_START, H, SCROLL, SCROLL_TRAVEL, UI, W, WHITEGRID, ez, lerp, type FxDef } from "./theme";
import { WhiteGrid } from "./backdrop";
import { interpolate } from "remotion";

/** What the composer shows at frame f: "/" then one letter per key frame, the full command from CYCLE.fill. */
export const typedAt = (command: string, f: number) => {
  if (f >= CYCLE.fill) return command;
  const letters = command.slice(1);
  const n = CYCLE.keys.filter((k, i) => i > 0 && f >= k).length;
  return "/" + letters.slice(0, n);
};
/** Letter whose pop-up shows at frame f (4 frames after each key press), and how far it has risen. */
export const popAt = (command: string, f: number) => {
  const letters = command.slice(1);
  for (let i = 1; i < CYCLE.keys.length; i++) {
    const k = CYCLE.keys[i];
    const next = i + 1 < CYCLE.keys.length ? CYCLE.keys[i + 1] : k + 4;
    if (f >= k && f < Math.min(next, k + 4)) return { key: letters[i - 1], p: interpolate(f, [k, k + 1], [0.6, 1], CLAMP) };
  }
  return null;
};

export const FxHost: React.FC<{ fx: FxDef; stage: "card" | "full" }> = ({ fx, stage }) => {
  const t = useCurrentFrame();
  const Comp = fx.Comp;
  return <Comp t={t} stage={stage} />;
};

/** Vertical offset of a sheet that slides in over the first `lead` frames (f < 0) and out over the last SCROLL frames.
 *  Smoothness pass: a SCROLL_TRAVEL px slide with a bell ease instead of a full-height whip; the fade does the rest. */
export const sheetY = (f: number, lead: number, len: number) =>
  f < 0 ? SCROLL_TRAVEL * (1 - ez(f, -lead, 0, EASE.inOut)) : -SCROLL_TRAVEL * ez(f, len - SCROLL, len, EASE.inOut);
/** Opacity of an incoming sheet: fades in over its lead so it crossfades over the outgoing one (which stays opaque). */
export const sheetOpacity = (f: number, lead: number) => (f < 0 ? ez(f, -lead, 0, EASE.inOut) : 1);

export const Cycle: React.FC<{ fx: FxDef; lead?: number }> = ({ fx, lead = 0 }) => {
  const f = useCurrentFrame() - lead;
  const thumb = CLIPS[fx.clip].thumb;
  const typed = typedAt(fx.command, f);
  const pop = popAt(fx.command, f);
  const press = interpolate(f, [CYCLE.send, CYCLE.send + 1.5, CYCLE.send + 4], [0, 1, 0], CLAMP);
  const sent = ez(f, CYCLE.sentStart, CYCLE.sentEnd, EASE.travel);
  const sparkP = ez(f, CYCLE.spark, CYCLE.spark + 5);
  const cardP = ez(f, CYCLE.dither, CYCLE.dither + 5);
  // The halftone builds up over the wait (dots brighten and grow), then crossfades into the result: no pop.
  const build = ez(f, CYCLE.dither, CYCLE.resolve, EASE.inOut);
  const resolved = ez(f, CYCLE.resolve, CYCLE.resolveEnd, EASE.inOut);
  const push = ez(f, CYCLE.push, CYCLE.full, EASE.inOut);
  const stage = f >= CYCLE.full ? "full" : "card";
  const rx = lerp(CARD.x, 0, push);
  const ry = lerp(CARD.y, 0, push);
  const rw = lerp(CARD.w, W, push);
  const rh = lerp(CARD.h, H, push);
  const rr = lerp(CARD.r, 0, push);
  // Ambient drift while only the keys move, then the scale-up behind the push (inside the safe window, see AppLayer).
  const appScale = interpolate(f, [0, CYCLE.push], [1, 1.012], CLAMP) * (1 + 0.08 * push);
  const caret = Math.floor(f / 11) % 2 === 0 || f < 5;
  const sheet = sheetY(f, lead, CYCLE.len);
  const sheetOp = sheetOpacity(f, lead);
  return (
    <AbsoluteFill style={{ background: WHITEGRID ? "transparent" : UI.bg, overflow: "hidden", transform: `translateY(${sheet}px)`, opacity: sheetOp }}>
      {WHITEGRID ? <WhiteGrid f={f + lead} /> : null}
      <AppLayer zoom={appScale} opacity={1 - push}>
        <Header showCompose={sent < 0.5} />
        {sent < 1 ? (
          <>
            <SlashMenu command={fx.command} menu={fx.menu} opacity={1 - ez(f, CYCLE.send, CYCLE.send + 4)} />
            <Composer typed={typed} thumb={thumb} caret={caret} press={press} bottom={TYPING.composerBottom + sent * 440} opacity={1 - ez(f, CYCLE.sentStart + 2, CYCLE.sentEnd)} />
            <Keyboard typedLetters={typed.slice(1)} popKey={pop?.key ?? null} popP={pop?.p ?? 1} y={sent * 440} opacity={1 - ez(f, CYCLE.sentStart + 1, CYCLE.sentEnd - 1)} />
          </>
        ) : null}
        {sent > 0 ? (
          <>
            <ReplyBar y={(1 - sent) * 140} opacity={sent} />
            <SentMessage command={fx.command} thumb={thumb} y={(1 - sent) * 90} opacity={sent} />
          </>
        ) : null}
        <SparkLine text={`Editing with ${fx.command.slice(1)}...`} opacity={sparkP} y={250 + (1 - sparkP) * 10} />
      </AppLayer>
      {f >= CYCLE.dither ? (
        <div
          style={{
            position: "absolute",
            left: rx,
            top: ry,
            width: rw,
            height: rh,
            borderRadius: rr,
            overflow: "hidden",
            opacity: cardP,
            background: UI.dither,
            transform: `translateY(${(1 - cardP) * 14}px)`,
          }}
        >
          {f >= FX_START ? (
            <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `scale(${rw / W})`, transformOrigin: "0 0", opacity: resolved }}>
              {/* The sequence frame includes the scroll lead; the effect starts at f = FX_START. */}
              <Sequence from={FX_START + lead} durationInFrames={CYCLE.len - FX_START} layout="none">
                <FxHost fx={fx} stage={stage} />
              </Sequence>
            </div>
          ) : null}
          {resolved < 1 ? <Dither t={f} build={build} w={Math.ceil(rw)} h={Math.ceil(rh)} style={{ opacity: 1 - resolved, transform: `scale(${1 + resolved * 0.08})` }} /> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
