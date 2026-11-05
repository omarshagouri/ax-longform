import React, { createContext, useContext } from "react";
import { useCurrentFrame as useRawCurrentFrame } from "remotion";

/**
 * Long-form reveal choreography. Existing LF animations were authored with
 * entrance events mostly in the first ~60-100 frames; the containing chapter
 * beat often lasts 6-12 seconds. Move through those authored cue frames over
 * the entire actual beat instead of finishing everything in seconds 1-3.
 *
 * These reference endpoints are per-animation (not arbitrary playback speed).
 * The normal frame-based motions remain deterministic and keep their order.
 * The final 2% is a tiny settled beat, not a multi-second frozen picture.
 */
export const LF_REVEAL_LAST_FRAME: Readonly<Record<string, number>> = {
  "VA-LF-001": 68,
  "VA-LF-002": 72,
  "VA-LF-003": 73,
  "VA-LF-004": 86,
  "VA-LF-005": 76,
  "VA-LF-006": 79,
  "VA-LF-007": 88,
  "VA-LF-008": 60,
  "VA-LF-009": 75,
  "VA-LF-010": 75,
  "VA-LF-011": 75,
  "VA-LF-012": 83,
  "VA-LF-013": 65,
  // VA-LF-014 already uses the actual beat duration in Dashboard.tsx.
  "VA-LF-015": 110,
  "VA-LF-016": 110,
  "VA-LF-017": 110,
  "VA-LF-018": 110,
  "VA-LF-019": 110,
  "VA-LF-020": 110,
};

type Timing = { animationId: string; durationFrames: number };
const Context = createContext<Timing | null>(null);
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const LFAnimationTimingProvider: React.FC<{
  animationId: string;
  durationFrames: number;
  children: React.ReactNode;
}> = ({ animationId, durationFrames, children }) => (
  <Context.Provider value={{ animationId, durationFrames }}>
    {children}
  </Context.Provider>
);

export function getLFRevealProgress(frame: number, durationFrames: number): number {
  const last = Math.max(1, durationFrames - 1);
  // Keep 2% for a clean final pose, with content revealed across the other 98%.
  return clamp01(frame / Math.max(1, last * 0.98));
}

export function getLFPacedFrame(
  frame: number,
  durationFrames: number,
  animationId: string,
): number {
  const target = LF_REVEAL_LAST_FRAME[animationId];
  if (!target || !Number.isFinite(durationFrames) || durationFrames < 2) return frame;
  return target * getLFRevealProgress(frame, durationFrames);
}

/** Animated content uses an authored cue-clock stretched to the real beat. */
export function useLFPacedFrame(): number {
  const raw = useRawCurrentFrame();
  const context = useContext(Context);
  return context
    ? getLFPacedFrame(raw, context.durationFrames, context.animationId)
    : raw;
}

/** Use this only when continuous natural-speed looping matters independently. */
export function useLFRealFrame(): number {
  return useRawCurrentFrame();
}

/** From 0 to 1 over the entire real beat, for staged labels and editorial layers. */
export function useLFRevealProgress(): number {
  const raw = useRawCurrentFrame();
  const context = useContext(Context);
  return context
    ? getLFRevealProgress(raw, context.durationFrames)
    : 1;
}
