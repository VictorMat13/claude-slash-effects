// The ending's grid cells. An effect cell renders the real effect component live (FX[i].Comp, whatever fx/index.ts holds
// at render time) at a chosen t, scaled from 1080x1920 into the cell, and crossfades between moments of that effect.
// A word cell shows one of Victor's spoken words on the app background, changing every WORD_EVERY frames (10 at 24 fps).
import React from "react";
import { Freeze } from "remotion";
import { FX } from "../fx";
import { Dither, INTER } from "../kit";
import { EASE, H, UI, W, ez, type FxDef } from "../theme";
import { E, GRID_FULL, WORDS, WORD_EVERY, WORD_SIZE, XF, at, segT, wordEm, type Box, type FxPlan, type WordPlan } from "./plan";

/** One effect at frame t (useCurrentFrame() inside it equals t), drawn full size and scaled to w px wide. */
export const LiveFx: React.FC<{ fx: FxDef; t: number; w: number; opacity?: number }> = ({ fx, t, w, opacity = 1 }) => {
  const Comp = fx.Comp;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        transform: `scale(${w / W})`,
        transformOrigin: "0 0",
        overflow: "hidden",
        opacity,
      }}
    >
      <Freeze frame={t}>
        <Comp t={t} stage="full" />
      </Freeze>
    </div>
  );
};

/** Dither patch that resolves away as the cell fills in (same look as the result card in the cycles). */
const CellDither: React.FC<{ f: number; i: number; p: number }> = ({ f, i, p }) =>
  p < 1 ? <Dither t={f + i * 3} style={{ opacity: 1 - p, transform: `scale(${1 + p * 0.08})` }} /> : null;

export const FxCell: React.FC<{ plan: FxPlan; f: number; box: Box; radius: number }> = ({ plan, f, box, radius }) => {
  const fx = FX[plan.fx % FX.length];
  const inP = ez(f, plan.reveal, plan.reveal + E.cellIn, EASE.inOut);
  const segs: { k: number; t: number; o: number }[] = [];
  const local = f - plan.reveal;
  if (local >= 0) {
    const k = Math.floor(local / plan.len);
    const s = plan.reveal + k * plan.len;
    // The previous moment keeps playing underneath while the next one fades in over it.
    if (k > 0 && f < s + XF) {
      const ps = s - plan.len;
      segs.push({ k: k - 1, t: segT(fx.thumbT, plan.phase, k - 1, plan.len) + (f - ps), o: 1 });
    }
    segs.push({ k, t: segT(fx.thumbT, plan.phase, k, plan.len) + (f - s), o: k === 0 ? 1 : ez(f, s, s + XF, EASE.inOut) });
  }
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        borderRadius: radius,
        overflow: "hidden",
        background: UI.dither,
      }}
    >
      {inP > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: inP }}>
          {segs.map((sg) => (
            <LiveFx key={sg.k} fx={fx} t={sg.t} w={box.w} opacity={sg.o} />
          ))}
        </div>
      ) : null}
      <CellDither f={f} i={plan.i} p={inP} />
    </div>
  );
};

/** Font size that keeps a word inside 78% of the cell, never above WORD_SIZE (full-screen cell units). */
const fitSize = (word: string, unit: number) => Math.min(WORD_SIZE, (GRID_FULL.cw * 0.78) / wordEm(word)) * unit;

const Word: React.FC<{ word: string; unit: number; opacity: number; dy: number; scale: number }> = ({ word, unit, opacity, dy, scale }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity,
      transform: `translateY(${dy}px) scale(${scale})`,
    }}
  >
    <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: fitSize(word, unit), color: UI.text, letterSpacing: -0.4 * unit, whiteSpace: "nowrap" }}>
      {word}
    </div>
  </div>
);

export const WordCell: React.FC<{ plan: WordPlan; f: number; box: Box; radius: number }> = ({ plan, f, box, radius }) => {
  const inP = ez(f, plan.reveal, plan.reveal + E.cellIn, EASE.inOut);
  const unit = box.w / GRID_FULL.cw;
  const local = Math.max(0, f - plan.reveal);
  const k = Math.floor(local / WORD_EVERY);
  const u = local - k * WORD_EVERY;
  const word = WORDS[(plan.start + k) % WORDS.length];
  const prev = k > 0 ? WORDS[(plan.start + k - 1) % WORDS.length] : null;
  const wIn = k === 0 ? 1 : ez(u, 0, at(4), EASE.enter);
  const wOut = ez(u, 0, at(3), EASE.accel);
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        borderRadius: radius,
        overflow: "hidden",
        background: UI.bg,
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: inP }}>
        {prev && wOut < 1 ? <Word word={prev} unit={unit} opacity={1 - wOut} dy={-10 * unit * wOut} scale={1.03} /> : null}
        <Word word={word} unit={unit} opacity={wIn} dy={10 * unit * (1 - wIn)} scale={1 + 0.03 * (u / WORD_EVERY)} />
      </div>
      <CellDither f={f} i={plan.i} p={inP} />
    </div>
  );
};
