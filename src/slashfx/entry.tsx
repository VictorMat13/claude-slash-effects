// Claude slash effects reel: its own render entry (same reason as crtliftoff2: nothing half-built elsewhere in
// src/Root.tsx can break these stills and renders). Never edit src/Root.tsx for this reel.
//
//   npx remotion still src/slashfx/entry.tsx SlashFx out/slashfx/f12.png --frame 12
//   npx remotion still src/slashfx/entry.tsx SlashFxProbe out/slashfx/probe.png --frame 20 --props '{"fx":"matchcut","stage":"full"}'
//   npx remotion render src/slashfx/entry.tsx SlashFx out/slashfx/SlashFx.mp4 --concurrency=1
import React from "react";
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "remotion";
import { Ending } from "./ending/Ending";
import { fxById } from "./fx";
import { Reel, SLASHFX_DURATION } from "./Reel";
import { ENDING_LEN, FONT_UI, FPS, UI, type FxStage } from "./theme";

type ProbeProps = { fx: string; stage: FxStage };
/** One effect alone, t = frame. Builders check their work here. */
const Probe: React.FC<ProbeProps> = ({ fx, stage }) => {
  const t = useCurrentFrame();
  const def = fxById(fx);
  const Comp = def.Comp;
  return (
    <AbsoluteFill style={{ background: UI.bg, fontFamily: FONT_UI }}>
      <Comp t={t} stage={stage} />
    </AbsoluteFill>
  );
};

const EndingOnly: React.FC = () => (
  <AbsoluteFill style={{ background: UI.bg, fontFamily: FONT_UI }}>
    <Ending />
  </AbsoluteFill>
);

const SlashFxRoot: React.FC = () => (
  <>
    <Composition id="SlashFx" component={Reel} durationInFrames={SLASHFX_DURATION} fps={FPS} width={1080} height={1920} />
    <Composition
      id="SlashFxProbe"
      component={Probe}
      durationInFrames={48}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ fx: "matchcut", stage: "full" as FxStage }}
    />
    <Composition id="SlashFxEnding" component={EndingOnly} durationInFrames={ENDING_LEN} fps={FPS} width={1080} height={1920} />
  </>
);

registerRoot(SlashFxRoot);
