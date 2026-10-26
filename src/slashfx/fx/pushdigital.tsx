// /screen-push-digital (polish, Victor 2026-10-25 17:05: "use our style ... like my CRT videos for the DaVinci video").
// Victor's spoken words (CLIPS.highlight.words; the clip itself is not shown, only its thumbnail sits in the composer)
// on a dark LED dot-matrix wall, played through his CRT Scope tube. The words are a z-stack: one continuous depth
// value P(t) eases forward on every spoken beat, so each new word pushes through the wall from behind (small, blurred,
// dim) while the previous one recedes up and back into the dots (scale down, blur up, opacity down) in the same eased
// move; it fades out one step further back. A live scope trace runs under the words: his voice (green, PH.user) talks
// at the center and pulses on every push, sending two packets out along the line. Ambient: the LEDs shimmer, the
// carrier hums, and one slow eased camera drift crosses the wall (8 px over 2 s).
// A word shorter than MIN_GAP frames ("a", 3 frames) joins the word before it, so nothing pops for one frame.
// Safe zone (Victor, 2026-10-25 22:00): the words are sized to the safe width (SAFE_IG.w, 880) and every readable word,
// front or receding, stays inside SAFE_IG; the scope trace sits above its bottom. The LED wall and the drift bleed.
import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { noise2D } from "@remotion/noise";
import { CRT } from "../../artcraft/kit/Tube";
import { Scope, type ScopeBump } from "../../artcraft/kit/Scope";
import { PH } from "../../artcraft/theme";
import { CLIPS } from "../data/clips";
import { INTER } from "../kit";
import { CLAMP, EASE, FPS, H, SAFE_IG, W, ez, type FxDef, type FxProps } from "../theme";

const BG = "#121014";
/** Unlit LEDs: bright enough to survive the tube's black crush. */
const DOT = "rgba(255,255,255,0.17)";
const RED = "#FF3B30";
const CYAN = "#2BD1FF";
const PITCH = 10;
const DOT_IN = 3.5;
const DOT_OUT = 4.4;
/** The world bleeds past the frame so the camera drift never shows an edge. */
const PAD = 24;
/** Front word center, how far up a word travels as it recedes one step, the scope baseline (kept 20 px or more above
 *  the safe bottom, so the trace stays at y 1500 or above). */
const CY = 1110;
const BACK_Y = 440;
const TRACE_Y = Math.min(1312, SAFE_IG.y1 - 20);
/** A front word's ink spans the safe width less this on each side: the 8 px camera drift, the RGB fringe, a margin. */
const WORD_INSET = 14;
/** ADV runs about 4% wide of the rendered Inter ExtraBold ("highlight" set to 860 inked 827 px), so aim past it. */
const INK_RATIO = 0.96;
/** Target word width in ADV units. Short words cap at MAX_SIZE. */
const TARGET_W = (SAFE_IG.w - 2 * WORD_INSET) / INK_RATIO;
const MAX_SIZE = 250;
const MIN_GAP = 4;

/** Approximate advance widths of Inter ExtraBold, in em, to size each word without measuring the DOM. */
const ADV: Record<string, number> = {
  a: 0.58, b: 0.62, c: 0.56, d: 0.62, e: 0.58, f: 0.38, g: 0.62, h: 0.61, i: 0.27, j: 0.27, k: 0.58, l: 0.27, m: 0.91,
  n: 0.61, o: 0.61, p: 0.62, q: 0.62, r: 0.41, s: 0.55, t: 0.39, u: 0.61, v: 0.58, w: 0.84, x: 0.58, y: 0.58, z: 0.52,
  M: 0.88, ".": 0.29, ",": 0.29, "'": 0.25, " ": 0.26,
};
const LETTER_SPACING = -0.02;
const emWidth = (w: string) =>
  w.split("").reduce((sum, c) => sum + (ADV[c] ?? (c >= "0" && c <= "9" ? 0.64 : 0.66)), 0) * 1.06 + LETTER_SPACING * w.length;
const sizeFor = (w: string) => Math.min(MAX_SIZE, TARGET_W / emWidth(w));

/** Spoken beats in frames: his words, a too-short word joined to the one before it. */
const BEATS = (() => {
  const raw = CLIPS.highlight.words;
  const out: { w: string; s: number }[] = [];
  raw.forEach((wd, i) => {
    const s = wd.s * FPS;
    const next = i + 1 < raw.length ? raw[i + 1].s * FPS : Infinity;
    if (next - s < MIN_GAP && out.length > 0) out[out.length - 1].w += ` ${wd.w}`;
    else out.push({ w: wd.w, s });
  });
  return out.map((b, k) => {
    const gap = k + 1 < out.length ? out[k + 1].s - b.s : 99;
    return { ...b, len: Math.min(7, Math.max(4, gap - 1)), next: k + 1 < out.length ? out[k + 1].s : Infinity };
  });
})();

/** Continuous stack depth: -1 before the first word, k while word k is in front, eased between. */
const depthAt = (t: number) => BEATS.reduce((p, b) => p + ez(t, b.s, b.s + b.len, EASE.decel), -1);

type Look = { scale: number; y: number; blur: number; opacity: number; fringe: number };
/** d < 0: coming through from behind the wall; 0: in front; 0..1: receding up and back; 1..2: fading out deeper. */
const lookAt = (d: number): Look | null => {
  if (d <= -1 || d >= 2) return null;
  if (d < 0) {
    const u = -d;
    return { scale: 1 - 0.45 * u, y: CY, blur: 10 * u, opacity: (1 - u) ** 1.3, fringe: 1.5 + 5 * u };
  }
  if (d < 1) {
    // front-loaded, so the old word is already up and back by the time the new one reads
    const e = 1 - (1 - d) ** 2;
    return { scale: 1 - 0.5 * e, y: CY - BACK_Y * e, blur: 7 * e, opacity: 1 - 0.6 * e, fringe: 1.5 + 2.5 * e };
  }
  const w = d - 1;
  return { scale: 0.5 - 0.16 * w, y: CY - BACK_Y - 170 * w, blur: 7 + 4 * w, opacity: 0.4 * (1 - w), fringe: 4 };
};

const Word: React.FC<{ text: string; look: Look; creep: number }> = ({ text, look, creep }) => {
  const layer: React.CSSProperties = { position: "absolute", left: 0, top: 0, opacity: 0.4, mixBlendMode: "screen" };
  return (
    <div style={{ position: "absolute", left: 0, top: look.y + PAD, width: W + 2 * PAD, height: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          position: "relative",
          transform: `scale(${(look.scale * (1 + creep)).toFixed(4)})`,
          filter: look.blur > 0.05 ? `blur(${look.blur.toFixed(2)}px)` : undefined,
          opacity: look.opacity,
          fontFamily: INTER,
          fontWeight: 800,
          fontSize: sizeFor(text),
          lineHeight: 1,
          letterSpacing: `${LETTER_SPACING}em`,
          whiteSpace: "nowrap",
          color: "#FFFFFF",
        }}
      >
        <span style={{ ...layer, color: RED, transform: `translateX(${-look.fringe}px)` }}>{text}</span>
        <span style={{ ...layer, color: CYAN, transform: `translateX(${look.fringe}px)` }}>{text}</span>
        <span style={{ position: "relative" }}>{text}</span>
      </div>
    </div>
  );
};

/** Soft noise under the LED mask: slow patches of the wall brighten and dim. */
const Shimmer: React.FC<{ t: number }> = ({ t }) => {
  const blobs = Array.from({ length: 7 }, (_, i) => {
    const x = PAD + 540 + 560 * noise2D(`pdx${i}`, t * 0.019, i * 3.1);
    const y = PAD + 960 + 980 * noise2D(`pdy${i}`, t * 0.019, i * 1.7);
    const a = Math.max(0, 0.06 + 0.06 * noise2D(`pda${i}`, t * 0.3, i));
    const r = 240 + 110 * (i % 3);
    return `radial-gradient(circle ${r}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, rgba(255,255,255,${a.toFixed(3)}), rgba(255,255,255,0))`;
  });
  const flick = 0.85 + 0.15 * random(`pd-flick-${t}`);
  return <AbsoluteFill style={{ opacity: flick, backgroundImage: blobs.join(", ") }} />;
};

/** His voice on the trace: talks at the center, pulses on every push, and each pulse sends two packets outward. */
const bumpsAt = (t: number): ScopeBump[] => {
  const cx = PAD + W / 2;
  const breathe = 0.85 + 0.15 * Math.sin(t * 0.5);
  let voice = 6;
  const out: ScopeBump[] = [];
  for (const b of BEATS) {
    if (t < b.s) continue;
    voice += 22 * interpolate(t - b.s, [0, 2, 14], [0, 1, 0], { ...CLAMP, easing: EASE.decel });
    const u = ez(t, b.s + 1, b.s + 17, EASE.decel);
    const amp = 16 * (1 - ez(t, b.s + 6, b.s + 17, EASE.inOut)) * ez(t, b.s, b.s + 2, EASE.enter);
    if (amp > 0.5) {
      out.push({ x: cx - 600 * u, amp, sigma: 46, rgb: PH.userRgb });
      out.push({ x: cx + 600 * u, amp, sigma: 46, rgb: PH.userRgb });
    }
  }
  out.push({ x: cx, amp: voice * breathe, sigma: 70, rgb: PH.userRgb });
  return out;
};

export const PushDigital: React.FC<FxProps> = ({ t }) => {
  // one slow eased camera drift across the wall: 8 px left and 3 px up over the 2 s the effect is on screen
  const dx = interpolate(t, [0, 48], [0, -8], { ...CLAMP, easing: EASE.inOut });
  const dy = interpolate(t, [0, 48], [0, -3], { ...CLAMP, easing: EASE.inOut });
  const P = depthAt(t);
  const highlight = BEATS.find((b) => b.w.startsWith("highlight"));
  return (
    <CRT bloom={0.8} glitchAt={highlight ? [Math.round(highlight.s)] : []}>
      <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -PAD, top: -PAD, width: W + 2 * PAD, height: H + 2 * PAD, transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)` }}>
          <AbsoluteFill style={{ backgroundImage: `radial-gradient(circle, ${DOT} ${DOT_IN}px, rgba(255,255,255,0) ${DOT_OUT}px)`, backgroundSize: `${PITCH}px ${PITCH}px` }} />
          <Shimmer t={t} />
          {BEATS.map((b, k) => {
            const look = lookAt(P - k);
            if (!look) return null;
            // the front word keeps creeping forward until the next word arrives
            const creep = 0.035 * ez(Math.min(t, b.next), b.s + b.len, b.s + b.len + 40, EASE.inOut);
            return <Word key={k} text={b.w} look={look} creep={creep} />;
          })}
          {/* the LED mask: background color everywhere except a dot on every PITCH, aligned with the dot grid */}
          <AbsoluteFill style={{ backgroundImage: `radial-gradient(circle, rgba(18,16,20,0) ${DOT_IN}px, ${BG} ${DOT_OUT}px)`, backgroundSize: `${PITCH}px ${PITCH}px` }} />
          <svg width={W + 2 * PAD} height={H + 2 * PAD} style={{ position: "absolute", left: 0, top: 0 }}>
            <Scope frame={t} x0={0} x1={W + 2 * PAD} y={TRACE_Y + PAD} bumps={bumpsAt(t)} hum={1.6} stroke={3.5} color="rgba(243,241,236,0.62)" />
          </svg>
        </div>
      </AbsoluteFill>
    </CRT>
  );
};

export const pushdigital: FxDef = {
  id: "pushdigital",
  command: "/screen-push-digital",
  menu: "Pixel words pushed through the screen",
  clip: "highlight",
  Comp: PushDigital,
  thumbT: [22, 31, 45],
};
