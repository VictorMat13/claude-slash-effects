// /match-cut: real article paragraphs about the Resolve 21.1 AI update cut on the lock word (LOCK_WORD, "Anthropic"), locked in a
// coral box at the same spot and size on every page. Polish (Victor, 16:50 and 17:05, CRT Scope bar):
//  - one continuous camera: a slow push 1.0 to 1.08 over t 0..48, anchored on the lock box, so every cut lands inside a moving camera;
//  - pages in 2.5D: the next two pages wait behind the current one, smaller, softer and dimmer by depth, and take less of the push
//    (parallax). On a cut the whole stack advances by one page, so the page you saw waiting behind is the one that cuts in;
//  - a live scope trace runs under the box across the cuts. A coral packet runs in along it on every cut (alternating sides) and
//    reaches the box on the cut; the box talks on the line and breathes once per page (1.00 to 1.015, eased, never a jump);
//  - each page arrives 3 px right and settles 3 px left (6 px, eased), the pages behind drift less.
// Pages cut every 5 frames (0.2 s at 24 fps), like the reference.
// Instagram safe zone (Victor, 22:00): at the worst frame of the push (zoom 1.08, breath 1.015, page settle) the lock box, the
// header rows, the peeking headers of the stacked pages and the coral packets all sit inside SAFE_IG (x 100..980, y 290..1520).
// The box stays centered on (540, 960); the sheets and the 1700 px paragraph lines keep bleeding to the frame edge (background).
import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Scope, type ScopeBump } from "../../artcraft/kit/Scope";
import { PH } from "../../artcraft/theme";
import { ARTICLES, LOCK_WORD, type Article } from "../data/facts";
import { CRT, INTER, MONO, SERIF } from "../kit";
import { CLAMP, EASE, H, SAFE_IG, UI, W, ez, lerp, type FxDef, type FxProps } from "../theme";

const ANCHOR = { x: W / 2, y: 960 };
const CUT = 5; // 0.2 s per page at 24 fps, like the reference

/** Camera keyframes (one timeline): focal point fixed on the lock box, zoom pushes the whole effect long. */
const KEY_T = [0, 48];
const ZOOM = [1.0, 1.08];
const ZMAX = ZOOM[1];
/** Air kept inside the safe rect at the worst frame. */
const EDGE = 10;
/** Front-plane content stays within ANCHOR.x +- REACH at zoom 1, so the push to ZMAX keeps it EDGE inside the safe sides. */
const REACH = (SAFE_IG.w / 2 - EDGE) / ZMAX; // 398

/** Paragraph text and the locked word (150 before the safe-zone pass; the box and the text shrink together). */
const FONT_SIZE = 140;
/** The lock box keeps one width and one face on every page, like the reference. It breathes up to 1.015 and is tilted 1.6
 *  degrees, so its widest corner at ZMAX still ends EDGE inside the safe sides (778 x 178). */
const BOX_H = 178;
const TILT_DEG = 1.6;
const TILT = (TILT_DEG * Math.PI) / 180;
const BREATH = 0.015;
const BOX_W = 2 * Math.floor((REACH / (1 + BREATH) - (BOX_H / 2) * Math.sin(TILT)) / Math.cos(TILT));

/** The page sheet, in plane coordinates (the front plane is the screen at zoom 1). Its top sits lower than before so the two
 *  sheets waiting behind it fit their peeking headers under the safe top. */
const SHEET = { x: 64, y: 560, w: W - 128, r: 30 };
/** Share of the push a plane takes at the end of the push. */
const camEnd = (push: number) => 1 + (ZMAX - 1) * push;
/** Sheet tops on screen at the end of the push: the furthest sheet sits EDGE under the safe top, the front sheet where SHEET
 *  puts it, and the two peeks share the space between them equally (about 114 px each). */
const STACK_TOP = SAFE_IG.y0 + EDGE;
const FRONT_TOP_END = ANCHOR.y - ZMAX * (ANCHOR.y - SHEET.y);
const PEEK = (FRONT_TOP_END - STACK_TOP) / 2;
/** The lift that puts a plane's sheet top at `topEnd` on screen at the end of the push. */
const liftFor = (scale: number, push: number, topEnd: number) => (topEnd - ANCHOR.y) / camEnd(push) - scale * (SHEET.y - ANCHOR.y);
/**
 * Depth planes: 0 is the current page, 1 and 2 the next two pages. `scale` and `lift` stack the sheets up and back so their
 * headers peek over the front sheet; `push` is the share of the camera push a plane takes (parallax); `drift` the per-page settle.
 */
const DEPTH = [
  { scale: 1, lift: 0, push: 1, blur: 0, ink: 1, frame: 0.3, drift: 6, h: H + 200 - SHEET.y },
  { scale: 0.9, lift: liftFor(0.9, 0.6, STACK_TOP + PEEK), push: 0.6, blur: 2.5, ink: 0.8, frame: 0.34, drift: 3.6, h: 460 },
  { scale: 0.8, lift: liftFor(0.8, 0.35, STACK_TOP), push: 0.35, blur: 4.5, ink: 0.58, frame: 0.24, drift: 2, h: 460 },
] as const;
/** Header row and the top of the text window, in sheet coordinates. The header rows end inside ANCHOR.x +- REACH, less the
 *  front page's 3 px settle, so the publication and the date stay inside the safe sides at ZMAX. */
const HEAD = { inset: Math.ceil(ANCHOR.x - REACH + DEPTH[0].drift / 2 - SHEET.x), y: 40, rule: 92, textTop: 104, fade: 170 };
/** Text blur on the current page (the lock box stays sharp). */
const TEXT_BLUR = 1.4;

/** The scope trace runs in the gap under the locked line (between its descenders and the next line's ascenders). */
const TRACE_Y = ANCHOR.y + Math.round(0.75 * FONT_SIZE);
const TRACE_INK = "rgba(243,241,236,0.6)";
/** Frames a packet takes to run in from the safe edge to the box. */
const FLIGHT = 16;
/** Packet width (gaussian sigma). Its coral segment runs 2.6 sigma each way. */
const PACKET_SIGMA = 36;
/** Packets launch this far from the box: the whole coral segment stays inside the safe sides at ZMAX. */
const LAUNCH_DX = REACH - 2.6 * PACKET_SIGMA; // 304

const face = (a: Article) => (a.face === "serif" ? SERIF : a.face === "mono" ? MONO : INTER);
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** One article page. Measures where the lock word lands and shifts the paragraph so it sits on the anchor. */
const Page: React.FC<{ a: Article; u: number; d: 0 | 1 | 2 }> = ({ a, u, d }) => {
  const box = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const [m, setM] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const c = box.current;
    const s = word.current;
    if (!c || !s) return;
    const cr = c.getBoundingClientRect();
    const sr = s.getBoundingClientRect();
    const scale = cr.width / c.offsetWidth || 1;
    setM({ x: (sr.left - cr.left) / scale, y: (sr.top - cr.top) / scale, w: sr.width / scale, h: sr.height / scale });
  }, []);
  let idx = -1;
  for (let n = 0; n < (a.lock ?? 1); n++) idx = a.text.indexOf(LOCK_WORD, idx + 1);
  const before = a.text.slice(0, idx);
  const after = a.text.slice(idx + LOCK_WORD.length);
  const ff = face(a);
  // 1700 px lines: enough lines above and below the locked one to fill the sheet on every page.
  const boxW = 1700;
  // Sheet coordinates: the anchor sits at (ANCHOR - SHEET) inside the sheet.
  const baseLeft = (W - boxW) / 2 - SHEET.x;
  const baseTop = 360 - SHEET.y;
  const tx = m ? ANCHOR.x - SHEET.x - (baseLeft + m.x + m.w / 2) : 0;
  const ty = m ? ANCHOR.y - SHEET.y - (baseTop + m.y + m.h / 2) : 0;
  // Arrives 3 px right, settles 3 px left (6 px per cut, eased). Pages further back drift less.
  const dx = DEPTH[d].drift * (0.5 - EASE.decel(u));
  const mask = `linear-gradient(180deg, rgba(0,0,0,0) ${HEAD.textTop}px, #000 ${HEAD.fade}px)`;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${dx.toFixed(2)}px)` }}>
      <div
        style={{
          position: "absolute",
          left: HEAD.inset,
          right: HEAD.inset,
          top: HEAD.y,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: INTER,
          fontSize: 28,
          fontWeight: 600,
          color: "#B4B0A8",
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        <span style={{ whiteSpace: "nowrap" }}>{a.source}</span>
        <span style={{ whiteSpace: "nowrap", marginLeft: 40 }}>{a.date}</span>
      </div>
      <div style={{ position: "absolute", left: HEAD.inset, right: HEAD.inset, top: HEAD.rule, height: 2, background: "rgba(255,255,255,0.18)" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          maskImage: mask,
          WebkitMaskImage: mask,
          filter: d === 0 ? `blur(${TEXT_BLUR}px)` : undefined,
        }}
      >
        <div
          ref={box}
          style={{
            position: "absolute",
            left: baseLeft,
            top: baseTop,
            width: boxW,
            fontFamily: ff,
            fontSize: FONT_SIZE,
            fontWeight: 500,
            lineHeight: 1.3,
            color: "rgba(236,233,226,0.86)",
            opacity: m ? 1 : 0,
            transform: `translate(${tx}px, ${ty}px)`,
            letterSpacing: a.face === "mono" ? -1 : 0,
          }}
        >
          {before}
          <span ref={word} style={{ visibility: "hidden" }}>{LOCK_WORD}</span>
          {after}
        </div>
      </div>
    </div>
  );
};

/** One depth plane: a dark sheet with a keyline holding page `idx`. The sheet itself never cuts, only its page does. */
const Plane: React.FC<{ d: 0 | 1 | 2; idx: number; u: number; z: number; children?: React.ReactNode }> = ({ d, idx, u, z, children }) => {
  const L = DEPTH[d];
  const cam = 1 + (z - 1) * L.push;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        transform: `scale(${cam.toFixed(5)}) translateY(${L.lift}px) scale(${L.scale})`,
        transformOrigin: `${ANCHOR.x}px ${ANCHOR.y}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: SHEET.x,
          top: SHEET.y,
          width: SHEET.w,
          height: L.h,
          borderRadius: SHEET.r,
          background: UI.screen,
          boxShadow: `inset 0 0 0 2px rgba(255,255,255,${L.frame}), 0 -18px 40px rgba(0,0,0,0.5)`,
          overflow: "hidden",
          filter: L.blur > 0 ? `blur(${L.blur}px)` : undefined,
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: L.ink }}>
          <Page key={`${d}-${idx}`} a={ARTICLES[idx]} u={u} d={d} />
        </div>
      </div>
      {children}
    </div>
  );
};

/** The trace's packets and the box's voice at frame t. */
const bumpsAt = (t: number): ScopeBump[] => {
  const coral = PH.claudeRgb;
  const b: ScopeBump[] = [];
  const k0 = Math.floor(t / CUT);
  for (let k = k0 - 1; k <= k0 + Math.ceil(FLIGHT / CUT) + 1; k++) {
    const arrive = k * CUT;
    const launch = arrive - FLIGHT;
    if (t < launch || t > arrive + 2) continue;
    // Packets alternate sides so both halves of the line carry one; each runs in from just inside the safe edge.
    const x0 = mod(k, 2) === 0 ? ANCHOR.x - LAUNCH_DX : ANCHOR.x + LAUNCH_DX;
    const p = ez(t, launch, arrive, EASE.inOut);
    const env = interpolate(t, [launch, launch + 3, arrive - 2, arrive + 2], [0, 1, 1, 0], CLAMP);
    b.push({ x: lerp(x0, ANCHOR.x, p), amp: 18 * env, sigma: PACKET_SIGMA, rgb: coral });
  }
  // The box talks on the line, loudest on each cut (a smooth pulse, continuous across cuts).
  const ph = mod(t, CUT) / CUT;
  const talk = 6 + 7 * (0.5 + 0.5 * Math.cos(2 * Math.PI * ph)) + 1.5 * Math.sin(t * 0.37);
  b.push({ x: ANCHOR.x, amp: talk, sigma: 120, rgb: coral });
  return b;
};

export const MatchCut: React.FC<FxProps> = ({ t }) => {
  const tt = Math.max(0, t);
  const k = Math.floor(tt / CUT);
  const u = (tt % CUT) / CUT;
  const z = interpolate(tt, KEY_T, ZOOM, { ...CLAMP, easing: EASE.inOut });
  // One breath per page: 1.00 on the cut, 1.015 mid-page, back to 1.00 on the next cut.
  const breath = 1 + BREATH * (0.5 - 0.5 * Math.cos(2 * Math.PI * u));
  const n = ARTICLES.length;
  return (
    <CRT>
      <AbsoluteFill style={{ background: UI.screen, overflow: "hidden" }}>
        <Plane d={2} idx={(k + 2) % n} u={u} z={z} />
        <Plane d={1} idx={(k + 1) % n} u={u} z={z} />
        <Plane d={0} idx={k % n} u={u} z={z}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <Scope frame={tt} x0={-80} x1={W + 80} y={TRACE_Y} bumps={bumpsAt(tt)} hum={1.4} stroke={3} color={TRACE_INK} />
          </svg>
          <div
            style={{
              position: "absolute",
              left: ANCHOR.x - BOX_W / 2,
              top: ANCHOR.y - BOX_H / 2,
              width: BOX_W,
              height: BOX_H,
              borderRadius: 13,
              background: UI.red,
              color: UI.white,
              fontFamily: INTER,
              fontSize: FONT_SIZE,
              fontWeight: 600,
              lineHeight: 1.3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(-${TILT_DEG}deg) scale(${breath.toFixed(5)})`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              letterSpacing: -1,
            }}
          >
            {LOCK_WORD}
          </div>
        </Plane>
      </AbsoluteFill>
    </CRT>
  );
};

export const matchcut: FxDef = {
  id: "matchcut",
  command: "/match-cut",
  menu: "News articles cut on one word, locked in place",
  clip: "connect",
  Comp: MatchCut,
  thumbT: [2, 14, 26],
};
