/**
 * Google Material Symbols (Rounded variant) Component
 * Licensed under Apache License 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 * Uses self-hosted Material Symbols Rounded font with offline ligature rendering.
 */

import type { JSX } from "preact";
import {
  ALL_MATERIAL_SYMBOLS,
  RECOMMENDED_MATERIAL_SYMBOLS,
  isValidSymbolName,
  normalizeSymbolName,
  searchMaterialSymbols,
  type RecommendedIcon,
} from "../../shared/material-symbols-catalog";

export {
  ALL_MATERIAL_SYMBOLS,
  RECOMMENDED_MATERIAL_SYMBOLS,
  isValidSymbolName,
  normalizeSymbolName,
  searchMaterialSymbols,
  type RecommendedIcon,
};

export interface MaterialSymbolProps {
  name?: string;
  size?: number | string;
  color?: string;
  className?: string;
  style?: JSX.CSSProperties;
  fallback?: string;
}

export function MaterialSymbol({
  name = "folder",
  size = 20,
  color = "currentColor",
  className = "",
  style = {},
  fallback = "folder",
}: MaterialSymbolProps) {
  const norm = normalizeSymbolName(name || "");
  const resolved = isValidSymbolName(norm) ? norm : fallback;
  const numSize = typeof size === "number" ? size : parseInt(String(size), 10) || 20;

  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        fontSize: `${numSize}px`,
        width: `${numSize}px`,
        height: `${numSize}px`,
        lineHeight: 1,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "middle",
        userSelect: "none",
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      {resolved}
    </span>
  );
}
