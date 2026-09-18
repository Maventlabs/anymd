export const themePresets = [
  {
    id: "precision-blue",
    name: "Precision Blue",
    mode: "light",
    description: "Quiet product precision with a crisp blue action color.",
    fonts: { display: "Inter", body: "Inter", mono: "IBM Plex Mono" },
    colors: {
      canvas: "#f5f5f7",
      surface: "#ffffff",
      text: "#1d1d1f",
      mutedText: "#6e6e73",
      primary: "#2f6df5",
      primaryText: "#ffffff",
      border: "#d2d2d7",
      accent: "#0071e3",
    },
  },
  {
    id: "signal-editorial",
    name: "Signal Editorial",
    mode: "light",
    description: "Compact editorial hierarchy with a decisive warm signal.",
    fonts: { display: "Oswald", body: "DM Sans", mono: "IBM Plex Mono" },
    colors: {
      canvas: "#f4f3ef",
      surface: "#ffffff",
      text: "#1b1b1b",
      mutedText: "#65645f",
      primary: "#e35b32",
      primaryText: "#ffffff",
      border: "#d1d0ca",
      accent: "#524ae9",
    },
  },
  {
    id: "playful-lime",
    name: "Playful Lime",
    mode: "light",
    description: "Rounded, optimistic UI with strong feedback states.",
    fonts: { display: "Nunito", body: "Nunito Sans", mono: "IBM Plex Mono" },
    colors: {
      canvas: "#f7fff1",
      surface: "#ffffff",
      text: "#24320f",
      mutedText: "#607044",
      primary: "#58cc02",
      primaryText: "#173300",
      border: "#b8df9b",
      accent: "#1cb0f6",
    },
  },
  {
    id: "signal-black",
    name: "Signal Black",
    mode: "dark",
    description: "High-contrast editorial black with one sharp signal color.",
    fonts: { display: "Space Grotesk", body: "Inter", mono: "IBM Plex Mono" },
    colors: {
      canvas: "#090909",
      surface: "#141414",
      text: "#f7f7f7",
      mutedText: "#a0a0a0",
      primary: "#fc1c46",
      primaryText: "#ffffff",
      border: "#303030",
      accent: "#ff718d",
    },
  },
  {
    id: "cobalt-terminal",
    name: "Cobalt Terminal",
    mode: "dark",
    description: "Developer-tool clarity on a restrained midnight canvas.",
    fonts: { display: "Figtree", body: "Inter", mono: "IBM Plex Mono" },
    colors: {
      canvas: "#0e111b",
      surface: "#121827",
      text: "#f4f7ff",
      mutedText: "#9ba8c7",
      primary: "#2862d7",
      primaryText: "#ffffff",
      border: "#263654",
      accent: "#63a2ff",
    },
  },
  {
    id: "violet-ledger",
    name: "Violet Ledger",
    mode: "dark",
    description: "Premium financial editorial with measured data accents.",
    fonts: { display: "Lora", body: "Inter", mono: "IBM Plex Mono" },
    colors: {
      canvas: "#0f1011",
      surface: "#191a1d",
      text: "#f6f4ff",
      mutedText: "#aaa7b5",
      primary: "#847dff",
      primaryText: "#ffffff",
      border: "#34333b",
      accent: "#00b3dd",
    },
  },
] as const;

export type ThemePreset = (typeof themePresets)[number];
export type ThemePresetId = ThemePreset["id"];
export const themePresetIds = themePresets.map(({ id }) => id) as ThemePresetId[];

export function getThemePreset(id = ""): ThemePreset | undefined {
  return themePresets.find((preset) => preset.id === id);
}
