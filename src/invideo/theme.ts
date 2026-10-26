// ===========================================================================
// invideo x Ahmed (Agentic Extend reel), Oct 2026. Shared series tokens.
// Created by the P1 hook builder; shared with the flat-part builder (IvFlat*).
// READ-ONLY for part builds: import from here, build layouts in your own file.
//
// World = Ahmed's world (Skilltree gray #20242D, fish7/fish8 tokens).
// invideo UI colors were sampled from REC1 (capture/studio/
// invideo-walkthrough-0-21min.mp4 @905s, Retina 3024x1964). Real UI strings
// only, copied from the recording. No invented copy.
// ===========================================================================
export { WORLD, SPRINGS, safePadX, FONT_UI, FONT_MONO } from "../fish7/theme";

// 9:8 parts sit in the top half of the 9:16 Reel: inset screen, only the
// ground bleeds to the edges (Victor 2026-09-30, same as holo/SafeFrame).
export const SAFE = { side: 0.1, top: 0.15, bottom: 0.05, radius: 28 } as const;

// Easing (approved Fish 8 smooth set): bezier only, zero overshoot.
export const EASE = {
  travel: [0.65, 0, 0.35, 1],
  enter: [0.05, 0.7, 0.1, 1],
  decel: [0.2, 0, 0, 1],
} as const;

// invideo editor (dark), sampled
export const IV = {
  panel: "#1E1E1E", // every panel body
  rail: "#171717", // gutters between panels, tool rail
  raised: "#2A2A2A", // composer box, media panel, scrollbar track
  border: "#323232",
  sep: "#393939", // track separators
  text: "#E8E8E8",
  textDim: "#9A9A9A",
  textFaint: "#6B6B6B",
  tabActive: "#FFFFFF",
  blue: "#4DA3F0", // timecode + playhead
  select: "#2F7BEF", // selected tool (arrow) button
  badge: "#1C3A5A", // V1 / A1 track badges
  badgeText: "#E7E8EF",
  vStripe: "#2B567C", // video track left stripe
  aStripe: "#2F5F4F", // audio track left stripe
  vClip: "#29587A", // video clip body
  vClipLabel: "#325673",
  vClipEdge: "#5E8DB3",
  aClip: "#2E5E4E", // audio clip body
  aClipEdge: "#5FA88E",
  wave: "#63C1A4", // waveform fill
  workBar: "#E8B100", // yellow work-area bar on the ruler
  chipBg: "#3F4C31", // "INVIDEO EDITOR 1.1" chip
  chipText: "#B9C79F",
  send: "#FFFFFF", // send button (white, dark arrow)
  sendIcon: "#151515",
  fontUi: "Inter, system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

// Real strings from the recording
export const IV_UI = {
  composerPlaceholder: "Send a message to Editor",
  chip: "INVIDEO EDITOR",
  chipVersion: "1.1",
  disclaimer: "invideo AI agents can make mistakes. Review their work.",
  model: "Pro",
  agent: "Agent two",
  agentBadge: "Agent Two Pro",
  topTabs: ["Edit", "Audio", "Color", "Preview", "Structure"],
  export: "Export",
  branch: "main",
  sourceTabs: ["Source", "Transcript"],
  monitor: "Monitor",
  inspectorTabs: ["Inspector", "Keyframe"],
  mediaTabs: ["Media", "Timelines", "Edit Index"],
  searchMedia: "Search media...",
  timeline: "Main Timeline",
  semantic: "Semantic",
  tracks: ["V2", "V1", "A1", "A2"],
  clipRaw: "1.2 ahmed-raw-take",
  clipSfx: "1.3",
  clipExtend: "1.5",
  sfxCaption: "Generated with ElevenLabs SFX",
  extendCaption: "Generated with Seedance 2.0",
  prompts: {
    silences: "Cut the silences.",
    sfx: "Add sound effects.",
    extend: "Make this shot five seconds longer.",
  },
} as const;

// Official marks (public/invideo/, fetched from invideo.io). Never redraw or recolor.
export const IV_LOGO = {
  dark: "invideo/invideo-logo-dark.svg",
  white: "invideo/invideo-logo-white.png",
} as const;
