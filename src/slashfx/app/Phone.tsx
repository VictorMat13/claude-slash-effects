// The Claude iOS app (dark mode, Code tab) rebuilt 1:1 from the reference frames. Everything is drawn in the reference's
// 720 px wide space (see dispatch/REFERENCE-STUDY.md for every measurement) and mapped into the Instagram safe rect by
// AppLayer (APP.scale at APP.left, APP.top: reference x 0..720 is x 100..980, reference y 0..APP.refH is y 290..1520).
import React from "react";
import { APP, FONT_UI, SAFE_IG, UI, WHITEGRID } from "../theme";
import { Spark } from "../kit";
import { Img, staticFile } from "remotion";

/** Typing state rows in reference space, lifted by APP.lift so the keyboard ends on the safe bottom (ref APP.refH):
 *  slash menu 158..259, composer 274..576 (with a thumb), keyboard 591..1006. Key pop-ups live inside the keyboard. */
export const TYPING = { menuY: 432 - APP.lift, composerBottom: 850 - APP.lift, keyboardTop: 865 - APP.lift } as const;
/** Sent state: the "Reply to Claude..." bar sits on the safe bottom, ref 914..1006. */
const REPLY_H = 92;
export const REPLY_TOP = APP.refH - REPLY_H;

/**
 * The app's window on the Instagram safe rect. The reference space is scaled by APP.scale and pinned to (APP.left, APP.top),
 * and the window clips at SAFE_IG the way the phone frame clipped the reference: the sent thumb tucks under its top edge,
 * the keyboard drops and the reply bar rises through its bottom edge. `zoom` (the ambient drift and the push scale) and
 * `opacity` apply inside the window, about its bottom centre, so the reply bar and the keyboard stay on the safe bottom
 * and no chrome ever crosses the rect.
 */
export const AppLayer: React.FC<{ children?: React.ReactNode; zoom?: number; opacity?: number; style?: React.CSSProperties }> = ({
  children,
  zoom = 1,
  opacity = 1,
  style,
}) => (
  <div style={{ position: "absolute", left: APP.left, top: APP.top, width: SAFE_IG.w, height: SAFE_IG.h, overflow: "hidden", background: UI.bg, borderRadius: WHITEGRID ? 40 : 0, boxShadow: WHITEGRID ? "0 0 0 3px rgba(20,14,12,0.9), 0 30px 80px rgba(20,14,12,0.28)" : "none" }}>
    <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 100%", opacity }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 720,
          height: APP.refH,
          transform: `scale(${APP.scale})`,
          transformOrigin: "0 0",
          fontFamily: FONT_UI,
          color: UI.text,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------- icons (white strokes, drawn to the reference glyphs)
const Icon: React.FC<{ d: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ d, size = 24, color = UI.text, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", ...style }}>
    {d}
  </svg>
);
export const SidebarIcon: React.FC<{ size?: number }> = ({ size }) => <Icon size={size} d={<><path d="M4 8h16" /><path d="M4 15h10" /></>} />;
export const ComposeIcon: React.FC<{ size?: number }> = ({ size }) => (
  <Icon size={size} d={<><path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" /><path d="M18.4 3.6a1.9 1.9 0 0 1 2.7 2.7L13 14.4l-3.6.9.9-3.6z" /></>} />
);
export const PlusIcon: React.FC<{ size?: number; color?: string }> = ({ size, color }) => <Icon size={size} color={color} d={<><path d="M12 5v14" /><path d="M5 12h14" /></>} />;
export const SlidersIcon: React.FC<{ size?: number; color?: string }> = ({ size, color }) => (
  <Icon size={size} color={color} d={<><path d="M4 7h10" /><path d="M18 7h2" /><circle cx="16" cy="7" r="2" /><path d="M4 17h2" /><path d="M10 17h10" /><circle cx="8" cy="17" r="2" /></>} />
);
export const MicIcon: React.FC<{ size?: number; color?: string }> = ({ size, color }) => (
  <Icon size={size} color={color} d={<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>} />
);
export const ArrowUpIcon: React.FC<{ size?: number; color?: string }> = ({ size, color }) => (
  <Icon size={size} color={color} style={{ strokeWidth: 2.6 } as React.CSSProperties} d={<><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></>} />
);
export const ShiftIcon: React.FC<{ size?: number }> = ({ size }) => <Icon size={size} d={<path d="M12 4l7 8h-4v7H9v-7H5z" />} />;
export const DeleteIcon: React.FC<{ size?: number }> = ({ size }) => (
  <Icon size={size} d={<><path d="M20 6H9l-6 6 6 6h11a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z" /><path d="M17 9l-6 6" /><path d="M11 9l6 6" /></>} />
);
export const PlayGlyph: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ display: "block" }}>
    <path d="M4 2.5v11l9-5.5z" fill="#FFFFFF" />
  </svg>
);
export const CloseGlyph: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" style={{ display: "block" }}>
    <path d="M2.5 2.5l7 7" /><path d="M9.5 2.5l-7 7" />
  </svg>
);

const RoundButton: React.FC<{ x: number; y: number; children: React.ReactNode }> = ({ x, y, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 64, height: 64, borderRadius: 32, background: UI.panel, display: "flex", alignItems: "center", justifyContent: "center" }}>
    {children}
  </div>
);

// ---------------------------------------------------------------- header: sidebar button, Chat | Code, compose button
export const Header: React.FC<{ showCompose?: boolean; style?: React.CSSProperties }> = ({ showCompose = true, style }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 720, height: 120, ...style }}>
    <RoundButton x={24} y={26}><SidebarIcon size={26} /></RoundButton>
    <div style={{ position: "absolute", left: 240, top: 26, width: 240, height: 64, borderRadius: 32, background: UI.seg }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 120, height: 64, display: "flex", alignItems: "center", justifyContent: "center", color: UI.muted, fontSize: 21, fontWeight: 500 }}>Chat</div>
      <div style={{ position: "absolute", left: 122, top: 6, width: 112, height: 52, borderRadius: 26, background: UI.segOn, display: "flex", alignItems: "center", justifyContent: "center", color: UI.text, fontSize: 21, fontWeight: 500 }}>Code</div>
    </div>
    {showCompose ? <RoundButton x={632} y={26}><ComposeIcon size={26} /></RoundButton> : null}
  </div>
);

// ---------------------------------------------------------------- slash menu row (one row: the command being typed)
export const SlashMenu: React.FC<{ command: string; menu: string; y?: number; opacity?: number }> = ({ command, menu, y = TYPING.menuY, opacity = 1 }) => (
  <div style={{ position: "absolute", left: 16, top: y, width: 688, height: 101, borderRadius: 18, background: UI.menuPanel, boxShadow: `inset 0 0 0 1px ${UI.line}`, opacity }}>
    <div style={{ position: "absolute", left: 30, top: 20, fontSize: 27, fontWeight: 400, color: UI.text, letterSpacing: -0.2 }}>{command}</div>
    <div style={{ position: "absolute", left: 30, top: 58, fontSize: 19, color: UI.muted }}>{menu}</div>
  </div>
);

// ---------------------------------------------------------------- composer: attachment thumbnail, typed text, bottom row
export const Composer: React.FC<{
  typed: string;
  thumb?: string;
  caret?: boolean;
  /** 0..1 press dip on the send button. */
  press?: number;
  /** Bottom edge (reference 850, lifted to TYPING.composerBottom). */
  bottom?: number;
  placeholder?: string;
  opacity?: number;
}> = ({ typed, thumb, caret = true, press = 0, bottom = TYPING.composerBottom, placeholder, opacity = 1 }) => {
  const h = thumb ? 302 : 160;
  const top = bottom - h;
  const textTop = thumb ? 190 : 30;
  return (
    <div style={{ position: "absolute", left: 16, top, width: 688, height: h, borderRadius: 24, background: UI.panel, boxShadow: `inset 0 0 0 1px ${UI.line}`, opacity }}>
      {thumb ? (
        <div style={{ position: "absolute", left: 19, top: 21, width: 150, height: 150, borderRadius: 14, overflow: "visible" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 14, overflow: "hidden", background: "#000" }}>
            <Img src={staticFile(thumb)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", left: 14, bottom: 14 }}><PlayGlyph size={16} /></div>
          </div>
          <div style={{ position: "absolute", left: 150 - 22, top: 8, width: 30, height: 30, borderRadius: 15, background: UI.badge, boxShadow: `0 0 0 2px ${UI.badgeRing}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CloseGlyph size={12} />
          </div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 22, top: textTop, fontSize: 26, color: typed ? UI.text : UI.muted, letterSpacing: -0.2, whiteSpace: "nowrap", display: "flex", alignItems: "center", height: 34 }}>
        {typed || placeholder || ""}
        {caret ? <div style={{ width: 2.5, height: 30, background: UI.coral, marginLeft: 2, borderRadius: 1 }} /> : null}
      </div>
      <div style={{ position: "absolute", left: 36, top: h - 56, display: "flex", gap: 34, alignItems: "center" }}>
        <PlusIcon size={26} color={UI.text} />
        <SlidersIcon size={26} color={UI.text} />
      </div>
      <div style={{ position: "absolute", left: 573, top: h - 55, display: "flex", alignItems: "center" }}>
        <MicIcon size={28} color={UI.text} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 618,
          top: h - 67,
          width: 57,
          height: 58,
          borderRadius: 16,
          background: UI.coral,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${1 - 0.12 * press})`,
          filter: `brightness(${1 - 0.15 * press})`,
        }}
      >
        <ArrowUpIcon size={28} color={UI.white} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- keyboard with key pop-ups
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"] as const;
const KEY_W = 62;
const KEY_H = 78;
const PITCH = 71.5;
/** Key rows as measured (the tray top was reference 865); drawn relative to the tray, which now sits at TYPING.keyboardTop. */
const TRAY_REF = 865;
const ROW_TOP = [947, 1051, 1155, 1259].map((y) => y - TRAY_REF);
/** Key rectangle for a lowercase letter, in reference space (lifted typing layout, keyboard at rest). */
export const keyRect = (ch: string) => {
  for (let r = 0; r < ROWS.length; r++) {
    const i = ROWS[r].indexOf(ch.toLowerCase());
    if (i >= 0) {
      const x0 = r === 0 ? 8 : r === 1 ? 43.5 : 115;
      return { x: x0 + i * PITCH, y: TYPING.keyboardTop + ROW_TOP[r], w: KEY_W, h: KEY_H };
    }
  }
  return null;
};

export const Keyboard: React.FC<{
  /** Letters typed so far (without the slash), shown in the suggestion strip as “ma. */
  typedLetters: string;
  /** Letter whose pop-up is showing, if any. */
  popKey?: string | null;
  /** 0..1 pop-up rise. */
  popP?: number;
  y?: number;
  opacity?: number;
}> = ({ typedLetters, popKey, popP = 1, y = 0, opacity = 1 }) => {
  const key = (ch: string, x: number, top: number, w = KEY_W, pressed = false) => (
    <div
      key={`${ch}-${x}-${top}`}
      style={{
        position: "absolute",
        left: x,
        top,
        width: w,
        height: KEY_H,
        borderRadius: 10,
        background: pressed ? UI.keyPop : UI.key,
        boxShadow: "0 1px 0 rgba(0,0,0,0.35)",
        color: UI.keyInk,
        fontSize: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {ch}
    </div>
  );
  const pop = popKey ? keyRect(popKey) : null;
  return (
    <div style={{ position: "absolute", left: 0, top: TYPING.keyboardTop + y, width: 720, height: APP.refH - TYPING.keyboardTop, background: UI.tray, opacity, overflow: "hidden" }}>
      {/* suggestion strip */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 720, height: 82 }}>
        <div style={{ position: "absolute", left: 240, top: 24, width: 1, height: 34, background: UI.trayLine }} />
        <div style={{ position: "absolute", left: 480, top: 24, width: 1, height: 34, background: UI.trayLine }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 240, height: 82, display: "flex", alignItems: "center", justifyContent: "center", color: UI.trayText, fontSize: 22, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 12px" }}>
          {typedLetters ? `“${typedLetters}` : "“"}
        </div>
      </div>
      {ROWS[0].split("").map((ch, i) => key(ch, 8 + i * PITCH, ROW_TOP[0], KEY_W, popKey === ch))}
      {ROWS[1].split("").map((ch, i) => key(ch, 43.5 + i * PITCH, ROW_TOP[1], KEY_W, popKey === ch))}
      <div style={{ position: "absolute", left: 8, top: ROW_TOP[2], width: 97, height: KEY_H, borderRadius: 10, background: UI.key, boxShadow: "0 1px 0 rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ShiftIcon size={28} />
      </div>
      {ROWS[2].split("").map((ch, i) => key(ch, 115 + i * PITCH, ROW_TOP[2], KEY_W, popKey === ch))}
      <div style={{ position: "absolute", left: 615, top: ROW_TOP[2], width: 98, height: KEY_H, borderRadius: 10, background: UI.key, boxShadow: "0 1px 0 rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DeleteIcon size={30} />
      </div>
      {/* bottom row, only its top shows above the safe bottom */}
      <div style={{ position: "absolute", left: 8, top: ROW_TOP[3], width: 97, height: KEY_H, borderRadius: 10, background: UI.key }} />
      <div style={{ position: "absolute", left: 115, top: ROW_TOP[3], width: 491, height: KEY_H, borderRadius: 10, background: UI.space }} />
      <div style={{ position: "absolute", left: 615, top: ROW_TOP[3], width: 98, height: KEY_H, borderRadius: 10, background: UI.key }} />
      {pop ? (
        <div
          style={{
            position: "absolute",
            left: pop.x + pop.w / 2 - 46,
            top: pop.y - TYPING.keyboardTop + pop.h + 6 - 167 + (1 - popP) * 20,
            width: 92,
            height: 167,
            borderRadius: 14,
            background: UI.keyPop,
            boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
            color: UI.keyInk,
            fontSize: 48,
            display: "flex",
            justifyContent: "center",
            paddingTop: 22,
            opacity: 1,
          }}
        >
          {popKey}
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- the collapsed "Reply to Claude..." bar (sent state)
export const ReplyBar: React.FC<{ y?: number; opacity?: number }> = ({ y = 0, opacity = 1 }) => (
  <div style={{ position: "absolute", left: 16, top: REPLY_TOP + y, width: 688, height: REPLY_H, borderRadius: 30, background: UI.replyBar, boxShadow: `inset 0 0 0 1px ${UI.line}`, opacity }}>
    <div style={{ position: "absolute", left: 30, top: 32 }}><PlusIcon size={28} color={UI.text} /></div>
    <div style={{ position: "absolute", left: 76, top: 28, fontSize: 27, color: UI.muted }}>Reply to Claude...</div>
    <div style={{ position: "absolute", left: 566, top: 31 }}><MicIcon size={30} color={UI.text} /></div>
    <div style={{ position: "absolute", left: 618, top: 17, width: 57, height: 57, borderRadius: 29, background: UI.replySend, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ArrowUpIcon size={26} color={UI.replyInk} />
    </div>
  </div>
);

// ---------------------------------------------------------------- the sent message: clip thumbnail + command pill, top right
export const SentMessage: React.FC<{ command: string; thumb?: string; y?: number; opacity?: number }> = ({ command, thumb, y = 0, opacity = 1 }) => (
  <div style={{ position: "absolute", left: 0, top: y, width: 720, height: 240, opacity }}>
    {thumb ? (
      <div style={{ position: "absolute", left: 491, top: -210, width: 204, height: 363, borderRadius: 14, overflow: "hidden", background: "#000" }}>
        <Img src={staticFile(thumb)} style={{ position: "absolute", left: 0, top: 150, width: "100%", height: 363, objectFit: "cover", objectPosition: "50% 18%", display: "block" }} />
        <div style={{ position: "absolute", left: 16, bottom: 16 }}><PlayGlyph size={18} /></div>
      </div>
    ) : null}
    <div style={{ position: "absolute", right: 27, top: thumb ? 171 : 120, height: 58, padding: "0 22px", borderRadius: 29, background: UI.pill, color: UI.coral, fontSize: 28, display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
      {command}
    </div>
  </div>
);

// ---------------------------------------------------------------- "✳ Editing with match-cut..." line
export const SparkLine: React.FC<{ text: string; y?: number; opacity?: number }> = ({ text, y = 250, opacity = 1 }) => (
  <div style={{ position: "absolute", left: 24, top: y, display: "flex", alignItems: "center", gap: 14, opacity }}>
    <Spark size={43} />
    <div style={{ fontSize: 24, color: UI.muted, whiteSpace: "nowrap" }}>{text}</div>
  </div>
);

// ---------------------------------------------------------------- home greeting "✳ / Evening, Victor"
export const HomeGreeting: React.FC<{ greeting: string; name: string; opacity?: number; y?: number }> = ({ greeting, name, opacity = 1, y = 0 }) => (
  <div style={{ position: "absolute", left: 0, top: 150 + y, width: 720, display: "flex", flexDirection: "column", alignItems: "center", gap: 36, opacity }}>
    <Spark size={44} />
    <div style={{ fontSize: 36, color: UI.text, letterSpacing: -0.3 }}>{`${greeting}, ${name}`}</div>
  </div>
);
