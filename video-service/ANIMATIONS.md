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
| VA-LF-013 | Dynamic Side-by-Side Comparator | two conditions with continuously different activity/stress | title, leftLabel, rightLabel, leftValue, rightValue, leftIntensity, rightIntensity, metricLabel, footer | 9s |

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
- VA-LF-013: two simultaneous motion lanes for comparison

Do not use motion as decoration only.
Do not add facts, mechanisms, values, rankings, or causal claims that are absent from narration/evidence.
Keep display text substantially shorter than narration.
