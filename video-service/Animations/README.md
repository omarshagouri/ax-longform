# Animations — Long-form motion library

**One folder for all animation implementation and QA**, alongside `video-service/Cards/`.

## Files

| File | Purpose |
|---|---|
| `registry.tsx` | Core VA-LF animation definitions, unified `animationRegistry`, schema validation, export used by Remotion renderer |
| `continuous.tsx` | Continuous-motion VA-LF animation components |
| `editorial.tsx` | Purpose-built explanatory VA-LF-015–020 components |
| `testing/qa-core.mjs` | Base animation render, canonical and stress screenshot checks |
| `testing/qa-continuous.mjs` | Continuous motion render checks |
| `testing/qa-editorial.mjs` | Individual editorial animation MP4 and checkpoint inspection |

## Permanent numeric-bounds policy for new animations

Every **user-supplied bounded numeric animation field** must use
`clampNumeric(min, max)` from `../src/clampNumeric` in its Zod schema.
For bounded integer fields (grid indexes/counts), use `clampInteger(min, max)`.
Out-of-range finite values are normalized to the nearest permitted boundary,
not rejected. Values already within range remain unchanged.

The renderer and animation preview must apply **the numeric values returned
by their bounded Zod slot parsers** to actual drawing, not only validate them.
Do not newly reject unrelated editorial text in existing previews; the
`normalizeBoundedAnimationValues` helper preserves non-numeric fields. The standalone dashboard path follows the
same policy. Add low / high / in-range regression cases to
`scripts/test-lf-animation-clamping.mjs` for every new bounded numeric field,
and keep that test in `validate-longform-video.yml`.

Non-numeric input and missing required fields still fail validation. Unbounded
measured/chart values have no arbitrary invented min/max. Clamping is a
visual input compatibility rule; do not represent a clamped value as a verified
battery measurement or external research result. Preserve full-beat reveal timing.

## One standard renderer and naming system

Every animation retains its existing `VA-LF-###` ID, catalog entry and Zod prop schema. The only public registry is `animationRegistry` in `registry.tsx`; don't add competing registries elsewhere.

Production consumes the library through `src/registry.ts` and preview through `src/AnimationPreview.tsx`. Do not import animations from `src/animations*.tsx`; those paths were removed in this reorganization.

## Tests (run from `video-service/`)

```sh
python3 scripts/extract_cards.py Cards
node Animations/testing/qa-core.mjs
node Animations/testing/qa-continuous.mjs
node Animations/testing/qa-editorial.mjs VA-LF-015
# Repeat editorial test for each ID through VA-LF-020
npm run build
```

GitHub Actions execute these scripts, render previews and upload corresponding QA artifacts. Outputs are not source code and are not committed.

## Existing asset behavior

The refactor preserves animation behavior; no motion semantics, existing IDs, props or durations have been changed. Use the live visual dataset to check Ready status; merged code alone does not imply production Cloud Run deployment.

## Existing catalog / usage reference

# Long-Form Animation Library V2

ID family: VA-LF-*.
Renderer: video-service / ax-longform-render.
Purpose: reusable 1920x1080 motion graphics selected by the Visual Plan Agent alongside VC-LF cards and VV-LF clips.

| ID | Name | Best use | Main slots | Default |
|---|---|---|---|---:|
| VA-LF-001 | Battery Buffer Reveal | usable vs reserve capacity, hidden buffer | title, usablePct, bufferPct, usableLabel, bufferLabel, footer | 8s |
| VA-LF-002 | Before / After Battery | capacity/SOC/usable-window comparison | title, beforeLabel, beforePct, afterLabel, afterPct, deltaLabel, footer | 8s |
| VA-LF-003 | Animated Line Chart | degradation/range/voltage/charging trends | title, seriesALabel, seriesA, seriesBLabel, seriesB, xLabel, yLabel, footer | 9s |
| VA-LF-004 | Process / Energy Flow | charger→BMS→pack, regen, heat/data flow | title, nodes, centerLabel, direction, footer | 8s |
| VA-LF-005 | Milestone Timeline | software, recalls, legal/product chronology | title, milestones, footer | 9s |
| VA-LF-006 | Number Count-Up | fleet size, %, capacity, money, cycle count | title, value, decimals, prefix, suffix, label, tone, footer | 7s |
| VA-LF-007 | System Before / After | BMS/software/architecture behavior change | title, beforeLabel, afterLabel, beforeItems, afterItems, footer | 9s |
| VA-LF-008 | Continuous Packet Stream | continuous energy/data movement across system nodes | title, nodes, flowLabel, intensity, footer | 8s |
| VA-LF-009 | Control Gate / Throttling | BMS power/current limiting, charge taper, bottlenecks | title, inputLabel, gateLabel, outputLabel, inputRate, outputRate, footer | 8s |
| VA-LF-010 | Thermal Cell Field | hot spots, heat propagation, cooling sweep | title, heatLevel, hotspotRow, hotspotCol, cooling, note, footer | 9s |
| VA-LF-011 | Live Calibration Shift | displayed SoH/range estimate moving while usable energy stays stable | title, displayedStart, displayedEnd, usablePct, displayedLabel, usableLabel, footer | 9s |
| VA-LF-012 | Data Stream → Decision | sensor data feeding BMS logic and producing control action | title, sensors, decisionLabel, actionLabel, footer | 9s |
| VA-LF-013 | Dynamic Side-by-Side Comparator | two conditions compared by independent progress bars on a 0–100 reference scale | title, leftLabel, rightLabel, leftValue, rightValue, leftIntensity, rightIntensity, metricLabel, footer | 9s |

## Renderer rule

The existing /render-chapter endpoint accepts:
- VC-LF-* -> designed card
- VA-LF-* -> renderer-generated animation

The beat shape stays compatible:
{"beat":"1","card_id":"VA-LF-008","values":{...},"duration":"8"}

## Selection rules

Prefer VA-LF when motion itself helps explain the mechanism, change, feedback, thermal behavior, data flow, power flow, or comparison.

Continuous-motion family:
- VA-LF-004: one repeating process pulse
- VA-LF-008: multiple continuously moving energy/data packets
- VA-LF-009: continuous flow entering and leaving a control gate at different rates
- VA-LF-010: thermal pulse field with moving cooling sweep
- VA-LF-011: active calibration scan and changing estimate
- VA-LF-012: continuous sensor packets into BMS logic and output action
- VA-LF-013: two independent progress bars that fill once to the supplied level, then hold (no looping particles). `leftIntensity` and `rightIntensity` are each a percentage from 0 to 100 of the full gray reference track: 50 and 50 yield equal half-length colored bars. These values are normalized illustrative proportions, not measured battery aging rates unless independently sourced and correctly labeled.
  Each colored bar shows its animated numeric level (e.g., `50%`) inside the bar when there is room; values near zero display on the gray track for legibility. Both comparison headings and values use independently fitted, vertically reserved text zones so a wrapped value cannot overlap the metric or bar.

Do not use motion as decoration only.
Do not add facts, mechanisms, values, rankings, or causal claims that are absent from narration/evidence.
Keep display text substantially shorter than narration.
