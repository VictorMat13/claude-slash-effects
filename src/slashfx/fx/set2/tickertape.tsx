// /ticker-tape (set 2, Victor 2026-10-26): Victor's clip "focus" full frame; under his chin a short, wide CRT ticker
// strip in the CRT Scope look. Grant Petty's press-release quote (PETTY.quote, verbatim) runs across it as tape, right
// to left, in mono. Claude's coral packet runs in along the live scope trace on the strip's bottom edge and punches each
// verbatim fragment (PETTY.cards) as it reaches the center: the fragment turns coral, swept left to right, and a coral
// rule draws under it. Between the two fragments the tape fast-forwards (one eased run, motion-blurred by its speed).
// His voice is the green wave on the trace under his mouth. PETTY.name and PETTY.role sit small at the strip's right
// end. His real words as the caption above the strip.
// Camera (KEY_T, one timeline): opens tight on the strip (tube plane 1.08, the tape inside pushed in 1.15, his clip
// soft and dim at 1.07), holds on fragment 1, then pulls out (t 9 to 25) while the tape runs: the tube plane settles
// to 1.0, the content inside to 1.0, his clip (the far plane) moves less (1.07 to 1.035) and racks into focus.
// 2.5D: the tube tilts back a few degrees and settles; inside it the real Edit page (press shot), far back, dim and
// blurred, pans slower than the tape (parallax).
// Safe zone (SAFE_IG, x 60..1000, y 270..1580 since Victor's 2026-10-26 00:50 change): the tube's worst frame (the
// opening: zoom and tilt peak at t 0) is sized into it; the caption sits between his jaw and the tube's top edge.
import React from "react";
import { AbsoluteFill, Img, interpolate, interpolateColors, staticFile } from "remotion";
import { CRT } from "../../../artcraft/kit/Tube";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { PETTY, SHOTS } from "../../data/facts";
import { Caption, Clip, INTER, MONO } from "../../kit";
import { CLAMP, EASE, SAFE_IG, UI, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { voiceEnv } from "../shutterstrike";

// ---------------------------------------------------------------- camera: one keyframe timeline
const KEY_T = [0, 9, 25, 48];
const key = (t: number, v: number[]) => interpolate(t, KEY_T, v, { ...CLAMP, easing: EASE.travel });
/** tube plane zoom (anchored on its top center) and tilt; both peak at t 0 */
const Z_KEYS = [1.08, 1.075, 1.0, 0.99];
const RX_KEYS = [6, 5.4, 1.4, 1.1];
/** the content inside the tube (tape, trace, header): tight on the tape, then out */
const IN_KEYS = [1.15, 1.14, 1.0, 0.985];
const FLOAT = 3;
const RY = 0.6;
const PERSP = 1600;

// ---------------------------------------------------------------- tube (final framing, on-screen px)
/** His jaw ends about y 1045 on screen (clip at 1.035 about its bottom center); the caption sits under it, the tube under that. */
const CARD_TOP = 1200;
const CARD_H = 252;
const EDGE = 8;

const project = (x: number, y: number, z: number, rx: number, ry: number) => {
  const a = (rx * Math.PI) / 180;
  const b = (ry * Math.PI) / 180;
  const x1 = x * z * Math.cos(b);
  const z1 = -x * z * Math.sin(b);
  const y2 = y * z * Math.cos(a) - z1 * Math.sin(a);
  const z2 = y * z * Math.sin(a) + z1 * Math.cos(a);
  const k = PERSP / (PERSP - z2);
  return { x: x1 * k, y: y2 * k };
};
/** How far a w x h tube reaches at its worst frame (the opening) with the full turn and float. */
const reach = (w: number, h: number) => {
  let side = 0;
  let bottom = 0;
  for (const ry of [-RY, RY])
    for (const sx of [-1, 1])
      for (const y of [0, h]) {
        const p = project((sx * w) / 2, y, Z_KEYS[0], RX_KEYS[0], ry);
        side = Math.max(side, Math.abs(p.x));
        bottom = Math.max(bottom, p.y + FLOAT);
      }
  return { side, bottom };
};
const fit = (ok: (v: number) => boolean, lo: number, hi: number) => {
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (ok(m)) lo = m;
    else hi = m;
  }
  return Math.floor(lo);
};
/** As wide as the safe rect allows at the worst frame (837 in the 60..1000 rect). */
const CARD_W = fit((w) => reach(w, CARD_H).side <= SAFE_IG.w / 2 - EDGE, 100, SAFE_IG.w);
const CARD_LEFT = (SAFE_IG.x0 + SAFE_IG.x1 - CARD_W) / 2;
const CARD_R = 28;
/** Worst-frame bottom edge (about 1479), inside SAFE_IG.y1 - EDGE. */
export const TICKER_BOTTOM = CARD_TOP + reach(CARD_W, CARD_H).bottom;
/** His words above the tube, one line, with at least CAPTION_GAP px between the descenders and the tube's highest top edge
 *  (CARD_TOP minus the float and the half pixel the turn adds). The descenders reach about 1.16 em under the caption's
 *  top (line box 1.12 em plus the overshoot), so the caption top is 1089 for a tube top of 1200 at rest. */
const CAPTION_SIZE = 58;
const CAPTION_GAP = 40;
const CAPTION_Y = Math.floor(CARD_TOP - FLOAT - 1 - CAPTION_GAP - CAPTION_SIZE * 1.16);

/** The CRT pass sizes itself to the 1080 composition: draw the tube 1080 wide and scale it into the card. */
const TUBE_W = 1080;
const K = CARD_W / TUBE_W;
const TUBE_H = CARD_H / K;

// ---------------------------------------------------------------- inside the tube (card px)
const INK = "#ECEAE4";
const CORAL = UI.coral;
const CX = CARD_W / 2;
/** content zoom anchor: low, so the trace and its packets never leave the tube at the tightest frame */
const ANCHOR_Y = 150;
const HEAD_Y = 22;
const HEAD_H = 36;
const TAPE_Y = 116;
const FONT = 40;
/** JetBrains Mono advances 0.6 em for every glyph and weight, so a character index is a position. */
const ADV = FONT * 0.6;
const TY = 200;
const FADE = 40;
/** Where his mouth sits over the tube (on-screen x about 664 at rest): his voice on the trace. */
const VOICE_X = 664 - CARD_LEFT;

// ---------------------------------------------------------------- the tape (positions in tape px from the quote start)
const QUOTE = PETTY.quote;
const FRAGS = PETTY.cards.map((f) => {
  const i = QUOTE.indexOf(f);
  return { i, n: f.length, c: (i + f.length / 2) * ADV };
});
/** after the quote: a gap, a small coral square, a gap, then the quote again (a ticker loops) */
const LOOP = (QUOTE.length + 3) * ADV;

/** punches (t): fragment 1 inside the card, fragment 2 as he says "focus on the" (t 15 to 30), held through "creative decisions" */
const PUNCH = [1, 26] as const;
/** the fast-forward between the fragments: one EASE.inOut run (peak about 250 tape px a frame at t 14), fastest during the
 *  card's push to full screen (t 9 to 14) */
const RUN: [number, number] = [5, 24];
/** the feed rate: 4 px a frame, easing down to 1.6 after fragment 2 lands (the tape settles, still moving) */
const feed = (tau: number) => lerp(4, 1.6, ez(tau, PUNCH[1] - 2, PUNCH[1] + 10, EASE.inOut));
const crawl = (t: number) => {
  const dt = 0.25;
  let s = 0;
  if (t >= 0) for (let x = 0; x < t; x += dt) s += feed(x + Math.min(dt, t - x) / 2) * Math.min(dt, t - x);
  else for (let x = 0; x > t; x -= dt) s -= feed(x - Math.min(dt, x - t) / 2) * Math.min(dt, x - t);
  return s;
};
const S0 = FRAGS[0].c - crawl(PUNCH[0]);
const RUN_D = FRAGS[1].c - S0 - crawl(PUNCH[1]);
/** Tape position at the strip's center at frame t: fragment i is centered exactly at PUNCH[i]. */
const tapeAt = (t: number) => S0 + crawl(t) + RUN_D * ez(t, RUN[0], RUN[1], EASE.inOut);

// ---------------------------------------------------------------- the trace
const PACKET_RUN = 10;
const traceBumps = (t: number): ScopeBump[] => {
  const bumps: ScopeBump[] = [];
  PUNCH.forEach((p, i) => {
    if (t < p) {
      // Claude's packet runs in from the left edge along the trace and meets the fragment at the center
      const u = ez(t, p - PACKET_RUN, p, EASE.travel);
      const env = interpolate(t, [p - PACKET_RUN, p - PACKET_RUN + 3], [0, 1], CLAMP);
      if (env > 0.01) bumps.push({ x: lerp(-40, CX, u), amp: 16 * env, sigma: 28, rgb: PH.claudeRgb });
    } else {
      // the punch, then a quiet hum at the read head until the next packet takes over
      const next = PUNCH[i + 1];
      const amp = next
        ? interpolate(t, [p, p + 2, p + 14, next - 2, next], [16, 26, 6, 6, 0], CLAMP)
        : interpolate(t, [p, p + 2, p + 14], [16, 26, 6], CLAMP);
      bumps.push({ x: CX, amp: amp * (0.9 + 0.1 * Math.sin(t * 0.5 + i)), sigma: 30, rgb: PH.claudeRgb });
    }
  });
  const voice = voiceEnv("focus", t) * (13 + 4 * Math.sin(t * 0.61) + 2 * Math.sin(t * 1.37));
  bumps.push({ x: VOICE_X, amp: voice, sigma: 26, rgb: PH.userRgb });
  return bumps;
};

// ---------------------------------------------------------------- the tape row
/** One quote copy, laid out by character index; fragments per character so the coral sweep can run through them. */
const QuoteCopy: React.FC<{ t: number; x: number; live: boolean }> = ({ t, x, live }) => {
  const parts: React.ReactNode[] = [];
  let at = 0;
  const plain = (a: number, b: number, k: string) => {
    if (b <= a) return;
    parts.push(
      <span key={k} style={{ position: "absolute", left: x + a * ADV, top: 0, whiteSpace: "pre", color: INK, opacity: 0.86 }}>
        {QUOTE.slice(a, b)}
      </span>,
    );
  };
  FRAGS.forEach((f, fi) => {
    plain(at, f.i, `p${fi}`);
    const sweep = live ? ez(t, PUNCH[fi] - 1, PUNCH[fi] + 6, EASE.decel) : 0;
    for (let j = 0; j < f.n; j++) {
      const k = Math.max(0, Math.min(1, sweep * (f.n + 3) - j));
      parts.push(
        <span key={`f${fi}-${j}`} style={{ position: "absolute", left: x + (f.i + j) * ADV, top: 0, whiteSpace: "pre", color: interpolateColors(k, [0, 1], [INK, CORAL]), opacity: lerp(0.86, 1, k) }}>
          {QUOTE[f.i + j]}
        </span>,
      );
    }
    // the coral rule under the fragment, drawn left to right with the punch
    const rule = live ? ez(t, PUNCH[fi], PUNCH[fi] + 7, EASE.decel) : 0;
    if (rule > 0.001)
      parts.push(<div key={`r${fi}`} style={{ position: "absolute", left: x + f.i * ADV, top: FONT * 1.2 + 4, width: f.n * ADV * rule, height: 4, borderRadius: 2, background: CORAL }} />);
    at = f.i + f.n;
  });
  plain(at, QUOTE.length, "end");
  // the loop mark: a small coral square two characters after the full stop
  parts.push(<div key="sep" style={{ position: "absolute", left: x + (QUOTE.length + 1.5) * ADV - 7, top: FONT * 0.6 - 7, width: 14, height: 14, borderRadius: 3, background: CORAL, opacity: 0.9 }} />);
  return <>{parts}</>;
};

const Tape: React.FC<{ t: number; zoom: number }> = ({ t, zoom }) => {
  const s = tapeAt(t);
  const speed = Math.abs(tapeAt(t + 0.5) - tapeAt(t - 0.5));
  // motion blur along the tape only, wide enough that the run streaks instead of strobing (sigma 35 at the peak)
  const blur = speed > 8 ? Math.min(48, speed * 0.14) : 0;
  const half = CX / zoom + 80;
  const copies: number[] = [];
  for (let r = Math.floor((s - half) / LOOP) - 1; r <= Math.ceil((s + half) / LOOP); r++) {
    const a = r * LOOP;
    if (a + LOOP > s - half && a < s + half && r >= 0) copies.push(r);
  }
  const fade = `linear-gradient(to right, transparent 0px, #000 ${FADE}px, #000 ${CARD_W - FADE}px, transparent ${CARD_W}px)`;
  return (
    <>
      {blur > 0 ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <filter id="tickertape-mblur" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      {/* the tape band */}
      <div style={{ position: "absolute", left: -40, width: CARD_W + 80, top: TAPE_Y - 38, height: 76, background: "rgba(8,10,14,0.62)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.12)" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: TAPE_Y - FONT * 0.6,
          width: CARD_W,
          height: FONT * 1.2 + 12,
          fontFamily: MONO,
          fontWeight: 500,
          fontSize: FONT,
          lineHeight: `${FONT * 1.2}px`,
          WebkitMaskImage: fade,
          maskImage: fade,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          filter: blur > 0 ? "url(#tickertape-mblur)" : undefined,
        }}
      >
        {copies.map((r) => (
          <QuoteCopy key={r} t={t} x={CX - s + r * LOOP} live={r === 0} />
        ))}
      </div>
    </>
  );
};

// ---------------------------------------------------------------- the screen
/** Edit page press shot (5120 x 2880): the timeline region, far back. */
const SHOT_W = 5120;
const SHOT_H = 2880;
const SHOT_Y = 2250;

const Screen: React.FC<{ t: number; inner: number }> = ({ t, inner }) => {
  const s = tapeAt(t);
  // far layer: zooms less than the content, pans with the tape at a twentieth of its speed (parallax)
  const farZ = Math.pow(inner, 0.35);
  const shotS = 0.5 * farZ;
  const shotX = 1500 + 0.05 * s;
  const head = (a: number) => ez(t, a, a + 7, EASE.enter);
  const name = head(17);
  const role = head(19);
  return (
    <AbsoluteFill style={{ background: PH.panel, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: "blur(2.2px) brightness(0.72) contrast(0.92)" }}>
        <Img
          src={staticFile(SHOTS.edit)}
          style={{ position: "absolute", left: CX - shotX * shotS, top: CARD_H / 2 - SHOT_Y * shotS, width: SHOT_W * shotS, height: SHOT_H * shotS, maxWidth: "none", display: "block" }}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(16,18,23,0.7) 0%, rgba(16,18,23,0.42) 45%, rgba(16,18,23,0.5) 70%, rgba(16,18,23,0.8) 100%)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: CARD_W, height: CARD_H, transformOrigin: `${CX}px ${ANCHOR_Y}px`, transform: `scale(${inner.toFixed(4)})` }}>
        {/* header: Grant Petty and his role at the strip's right end */}
        <div style={{ position: "absolute", right: 30, top: HEAD_Y, height: HEAD_H, display: "flex", alignItems: "center", gap: 14, whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, lineHeight: 1, color: INK, opacity: name, transform: `translateY(${(1 - name) * 10}px)` }}>{PETTY.name}</div>
          <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 28, lineHeight: 1, color: INK, opacity: 0.7 * role, transform: `translateY(${(1 - role) * 10}px)` }}>{PETTY.role}</div>
        </div>
        <Tape t={t} zoom={inner} />
        <svg width={CARD_W} height={CARD_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Scope frame={t} x0={-20} x1={CARD_W + 20} y={TY} bumps={traceBumps(t)} hum={1.4} stroke={3} color="rgba(243,241,236,0.62)" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const TickerTape: React.FC<FxProps> = ({ t }) => {
  const z = key(t, Z_KEYS);
  const rx = key(t, RX_KEYS);
  const inner = key(t, IN_KEYS);
  // far plane: his clip, 1.07 to 1.035 about its bottom center (his face rises a little, clear of the caption), racks into focus
  const clipS = key(t, [1.07, 1.068, 1.035, 1.033]);
  const clipBlur = key(t, [2.4, 2.1, 0, 0]);
  const clipBright = key(t, [0.8, 0.82, 1, 1]);
  const dx = 3 * Math.sin(t * 0.07);
  const dy = 1.5 * Math.sin(t * 0.05) - 1.5;
  const float = FLOAT * Math.sin(t * 0.14);
  const ry = RY * Math.sin(t * 0.06);
  const clipFilter = `${clipBlur > 0.05 ? `blur(${clipBlur.toFixed(2)}px) ` : ""}brightness(${clipBright.toFixed(3)})`;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${clipS.toFixed(4)})`, transformOrigin: "540px 1840px", filter: clipFilter }}>
        <Clip name="focus" />
      </AbsoluteFill>
      <Caption name="focus" t={t} y={CAPTION_Y} size={CAPTION_SIZE} maxWidth={SAFE_IG.w} />
      <div
        style={{
          position: "absolute",
          left: CARD_LEFT,
          top: CARD_TOP,
          width: CARD_W,
          height: CARD_H,
          borderRadius: CARD_R,
          overflow: "hidden",
          background: "#000",
          transformOrigin: `${CARD_W / 2}px 0px`,
          transform: `perspective(${PERSP}px) translateY(${float.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${z.toFixed(4)})`,
          boxShadow: "0 0 0 2px rgba(255,255,255,0.14), 0 28px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: TUBE_W, height: TUBE_H, overflow: "hidden", transform: `scale(${K})`, transformOrigin: "0 0" }}>
          <CRT loop={150} bloom={0.85}>
            <div style={{ position: "absolute", left: 0, top: 0, width: CARD_W, height: CARD_H, transform: `scale(${1 / K})`, transformOrigin: "0 0" }}>
              <Screen t={t} inner={inner} />
            </div>
          </CRT>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const tickertape: FxDef = {
  id: "tickertape",
  command: "/ticker-tape",
  menu: "A press line runs under your chin",
  clip: "focus",
  Comp: TickerTape,
  thumbT: [6, 30, 38],
};
