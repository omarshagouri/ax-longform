import { z } from "zod";

/**
 * AmpCoreX animation input policy: bounded numeric values never reject solely
 * for being outside their documented range. Valid values pass through unchanged.
 * Non-numeric input is still rejected; a missing required field is not fabricated.
 */
export const clampNumeric = (min: number, max: number) => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    throw new Error("Invalid animation numeric bounds");
  }
  return z.preprocess(
    (value) => typeof value === "number" && Number.isFinite(value)
      ? Math.max(min, Math.min(max, value))
      : value,
    z.number().min(min).max(max),
  );
};

/** Bounded integer controls (grid indexes, counts): round after clamping. */
export const clampInteger = (min: number, max: number) =>
  z.preprocess(
    (value) => typeof value === "number" && Number.isFinite(value)
      ? Math.round(Math.max(min, Math.min(max, value)))
      : value,
    z.number().int().min(min).max(max),
  );

/** For standalone animation rendering paths that do not parse a Zod schema. */
export const clampNumericValue = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : value;
