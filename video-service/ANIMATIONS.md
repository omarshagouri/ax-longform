# AmpCoreX Long-Form Animation Library V1

ID family: VA-LF-*.
Renderer: video-service / ax-longform-render.
Purpose: reusable 1920x1080 motion graphics that can be selected exactly like VC-LF cards.

| ID | Name | Best use | Main slots | Default |
|---|---|---|---|---:|
| VA-LF-001 | Battery Buffer Reveal | usable vs reserve capacity, hidden buffer | title, usablePct, bufferPct, usableLabel, bufferLabel, footer | 8s |
| VA-LF-002 | Before / After Battery | capacity/SOC/usable-window comparison | title, beforeLabel, beforePct, afterLabel, afterPct, deltaLabel, footer | 8s |
| VA-LF-003 | Animated Line Chart | degradation/range/voltage/charging trends | title, seriesALabel, seriesA, seriesBLabel, seriesB, xLabel, yLabel, footer | 9s |
| VA-LF-004 | Process / Energy Flow | charger→BMS→pack, regen, heat/data flow | title, nodes, centerLabel, direction, footer | 8s |
| VA-LF-005 | Milestone Timeline | software, recalls, legal/product chronology | title, milestones, footer | 9s |
| VA-LF-006 | Number Count-Up | fleet size, %, capacity, money, cycle count | title, value, decimals, prefix, suffix, label, tone, footer | 7s |
| VA-LF-007 | System Before / After | BMS/software/architecture behavior change | title, beforeLabel, afterLabel, beforeItems, afterItems, footer | 9s |

## Renderer rule

The existing /render-chapter endpoint accepts both:
- VC-LF-* -> static/designed card
- VA-LF-* -> renderer-generated animation

The beat shape is unchanged:

{"beat":"1","card_id":"VA-LF-001","values":{...},"duration":"8"}

This keeps Make and Visual_Plan compatible with one ID field.

## Selection rules

Use VA-LF when movement communicates the idea better than a text card: process, progression, change over time, flow, before/after state, or numeric reveal.

Do not add facts that are absent from narration/evidence.
Display text should be shorter than narration.
