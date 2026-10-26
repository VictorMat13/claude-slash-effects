// /page-flip (set 2, builder S2-A). Victor full frame (clip "learn": "And if you want to learn how to use AI in Resolve,").
// Beside his head, in the clear column left of his face, a CRT tube holds a 2.5D stack of manual pages. At the top of the
// tube a page counter (Inter 800, tabular numerals) spins from a low number to MANUAL.page while the pages flip faster and
// faster: each flip is one sheet swinging down on its top edge (out toward the lens, then flat onto the stack, eased,
// staggered, several in the air at once as it speeds up). MANUAL.name sits small under the counter, above the stack, from
// the opening. Then the last page lands slower (its coral caret already waiting), MANUAL.section is typed on it and
// MANUAL.source fades in smaller below the stack (all verbatim, facts.ts).
// One live scope trace runs under the stack; a coral packet fires on it at every landing and runs out toward him, the last
// one bigger; his voice (real word timings) is the green amplitude at the end nearest him.
// Camera: opens tight on the counter (the tube at 1.3x and the screen inside pushed in on the counter, his footage the far
// plane, soft and dim), holds while the counter spins, then pulls out (t 6 to 22) to reveal him: the tube settles into its
// column and angles toward him (2.5D), the screen inside pulls back, his footage racks into focus and eases 1.07 to 1.04
// (never past 1.07). Ambient: tube float, footage drift, CRT refresh, trace carrier, caret.
// Safe zone: the tube and everything in it, and the caption, stay inside SAFE_IG at every t; the tube never reaches his face
// (its right edge stays left of his hair at every frame, including the tight opening). Caption: his words, on his chest.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { MANUAL } from "../../data/facts";
import { CRT, Caption, Clip, DarkGrid, INTER } from "../../kit";
import { CLAMP, EASE, SAFE_IG, UI, ez, lerp, type FxDef, type FxProps } from "../../theme";
import { voiceEnv } from "../shutterstrike";

// ---------------------------------------------------------------- camera: one keyframe timeline (hold tight, pull out, hold)
const KEY_T = [0, 6, 22, 48];
const key = (t: number, v: number[]) => interpolate(t, KEY_T, v, { ...CLAMP, easing: EASE.travel });
const camAt = (t: number) => ({
  /** tube scale about its top-left corner (the safe rect's corner) */
  s: key(t, [1.26, 1.25, 1.0, 0.99]),
  /** the screen inside the tube, pushed in on the counter */
  iz: key(t, [1.14, 1.13, 1.0, 1.0]),
  /** the tube turns toward him as he is revealed */
  ry: key(t, [2, 2.2, 7, 7.5]),
  rx: key(t, [3, 3, 1, 1]),
  /** far plane: his footage, about its left edge so his head moves right, away from the tube */
  clipS: key(t, [1.07, 1.068, 1.042, 1.04]),
  clipBlur: key(t, [2.6, 2.4, 0, 0]),
  clipBright: key(t, [0.72, 0.74, 1, 1]),
});
const CLIP_ORIGIN = { x: 100, y: 760 };

// ---------------------------------------------------------------- the tube (final framing, screen px) and its layout
/** In this take his hair never comes further left than about x 405 (t 38..44); under the footage's 1.04 push about x 100
 *  that is about 417 on screen, so the tube ends at 400. Its left and top edges follow SAFE_IG (theme.ts). */
const TUBE_RIGHT = 400;
/** top: 20 px under the safe top so the bezel clears the 4:5 feed crop (y 285) at the float's highest frame. */
const TUBE = { left: SAFE_IG.x0 + 6, top: SAFE_IG.y0 + 20, w: TUBE_RIGHT - (SAFE_IG.x0 + 6), h: 716, r: 26 } as const;
/** The CRT pass sizes itself to 1080 px: draw it at TUBE.w / K and scale it into the tube (finer scanlines, thin vignette). */
const K = 0.4;
const TUBE_IW = TUBE.w / K;
const TUBE_IH = TUBE.h / K;

const INK = "#ECEAE4";
const MUTED = "rgba(236,234,228,0.78)";
const COUNTER = { y: 26, size: 84 } as const;
/** 28 px (the label floor) with tight tracking: at the opening's 1.14 push every glyph stays clear of the bezel shadow. */
const NAME = { y: 118, size: 28, track: -0.7 } as const;
/** The stack: pages hang on their top edge at HINGE. */
const PAGE = { x: 14, w: TUBE.w - 28, h: 330 } as const;
const HINGE = 206;
const SHEETS = 4;
const SHEET_STEP = 7;
const TRACE_Y = 600;
const SOURCE = { y: 628, size: 28 } as const;
/** The counter is the focal point of the screen's own push-in. */
const FOCUS = { x: TUBE.w / 2, y: COUNTER.y + COUNTER.size / 2 };

// ---------------------------------------------------------------- the flips (24 fps, t = 0 at the card resolve)
const N = 16;
/** Landing times get closer together: faster and faster. The first lands just before t 0, the 16th at t 20. */
const landT = (k: number) => -6 + 26 * Math.pow(k / N, 0.55);
const flipDur = (k: number) => lerp(7, 4.5, k / N);
/** The last page: starts while the fast ones are still landing, lands slower, at t 24. */
const FINAL = { start: 16.5, land: 24 } as const;
const FROM = 95; // degrees: just past edge-on, so a back never reaches up over the counter
const FINAL_N = N + 1;
type Flip = { k: number; start: number; land: number };
const FLIPS: Flip[] = [
  ...Array.from({ length: N }, (_, i) => {
    const k = i + 1;
    return { k, start: landT(k) - flipDur(k), land: landT(k) };
  }),
  { k: FINAL_N, start: FINAL.start, land: FINAL.land },
];

/** The counter: driven by the landings (continuous), accelerating; exactly MANUAL.page once the last page is down. */
const TARGET = Number(MANUAL.page.replace(/,/g, ""));
const counterAt = (t: number) => {
  if (t >= FINAL.land) return MANUAL.page;
  let c = 0;
  for (const f of FLIPS) c += ez(t, f.land - 2, f.land, EASE.inOut);
  const v = Math.round(1 + (TARGET - 1) * Math.pow(c / FINAL_N, 2.1));
  return Math.min(TARGET - 1, v).toLocaleString("en-US");
};

/** Page texture: plain bars in place of body copy (no invented text), a different rhythm per page. */
const bars = (k: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const h = Math.sin(k * 12.9898 + i * 78.233) * 43758.5453;
    const r = h - Math.floor(h);
    return i % 5 === 4 ? 0.42 + 0.2 * r : 0.78 + 0.22 * r;
  });

const PageFace: React.FC<{ k: number; shade: number; children?: React.ReactNode }> = ({ k, shade, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 10,
      background: "#2B2F38",
      boxShadow: "inset 0 0 0 2px rgba(236,234,228,0.42)",
      overflow: "hidden",
      filter: shade < 0.999 ? `brightness(${shade.toFixed(3)})` : undefined,
    }}
  >
    {children ?? (
      <div style={{ position: "absolute", left: 18, right: 18, top: 24 }}>
        <div style={{ width: "62%", height: 13, borderRadius: 6, background: "rgba(236,234,228,0.5)", marginBottom: 20 }} />
        {bars(k, 8).map((w, i) => (
          <div key={i} style={{ width: `${(w * 100).toFixed(1)}%`, height: 8, borderRadius: 4, background: "rgba(236,234,228,0.3)", marginBottom: 19 }} />
        ))}
      </div>
    )}
  </div>
);

const PageBack: React.FC<{ shade: number }> = ({ shade }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 10,
      background: "#3A3E48",
      boxShadow: "inset 0 0 0 2px rgba(236,234,228,0.46)",
      filter: `brightness(${shade.toFixed(3)})`,
    }}
  />
);

/** The last page: a coral caret waiting while it falls, then MANUAL.section typed once it is down; body texture under it. */
const FinalFace: React.FC<{ t: number }> = ({ t }) => {
  const p = ez(t, 25, 35, EASE.inOut);
  const n = Math.round(MANUAL.section.length * p);
  const caretOn = p < 1 || Math.floor(t / 6) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: 14, right: 12, top: 16 }}>
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 700,
          fontSize: 36,
          lineHeight: 1.08,
          letterSpacing: -0.8,
          color: INK,
          textWrap: "balance",
        }}
      >
        {MANUAL.section.slice(0, n)}
        {caretOn ? (
          <span style={{ display: "inline-block", width: 15, height: 32, marginLeft: 3, verticalAlign: -4, background: UI.coral }} />
        ) : null}
        <span style={{ opacity: 0 }}>{MANUAL.section.slice(n)}</span>
      </div>
      <div style={{ marginTop: 22 }}>
        {bars(FINAL_N, 4).map((w, i) => (
          <div key={i} style={{ width: `${(w * 100).toFixed(1)}%`, height: 8, borderRadius: 4, background: "rgba(236,234,228,0.3)", marginBottom: 18 }} />
        ))}
      </div>
    </div>
  );
};

/** One sheet on its hinge. theta 0 lies on the stack; 90 is edge-on toward the lens; above 90 its back shows. */
const Sheet: React.FC<{ f: Flip; t: number }> = ({ f, t }) => {
  const p = ez(t, f.start, f.land, EASE.decel);
  const theta = lerp(FROM, 0, p);
  const back = theta > 90;
  // simple light: brightest flat, darker as it turns away from the lens
  const shade = 0.55 + 0.45 * Math.abs(Math.cos((theta * Math.PI) / 180));
  const air = 1 - p;
  return (
    <div
      style={{
        position: "absolute",
        left: PAGE.x,
        top: HINGE,
        width: PAGE.w,
        height: PAGE.h,
        transformOrigin: "50% 0%",
        transform: `perspective(2200px) rotateX(${theta.toFixed(3)}deg)`,
        boxShadow: `0 ${(6 + 26 * air).toFixed(1)}px ${(14 + 30 * air).toFixed(1)}px rgba(0,0,0,${(0.45 + 0.2 * air).toFixed(3)})`,
        borderRadius: 10,
      }}
    >
      {back ? <PageBack shade={shade * 0.9} /> : f.k === FINAL_N ? <PageFace k={f.k} shade={shade}><FinalFace t={t} /></PageFace> : <PageFace k={f.k} shade={shade} />}
    </div>
  );
};

const Stack: React.FC<{ t: number }> = ({ t }) => {
  // the newest landed page lies on top; pages in the air draw over it in landing order
  let top: Flip | null = null;
  for (const f of FLIPS) if (t >= f.land) top = f;
  const air = FLIPS.filter((f) => t >= f.start && t < f.land);
  const settle = Math.max(0, ...FLIPS.map((f) => interpolate(t, [f.land, f.land + 1, f.land + 6], [0, 1, 0], CLAMP)));
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: `50% ${HINGE}px`, transform: `perspective(1400px) rotateX(${(12 + 1.5 * settle).toFixed(3)}deg)` }}>
      {/* the stack under the top page, deepest first */}
      {Array.from({ length: SHEETS }, (_, i) => {
        const d = SHEETS - i;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PAGE.x + d * 3,
              width: PAGE.w - d * 6,
              top: HINGE + d * SHEET_STEP,
              height: PAGE.h,
              borderRadius: 10,
              background: "#2A2E37",
              boxShadow: `inset 0 0 0 2px rgba(236,234,228,${(0.46 - 0.06 * d).toFixed(3)})`,
              filter: `brightness(${(1 - 0.08 * d).toFixed(3)})`,
            }}
          />
        );
      })}
      {top ? (
        <div style={{ position: "absolute", left: PAGE.x, top: HINGE, width: PAGE.w, height: PAGE.h, boxShadow: "0 6px 14px rgba(0,0,0,0.45)", borderRadius: 10 }}>
          {top.k === FINAL_N ? (
            <PageFace k={top.k} shade={1}>
              <FinalFace t={t} />
            </PageFace>
          ) : (
            <PageFace k={top.k} shade={1} />
          )}
        </div>
      ) : (
        <div style={{ position: "absolute", left: PAGE.x, top: HINGE, width: PAGE.w, height: PAGE.h }}>
          <PageFace k={0} shade={1} />
        </div>
      )}
      {air.map((f) => (
        <Sheet key={f.k} f={f} t={t} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- the trace under the stack
const trace = (t: number): ScopeBump[] => {
  const bumps: ScopeBump[] = [];
  for (const f of FLIPS) {
    const last = f.k === FINAL_N;
    const run = last ? 14 : 9;
    if (t < f.land - 1 || t > f.land + run + 1) continue;
    const u = ez(t, f.land, f.land + run, EASE.decel);
    const env = interpolate(t, [f.land - 1, f.land + 1, f.land + run], [0, 1, 0], CLAMP);
    bumps.push({ x: lerp(PAGE.x + PAGE.w / 2, TUBE.w + 40, u), amp: (last ? 24 : 15) * env, sigma: last ? 34 : 26, rgb: PH.claudeRgb });
  }
  // his voice, at the end of the line nearest him
  bumps.push({ x: TUBE.w - 34, amp: 2.5 + 13 * voiceEnv("learn", t) + Math.sin(t * 0.31), sigma: 26, rgb: PH.userRgb });
  return bumps;
};

/** What the tube shows, in tube px, under the screen's own push-in on the counter. */
const Screen: React.FC<{ t: number; iz: number }> = ({ t, iz }) => {
  const name = ez(t, 3, 10, EASE.enter);
  const source = ez(t, 31, 37, EASE.enter);
  const value = counterAt(t);
  return (
    <AbsoluteFill style={{ background: PH.panel, overflow: "hidden" }}>
      <DarkGrid shift={t * 0.35} pitch={37} style={{ left: -40, top: -40, width: TUBE.w + 80, height: TUBE.h + 80, background: "transparent", opacity: 0.9 }} />
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${FOCUS.x}px ${FOCUS.y}px`, transform: `scale(${iz.toFixed(4)})` }}>
        <Stack t={t} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: COUNTER.y,
            textAlign: "center",
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: COUNTER.size,
            lineHeight: 1,
            letterSpacing: -2,
            fontVariantNumeric: "tabular-nums",
            color: INK,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: NAME.y,
            textAlign: "center",
            fontFamily: INTER,
            fontWeight: 600,
            fontSize: NAME.size,
            lineHeight: 1.14,
            letterSpacing: NAME.track,
            color: MUTED,
            textWrap: "balance",
            opacity: name,
            transform: `translateY(${((1 - name) * 10).toFixed(2)}px)`,
          }}
        >
          {MANUAL.name}
        </div>
        <svg width={TUBE.w} height={TUBE.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Scope frame={t} x0={-10} x1={TUBE.w + 10} y={TRACE_Y} bumps={trace(t)} hum={1.3} stroke={3} color="rgba(243,241,236,0.62)" />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: SOURCE.y,
            textAlign: "center",
            fontFamily: INTER,
            fontWeight: 500,
            fontSize: SOURCE.size,
            lineHeight: 1.16,
            letterSpacing: -0.3,
            color: MUTED,
            textWrap: "balance",
            opacity: source,
            transform: `translateY(${((1 - source) * 10).toFixed(2)}px)`,
          }}
        >
          {MANUAL.source}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the scene
/** His words under his chin, clear under the tube even at the tight opening (tube bottom at most about 1195). */
const CAPTION_Y = 1240;

export const PageFlip: React.FC<FxProps> = ({ t }) => {
  const c = camAt(t);
  const dx = 2 * Math.sin(t * 0.07);
  const dy = 1.5 * Math.sin(t * 0.05);
  const floatY = 3 * Math.sin(t * 0.12);
  const floatX = 2.5 * Math.sin(t * 0.07 + 0.5);
  const clipFilter = `${c.clipBlur > 0.05 ? `blur(${c.clipBlur.toFixed(2)}px) ` : ""}brightness(${c.clipBright.toFixed(3)})`;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${c.clipS.toFixed(4)})`,
          transformOrigin: `${CLIP_ORIGIN.x}px ${CLIP_ORIGIN.y}px`,
          filter: clipFilter,
        }}
      >
        <Clip name="learn" />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 62% 40%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.28) 100%)" }} />
      {/* camera: the tube scales about the safe rect's corner; 2.5D turn about its own center */}
      <div
        style={{
          position: "absolute",
          left: TUBE.left,
          top: TUBE.top,
          width: TUBE.w,
          height: TUBE.h,
          transformOrigin: "0px 0px",
          transform: `translate(${floatX.toFixed(2)}px, ${floatY.toFixed(2)}px) scale(${c.s.toFixed(4)})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: TUBE.r,
            overflow: "hidden",
            background: "#000",
            transformOrigin: "50% 50%",
            transform: `perspective(1600px) rotateY(${c.ry.toFixed(3)}deg) rotateX(${c.rx.toFixed(3)}deg)`,
            boxShadow: "0 0 0 2px rgba(255,255,255,0.14), 0 28px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: TUBE_IW, height: TUBE_IH, overflow: "hidden", transform: `scale(${K})`, transformOrigin: "0 0" }}>
            <CRT loop={150} bloom={0.85}>
              <div style={{ position: "absolute", left: 0, top: 0, width: TUBE.w, height: TUBE.h, transform: `scale(${1 / K})`, transformOrigin: "0 0" }}>
                <Screen t={t} iz={c.iz} />
              </div>
            </CRT>
          </div>
        </div>
      </div>
      <Caption name="learn" t={t} y={CAPTION_Y} size={62} chunk={3} maxWidth={SAFE_IG.w - 40} />
    </AbsoluteFill>
  );
};

export const pageflip: FxDef = {
  id: "pageflip",
  command: "/page-flip",
  menu: "A manual flips to the page that matters",
  clip: "learn",
  Comp: PageFlip,
  thumbT: [8, 22, 36],
};
