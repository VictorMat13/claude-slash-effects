// /screen-push: split frame. Top half is a CRT screen in 2.5D: far back, the real Resolve 21 Edit page (press shot,
// pushed in on the media pool and viewers, blurred by distance, slow eased pan); then the grid; then the open-top box
// (the timeline, real Resolve track names V2, V1, A1 down its left side) sitting on the live scope trace. Coral
// particles stream from the top edge on four deterministic bezier lanes and land, eased, in neat hex rows, bottom up.
// Victor's voice is the green wave on the trace left of the box (green packets run into the box on each of his word
// groups); Claude's coral wave on the right breathes with the pour, and a coral packet leaves the box each time a
// track fills. His spoken words sit under the trace in coral mono.
// One camera: close on the stream entering the box, hold while rows pack, pull out to the whole screen.
// Bottom half is Victor's clip "pull". Everything is a pure function of t.
// IG safe zone (Victor, 2026-10-25 22:00): the box, beads, labels, scope packets and words stay inside SAFE_IG
// (x 100..980, y 290..960 above the split) at every t, including the camera travel and drift. The beads still pour in
// from above but fade in across the safe top edge; the grid, the far plate and the white trace bleed to the frame edge.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Scope, type ScopeBump } from "../../artcraft/kit/Scope";
import { PH } from "../../artcraft/theme";
import { CLIPS } from "../data/clips";
import { SHOTS, TRACKS } from "../data/facts";
import { CRT, MONO } from "../kit";
import { CLAMP, EASE, FPS, SAFE_IG, UI, W, ez, lerp, type FxDef, type FxProps } from "../theme";
import { GridLayer, LowerClip, Plate, SPLIT, TRACE_INK, camAt, layerStyle, toScreen, voiceEnv, type CamKeys } from "./shutterstrike";

/** Open-top box (the timeline), outline 3 px, 540 x 400. It sits on the scope trace. */
const BOX = { l: 270, r: 810, t: 340, b: 740 } as const;
const STROKE = 3;
const TRACE_Y = BOX.b + 2;

/** Hex rows: pitch 30 px, rows alternate 17 and 16 columns, 13 rows (85% of the box), bottom up. */
const PITCH = 30;
const DOT = 11.5;
const ROW_H = PITCH * 0.866;
const ROWS = 13;
const BOTTOM_Y = BOX.b - STROKE / 2 - 13;
const SHADES = ["#D97757", "#C2613F", "#A64A2C"] as const;

/** Four lanes: each leaves the top edge at SRC and enters the box above its band at MOUTH, then fans to its slots. */
const SRC = [492, 524, 556, 588];
const MOUTH = [337.5, 472.5, 607.5, 742.5];
const LANE_TOP = -70;
/** Inside a row each lane lands its slots evenly over the row's time, offset by its phase, so the lanes alternate and
 *  no lane ever fires two beads back to back. */
const PHASE = [0.125, 0.625, 0.375, 0.875];
/** Rhythm (24 fps): each lane passes one bead through the box mouth about every frame, from M_FIRST to M_LAST, so the
 *  beads in a lane sit ~46 px apart. Every bead has the same motion relative to its own landing: it cruises down its
 *  lane at CRUISE px per frame, then lands with an eased (decelerating) hop over the last LAND frames. */
const M_FIRST = -21;
const M_LAST = 33.5;
const CRUISE = 46;
const LAND = 4;
const LAND_D = (CRUISE * LAND) / 2;
/** Path length still to go, tau frames before landing, and its inverse. */
const remaining = (tau: number) => (tau <= 0 ? 0 : tau < LAND ? (CRUISE * tau * tau) / (2 * LAND) : LAND_D + CRUISE * (tau - LAND));
const tauOf = (rest: number) => (rest <= LAND_D ? Math.sqrt((2 * LAND * rest) / CRUISE) : LAND + (rest - LAND_D) / CRUISE);
const FALL_N = 28;

type Pt = { x: number; y: number };
type Lander = { x: number; y: number; row: number; fill: string; s: number; T: number; pts: Pt[]; cum: number[] };

const bez = (c: Pt[], u: number): Pt => {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const d = 3 * v * u * u;
  const e = u * u * u;
  return { x: a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x, y: a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y };
};
/** A lane's path to one slot: a curve from the top edge into the box mouth (vertical there), straight down the lane's
 *  column, then a short hop that crosses over the row above its landed neighbours and drops into the slot.
 *  Sampled, with an arc-length table so the stream keeps even spacing. */
const lanePath = (band: number, slot: Pt): Pt[] => {
  const m = { x: MOUTH[band], y: BOX.t - 10 };
  const fall: Pt[] = [{ x: SRC[band], y: LANE_TOP }, { x: SRC[band], y: 110 }, { x: m.x, y: BOX.t - 150 }, m];
  const yh = Math.max(m.y + 6, slot.y - 70);
  const hop: Pt[] = [{ x: m.x, y: yh }, { x: m.x, y: slot.y - 30 }, { x: slot.x, y: slot.y - 40 }, slot];
  const pts: Pt[] = [];
  for (let i = 0; i <= FALL_N; i++) pts.push(bez(fall, i / FALL_N));
  for (let i = 1; i <= 8; i++) pts.push({ x: m.x, y: lerp(m.y, yh, i / 8) });
  for (let i = 1; i <= 16; i++) pts.push(bez(hop, i / 16));
  return pts;
};

const LANDERS: Lander[] = (() => {
  const order: { x: number; y: number; row: number; col: number; band: number; tau: number }[] = [];
  for (let row = 0; row < ROWS; row++) {
    const cols = row % 2 === 0 ? 17 : 16;
    const bands: { x: number; col: number }[][] = [[], [], [], []];
    for (let c = 0; c < cols; c++) {
      const x = 540 + (c - (cols - 1) / 2) * PITCH;
      let b = 0;
      for (let k = 1; k < 4; k++) if (Math.abs(x - MOUTH[k]) < Math.abs(x - MOUTH[b])) b = k;
      bands[b].push({ x, col: c });
    }
    // Inside each band, the slot under the lane fills first, then outward (left before right).
    for (let b = 0; b < 4; b++) bands[b].sort((p, q) => Math.abs(p.x - MOUTH[b]) - Math.abs(q.x - MOUTH[b]) || p.x - q.x);
    for (let b = 0; b < 4; b++)
      bands[b].forEach((sl, i) =>
        order.push({ x: sl.x, y: BOTTOM_Y - row * ROW_H, row, col: sl.col, band: b, tau: (row + (i + PHASE[b]) / bands[b].length) / ROWS }),
      );
  }
  return order.map((o) => {
    const pts = lanePath(o.band, { x: o.x, y: o.y });
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const len = cum[cum.length - 1];
    // Through the mouth on the lane's rhythm, landing when the rest of its own path is done.
    const T = M_FIRST + (M_LAST - M_FIRST) * Math.pow(o.tau, 1.12) + tauOf(len - cum[FALL_N]);
    return { x: o.x, y: o.y, row: o.row, fill: SHADES[(o.col + 2 * o.row) % 3], s: T - tauOf(len), T, pts, cum };
  });
})();

/** Where a bead is when it still has `rest` px of its path to go. */
const along = (l: Lander, rest: number): Pt => {
  const last = l.pts.length - 1;
  const target = Math.max(0, l.cum[last] - rest);
  let i = 1;
  while (i < last && l.cum[i] < target) i++;
  const a = l.cum[i - 1];
  const b = l.cum[i];
  const f = b > a ? Math.min(1, (target - a) / (b - a)) : 0;
  return { x: lerp(l.pts[i - 1].x, l.pts[i].x, f), y: lerp(l.pts[i - 1].y, l.pts[i].y, f) };
};

/** When each track band is full (rows 0-4 A1, 5-9 V1, 10-12 V2): a coral packet leaves the box then. */
const BAND_DONE = [4, 9, 12].map((r) => Math.max(...LANDERS.filter((l) => l.row <= r).map((l) => l.T)));
const T_LAST = Math.max(...LANDERS.map((l) => l.T));
/** Start of each 3-word group he says (same grouping as the words under the box): a green packet runs into the box. */
const GROUPS = (() => {
  const w = CLIPS.pull.words;
  const g: { s: number; text: string }[] = [];
  for (let i = 0; i < w.length; i += 3) g.push({ s: w[i].s, text: w.slice(i, i + 3).map((x) => x.w).join(" ") });
  return g;
})();
/** Victor's voice left of the box and Claude's wave right of it, both close enough that their colored packets
 *  (2.6 sigma either side) stay inside the safe width with the box (safe zone: were 125 and 958, sigma 30 and 40). */
const VOICE_X = BOX.l - 62;
const CLAUDE_X = BOX.r + 62;
const SIG_VOICE = 24;
const SIG_CLAUDE = 24;

const packet = (t: number, a: number, len: number, x0: number, x1: number, amp: number, sigma: number, rgb: string): ScopeBump | null => {
  if (t < a - 1 || t > a + len + 3) return null;
  const u = ez(t, a, a + len, EASE.travel);
  const env = interpolate(t, [a - 1, a + 2, a + len - 1, a + len + 3], [0, 1, 1, 0], CLAMP);
  return { x: lerp(x0, x1, u), amp: amp * env, sigma, rgb };
};

const bumpsAt = (t: number): ScopeBump[] => {
  const b: ScopeBump[] = [];
  // Victor talks (real word timings of "pull").
  b.push({ x: VOICE_X, amp: voiceEnv("pull", t) * (14 + 5 * Math.sin(t * 0.61) + 3 * Math.sin(t * 1.37)), sigma: SIG_VOICE, rgb: PH.userRgb });
  // Claude works while the pour runs, then settles to a calm breath.
  const work = interpolate(t, [T_LAST - 6, T_LAST + 6], [1, 0.35], CLAMP);
  b.push({ x: CLAUDE_X, amp: work * (13 + 4 * Math.sin(t * 0.37) + 2.5 * Math.sin(t * 0.91)), sigma: SIG_CLAUDE, rgb: PH.claudeRgb });
  for (const g of GROUPS) {
    const p = packet(t, g.s * FPS, 8, VOICE_X + 10, BOX.l - 4, 18, 22, PH.userRgb);
    if (p) b.push(p);
  }
  // A full track sends a packet out of the box into Claude's wave (it used to run off the frame edge).
  for (const d of BAND_DONE) {
    const p = packet(t, d, 10, BOX.r + 6, CLAUDE_X, 22, 22, PH.claudeRgb);
    if (p) b.push(p);
  }
  return b;
};

/** His words under the trace, the 3-word group being spoken at t, coral mono. Groups cross-fade (eased, 4 frames). */
const Words: React.FC<{ t: number; y: number }> = ({ t, y }) => {
  const sec = t / FPS;
  let gi = -1;
  for (let i = 0; i < GROUPS.length; i++) if (sec >= GROUPS[i].s) gi = i;
  if (gi < 0) return null;
  const inF = (sec - GROUPS[gi].s) * FPS;
  const show = (text: string, op: number, dy: number, key: string) => (
    <div key={key} style={{ position: "absolute", left: 0, right: 0, top: y + dy, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 56, lineHeight: 1.15, color: UI.coral, letterSpacing: -0.5, whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
  const inP = ez(inF, 0, 5, EASE.enter);
  const outP = ez(inF, 0, 4, EASE.decel);
  return (
    <>
      {gi > 0 && outP < 1 ? show(GROUPS[gi - 1].text, 1 - outP, -10 * outP, "prev") : null}
      {show(GROUPS[gi].text, inP, 12 * (1 - inP), "cur")}
    </>
  );
};

// Hold close on the stream entering the box, pull out and tilt up 12 to 26 (the reveal), settle with a slow push.
// Same keys and timing as before; values reframed so the box, both side packets and the words fit SAFE_IG at every t
// (Claude's wave is up from t 0, his words from t 7.6), so the hold is 1.07, not 1.4.
const CAM: CamKeys = {
  t: [0, 12, 26, 48],
  x: [542, 541, 540, 540],
  y: [413, 415, 452, 450],
  z: [1.07, 1.065, 0.968, 0.985],
};
/** Falling beads fade in across the safe top edge (screen px): invisible at FADE[0], full at FADE[1]. */
const FADE = [SAFE_IG.y0 + 14, SAFE_IG.y0 + 70];
const LABEL_Y = [BOX.t + 66.7, BOX.t + 200, BOX.t + 333.3];
const LABEL_AT = [18, 21, 24];

export const ScreenPush: React.FC<FxProps> = ({ t }) => {
  const cam = camAt(t, CAM);
  const pan = ez(t, 0, 52, EASE.inOut);
  const landed: Lander[] = [];
  const falling: { x: number; y: number; fill: string; key: number; op: number }[] = [];
  LANDERS.forEach((l, j) => {
    if (t >= l.T) landed.push(l);
    else if (t >= l.s) {
      const p = along(l, remaining(l.T - t));
      const op = interpolate(toScreen(cam, 1, p).y, FADE, [0, 1], { ...CLAMP, easing: EASE.inOut });
      if (op > 0) falling.push({ x: p.x, y: p.y, fill: l.fill, key: j, op });
    }
  });
  const bumps = bumpsAt(t);
  const edge = 0.92 + 0.08 * Math.sin(t * 0.22);
  return (
    <AbsoluteFill style={{ background: UI.screen, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: SPLIT, overflow: "hidden" }}>
        <CRT>
          <AbsoluteFill style={{ background: UI.screen }}>
            {/* Far plate: the real Edit page, pushed in on the media pool and viewers, the timeline behind the box. */}
            <Plate cam={cam} k={0.6} src={SHOTS.edit} nw={5120} nh={2880} scale={0.42} x={-190 - 120 * pan} y={-90 - 16 * pan} blur={5} bright={0.5} tilt={5} />
            <GridLayer cam={cam} k={0.82} t={t} />
            <div style={layerStyle(cam, 1)}>
              <svg width={W} height={SPLIT} viewBox={`0 0 ${W} ${SPLIT}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                <Scope frame={t} x0={-120} x1={W + 120} y={TRACE_Y} bumps={bumps} hum={1.5} stroke={3} color={TRACE_INK} />
                <rect x={BOX.l} y={BOX.t} width={BOX.r - BOX.l} height={BOX.b - BOX.t} fill={PH.panel} fillOpacity={0.9} />
                {[BOX.t + 133.3, BOX.t + 266.7].map((y) => (
                  <line key={y} x1={BOX.l + 10} x2={BOX.r - 10} y1={y} y2={y} stroke={UI.screenInk} strokeOpacity={0.22} strokeWidth={2} strokeDasharray="8 10" />
                ))}
                {landed.map((l, i) => (
                  <circle key={`l${i}`} cx={l.x} cy={l.y} r={DOT} fill={l.fill} />
                ))}
                <path
                  d={`M ${BOX.l} ${BOX.t} L ${BOX.l} ${BOX.b} L ${BOX.r} ${BOX.b} L ${BOX.r} ${BOX.t}`}
                  fill="none"
                  stroke={UI.screenInk}
                  strokeWidth={STROKE}
                  strokeOpacity={edge}
                  strokeLinejoin="miter"
                />
                {falling.map((d) => (
                  <circle key={`f${d.key}`} cx={d.x} cy={d.y} r={DOT} fill={d.fill} opacity={d.op} />
                ))}
              </svg>
              {TRACKS.map((name, i) => {
                const p = ez(t, LABEL_AT[i], LABEL_AT[i] + 8, EASE.enter);
                return (
                  <div
                    key={name}
                    style={{
                      position: "absolute",
                      left: BOX.l - 26 - 120,
                      width: 120,
                      top: LABEL_Y[i] - 22,
                      height: 44,
                      textAlign: "right",
                      fontFamily: MONO,
                      fontWeight: 500,
                      fontSize: 34,
                      lineHeight: "44px",
                      color: UI.screenInk,
                      opacity: p,
                      transform: `translateX(${(-14 * (1 - p)).toFixed(2)}px)`,
                    }}
                  >
                    {name}
                  </div>
                );
              })}
              {/* a soft dark scrim so the coral words read over the timeline in the far plate */}
              <div
                style={{
                  position: "absolute",
                  left: 120,
                  width: W - 240,
                  top: TRACE_Y + 14,
                  height: 104,
                  background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(16,18,23,0.94) 62%, rgba(16,18,23,0) 100%)",
                }}
              />
              <Words t={t} y={TRACE_Y + 32} />
            </div>
          </AbsoluteFill>
        </CRT>
      </div>
      <LowerClip name="pull" t={t} s={1.0} tx={0} ty={-440} />
    </AbsoluteFill>
  );
};

export const screenpush: FxDef = {
  id: "screenpush",
  command: "/screen-push",
  menu: "Particles pour in, the screen pushes through",
  clip: "pull",
  Comp: ScreenPush,
  thumbT: [8, 26, 40],
};
