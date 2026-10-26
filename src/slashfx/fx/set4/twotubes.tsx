// /two-tubes (set 4, builder FX-A; dispatch/VIDEO4.md). Victor full frame (clip "prompt": "So if you prompt something
// like,"). Two small see-through CRT tubes sit side by side above his head (y 300..520 at rest), labeled in mono with
// ASSISTANTS[0] ("Claude") and ASSISTANTS[2] ("ChatGPT Codex"), verbatim from facts.ts. One live scope trace runs under
// both tubes and joins them; his voice is the wave in the middle of it, right above his head. The JOBS list (verbatim)
// is dealt from there in order, alternating tubes: each job leaves the middle of the trace as a packet (coral into the
// Claude tube on the left, green into the Codex tube on the right), and when it arrives under its tube the tube's
// keyline flashes in that color and the job types in (the job before it slides up under the header and fades).
// Packets land on his word onsets ("So", "prompt", "something", "like,") and keep the same rhythm after his line ends.
// Camera (one keyframe timeline, anchored on the tubes): tight on the tubes (overlay plane 1.15, his footage 1.07),
// hold, then pull out (t 11 to 29) to the rest framing (overlay 1.0, footage 1.016), hold and breathe. 2.5D: the
// tubes are nearer the lens than his face (the overlay takes the larger zoom and 1.25x the drift), each tube is turned
// a few degrees toward the middle, and they float out of phase. His footage never goes past 1.07.
// Caption: his words, white, under his chin. Safe zone (SAFE_IG, x 60..1000, y 270..1580): tubes, labels, logs,
// packets and caption stay inside at every t 0..60, including the tight opening (zoom 1.15 is the widest frame).
// His face is never covered: the tubes end above his hairline (they cross only the top of his hair).
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors } from "remotion";
import { Scope, type ScopeBump } from "../../../artcraft/kit/Scope";
import { PH } from "../../../artcraft/theme";
import { CLIPS } from "../../data/clips";
import { ASSISTANTS, JOBS } from "../../data/facts";
import { Caption, Clip, MONO } from "../../kit";
import {
  CLAMP,
  EASE,
  FPS,
  H,
  SAFE_IG,
  UI,
  W,
  ez,
  type FxDef,
  type FxProps,
} from "../../theme";
import { voiceEnv } from "../shutterstrike";

// ---------------------------------------------------------------- camera: one keyframe timeline, hold, pull out, hold
const ANCHOR = { x: W / 2, y: 430 };
const KEY_T = [0, 11, 29, 48];
const key = (t: number, v: number[]) =>
  interpolate(t, KEY_T, v, { ...CLAMP, easing: EASE.travel });
/** The tubes' plane (nearer the lens) and his footage (farther): the footage never passes 1.07. */
const Z_OVER = [1.15, 1.144, 1.0, 0.994];
const Z_FOOT = [1.07, 1.068, 1.016, 1.014];
/** Drift (px). At zoom 1.014 the footage overscans at least 6 px on every side of the anchor, so no edge shows. */
const driftAt = (t: number) => ({
  x: 3.5 * Math.sin(t * 0.075 + 0.3),
  y: 2.5 * Math.sin(t * 0.06 + 1.2),
});
const NEAR = 1.25;

// ---------------------------------------------------------------- tubes (world px on the overlay plane, at zoom 1)
const TUBE = { w: 368, h: 220, top: 300, gap: 34, r: 26 } as const;
const PAD = 18;
const HEADER_H = 56;
const BODY_TOP = HEADER_H + 6;
const BODY_H = TUBE.h - BODY_TOP - 10;
const BODY_W = TUBE.w - 2 * PAD;
const CARET_W = 16;
const TEXT = 34;
const LINE = 40;
/** Space between the outgoing job and the incoming one during a hand-off. */
const HANDOFF = 14;
const CHARS = Math.floor((TUBE.w - 2 * PAD) / (0.6 * TEXT));
type Side = 0 | 1;
const tubeCx = (s: Side) =>
  s === 0
    ? W / 2 - TUBE.gap / 2 - TUBE.w / 2
    : W / 2 + TUBE.gap / 2 + TUBE.w / 2;
const RGB = [PH.claudeRgb, PH.userRgb] as const;
const LABEL = [ASSISTANTS[0], ASSISTANTS[2]] as const;
/** The trace runs under both tubes. */
const TRACE_Y = TUBE.top + TUBE.h + 28;
const MID_X = W / 2;

// ---------------------------------------------------------------- the jobs: dealt in order, alternating tubes
const onset = (w: string) => {
  const hit = CLIPS.prompt.words.find((x) => x.w === w);
  return hit ? hit.s * FPS : 0;
};
/** Arrival frames: his word onsets, then the same rhythm after his line. */
const ARRIVE = [
  1,
  onset("So"),
  onset("prompt"),
  onset("something"),
  onset("like,"),
  31,
  37,
];
const FLIGHT = 9;

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
type Job = {
  text: string;
  lines: string[];
  side: Side;
  at: number;
  dur: number;
  h: number;
};
const JOB_LIST: Job[] = JOBS.slice(0, ARRIVE.length).map((text, i) => {
  const lines = wrap(text, CHARS);
  return {
    text,
    lines,
    side: (i % 2) as Side,
    at: ARRIVE[i],
    dur: Math.min(11, Math.max(5, text.length / 3.2)),
    h: lines.length * LINE,
  };
});
const jobsOf = (s: Side) => JOB_LIST.filter((j) => j.side === s);

// ---------------------------------------------------------------- one tube
const SPLIT = "1px 0 0 rgba(255,70,50,0.42), -1px 0 0 rgba(60,150,255,0.42)";

/** The tube's screen: the current job types in at the top; when the next one arrives both scroll up in one eased move
 *  (the old job slides under the header and fades, the new one rises into its place). A caret waits before the first job. */
const TubeLog: React.FC<{ s: Side; t: number }> = ({ s, t }) => {
  const jobs = jobsOf(s);
  const caretOn = Math.floor(t / 6) % 2 === 0;
  const fade = "linear-gradient(180deg, rgba(0,0,0,0) 0px, #000 16px)";
  const caretBox = (key: string, left: number, top: number) => (
    <span
      key={key}
      style={{
        position: "absolute",
        left,
        top,
        width: CARET_W,
        height: TEXT * 0.92,
        background: `rgb(${RGB[s]})`,
        opacity: 0.92,
      }}
    />
  );
  const first = jobs[0];
  return (
    <div
      style={{
        position: "absolute",
        left: PAD,
        right: PAD,
        top: BODY_TOP,
        height: BODY_H,
        overflow: "hidden",
        maskImage: fade,
        WebkitMaskImage: fade,
      }}
    >
      {first && t < first.at - 2 && caretOn
        ? caretBox("idle", 0, (LINE - TEXT * 0.92) / 2 + 2)
        : null}
      {jobs.map((j, k) => {
        const next = jobs[k + 1];
        if (t < j.at - 3) return null;
        const out = next ? ez(t, next.at - 3, next.at + 4, EASE.travel) : 0;
        if (out >= 1) return null;
        // one scroll per hand-off: the job before slides up out of the body while this one rises into its place
        const prev = jobs[k - 1];
        const up = ez(t, j.at - 3, j.at + 4, EASE.travel);
        const inP = prev
          ? interpolate(up, [0, 0.6], [0, 1], CLAMP)
          : ez(t, j.at - 3, j.at + 2, EASE.enter);
        const y =
          (prev ? (prev.h + HANDOFF) * (1 - up) : 22 * (1 - inP)) -
          (j.h + HANDOFF) * out;
        const p = ez(t, j.at, j.at + j.dur, EASE.inOut);
        const typed = Math.round(j.text.length * p);
        // characters shown per line (lines were split on spaces, so each break eats one typed character)
        let rest = typed;
        const shown = j.lines.map((l) => {
          const n = Math.max(0, Math.min(l.length, rest));
          rest -= l.length + 1;
          return l.slice(0, n);
        });
        const open = shown.findIndex((x, li) => x.length < j.lines[li].length);
        const at = open < 0 ? j.lines.length - 1 : open;
        // the caret sits after the last typed character; hidden when the line is full (it would not fit the body)
        const caretX = shown[at].length * 0.6 * TEXT + 3;
        const caret =
          out === 0 && (p < 1 || caretOn) && caretX + CARET_W <= BODY_W;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: y,
              height: j.h,
              opacity: inP * (1 - out),
            }}
          >
            {j.lines.map((l, li) => (
              <div
                key={li}
                style={{
                  position: "absolute",
                  left: 0,
                  top: li * LINE,
                  height: LINE,
                  fontFamily: MONO,
                  fontSize: TEXT,
                  lineHeight: `${LINE}px`,
                  fontWeight: 500,
                  whiteSpace: "pre",
                  color: UI.screenInk,
                  textShadow: SPLIT,
                }}
              >
                {shown[li]}
              </div>
            ))}
            {caret
              ? caretBox("c", caretX, at * LINE + (LINE - TEXT * 0.92) / 2 + 2)
              : null}
          </div>
        );
      })}
    </div>
  );
};

const Tube: React.FC<{ s: Side; t: number }> = ({ s, t }) => {
  const cx = tubeCx(s);
  const jobs = jobsOf(s);
  const flash = Math.max(
    0,
    ...jobs.map((j) =>
      interpolate(t, [j.at - 2, j.at, j.at + 11], [0, 1, 0], CLAMP),
    ),
  );
  const keyline = interpolateColors(
    flash,
    [0, 1],
    ["rgba(243,241,236,0.3)", `rgba(${RGB[s]},0.95)`],
  );
  // turned a few degrees toward the middle, floating out of phase with the other tube
  const ry = s === 0 ? 5 : -5;
  const fy = 2.5 * Math.sin(t * 0.12 + (s === 0 ? 0.2 : 2.4));
  return (
    <div
      style={{
        position: "absolute",
        left: cx - TUBE.w / 2,
        top: TUBE.top,
        width: TUBE.w,
        height: TUBE.h,
        transform: `translateY(${fy.toFixed(2)}px) perspective(1300px) rotateY(${ry}deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: TUBE.r,
          overflow: "hidden",
          background: "rgba(10,12,16,0.6)",
          backdropFilter: "blur(6px) saturate(0.85)",
          WebkitBackdropFilter: "blur(6px) saturate(0.85)",
          boxShadow: `inset 0 0 0 ${(1.6 + 1.4 * flash).toFixed(2)}px ${keyline}, inset 0 0 30px rgba(0,0,0,0.45), 0 16px 34px rgba(0,0,0,0.38)`,
        }}
      >
        {/* header: the assistant's name, verbatim, with a dot in its packet color */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            right: PAD,
            top: 0,
            height: HEADER_H,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: `rgb(${RGB[s]})`,
              opacity: 0.75 + 0.25 * flash,
              flex: "none",
            }}
          />
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 28,
              lineHeight: "28px",
              color: UI.screenInk,
              whiteSpace: "nowrap",
              textShadow: SPLIT,
            }}
          >
            {LABEL[s]}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: PAD,
            right: PAD,
            top: HEADER_H,
            height: 1.5,
            background: "rgba(243,241,236,0.16)",
          }}
        />
        <TubeLog s={s} t={t} />
        {/* tube surface: rolling scanlines, a refresh band, darker curved corners */}
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
            top: `${(((t * 6 + s * 80) % 170) - 45).toFixed(1)}%`,
            height: "32%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 72% 70% at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.32) 100%)",
          }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- the trace: his voice in the middle, packets out to the tubes
const bumpsAt = (t: number): ScopeBump[] => {
  const out: ScopeBump[] = [];
  for (const j of JOB_LIST) {
    const t0 = j.at - FLIGHT;
    if (t < t0 - 1 || t > j.at + 4) continue;
    const p = ez(t, t0, j.at, EASE.inOut);
    const env = interpolate(
      t,
      [t0, t0 + 3, j.at - 1, j.at + 4],
      [0, 1, 1, 0],
      CLAMP,
    );
    out.push({
      x: MID_X + (tubeCx(j.side) - MID_X) * p,
      amp: 17 * env,
      sigma: 28,
      rgb: RGB[j.side],
    });
  }
  // each tube speaks up on the line while its job types
  ([0, 1] as Side[]).forEach((s) => {
    const talk = Math.max(
      0,
      ...jobsOf(s).map((j) =>
        interpolate(
          t,
          [j.at - 1, j.at + 1, j.at + j.dur, j.at + j.dur + 4],
          [0, 1, 1, 0],
          CLAMP,
        ),
      ),
    );
    out.push({
      x: tubeCx(s),
      amp: 3 + 1.2 * Math.sin(t * 0.27 + s * 2) + 8 * talk,
      sigma: 44,
      rgb: RGB[s],
    });
  });
  // his voice, right above his head: the source of every job
  const v = voiceEnv("prompt", t);
  out.push({
    x: MID_X,
    amp: 3 + v * (11 + 3 * Math.sin(t * 0.9)),
    sigma: 40,
    rgb: "243,241,236",
  });
  return out;
};

// ---------------------------------------------------------------- the scene
/** His words under his chin (chin about y 1100 at rest, up to 1150 at the tight opening). */
const CAPTION_Y = 1192;

export const TwoTubes: React.FC<FxProps> = ({ t }) => {
  const zo = key(t, Z_OVER);
  const zf = key(t, Z_FOOT);
  const d = driftAt(t);
  const cam = (z: number, k: number) =>
    `translate(${(d.x * k).toFixed(2)}px, ${(d.y * k).toFixed(2)}px) scale(${z.toFixed(5)})`;
  return (
    <AbsoluteFill style={{ background: UI.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: cam(zf, 1),
          transformOrigin: `${ANCHOR.x}px ${ANCHOR.y}px`,
        }}
      >
        <Clip name="prompt" />
      </AbsoluteFill>
      {/* a soft darkening at the top so the dark glass reads against the window */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.12) 30%, rgba(0,0,0,0) 44%)",
        }}
      />
      <AbsoluteFill
        style={{
          transform: cam(zo, NEAR),
          transformOrigin: `${ANCHOR.x}px ${ANCHOR.y}px`,
        }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          <Scope
            frame={t}
            x0={-120}
            x1={W + 120}
            y={TRACE_Y}
            bumps={bumpsAt(t)}
            hum={1.3}
            stroke={3}
            color="rgba(243,241,236,0.6)"
          />
        </svg>
        <Tube s={0} t={t} />
        <Tube s={1} t={t} />
      </AbsoluteFill>
      <Caption
        name="prompt"
        t={t}
        y={CAPTION_Y}
        size={62}
        chunk={3}
        maxWidth={SAFE_IG.w - 40}
      />
    </AbsoluteFill>
  );
};

export const twotubes: FxDef = {
  id: "twotubes",
  command: "/two-tubes",
  menu: "Two tubes, one job list, both assistants",
  clip: "prompt",
  Comp: TwoTubes,
  thumbT: [12, 21, 30],
};
