// /magnifier (set 4, builder FX-A; dispatch/VIDEO4.md). A full-screen CRT page, no footage (like /match-cut).
// The page is PTTL.gr's paragraph (ARTICLES[1], verbatim, with its source and date pinned at the top like a reader's
// masthead), set in mono so the layout is exact: the column is wide enough that the lock word "Anthropic" (LOCK_WORD)
// sits mid-line, and the lines bleed off both edges (background, like match-cut's 1700 px lines).
// The page scrolls up slowly (one eased move from before t 0 to after t 48). A round CRT lens floats over it, locked on
// the word: it magnifies 1.6x about its own center with a slight barrel (an SVG displacement map, edges compressed),
// a keyline and a dark bezel; the text under it is sharp, the rest of the page is soft and dim. The lens follows the
// word with a 2 frame lag plus a small float, so the word drifts inside the glass and the lens keeps re-centering it.
// The lens sits on a live scope trace that rides under it. When the word passes the frame center (t 20) two coral
// packets run in along the trace and meet under the lens: the keyline flashes coral, one soft ring leaves the rim and a
// coral rule draws under the word on the page (seen magnified in the lens).
// Camera: one slow push 1.0 to 1.08 (eased, t -6 to 54) anchored on the frame center; 2.5D: the lens plane is nearer
// the camera than the page (it takes 1.3x the push and 1.3x the drift) and casts a soft shadow on the page.
// Safe zone (SAFE_IG, x 60..1000, y 270..1580): the masthead, the lens with its bezel and ring, and the packets stay
// inside at every t 0..60, including the end of the push. Timing at 24 fps: card t 0..9, push 9..14, full 14..48.
import React, { useId } from "react";
import { AbsoluteFill, interpolate, interpolateColors } from "remotion";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { ARTICLES, LOCK_WORD } from "../../data/facts";
import { CRT, MONO } from "../../kit";
import {
  CLAMP,
  EASE,
  H,
  UI,
  W,
  ez,
  lerp,
  type FxDef,
  type FxProps,
} from "../../theme";

const ARTICLE = ARTICLES[1];

// ---------------------------------------------------------------- page layout (world px on the page plane)
/** Base type: JetBrains Mono advances 0.6 em, so every character's x is known without measuring the DOM. */
const F = 48;
const CH = 0.6 * F;
const LH = Math.round(1.5 * F);
/** Characters per line. 37 puts "introduced by Anthropic as an open" on one line with the word in its middle. */
const COLS = 37;

const wrap = (text: string, cols: number) => {
  const out: string[] = [];
  let cur = "";
  for (const w of text.split(" ")) {
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= cols) cur += " " + w;
    else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out;
};
const LINES = wrap(ARTICLE.text, COLS);
const WORD_ROW = Math.max(
  0,
  LINES.findIndex((l) => l.includes(LOCK_WORD)),
);
const WORD_COL = Math.max(0, LINES[WORD_ROW].indexOf(LOCK_WORD));
/** Line left edge so the word's center lands on x = W / 2 when the page is not panned. */
const TEXT_LEFT = W / 2 - (WORD_COL + LOCK_WORD.length / 2) * CH;

/** The masthead (pinned) and the fade that takes the body text under it. */
const HEAD = {
  y: 364,
  size: 30,
  rule: 416,
  fadeA: 422,
  fadeB: 498,
  inset: 150,
};

// ---------------------------------------------------------------- motion (all pure functions of t)
/** The word crosses the frame center at T_C: the beat (packets meet, keyline flash, rule under the word). */
const T_C = 20;
const ANCHOR = { x: W / 2, y: H / 2 };
/** Scroll: one eased move across the whole effect; its midpoint is T_C, where the word is on the anchor's y. */
const SCROLL = { a: -18, b: 58, d: 480 };
const scrollP = (t: number) =>
  interpolate(t, [SCROLL.a, SCROLL.b], [0, 1], {
    ...CLAMP,
    easing: EASE.inOut,
  });
const wordY = (t: number) => ANCHOR.y + SCROLL.d / 2 - SCROLL.d * scrollP(t);
/** A slow sideways pan of the page (eased), so the lens tracks in x as well. */
const panX = (t: number) =>
  interpolate(t, [SCROLL.a, SCROLL.b], [26, -26], {
    ...CLAMP,
    easing: EASE.inOut,
  });

/** Camera push and drift. The page plane takes all of it, the lens plane LENS_K times it (nearer the camera). */
const zoomAt = (t: number) =>
  interpolate(t, [-6, 54], [1.0, 1.08], { ...CLAMP, easing: EASE.inOut });
const driftAt = (t: number) => ({
  x: 3 * Math.sin(t * 0.07 + 0.4),
  y: 2.5 * Math.sin(t * 0.055 + 1.3),
});
const LENS_K = 1.3;

/** Where the word's center lands on screen at t. */
const wordScreen = (t: number) => {
  const z = zoomAt(t);
  const d = driftAt(t);
  return {
    x: ANCHOR.x + panX(t) * z + d.x,
    y: ANCHOR.y + (wordY(t) - ANCHOR.y) * z + d.y,
  };
};

// ---------------------------------------------------------------- the lens
const MAG = 1.6;
/** Lens radius at zoom 1 (world px on the lens plane) and the bezel ring outside it. */
const R = 268;
const BEZEL = 10;
/** The lens follows the word this many frames late (it drifts to re-center the word). */
const LAG = 2;
const lensAt = (t: number) => {
  const p = wordScreen(t - LAG);
  const z = zoomAt(t);
  const zl = 1 + (z - 1) * LENS_K;
  const d = driftAt(t);
  // the lens plane rides the drift more than the page (parallax) and floats a little on its own
  const fx = (LENS_K - 1) * d.x + 3 * Math.sin(t * 0.13 + 0.8);
  const fy = (LENS_K - 1) * d.y + 2.5 * Math.sin(t * 0.11 + 2.0);
  return { x: p.x + fx, y: p.y + fy, r: R * zl };
};
/** Barrel strength: the rim samples this share of the radius further out (compressed edge, bulging center). */
const BARREL = 0.15;

// ---------------------------------------------------------------- the trace under the lens
const TRACE_GAP = 34;
const TRACE_INK = "rgba(243,241,236,0.6)";
const FLIGHT = 15;
const PACKET_SIGMA = 34;
const LAUNCH_DX = 320;
const flashAt = (t: number) =>
  interpolate(t, [T_C - 2, T_C, T_C + 13], [0, 1, 0], CLAMP);

const bumpsAt = (t: number, cx: number): ScopeBump[] => {
  const coral = PH.claudeRgb;
  const launch = T_C - FLIGHT;
  const out: ScopeBump[] = [];
  if (t > launch - 1 && t < T_C + 4) {
    const p = ez(t, launch, T_C, EASE.inOut);
    const env = interpolate(
      t,
      [launch, launch + 3, T_C - 1, T_C + 3],
      [0, 1, 1, 0],
      CLAMP,
    );
    out.push({
      x: lerp(cx - LAUNCH_DX, cx, p),
      amp: 18 * env,
      sigma: PACKET_SIGMA,
      rgb: coral,
    });
    out.push({
      x: lerp(cx + LAUNCH_DX, cx, p),
      amp: 18 * env,
      sigma: PACKET_SIGMA,
      rgb: coral,
    });
  }
  // the lens "reads" on the line: a quiet coral voice under it that speaks up on the beat
  const read =
    5 +
    1.6 * Math.sin(t * 0.31) +
    1.2 * Math.sin(t * 0.73 + 1) +
    13 * flashAt(t);
  out.push({ x: cx, amp: read, sigma: 96, rgb: coral });
  return out;
};

// ---------------------------------------------------------------- the page
const INK = "rgba(236,233,226,0.88)";
const SPLIT = "1px 0 0 rgba(255,70,50,0.42), -1px 0 0 rgba(60,150,255,0.42)";

/** The page body at t, scrolled and panned. `sharp` is the lens copy (brighter, split). */
const Page: React.FC<{ t: number; sharp: boolean }> = ({ t, sharp }) => {
  const y0 = wordY(t) - (WORD_ROW * LH + LH / 2);
  const x0 = TEXT_LEFT + panX(t);
  const mask = `linear-gradient(180deg, rgba(0,0,0,0) ${HEAD.fadeA}px, #000 ${HEAD.fadeB}px)`;
  const rule = ez(t, T_C - 1, T_C + 7, EASE.decel);
  const before = LINES[WORD_ROW].slice(0, WORD_COL);
  const after = LINES[WORD_ROW].slice(WORD_COL + LOCK_WORD.length);
  const lineStyle: React.CSSProperties = {
    position: "absolute",
    left: x0,
    height: LH,
    fontFamily: MONO,
    fontSize: F,
    lineHeight: `${LH}px`,
    fontWeight: 500,
    letterSpacing: 0,
    whiteSpace: "pre",
    color: sharp ? "rgba(243,241,236,0.97)" : INK,
    textShadow: sharp ? SPLIT : undefined,
  };
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {LINES.map((l, i) => {
          const y = y0 + i * LH;
          if (y < HEAD.fadeA - LH || y > H + 200) return null;
          if (i !== WORD_ROW) {
            return (
              <div key={i} style={{ ...lineStyle, top: y }}>
                {l}
              </div>
            );
          }
          return (
            <div key={i} style={{ ...lineStyle, top: y }}>
              {before}
              <span
                style={{
                  color: UI.coral,
                  fontWeight: 700,
                  position: "relative",
                }}
              >
                {LOCK_WORD}
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: LH * 0.86,
                    width: `${(100 * rule).toFixed(2)}%`,
                    height: 4,
                    background: UI.coral,
                    opacity: 0.95,
                  }}
                />
              </span>
              {after}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** The masthead stays pinned (reader view), sharp: source left, date right, a rule under them. */
const Masthead: React.FC = () => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: HEAD.inset,
        right: HEAD.inset,
        top: HEAD.y - HEAD.size / 2,
        display: "flex",
        justifyContent: "space-between",
        fontFamily: MONO,
        fontSize: HEAD.size,
        lineHeight: `${HEAD.size}px`,
        fontWeight: 500,
        color: "rgba(236,233,226,0.82)",
        whiteSpace: "nowrap",
      }}
    >
      <span>{ARTICLE.source}</span>
      <span>{ARTICLE.date}</span>
    </div>
    <div
      style={{
        position: "absolute",
        left: HEAD.inset,
        right: HEAD.inset,
        top: HEAD.rule,
        height: 2,
        background: "rgba(255,255,255,0.2)",
      }}
    />
  </AbsoluteFill>
);

/** The page plane under the camera (push about the anchor, drift). */
const pageCam = (t: number): React.CSSProperties => {
  const z = zoomAt(t);
  const d = driftAt(t);
  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: W,
    height: H,
    transformOrigin: `${ANCHOR.x}px ${ANCHOR.y}px`,
    transform: `translate(${d.x.toFixed(2)}px, ${d.y.toFixed(2)}px) scale(${z.toFixed(5)})`,
  };
};

// ---------------------------------------------------------------- the barrel (SVG displacement map, built per size)
const svgUri = (body: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 1 1" preserveAspectRatio="none">${body}</svg>`,
  )}`;
const RAMP_X = svgUri(
  `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient></defs><rect width="1" height="1" fill="url(#g)"/>`,
);
const RAMP_Y = svgUri(
  `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#0f0"/></linearGradient></defs><rect width="1" height="1" fill="url(#g)"/>`,
);
/** r squared, as gray, piecewise linear: 0 at the center, 1 at the rim and beyond. */
const R2_STOPS = [0, 0.2, 0.4, 0.6, 0.8, 1].map((o) => {
  const v = Math.round(255 * o * o);
  return `<stop offset="${o}" stop-color="rgb(${v},${v},${v})"/>`;
});
const RAMP_R2 = svgUri(
  `<defs><radialGradient id="g" cx="0.5" cy="0.5" r="0.5">${R2_STOPS.join("")}</radialGradient></defs><rect width="1" height="1" fill="url(#g)"/>`,
);

const BarrelFilter: React.FC<{ id: string; size: number }> = ({ id, size }) => {
  const s = size.toFixed(1);
  // displacement = scale * r^2 * (ramp - 0.5): 0 at the center, scale / 2 = BARREL * radius outward at the rim
  const scale = BARREL * size;
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter
          id={id}
          x="0"
          y="0"
          width={s}
          height={s}
          filterUnits="userSpaceOnUse"
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={RAMP_X}
            x="0"
            y="0"
            width={s}
            height={s}
            preserveAspectRatio="none"
            result="rx"
          />
          <feImage
            href={RAMP_Y}
            x="0"
            y="0"
            width={s}
            height={s}
            preserveAspectRatio="none"
            result="ry"
          />
          <feComposite
            in="rx"
            in2="ry"
            operator="arithmetic"
            k1={0}
            k2={1}
            k3={1}
            k4={0}
            result="ramp"
          />
          <feImage
            href={RAMP_R2}
            x="0"
            y="0"
            width={s}
            height={s}
            preserveAspectRatio="none"
            result="r2"
          />
          <feComposite
            in="ramp"
            in2="r2"
            operator="arithmetic"
            k1={1}
            k2={0}
            k3={-0.5}
            k4={0.5}
            result="map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={scale.toFixed(2)}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
};

// ---------------------------------------------------------------- the scene
export const Magnifier: React.FC<FxProps> = ({ t }) => {
  // one filter per mounted lens: the ending grid shows several lenses of different sizes at once
  const filterId = `magnifier-barrel-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const L = lensAt(t);
  const size = 2 * L.r;
  const flash = flashAt(t);
  // the lens racks into focus as the card resolves
  const focus = interpolate(t, [-4, 7], [2.6, 0], {
    ...CLAMP,
    easing: EASE.enter,
  });
  const traceY = L.y + L.r + BEZEL + TRACE_GAP;
  const ringK = (t - T_C) / 16;
  // the ring fades in over its first frames (enter curve), then fades out as it grows
  const ringIn = ez(t, T_C, T_C + 3, EASE.enter);
  const key = interpolateColors(
    flash,
    [0, 1],
    ["rgba(243,241,236,0.58)", "rgba(217,119,87,0.98)"],
  );
  return (
    <CRT>
      <AbsoluteFill style={{ background: UI.screen, overflow: "hidden" }}>
        {/* the page, soft: everything not under the lens */}
        <div style={{ ...pageCam(t), filter: "blur(4.2px)", opacity: 0.5 }}>
          <Page t={t} sharp={false} />
        </div>
        <div style={pageCam(t)}>
          <Masthead />
        </div>
        {/* the lens' shadow on the page (it floats nearer the camera) */}
        <div
          style={{
            position: "absolute",
            left: L.x - L.r * 1.18,
            top: L.y - L.r * 1.18 + 26,
            width: L.r * 2.36,
            height: L.r * 2.36,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,0,0,0.7) 52%, rgba(0,0,0,0) 72%)",
          }}
        />
        {/* the trace the lens sits on */}
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          <Scope
            frame={t}
            x0={-80}
            x1={W + 80}
            y={traceY}
            bumps={bumpsAt(t, L.x)}
            hum={1.4}
            stroke={3}
            color={TRACE_INK}
          />
        </svg>
        {/* bezel */}
        <div
          style={{
            position: "absolute",
            left: L.x - L.r - BEZEL,
            top: L.y - L.r - BEZEL,
            width: size + 2 * BEZEL,
            height: size + 2 * BEZEL,
            borderRadius: "50%",
            background: "#08090C",
            boxShadow:
              "inset 0 0 0 1.5px rgba(255,255,255,0.16), 0 18px 40px rgba(0,0,0,0.55)",
          }}
        />
        {/* the glass: the page again, sharp, 1.6x about the lens center, bent by the barrel */}
        <div
          style={{
            position: "absolute",
            left: L.x - L.r,
            top: L.y - L.r,
            width: size,
            height: size,
            borderRadius: "50%",
            overflow: "hidden",
            background: UI.screen,
          }}
        >
          <BarrelFilter id={filterId} size={size} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: size,
              height: size,
              filter: `url(#${filterId})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -(L.x - L.r),
                top: -(L.y - L.r),
                width: W,
                height: H,
                transformOrigin: `${L.x.toFixed(2)}px ${L.y.toFixed(2)}px`,
                transform: `scale(${MAG})`,
                filter:
                  focus > 0.02 ? `blur(${focus.toFixed(2)}px)` : undefined,
              }}
            >
              <div style={pageCam(t)}>
                <Page t={t} sharp />
              </div>
            </div>
          </div>
          {/* tube surface: rolling scanlines, a refresh band, the curved glass darkening at the rim */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 4px)",
              backgroundPosition: `0 ${(t % 4).toFixed(0)}px`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${(((t * 5) % 170) - 45).toFixed(1)}%`,
              height: "30%",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0,0,0,0) 62%, rgba(0,0,0,0.5) 100%)",
            }}
          />
        </div>
        {/* keyline (flashes coral on the beat) */}
        <div
          style={{
            position: "absolute",
            left: L.x - L.r,
            top: L.y - L.r,
            width: size,
            height: size,
            borderRadius: "50%",
            boxShadow: `inset 0 0 0 ${(2.5 + 1.5 * flash).toFixed(2)}px ${key}`,
          }}
        />
        {/* one soft ring leaves the rim as the packets meet */}
        {ringK > 0 && ringK < 1 ? (
          <div
            style={{
              position: "absolute",
              left: L.x - L.r - BEZEL - 14 * EASE.decel(ringK),
              top: L.y - L.r - BEZEL - 14 * EASE.decel(ringK),
              width: size + 2 * (BEZEL + 14 * EASE.decel(ringK)),
              height: size + 2 * (BEZEL + 14 * EASE.decel(ringK)),
              boxSizing: "border-box",
              borderRadius: "50%",
              border: `2.5px solid rgba(${PH.claudeRgb},${(0.7 * ringIn * (1 - ringK)).toFixed(3)})`,
            }}
          />
        ) : null}
      </AbsoluteFill>
    </CRT>
  );
};

export const magnifier: FxDef = {
  id: "magnifier",
  command: "/magnifier",
  menu: "A CRT lens locked on the word that matters",
  clip: "learn",
  Comp: Magnifier,
  thumbT: [8, 21, 36],
};
