// The whole reel: six command cycles (CYCLE.len frames each, 76) and the ending (144 frames). 600 frames at 24 fps.
// Cycles overlap by SCROLL frames: the outgoing full-screen effect slides up while the next prompt slides in from
// below, both on the same eased travel, so the switch between prompts is one continuous scroll (no hard cuts).
import React from "react";
import { AbsoluteFill, Freeze, Sequence, useCurrentFrame } from "remotion";
import { Cycle, sheetY } from "./Cycle";
import { Ending } from "./ending/Ending";
import { FX } from "./fx";
import { CYCLE, ENDING_LEN, ENDING_START, FONT_UI, SCROLL, TOTAL, UI } from "./theme";

export const SLASHFX_DURATION = TOTAL;

/** Slides its children in from below over the first `lead` frames of the enclosing sequence. */
const ScrollIn: React.FC<{ lead: number; children: React.ReactNode }> = ({ lead, children }) => {
  const f = useCurrentFrame() - lead;
  const y = f < 0 ? sheetY(f, lead, Number.MAX_SAFE_INTEGER) : 0;
  return <AbsoluteFill style={{ background: UI.bg, transform: `translateY(${y}px)` }}>{children}</AbsoluteFill>;
};

/** While the ending sheet scrolls in it shows the ending's first frame (frozen), then the ending runs from its frame 0. */
const EndingWithLead: React.FC<{ lead: number }> = ({ lead }) => {
  const f = useCurrentFrame();
  if (f < lead) {
    return (
      <Freeze frame={0}>
        <Ending />
      </Freeze>
    );
  }
  return (
    <Sequence from={lead} durationInFrames={ENDING_LEN}>
      <Ending />
    </Sequence>
  );
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: UI.bg, fontFamily: FONT_UI }}>
    {FX.map((fx, k) => {
      const lead = k === 0 ? 0 : SCROLL;
      return (
        <Sequence key={fx.id} from={k * CYCLE.len - lead} durationInFrames={CYCLE.len + lead}>
          <Cycle fx={fx} lead={lead} />
        </Sequence>
      );
    })}
    <Sequence from={ENDING_START - SCROLL} durationInFrames={ENDING_LEN + SCROLL}>
      <ScrollIn lead={SCROLL}>
        <EndingWithLead lead={SCROLL} />
      </ScrollIn>
    </Sequence>
  </AbsoluteFill>
);
