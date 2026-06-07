// tokens.template.ts — base de tokens para un short vertical 9:16.
//
// COPIAR a `src/tokens.ts` del proyecto Remotion y AJUSTAR:
//
//   1. Brand: `colors.accent`, `colors.accentGradient`, `colors.accentGlow`
//      según el wordmark del SaaS.
//   2. Fonts: el `loadFont` carga Plus Jakarta Sans por default. Si el
//      brand usa otra display font, swappear los imports + el familyName
//      del WordByWordText (asset) si hace falta.
//   3. VARIANT_NATIVE: tamaño del canvas del component library del SaaS
//      (1504×940 en iteralex; chequear `GALLERY_CANVAS` del bridge).
//
// El layout 3 zonas (WORDMARK, MOCKUP, CAPTIONS) y el LAPTOP frame son
// estables — no requieren tuning entre brands.

import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

loadJakarta("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});

loadJetBrains("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const fps = 30;
export const F = (s: number): number => Math.round(s * fps);

export const COMP = { width: 1080, height: 1920 } as const;

// Safe zones IG Story 9:16.
export const SAFE_TOP = 160;
export const SAFE_BOTTOM = 200;

// Tamaño nativo del canvas del component library del SaaS.
// Para iteralex es 1504×940 (ver GALLERY_CANVAS del bridge).
export const VARIANT_NATIVE = { width: 1504, height: 940 } as const;

// ─── Layout: 3 zonas verticales ──────────────────────────────────────
//
//   y=0    → 160    SAFE_TOP       reserva header IG
//   y=160  → 400    WORDMARK_ZONE  wordmark centrado
//   y=400  → 440    gap
//   y=440  → 1320   MOCKUP_ZONE    laptop o pain-tabs
//   y=1320 → 1380   gap
//   y=1380 → 1720   CAPTIONS_ZONE  captions
//   y=1720 → 1920   SAFE_BOTTOM    reserva reply input IG

export const WORDMARK_ZONE = {
  x: 0,
  y: 160,
  width: COMP.width,
  height: 240,
} as const;

export const MOCKUP_ZONE = {
  x: 0,
  y: 440,
  width: COMP.width,
  height: 880,
} as const;

export const CAPTIONS_ZONE = {
  x: 0,
  y: 1380,
  width: COMP.width,
  height: 340,
} as const;

// ─── Laptop frame (mockup del SaaS) ──────────────────────────────────
//
// Dimensiones fijas centradas en MOCKUP_ZONE. El bisel + topbar + base
// emulan un notebook (igual al iteralex-device-mockup del taller estático).

export const LAPTOP_WIDTH = 880;
export const LAPTOP_BORDER = 14;
export const LAPTOP_TOPBAR_H = 28;

// Screen del laptop: aspect-ratio 16:10. Width = LAPTOP_WIDTH - 2*BORDER.
export const LAPTOP_SCREEN_WIDTH = LAPTOP_WIDTH - LAPTOP_BORDER * 2; // 852
export const LAPTOP_SCREEN_HEIGHT = Math.round(LAPTOP_SCREEN_WIDTH * 10 / 16); // 533

// Base inferior simula la "bisagra/teclado".
export const LAPTOP_BASE_H = 14;

// Altura total del laptop = border top + screen + border bottom + base.
export const LAPTOP_HEIGHT =
  LAPTOP_BORDER + LAPTOP_SCREEN_HEIGHT + LAPTOP_BORDER + LAPTOP_BASE_H;

// Laptop centrado horizontalmente y verticalmente dentro de MOCKUP_ZONE.
export const LAPTOP = {
  x: MOCKUP_ZONE.x + (MOCKUP_ZONE.width - LAPTOP_WIDTH) / 2,
  y: MOCKUP_ZONE.y + (MOCKUP_ZONE.height - LAPTOP_HEIGHT) / 2,
  width: LAPTOP_WIDTH,
  height: LAPTOP_HEIGHT,
} as const;

// Viewport interno del laptop (donde renderiza DashboardCamera).
export const LAPTOP_VIEWPORT = {
  x: LAPTOP.x + LAPTOP_BORDER,
  y: LAPTOP.y + LAPTOP_BORDER + LAPTOP_TOPBAR_H,
  width: LAPTOP_SCREEN_WIDTH,
  height: LAPTOP_SCREEN_HEIGHT - LAPTOP_TOPBAR_H,
} as const;

// Base scale para que el variant entre justo a ancho del viewport.
export const VARIANT_BASE_SCALE = LAPTOP_VIEWPORT.width / VARIANT_NATIVE.width;

// ─── Brand colors — REEMPLAZAR por los del SaaS ──────────────────────
//
// El default acá es el sistema iteralex (naranja #F27A1A). Para otro
// brand, ajustar solo `accent`, `accentGradient`, `accentGlow`. El resto
// (bg, fg, etc.) suele ser brand-agnostic en shorts oscuros.

export const colors = {
  bg: "#0a0a0a",
  fg: "#ffffff",
  fgMuted: "rgba(255, 255, 255, 0.62)",
  fgDim: "rgba(255, 255, 255, 0.30)",
  accent: "#F27A1A",
  accentGradient:
    "linear-gradient(125deg, #FFB061 0%, #F27A1A 50%, #FF8A2E 100%)",
  accentGlow: "rgba(242, 122, 26, 0.45)",
} as const;
