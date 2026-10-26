// /headline-feed (set 3, builder S3-A). Victor's footage full frame. The real headlines (HEADLINES in data/facts.ts,
// verbatim, with publication and date small) arrive one every 3 frames from the bottom of the safe rect as dark CRT cards
// with a keyline. The stack is one continuous depth value: every new card rises in at the front (lowest), standing up from
// a slight tilt, and pushes the cards before it one step back and up (smaller, dimmer, a touch of blur) so each older card
// peeks out above the next one with its source and first line. The cards sit left of center, below his jaw and beside his
// shoulder, angled a few degrees toward him (2.5D), and they never cover his face.
// One live scope trace runs up the stack's left edge: a coral packet runs up it into each card as it lands (the card's
// keyline answers in coral), the packet stays on the line beside its card and rides back with it, and his voice is the
// green amplitude level with his eyes. In the hold the feed refreshes twice: a coral packet runs up the whole stack.
// Camera (KEY_T, hold, travel, hold): opens tight and low on the first card (card plane 1.08), then rides up with the
// stack and pulls back (1.0) while his footage, the far plane, moves less (1.06 to 1.035, never past 1.07); a slow drift.
// Instagram safe zone: every card, its text and the packets stay inside SAFE_IG (x 100..980, y 290..1520) at every t,
// including the entrance, the camera travel and the drift; the footage and the trace line bleed.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { HEADLINES } from "../../data/facts";
import { Clip, INTER, MONO } from "../../kit";
import { CLAMP, EASE, H, SAFE_IG, UI, W, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { voiceEnv } from "../shutterstrike";

const CLIP = "subtitles" as const;

/** Feed order (indices into HEADLINES): oldest first, the front card last. */
const ORDER = [5, 3, 1, 0, 4, 6, 2] as const;
const FEED = ORDER.map((i) => HEADLINES[i]);

// ---------------------------------------------------------------- card geometry (card plane, final framing)
/** Card left edge and width: the stack stays left of his face (front card x 150..630). */
const L = 150;
const CW = 480;
const PAD = { x: 22, top: 18, bottom: 16 };
const TYPE = { source: 28, head: 34, lh: 1.12, date: 26 } as const;
const LINE_H = TYPE.head * TYPE.lh;
const SOURCE_H = TYPE.source * 1.2;
const DATE_H = TYPE.date * 1.2;
/** Headline lines per card at this width (Inter 700 34 px, 436 px measure, balanced), measured on the stills: the card
 *  hugs its headline so the date sits right under it. */
const LINES = [3, 2, 3, 3, 3, 2, 3] as const;
const cardH = (lines: number) => Math.round(PAD.top + SOURCE_H + 8 + lines * LINE_H + 10 + DATE_H + PAD.bottom);
const HS = LINES.map(cardH);
/** The front card's bottom edge (40 px above the safe bottom: room for the entrance, the drift and the float). */
const B = SAFE_IG.y1 - 40;
/** Each step back: the card shrinks by SSTEP and its top rises VIS px (scaled) above the card in front, so its source and
 *  first headline line show; the lines under the first fade out as it recedes. */
const VIS = 106;
const SSTEP = 0.1;
/** Cards angle toward his head (inner edge recedes) and stand up from this tilt as they land. */
const RY = 5;
const TILT = 12;
const PERSP = 1400;
/** The trace runs up the stack's left edge. */
const TX = L - 24;

// ---------------------------------------------------------------- timing (24 fps, t = 0 at the card resolve)
/** One card every 3 frames: the last (front) card lands at t 24, inside the t 14..26 reveal window. */
const ARRIVE = (i: number) => -3 + 3 * i;
const LAND = 7;
/** A new card's own rise starts DELAY frames after the stack starts to make room for it, so the card in front has
 *  already moved up and back when the new one shows (no text ever shows through a half-faded card). */
const DELAY = 2;
const push = (t: number, j: number) => ez(t, ARRIVE(j), ARRIVE(j) + LAND, EASE.decel);
const rise = (t: number, j: number) => ez(t, ARRIVE(j) + DELAY, ARRIVE(j) + DELAY + LAND, EASE.decel);
/** The feed refreshes in the hold: a coral packet runs up the whole stack. */
const REFRESH = [27, 36];
const REFRESH_LEN = 14;

type Look = { s: number; top: number; bottom: number; op: number; blur: number; dim: number; rx: number; d: number };
/**
 * The whole stack at frame t, newest first. Card i's depth d is how far the cards after it have pushed it (continuous).
 * At depth 0 it sits in front with its bottom on B (rising in from 26 px lower, 5% larger, tilted back); as it is pushed it
 * eases to VIS px (scaled) above the top of the card directly in front of it, so each strip is the same height whatever
 * the cards' own heights, and nothing ever jumps.
 */
const stackAt = (t: number): (Look | null)[] => {
  const looks: (Look | null)[] = FEED.map(() => null);
  let inFront: number | null = null;
  let d = 0;
  for (let i = FEED.length - 1; i >= 0; i--) {
    const h = HS[i];
    const u = 1 - rise(t, i);
    const sd = 1 - SSTEP * d;
    const s = sd * (1 + 0.05 * u);
    const home = B + 26 * u - h * s;
    const top: number = inFront === null ? home : lerp(home, inFront - VIS * sd, Math.min(1, d));
    // the glass turns opaque in the first frames of the rise (it is moving, tilting and blurred), the text types in after
    const op = Math.min(1, 2.4 * (1 - u)) ** 0.8 * interpolate(d, [2.8, 3.8], [1, 0], CLAMP);
    if (op > 0.003) looks[i] = { s, top, bottom: top + h * s, op, blur: 0.75 * d + 3 * u, dim: Math.min(0.55, 0.17 * d), rx: TILT * u, d };
    // even unseen, this card is the reference for the one behind it
    inFront = top;
    d += push(t, i);
  }
  return looks;
};
/** Where a card meets the trace (card plane y): its middle in front, the middle of its visible strip once it is back. */
const anchorY = (i: number, look: Look) => look.top + look.s * lerp(HS[i] / 2, 52, Math.min(1, look.d));
/** Trace coordinate (arc length up the line) of a card-plane y. */
const S_BASE = H + 40;
const sOf = (y: number) => S_BASE - y;

// ---------------------------------------------------------------- camera (one keyframe timeline: hold, travel, hold)
const KEY_T = [0, 6, 24, 48];
const key = (t: number, v: number[]) => interpolate(t, KEY_T, v, { ...CLAMP, easing: EASE.travel });
/** card plane: zoom anchored on the front card's bottom-left corner, and the rise (the scene slides down as the camera rides up) */
const Z = [1.08, 1.075, 1.0, 1.0];
const RISE = [-30, -28, 0, 0];
/** far plane (his footage): parallax, never past 1.07 */
const CLIP_S = [1.06, 1.058, 1.035, 1.033];
const CLIP_RISE = [-14, -13, 0, 0];
/** Footage scale origin left of his face, so the push moves his face away from the stack. */
const CLIP_ORIGIN = { x: 340, y: 900 };
/** Drift amplitudes (px); the card plane rides the drift NEAR times more than the footage (parallax). */
const DRIFT = { x: 4, y: 3 };
const NEAR = 1.25;

/** His voice: on the trace level with his eyes, beside his head. */
const VOICE_Y = 800;
const TRACE_INK = "rgba(243,241,236,0.55)";

const gauss = (x: number, c: number, sg: number) => Math.exp(-((x - c) ** 2) / (2 * sg * sg));

/** The live trace's packets and voice, plus how hard each card's keyline answers (0..1). */
const traceAt = (t: number, looks: (Look | null)[]) => {
  const bumps: ScopeBump[] = [];
  const flash = FEED.map(() => 0);
  looks.forEach((look, i) => {
    if (!look) return;
    const a = ARRIVE(i) + DELAY;
    const anchor = sOf(anchorY(i, look));
    // up the line from below the frame into the landing card, then it stays beside its card and rides back with it
    const u = ez(t, a - 3, a + 4, EASE.travel);
    const env = interpolate(t, [a - 3, a - 1, a + 4, a + 16], [0, 16, 16, 5], CLAMP) * look.op * (0.88 + 0.12 * Math.sin(t * 0.47 + i * 1.3));
    if (env > 0.4) bumps.push({ x: lerp(-40, anchor, u), amp: env, sigma: 30, rgb: PH.claudeRgb });
    flash[i] = Math.max(flash[i], interpolate(t, [a + 2, a + 4, a + 18], [0, 1, 0], CLAMP));
  });
  // the feed refreshes: one coral packet up the whole stack, each card answering as it passes
  for (const r of REFRESH) {
    const p = ez(t, r, r + REFRESH_LEN, EASE.travel);
    const env = interpolate(t, [r - 1, r + 1, r + REFRESH_LEN - 3, r + REFRESH_LEN], [0, 1, 1, 0], CLAMP);
    if (env < 0.01) continue;
    const from = sOf(B - HS[HS.length - 1] / 2);
    const at = lerp(from, S_BASE + 140, p);
    bumps.push({ x: at, amp: 14 * env, sigma: 32, rgb: PH.claudeRgb });
    looks.forEach((look, i) => {
      if (look) flash[i] = Math.max(flash[i], 0.8 * env * gauss(at, sOf(anchorY(i, look)), 46));
    });
  }
  // his voice, beside his head
  const v = voiceEnv(CLIP, t);
  bumps.push({ x: sOf(VOICE_Y), amp: 3 + 15 * v * (0.86 + 0.14 * Math.sin(t * 0.83)), sigma: 44, rgb: PH.userRgb });
  return { bumps, flash };
};

/** One headline card: dark CRT glass, a keyline that answers in coral, the source, the headline, the date. */
const Card: React.FC<{ i: number; t: number; look: Look; flash: number }> = ({ i, t, look, flash }) => {
  const h = FEED[i];
  const ch = HS[i];
  const d = look.d;
  // receding: the lines under the first fade out, so only the source and the first line peek above the next card
  const back = Math.min(1, Math.max(0, d) * 1.5);
  const lower = (1 - back).toFixed(3);
  // the fade ends above line 2's capitals (about 1.18 lines down), so no half-cut letters peek under line 1
  const lineMask = `linear-gradient(180deg, #000 0px, #000 ${(LINE_H * 1.04).toFixed(1)}px, rgba(0,0,0,${lower}) ${(LINE_H * 1.15).toFixed(1)}px)`;
  const a = ARRIVE(i) + DELAY;
  const since = t - a;
  const float = Math.sin(t * 0.13 + i * 1.7) * 1.5 * (1 - Math.min(1, look.rx / TILT));
  const words = h.text.split(" ");
  const src = ez(t, a, a + 4);
  const date = ez(t, a + 3 + words.length * 0.5, a + 7 + words.length * 0.5);
  const keyline = `rgba(${Math.round(lerp(255, 217, flash))},${Math.round(lerp(255, 119, flash))},${Math.round(lerp(255, 87, flash))},${lerp(0.26, 0.95, flash).toFixed(3)})`;
  return (
    <div
      style={{
        position: "absolute",
        left: L,
        top: B - ch,
        width: CW,
        height: ch,
        opacity: look.op,
        transformOrigin: "0% 100%",
        transform: `translateY(${(look.bottom - B + float).toFixed(2)}px) perspective(${PERSP}px) rotateY(${RY}deg) rotateX(${look.rx.toFixed(3)}deg) scale(${look.s.toFixed(4)})`,
        filter: look.blur > 0.05 ? `blur(${look.blur.toFixed(2)}px)` : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          overflow: "hidden",
          background: "rgba(13,15,20,0.95)",
          boxShadow: "inset 0 0 26px rgba(0,0,0,0.45), 0 18px 40px rgba(0,0,0,0.45)",
        }}
      >
        {/* scanlines that roll, and the slow refresh band */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 4px)",
            backgroundPosition: `0 ${(((since % 4) + 4) % 4).toFixed(0)}px`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${(((since * 7 + i * 37) % 170) - 45).toFixed(1)}%`,
            height: "30%",
            background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.045) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div style={{ position: "absolute", left: PAD.x, right: PAD.x, top: PAD.top, bottom: PAD.bottom, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: TYPE.source,
              lineHeight: 1.2,
              letterSpacing: -0.5,
              whiteSpace: "nowrap",
              color: UI.coral,
              opacity: src,
              transform: `translateY(${((1 - src) * 8).toFixed(2)}px)`,
            }}
          >
            {h.source}
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: INTER,
              fontWeight: 700,
              fontSize: TYPE.head,
              lineHeight: TYPE.lh,
              letterSpacing: -0.6,
              color: UI.screenInk,
              textShadow: "1.1px 0 0 rgba(255,60,40,0.38), -1.1px 0 0 rgba(40,140,255,0.38)",
              textWrap: "balance",
              WebkitMaskImage: back > 0.001 ? lineMask : undefined,
              maskImage: back > 0.001 ? lineMask : undefined,
            }}
          >
            {words.map((w, j) => {
              const wp = ez(t, a + 1 + j * 0.5, a + 4 + j * 0.5);
              return (
                <React.Fragment key={j}>
                  <span style={{ display: "inline-block", opacity: wp, transform: `translateY(${((1 - wp) * 10).toFixed(2)}px)` }}>{w}</span>
                  {j < words.length - 1 ? " " : null}
                </React.Fragment>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: TYPE.date,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              color: "rgba(236,233,226,0.62)",
              opacity: date * (1 - back),
              transform: `translateY(${((1 - date) * 8).toFixed(2)}px)`,
            }}
          >
            {h.date}
          </div>
        </div>
        {/* receding: the card darkens with depth */}
        {look.dim > 0.005 ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${look.dim.toFixed(3)})` }} /> : null}
      </div>
      {/* the keyline: light glass edge, coral while the card answers its packet */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 18, boxShadow: `inset 0 0 0 1.5px ${keyline}` }} />
    </div>
  );
};

export const HeadlineFeed: React.FC<FxProps> = ({ t }) => {
  const z = key(t, Z);
  const rise = key(t, RISE);
  const clipS = key(t, CLIP_S);
  const clipRise = key(t, CLIP_RISE);
  const dx = DRIFT.x * Math.sin(t * 0.08 + 0.3);
  const dy = DRIFT.y * Math.sin(t * 0.06 + 1.2);
  const looks = stackAt(t);
  const { bumps, flash } = traceAt(t, looks);
  return (
    <AbsoluteFill style={{ background: UI.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx.toFixed(2)}px, ${(dy + clipRise).toFixed(2)}px) scale(${clipS.toFixed(5)})`,
          transformOrigin: `${CLIP_ORIGIN.x}px ${CLIP_ORIGIN.y}px`,
        }}
      >
        <Clip name={CLIP} />
      </AbsoluteFill>
      {/* a soft vignette, and a scrim on the left so the trace and the stack read; it ends before his face */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.26) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.16) 26%, rgba(0,0,0,0) 44%)" }} />
      <AbsoluteFill
        style={{
          transform: `translate(${(dx * NEAR).toFixed(2)}px, ${(dy * NEAR + rise).toFixed(2)}px) scale(${z.toFixed(5)})`,
          transformOrigin: `${L}px ${B}px`,
        }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`translate(${TX} ${S_BASE}) rotate(-90)`}>
            <Scope frame={t} x0={-60} x1={S_BASE + 200} y={0} bumps={bumps} hum={1.4} stroke={3} color={TRACE_INK} />
          </g>
        </svg>
        {looks.map((look, i) => (look ? <Card key={i} i={i} t={t} look={look} flash={flash[i]} /> : null))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const headlinefeed: FxDef = {
  id: "headlinefeed",
  command: "/headline-feed",
  menu: "Real headlines stack up beside you",
  clip: CLIP,
  Comp: HeadlineFeed,
  thumbT: [22, 30, 40],
};
