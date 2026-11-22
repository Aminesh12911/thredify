"use client";

import { useId, useRef } from "react";
import type { CustomizationLayer } from "@/types";
import { getFont } from "@/lib/products/studioFonts";

/** Printable area inside the 400×440 T-shirt viewBox. */
export const PRINT_AREA = { x: 130, y: 100, w: 140, h: 190 };
const VIEWBOX_W = 400;

export function layerBox(l: CustomizationLayer) {
  if (l.kind === "image") {
    const w = PRINT_AREA.w * 0.6 * l.scale;
    return { w, h: w / (l.aspect || 1) };
  }
  const fs = l.fontSize ?? 22;
  return { w: Math.max(1, (l.text ?? "").length) * fs * 0.58, h: fs * 1.3 };
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

interface Props {
  layers: CustomizationLayer[];
  selectedId?: string | null;
  showGuides?: boolean;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, patch: Partial<CustomizationLayer>) => void;
  onRemove?: (id: string) => void;
}

/** Renders print layers inside the shirt SVG. Interactive only when onChange is provided. */
export function DesignLayers({ layers, selectedId, showGuides, onSelect, onChange, onRemove }: Props) {
  const clipId = `clip${useId().replace(/:/g, "")}`;
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; k: number } | null>(null);
  const interactive = Boolean(onChange);

  function down(e: React.PointerEvent<SVGGElement>, l: CustomizationLayer) {
    onSelect?.(l.id);
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    drag.current = {
      id: l.id,
      sx: e.clientX,
      sy: e.clientY,
      ox: l.x,
      oy: l.y,
      k: VIEWBOX_W / svg.getBoundingClientRect().width,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<SVGGElement>) {
    const d = drag.current;
    if (!d || !onChange) return;
    onChange(d.id, {
      x: clamp(d.ox + (((e.clientX - d.sx) * d.k) / PRINT_AREA.w) * 100),
      y: clamp(d.oy + (((e.clientY - d.sy) * d.k) / PRINT_AREA.h) * 100),
    });
  }

  function up(e: React.PointerEvent<SVGGElement>) {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function key(e: React.KeyboardEvent<SVGGElement>, l: CustomizationLayer) {
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      onChange?.(l.id, { x: clamp(l.x + dx), y: clamp(l.y + dy) });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onRemove?.(l.id);
    }
  }

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={PRINT_AREA.x} y={PRINT_AREA.y} width={PRINT_AREA.w} height={PRINT_AREA.h} />
        </clipPath>
      </defs>
      {showGuides && (
        <rect
          x={PRINT_AREA.x}
          y={PRINT_AREA.y}
          width={PRINT_AREA.w}
          height={PRINT_AREA.h}
          fill="none"
          stroke="#B87958"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.8"
          pointerEvents="none"
        />
      )}
      {layers.map((l) => {
        const cx = PRINT_AREA.x + (l.x / 100) * PRINT_AREA.w;
        const cy = PRINT_AREA.y + (l.y / 100) * PRINT_AREA.h;
        const { w, h } = layerBox(l);
        const selected = l.id === selectedId;
        const font = getFont(l.font);
        return (
          <g key={l.id}>
            <g clipPath={`url(#${clipId})`} pointerEvents="none">
              {l.kind === "image" && l.imageDataUrl ? (
                <image href={l.imageDataUrl} x={cx - w / 2} y={cy - h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
              ) : (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={l.fontSize ?? 22}
                  fill={l.color ?? "#252820"}
                  style={{ fontFamily: font.css, fontStyle: font.style ?? "normal", fontWeight: font.weight ?? 400 }}
                >
                  {l.text}
                </text>
              )}
            </g>
            {interactive && (
              <g
                data-layer-id={l.id}
                tabIndex={0}
                role="button"
                aria-label={`${l.kind === "image" ? "Image" : "Text"} layer${l.kind === "text" ? `: ${l.text}` : ""}. Drag or use arrow keys to move.`}
                style={{ touchAction: "none", cursor: "grab", outline: "none" }}
                onPointerDown={(e) => down(e, l)}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
                onFocus={() => onSelect?.(l.id)}
                onKeyDown={(e) => key(e, l)}
              >
                <rect
                  x={cx - w / 2 - 3}
                  y={cy - h / 2 - 3}
                  width={w + 6}
                  height={h + 6}
                  fill="transparent"
                  stroke={selected ? "#667052" : "none"}
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
