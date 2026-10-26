// The ending (ENDING_LEN frames, 144 at 24 fps: reel frames 456 to 599). Home screen, Victor types /<keyword> and sends, Claude answers with the
// "Effect of the Day" card whose 5 x 4 grid fills in from the dither with our six effects playing live, the card pushes
// to full screen and becomes the CTA: Comment "<KEYWORD>" with a coral pill over the grid. See dispatch/agent-END.md.
// Safe zone (dispatch/SAFEZONE.md): the app sits in SAFE_IG (AppLayer), the card is CARD, the CTA block is plan.ts CTA.
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { AppLayer, Composer, Header, HomeGreeting, Keyboard, ReplyBar, SentMessage, SlashMenu, SparkLine, TYPING } from "../app/Phone";
import { Dither, INTER } from "../kit";
import { APP, CARD, CLAMP, EASE, FPS, GREETING, H, NAME, UI, W, ez, lerp, WHITEGRID } from "../theme";
import { WhiteGrid } from "../backdrop";
import { FxCell, WordCell } from "./cells";
import {
  CARD_K,
  CARD_SUB,
  CARD_TITLE,
  CELLS,
  CTA,
  CTA_K,
  COMMAND,
  E,
  FULL_BG,
  GRID_CARD,
  GRID_FULL,
  GRID_ZOOM,
  HEADLINE,
  MENU,
  PILL,
  SPARK_TEXT,
  at,
  cellBox,
  popAt,
  typedAt,
} from "./plan";

export { E as ENDING_T, PILL as ENDING_PILL };

/** Reference f0168 / f0172: slash menu panel top 577 with a 15 px gap to the composer (no thumb here, so the menu sits
 *  lower than in the cycles), lifted with the typing rows by APP.lift. The greeting (spark, gap, line: about 123 ref px)
 *  is centred between the header buttons (bottom 90) and the menu. */
const MENU_Y = 575 - APP.lift;
const GREETING_Y = -14;

const lerpBox = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }, p: number) => ({
  x: lerp(a.x, b.x, p),
  y: lerp(a.y, b.y, p),
  w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p),
});

/** Centred single line of text with its vertical centre at y (card-relative output pixels). */
const Line: React.FC<{ y: number; size: number; weight: number; color: string; opacity?: number; dy?: number; children: React.ReactNode }> = ({
  y,
  size,
  weight,
  color,
  opacity = 1,
  dy = 0,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: y - size * 0.6,
      height: size * 1.2,
      lineHeight: `${size * 1.2}px`,
      textAlign: "center",
      fontFamily: INTER,
      fontWeight: weight,
      fontSize: size,
      color,
      letterSpacing: -0.02 * size,
      whiteSpace: "nowrap",
      opacity,
      transform: `translateY(${dy}px)`,
    }}
  >
    {children}
  </div>
);

export const Ending: React.FC = () => {
  const f = useCurrentFrame();

  // ------------------------------------------------ app phase: typing, send, sent state
  const typed = typedAt(f);
  const pop = popAt(f);
  const press = interpolate(f, [E.send, E.send + at(1.5), E.send + at(4)], [0, 1, 0], CLAMP);
  const sent = ez(f, E.sentStart, E.sentEnd, EASE.travel);
  const caret = f < E.send && (Math.floor(f / at(14)) % 2 === 0 || f < at(6));
  const greetOp = 1 - ez(f, E.send, E.sentEnd - at(2), EASE.inOut);
  const sparkP = ez(f, E.spark, E.spark + at(5));
  const streamed = SPARK_TEXT.slice(0, Math.round(interpolate(f, [E.spark, E.streamEnd], [0, SPARK_TEXT.length], CLAMP)));

  // ------------------------------------------------ card: dither, resolve, push to full screen
  const cardP = ez(f, E.card, E.card + E.cardIn);
  const resolved = ez(f, E.resolve, E.resolveEnd, EASE.inOut);
  const push = ez(f, E.push, E.full, EASE.travel);
  /** Slow camera drift on the app (ambient motion while only keys move), then the cycles' scale-up and fade. */
  const appScale = interpolate(f, [0, at(40)], [1, 1.01], CLAMP) * (1 + 0.08 * push);
  const rx = lerp(CARD.x, 0, push);
  const ry = lerp(CARD.y, 0, push);
  const rw = lerp(CARD.w, W, push);
  const rh = lerp(CARD.h, H, push);
  const rr = lerp(CARD.r, 0, push);
  const cardBg = interpolateColors(push, [0, 1], [UI.dither, FULL_BG]);

  // ------------------------------------------------ titles: "Effect of the Day" grows with the push, then the CTA replaces it
  const titleOut = ez(f, E.full, E.full + at(6), EASE.accel);
  const ctaIn = ez(f, E.full + at(6), E.full + at(15), EASE.enter);
  const pillIn = ez(f, E.full + at(5), E.full + at(14), EASE.enter);
  const breathe = 1 + 0.005 * Math.sin(((f - E.full) * 0.16 * 30) / FPS);

  // ------------------------------------------------ grid
  const zoom = interpolate(f, [E.push, E.len - 1], [1, 1 + GRID_ZOOM], CLAMP);
  const gx = lerp(GRID_CARD.x0, GRID_FULL.x0, push);
  const gy = lerp(GRID_CARD.y0, GRID_FULL.y0, push);
  const gw = lerp(GRID_CARD.w, GRID_FULL.w, push);
  const gh = lerp(GRID_CARD.h, GRID_FULL.h, push);
  const cellR = lerp(6 * CARD_K, 10 * CTA_K, push);

  return (
    <AbsoluteFill style={{ background: WHITEGRID ? "transparent" : UI.bg, overflow: "hidden" }}>
      {WHITEGRID ? <WhiteGrid f={f} /> : null}
      {push < 1 ? (
        <AppLayer zoom={appScale} opacity={1 - push}>
          <Header />
          {greetOp > 0 ? <HomeGreeting greeting={GREETING} name={NAME} y={GREETING_Y} opacity={greetOp} /> : null}
          {sent < 1 ? (
            <>
              <SlashMenu command={COMMAND} menu={MENU} y={MENU_Y} opacity={1 - ez(f, E.send, E.send + at(4))} />
              <Composer typed={typed} caret={caret} press={press} bottom={TYPING.composerBottom + sent * 440} opacity={1 - ez(f, E.sentStart + at(2), E.sentEnd)} />
              <Keyboard typedLetters={typed.slice(1)} popKey={pop?.key ?? null} popP={pop?.p ?? 1} y={sent * 440} opacity={1 - ez(f, E.sentStart, E.sentEnd - at(1))} />
            </>
          ) : null}
          {sent > 0 ? (
            <>
              <ReplyBar y={(1 - sent) * 140} opacity={ez(f, E.sentStart + at(3), E.sentEnd + at(1), EASE.inOut)} />
              <SentMessage command={COMMAND} y={38 + (1 - sent) * 90} opacity={sent} />
            </>
          ) : null}
          {f >= E.spark ? <SparkLine text={streamed} opacity={sparkP} y={250 + (1 - sparkP) * 10} /> : null}
        </AppLayer>
      ) : null}

      {f >= E.card ? (
        <div
          style={{
            position: "absolute",
            left: rx,
            top: ry,
            width: rw,
            height: rh,
            borderRadius: rr,
            overflow: "hidden",
            opacity: cardP,
            background: cardBg,
            transform: `translateY(${(1 - cardP) * 14}px)`,
          }}
        >
          {f >= E.resolve ? (
            <div style={{ position: "absolute", inset: 0, opacity: resolved }}>
              {titleOut < 1 ? (
                <>
                  <Line y={lerp(210 * CARD_K, CTA.headY, push)} size={lerp(44 * CARD_K, CTA.headSize, push)} weight={700} color={UI.headline} opacity={1 - titleOut} dy={-14 * CTA_K * titleOut}>
                    {CARD_TITLE}
                  </Line>
                  <Line y={lerp(265 * CARD_K, CTA.subY, push)} size={lerp(22 * CARD_K, CTA.subSize, push)} weight={500} color={UI.coral} opacity={1 - titleOut} dy={-14 * CTA_K * titleOut}>
                    {CARD_SUB}
                  </Line>
                </>
              ) : null}
              {ctaIn > 0 ? (
                <>
                  <Line y={CTA.headY} size={CTA.headSize} weight={800} color={UI.headline} opacity={ctaIn} dy={18 * CTA_K * (1 - ctaIn)}>
                    {HEADLINE}
                  </Line>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: CTA.pillTop,
                      display: "flex",
                      justifyContent: "center",
                      opacity: pillIn,
                      transform: `translateY(${18 * CTA_K * (1 - pillIn)}px)`,
                    }}
                  >
                    <div
                      style={{
                        padding: `${10 * CTA_K}px ${26 * CTA_K}px`,
                        borderRadius: 14 * CTA_K,
                        background: UI.coral,
                        color: UI.ink,
                        fontFamily: INTER,
                        fontWeight: 700,
                        fontSize: CTA.pillSize,
                        lineHeight: 1.15,
                        letterSpacing: -0.6 * CTA_K,
                        whiteSpace: "nowrap",
                        transform: `scale(${breathe})`,
                      }}
                    >
                      {PILL}
                    </div>
                  </div>
                </>
              ) : null}
              <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: `${gx + gw / 2}px ${gy + gh / 2}px` }}>
                {CELLS.map((plan) => {
                  const box = lerpBox(cellBox(GRID_CARD, plan.i), cellBox(GRID_FULL, plan.i), push);
                  return plan.kind === "fx" ? (
                    <FxCell key={plan.i} plan={plan} f={f} box={box} radius={cellR} />
                  ) : (
                    <WordCell key={plan.i} plan={plan} f={f} box={box} radius={cellR} />
                  );
                })}
              </div>
            </div>
          ) : null}
          {resolved < 1 ? <Dither t={f} w={Math.ceil(rw)} h={Math.ceil(rh)} style={{ opacity: 1 - resolved, transform: `scale(${1 + resolved * 0.08})` }} /> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
