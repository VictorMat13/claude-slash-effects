// Stand-in for an effect a builder has not delivered yet: Victor's clip with the command name. Replaced in fx/index.ts.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Clip } from "../kit";
import { FONT_UI, UI, type FxDef, type FxProps } from "../theme";
import type { ClipName } from "../data/clips";

export const placeholder = (id: string, command: string, menu: string, clip: ClipName): FxDef => {
  const Comp: React.FC<FxProps> = ({ t }) => (
    <AbsoluteFill style={{ background: UI.bg }}>
      <Clip name={clip} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 240 + Math.sin(t * 0.2) * 6, textAlign: "center", fontFamily: FONT_UI, fontSize: 60, fontWeight: 700, color: UI.white, textShadow: "0 3px 18px rgba(0,0,0,0.6)" }}>
        {command}
      </div>
    </AbsoluteFill>
  );
  return { id, command, menu, clip, Comp, thumbT: [4, 16, 28] };
};
