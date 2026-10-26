// /split-wipe (set 2 on the Remotion take, Victor 2026-10-26): Victor's clip "r_assets" ("Screenshots, demos of your
// product, and reference videos of style that you like.") full frame twice, in perfect register (one camera transform
// shared by both copies): the copy left of the line is flat (saturate 0.2, contrast 0.9), the copy right of it is as
// shot. The boundary is the live scope trace drawn vertically: the clip-path of the flat copy follows the trace's own
// points, so the wave IS the edge. The line wipes edge to edge and back on his beats (EASE.travel, never a jump): in
// from the right on "Screenshots", out to the right on "demos", back to the left on "your product," so he ends in full
// color ("reference" comes at t 48.6, after the reel has scrolled the effect away). His voice is the green wave on the
// line at mouth height; on each wipe Claude's coral packet rides down the line from the label pane.
// A small CRT label pane above his head, with the Remotion mark (LOGOS.resolve), types three verbatim items from the
// Remotion docs paragraph (facts_remotion.ts ARTICLES, source "Remotion docs": "... Use this for knowledge about
// compositions, animations, layout, typography, media elements, effects, audio, fonts, timing.") in coral mono under the
// verbatim heading "Use this for knowledge about", one per wipe: the old item lifts away, the new one types out.
// Camera: one push 1.008 to 1.034 anchored on his face (hold, travel, hold) with a 2.4 px drift; the pane rides the drift
// a little more (nearer, parallax) and settles from a 7 degree tilt. Footage is the background; nothing far behind it.
// Safe zone: the pane, the line's rest positions (with the wave) and the caption stay inside SAFE_IG at every t; the
// line itself bleeds top to bottom (it is a trace).
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { CRT } from "../../../artcraft/kit/Tube";
import { PH } from "../../../artcraft/theme";
import { ARTICLES, JOBS, LOGOS } from "../../data/facts";
import { Caption, Clip, MONO } from "../../kit";
import { CLAMP, EASE, H, SAFE_IG, UI, W, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { traceY, voiceEnv } from "../shutterstrike";
import type { ScopeBump } from "../../../artcraft/kit/Scope";

// ---------------------------------------------------------------- real text (verbatim, checked against facts.ts)
/** The paragraph is found by its source name, not its index, and only when the effect renders: if facts.ts ever loses it
 *  (or the words), the error names the source, and the other sets' renders (which import set 2) are not affected. */
const SOURCE_NAME = "Remotion docs";
/** one item per wipe, matched to his words: screenshots are media elements, demos are animations, style is effects */
const PANE_JOBS = ["media elements", "animations", "effects"] as const;
let realText: { head: string; jobs: string[] } | null = null;
const textOf = () => {
  if (realText) return realText;
  const article = ARTICLES.find((a) => a.source === SOURCE_NAME);
  if (!article) throw new Error(`splitwipe: no article from "${SOURCE_NAME}" in facts.ts ARTICLES`);
  const pick = (s: string, job = false) => {
    if (!article.text.includes(s)) throw new Error(`splitwipe: "${s}" is not in the ${SOURCE_NAME} paragraph (facts.ts ARTICLES)`);
    if (job && !(JOBS as readonly string[]).includes(s)) throw new Error(`splitwipe: "${s}" is not in facts.ts JOBS (${SOURCE_NAME})`);
    return s;
  };
  realText = { head: pick("Use this for knowledge about"), jobs: PANE_JOBS.map((j) => pick(j, true)) };
  return realText;
};

// ---------------------------------------------------------------- camera (both copies share it: perfect register)
/** his face center in the clip (head x 390..790, y 535..1030 at rest): the push grows him in place */
const ORIGIN = { x: 590, y: 820 };
const camAt = (t: number) => ({
  z: interpolate(t, [0, 8, 30, 48], [1.008, 1.01, 1.032, 1.034], { ...CLAMP, easing: EASE.travel }),
  // at z 1.008 the footage overscans 3.9 px or more on every side, so the drift never shows an edge
  dx: 2.4 * Math.sin(t * 0.08 + 0.3),
  dy: 2 * Math.sin(t * 0.06 + 1.1),
});
/** the pane sits nearer the lens than the footage: it rides the drift a little more */
const NEAR = 1.35;

// ---------------------------------------------------------------- the wipe line
/** rest positions: beside his face (head about x 383..797 at the full push), inside the safe rect with the wave */
const XL = 160;
const XR = 930;
/** the wipes, on his beats: "Screenshots," (t 3.6, inside the card), "demos" (t 13.8), "your product," (t 31.3 to 45.7) */
const WIPES = [
  { a: -6, b: 6, to: XL },
  { a: 12, b: 23, to: XR },
  { a: 27, b: 38, to: XL },
] as const;
const lineX = (t: number) => {
  let x = XR;
  let from = XR;
  for (const w of WIPES) {
    x += (w.to - from) * ez(t, w.a, w.b, EASE.travel);
    from = w.to;
  }
  return x + 3 * Math.sin(t * 0.11 + 0.6);
};
/** his mouth on screen (clip y about 940 under the push) and where the coral packet runs on the line */
const Y_MOUTH = 942;
const Y_TOP = 430;
const Y_BOT = 1440;
const HUM = 1.6;
/** his caption's bottom edge (red team, 2026-10-26: was the safe bottom minus 12, 1568, inside the Reels UI band) */
const CAPTION_BOTTOM = 1450;

const bumpsAt = (t: number): ScopeBump[] => {
  const voice = voiceEnv("r_assets", t) * (14 + 4 * Math.sin(t * 0.61) + 2 * Math.sin(t * 1.37));
  const bumps: ScopeBump[] = [{ x: Y_MOUTH, amp: voice, sigma: 34, rgb: PH.userRgb }];
  for (const w of WIPES) {
    const env = interpolate(t, [w.a - 1, w.a + 2, w.b - 2, w.b + 1], [0, 1, 1, 0], CLAMP);
    if (env > 0.01) bumps.push({ x: lerp(Y_TOP, Y_BOT, ez(t, w.a, w.b, EASE.travel)), amp: 22 * env, sigma: 34, rgb: PH.claudeRgb });
  }
  return bumps;
};
/** the line as points (x along the wave, y down the frame), shared by the stroke and the flat copy's clip-path */
const linePts = (t: number) => {
  const x0 = lineX(t);
  const bumps = bumpsAt(t);
  const pts: { x: number; y: number }[] = [];
  for (let y = -24; y < H + 24; y += 6) pts.push({ x: x0 + traceY(y, t, bumps, HUM), y });
  pts.push({ x: x0 + traceY(H + 24, t, bumps, HUM), y: H + 24 });
  return { pts, bumps, x0 };
};

const Line: React.FC<{ t: number; pts: { x: number; y: number }[]; bumps: ScopeBump[]; x0: number }> = ({ t, pts, bumps, x0 }) => {
  const str = (p: { x: number; y: number }[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  const seg = (b: ScopeBump) => {
    const s = b.sigma ?? 30;
    const out: { x: number; y: number }[] = [];
    for (let y = b.x - 2.6 * s; y <= b.x + 2.6 * s; y += 3) out.push({ x: x0 + traceY(y, t, bumps, HUM), y });
    return out;
  };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {/* a hard dark keyline (no blur) so the line reads over his skin and the bright window */}
      <polyline points={str(pts)} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={8} strokeLinejoin="round" />
      <polyline points={str(pts)} fill="none" stroke="rgba(243,241,236,0.84)" strokeWidth={3.4} strokeLinejoin="round" />
      {bumps.map((b, i) =>
        b.amp < 0.5 ? null : (
          <polyline key={i} points={str(seg(b))} fill="none" stroke={`rgba(${b.rgb},${Math.min(1, 0.45 + b.amp / 26).toFixed(3)})`} strokeWidth={4.2} strokeLinejoin="round" strokeLinecap="round" />
        ),
      )}
    </svg>
  );
};

// ---------------------------------------------------------------- the label pane (a small CRT above his head)
const P_W = 640;
const P_H = 146;
const P_LEFT = (W - P_W) / 2;
/** under the safe top with room for the float and the tilt, clear above his hair (about y 488 at the full push) */
const P_TOP = SAFE_IG.y0 + 32;
const TUBE_W = 1080;
const PK = P_W / TUBE_W;
const INK = "#ECEAE4";
const ICON = 66;
const TEXT_X = 26 + ICON + 22;
const JOB = 50;

/** which job the pane shows at t, how much of it is typed, and the outgoing one */
const typingAt = (t: number) => {
  let k = -1;
  WIPES.forEach((w, i) => {
    if (t >= w.a + 2) k = i;
  });
  if (k < 0) return null;
  const jobs = textOf().jobs;
  const w = WIPES[k];
  const word = jobs[k];
  const a = w.a + 2;
  const b = a + word.length * 0.55;
  const n = Math.round(word.length * ez(t, a, b, EASE.decel));
  const out = k > 0 ? { word: jobs[k - 1], p: ez(t, w.a, w.a + 4, EASE.decel) } : null;
  // the new name fades up under the outgoing one as it starts to type
  const inOp = out ? ez(t, w.a + 1.5, w.a + 3, EASE.enter) : 1;
  return { word, n, typing: t < b, out, inOp };
};

const Pane: React.FC<{ t: number }> = ({ t }) => {
  const on = ez(t, -8, 2, EASE.decel);
  const head = ez(t, -6, 1, EASE.enter);
  const ty = typingAt(t);
  const caret = ty && ty.typing ? 1 : 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(t * 0.45));
  return (
    <AbsoluteFill style={{ background: PH.panel, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scaleY(${lerp(0.02, 1, on).toFixed(4)})`,
          filter: on < 0.999 ? `brightness(${(1 + 1.4 * (1 - on)).toFixed(3)})` : undefined,
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(28,31,38,0.9) 0%, rgba(16,18,23,1) 100%)" }} />
        <Img src={staticFile(LOGOS.resolve)} style={{ position: "absolute", left: 26, top: (P_H - ICON) / 2, width: ICON, height: ICON, objectFit: "contain", display: "block" }} />
        <div style={{ position: "absolute", left: TEXT_X, top: 22, fontFamily: MONO, fontWeight: 500, fontSize: 28, lineHeight: 1, color: INK, opacity: 0.66 * head, whiteSpace: "nowrap", transform: `translateY(${(1 - head) * 8}px)` }}>
          {textOf().head}
        </div>
        <div style={{ position: "absolute", left: TEXT_X, top: 60, height: JOB * 1.15, fontFamily: MONO, fontWeight: 700, fontSize: JOB, lineHeight: `${JOB * 1.15}px`, color: UI.coral, whiteSpace: "pre" }}>
          {ty && ty.out && ty.out.p < 1 ? (
            <div style={{ position: "absolute", left: 0, top: 0, opacity: 1 - ty.out.p, transform: `translateY(${(-14 * ty.out.p).toFixed(2)}px)` }}>{ty.out.word}</div>
          ) : null}
          {ty ? (
            <div style={{ position: "absolute", left: 0, top: 0, display: "flex", alignItems: "center", opacity: ty.inOp }}>
              <span>{ty.word.slice(0, ty.n)}</span>
              <span style={{ display: "inline-block", width: JOB * 0.56, height: JOB * 0.92, marginLeft: 4, background: UI.coral, opacity: caret }} />
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the effect
export const SplitWipe: React.FC<FxProps> = ({ t }) => {
  const cam = camAt(t);
  const camStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
    transform: `translate(${cam.dx.toFixed(2)}px, ${cam.dy.toFixed(2)}px) scale(${cam.z.toFixed(5)})`,
  };
  const { pts, bumps, x0 } = linePts(t);
  const clip = `polygon(-40px -24px, ${pts.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(", ")}, -40px ${H + 24}px)`;
  // the pane: near layer, settles from a 7 degree tilt, floats
  const rx = interpolate(t, [0, 14, 48], [7, 2, 1.4], { ...CLAMP, easing: EASE.travel });
  const float = 2 * Math.sin(t * 0.13 + 0.4);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {/* as shot */}
      <div style={camStyle}>
        <Clip name="r_assets" />
      </div>
      {/* flat: the same clip, the same transform, only the filter differs; clipped to the left of the live line */}
      <div style={{ position: "absolute", inset: 0, clipPath: clip, WebkitClipPath: clip }}>
        <div style={{ ...camStyle, filter: "saturate(0.2) contrast(0.9)" }}>
          <Clip name="r_assets" />
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 58% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.22) 100%)" }} />
      <Line t={t} pts={pts} bumps={bumps} x0={x0} />
      <div
        style={{
          position: "absolute",
          left: P_LEFT,
          top: P_TOP,
          width: P_W,
          height: P_H,
          borderRadius: 22,
          overflow: "hidden",
          background: "#000",
          transformOrigin: "50% 100%",
          transform: `translate(${(cam.dx * NEAR).toFixed(2)}px, ${(cam.dy * NEAR + float).toFixed(2)}px) perspective(1400px) rotateX(${rx.toFixed(3)}deg)`,
          boxShadow: "0 0 0 2px rgba(255,255,255,0.16), 0 22px 48px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: TUBE_W, height: P_H / PK, overflow: "hidden", transform: `scale(${PK})`, transformOrigin: "0 0" }}>
          <CRT loop={150} bloom={0.8}>
            <div style={{ position: "absolute", left: 0, top: 0, width: P_W, height: P_H, transform: `scale(${1 / PK})`, transformOrigin: "0 0" }}>
              <Pane t={t} />
            </div>
          </CRT>
        </div>
      </div>
      {/* anchored by its bottom edge at y 1450: clear of the Reels UI band, on his chest under his chin, inside the rect. Five
          words do not fit one line at 60 px, so the two lines are balanced (no single word left hanging) and grow upward. */}
      <Caption name="r_assets" t={t} size={60} chunk={5} maxWidth={SAFE_IG.w - 40} style={{ top: undefined, bottom: H - CAPTION_BOTTOM, textWrap: "balance" }} />
    </AbsoluteFill>
  );
};

export const splitwipe: FxDef = {
  id: "splitwipe",
  command: "/split-wipe",
  menu: "A wipe line that grades your footage",
  clip: "r_assets",
  Comp: SplitWipe,
  thumbT: [16, 26, 34],
};
