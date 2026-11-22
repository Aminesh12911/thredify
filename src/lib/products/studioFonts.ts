export interface StudioFont {
  id: string;
  label: string;
  css: string;
  style?: "italic" | "normal";
  weight?: number;
}

export const studioFonts: StudioFont[] = [
  { id: "fraunces", label: "Fraunces (serif)", css: "var(--font-fraunces), Georgia, serif", weight: 600 },
  { id: "fraunces-italic", label: "Fraunces italic", css: "var(--font-fraunces), Georgia, serif", style: "italic", weight: 500 },
  { id: "inter", label: "Inter (sans)", css: "var(--font-inter), system-ui, sans-serif", weight: 700 },
  { id: "mono", label: "Typewriter", css: "'Courier New', Courier, monospace", weight: 700 },
  { id: "script", label: "Handwritten", css: "'Brush Script MT', 'Segoe Script', cursive", weight: 400 },
];

export const getFont = (id?: string) => studioFonts.find((f) => f.id === id) ?? studioFonts[0];
