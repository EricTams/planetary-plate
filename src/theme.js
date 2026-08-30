/* Shared palette and style tokens. */

export const T = {
  paper: "#F1F3EC",
  panel: "#FAFBF7",
  ink: "#22301F",
  muted: "#6C7A66",
  hair: "#D8DECE",
  green: "#2F7D4E",
  ochre: "#C08A2D",
  red: "#BC4B3C",
};

/* Categorical ramps for the group profile: cool hues climb green → violet
   across the six groups a dish earns credit for, warm hues climb gold → deep
   red across the six ceilings it spends against. Order matches POSITIVE_BARS
   and NEGATIVE_BARS in data.js. */
export const COOL = [
  "#2F7D4E", // whole grains
  "#1B8A72", // legumes
  "#17879C", // vegetables
  "#2E6FA8", // fruits
  "#4A57A6", // nuts
  "#6B4E9B", // plant oils
];

export const WARM = [
  "#D9A520", // eggs
  "#C08A2D", // dairy
  "#C7742A", // tubers
  "#C0562E", // added sugar
  "#B4412F", // animal / tropical fat
  "#9E3033", // ultra-processed
];

/* Neutrals for groups that carry energy but sit outside the two ramps. */
export const NEUTRAL = {
  bridge: "#7E8AA0",
  meat: "#8A7F6B",
  inert: "#B7BDAE", // refined starch: present and eaten, but earning nothing
};

export const FONT = {
  display: "'Instrument Serif', serif",
  sans: "'Archivo', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

export const label = {
  fontSize: 11,
  color: T.muted,
  fontFamily: FONT.sans,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

export const input = {
  width: 64,
  padding: "4px 6px",
  border: `1px solid ${T.hair}`,
  borderRadius: 4,
  background: "#fff",
  color: T.ink,
  fontFamily: FONT.mono,
  fontSize: 12,
};

export const panel = {
  background: T.panel,
  border: `1px solid ${T.hair}`,
  borderRadius: 8,
};

/* Pill button used for plot tabs and scoring-mode toggles. */
export function toggle(active) {
  return {
    padding: "6px 11px",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: FONT.sans,
    border: `1px solid ${active ? T.ink : T.hair}`,
    background: active ? T.ink : "#fff",
    color: active ? T.paper : T.ink,
  };
}
