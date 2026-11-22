import { useId } from "react";

interface Props {
  color: string;
  side?: "front" | "back";
  slogan?: string;
  fit?: "Regular" | "Oversized" | "Slim";
  className?: string;
  children?: React.ReactNode; // overlay rendered inside the print area
}

/** Pick readable ink for a given shirt colour. */
export function inkFor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#252820" : "#F3EFE6";
}

/**
 * Original vector T-shirt mockup with fabric shading. The print area is
 * x:140–260, y:110–270 inside a 400×440 viewBox.
 */
export function TShirtMockup({ color, side = "front", slogan, fit = "Regular", className, children }: Props) {
  const uid = useId().replace(/:/g, "");
  const ink = inkFor(color);
  const body =
    fit === "Oversized"
      ? "M120 40 L60 70 L10 140 L55 170 L90 140 L90 410 L310 410 L310 140 L345 170 L390 140 L340 70 L280 40 Q200 85 120 40Z"
      : fit === "Slim"
      ? "M130 40 L75 70 L35 135 L75 160 L105 130 L105 410 L295 410 L295 130 L325 160 L365 135 L325 70 L270 40 Q200 80 130 40Z"
      : "M125 40 L65 70 L18 140 L62 168 L98 138 L98 410 L302 410 L302 138 L338 168 L382 140 L335 70 L275 40 Q200 82 125 40Z";
  const neck = side === "front" ? "M125 40 Q200 112 275 40" : "M125 40 Q200 70 275 40";

  return (
    <svg
      viewBox="0 0 400 440"
      className={className}
      role="img"
      aria-label={`${side} view of T-shirt`}
    >
      <defs>
        <linearGradient id={`shade${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.14" />
          <stop offset="0.25" stopColor="#000" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="425" rx="130" ry="9" fill="#252820" opacity="0.08" />
      <path d={body} fill={color} />
      <path d={body} fill={`url(#shade${uid})`} />
      <path d={neck} fill="none" stroke="#000" strokeOpacity="0.28" strokeWidth="7" strokeLinecap="round" />
      <path d="M98 138 L62 168 M302 138 L338 168" stroke="#000" strokeOpacity="0.12" strokeWidth="2" />
      {slogan && (
        <text
          x="200"
          y={side === "front" ? 175 : 190}
          textAnchor="middle"
          fill={ink}
          fontFamily="Georgia, serif"
          fontSize={slogan.length > 12 ? 20 : 26}
          fontStyle="italic"
          letterSpacing="1"
        >
          {slogan}
        </text>
      )}
      {children}
    </svg>
  );
}
