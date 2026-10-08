import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { theme } from "./theme";
import { continuousAnimationRegistry } from "./animations-continuous";

const lfTheme = {
  ...theme,
  navySurface: "#142440",
  navyLine: "#24375A",
  slate: "#8CA0B8",
  heatDeep: "#FF4D4D",
};

const toneColor = (tone?: string) => {
  if (tone === "heat") return lfTheme.heat;
  if (tone === "cold") return lfTheme.cold;
  if (tone === "white") return lfTheme.white;
  return lfTheme.teal;
};

type AnimEntry = {
  component: React.FC<any>;
  schema: z.ZodTypeAny;
  description: string;
  slots: string[];
  defaultDurationSec: number;
};

const baseProps = {
  title: z.string().optional(),
};

const batteryBufferSchema = z.object({
  ...baseProps,
  usablePct: z.number().min(0).max(100),
  bufferPct: z.number().min(0).max(100).default(0),
  usableLabel: z.string().optional().default("Usable"),
  bufferLabel: z.string().optional().default("Reserve"),
  footer: z.string().optional(),
});

const beforeAfterSchema = z.object({
  ...baseProps,
  beforeLabel: z.string(),
  beforePct: z.number().min(0).max(100),
  afterLabel: z.string(),
  afterPct: z.number().min(0).max(100),
  deltaLabel: z.string().optional(),
  footer: z.string().optional(),
});

const lineChartSchema = z.object({
  ...baseProps,
  seriesALabel: z.string().optional().default("A"),
  seriesA: z.array(z.number()).min(2),
  seriesBLabel: z.string().optional().default("B"),
  seriesB: z.array(z.number()).min(2).optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  footer: z.string().optional(),
});

const processFlowSchema = z.object({
  ...baseProps,
  nodes: z.array(z.string()).min(2).max(5),
  centerLabel: z.string().optional(),
  direction: z.enum(["forward", "reverse", "bidirectional"]).default("forward"),
  footer: z.string().optional(),
});

const timelineSchema = z.object({
  ...baseProps,
  milestones: z.array(
    z.object({
      label: z.string(),
      value: z.string().optional(),
      tone: z.enum(["teal", "heat", "cold", "white"]).optional(),
    })
  ).min(2).max(6),
  footer: z.string().optional(),
});

const counterSchema = z.object({
  ...baseProps,
  value: z.number(),
  decimals: z.number().int().min(0).max(2).default(0),
  prefix: z.string().optional().default(""),
  suffix: z.string().optional().default(""),
  label: z.string().optional(),
  tone: z.enum(["teal", "heat", "cold", "white"]).optional(),
  footer: z.string().optional(),
});

const systemDeltaSchema = z.object({
  ...baseProps,
  beforeLabel: z.string(),
  afterLabel: z.string(),
  beforeItems: z.array(z.string()).min(1).max(4),
  afterItems: z.array(z.string()).min(1).max(4),
  footer: z.string().optional(),
});

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const linearPhase = (frame: number, start: number, duration: number) =>
  clamp01((frame - start) / Math.max(1, duration));

const enter = (frame: number, fps: number, delay = 0, stiffness = 120) => {
  const p = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 19, stiffness, mass: 0.72 },
  });
  return clamp01(p);
};

const fade = (frame: number, start: number, duration = 12) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const titleSizeFor = (title: string) => {
  if (title.length > 54) return 54;
  if (title.length > 40) return 60;
  return 66;
};

const Title: React.FC<{ title?: string; kicker?: string }> = ({
  title,
  kicker,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!title && !kicker) return null;
  const p = enter(frame, fps, 0);
  const t = title || "";
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        top: 62,
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px)`,
      }}
    >
      {kicker ? (
        <div
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 27,
            fontWeight: 700,
            color: lfTheme.teal,
            letterSpacing: 4.2,
            marginBottom: 12,
          }}
        >
          {kicker.toUpperCase()}
        </div>
      ) : null}
      {title ? (
        <div
          style={{
            maxWidth: 1580,
            fontFamily: "Space Grotesk, Arial, sans-serif",
            fontSize: titleSizeFor(t),
            fontWeight: 700,
            color: lfTheme.white,
            lineHeight: 1.05,
            letterSpacing: -1.1,
          }}
        >
          {title}
        </div>
      ) : null}
    </div>
  );
};

const Footer: React.FC<{ text?: string }> = ({ text }) =>
  text ? (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 42,
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: 25,
        color: lfTheme.slate,
        lineHeight: 1.25,
      }}
    >
      {text}
    </div>
  ) : null;

const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(10,22,40,0.68)",
      border: `2px solid ${lfTheme.navyLine}`,
      borderRadius: 28,
      boxShadow: "0 22px 70px rgba(0,0,0,0.22)",
      ...style,
    }}
  >
    {children}
  </div>
);

const LegendPill: React.FC<{
  color: string;
  label: string;
  value: string;
  opacity?: number;
}> = ({ color, label, value, opacity = 1 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 18px",
      borderRadius: 999,
      background: "rgba(20,36,64,0.86)",
      border: `1px solid ${lfTheme.navyLine}`,
      opacity,
      fontFamily: "Inter, Arial, sans-serif",
      color: lfTheme.white,
      fontSize: 27,
      fontWeight: 650,
      whiteSpace: "nowrap",
    }}
  >
    <span
      style={{
        width: 13,
        height: 13,
        borderRadius: 99,
        background: color,
        boxShadow: `0 0 16px ${color}55`,
      }}
    />
    <span style={{ color: lfTheme.slate }}>{label}</span>
    <span style={{ fontWeight: 800, color: lfTheme.white }}>{value}</span>
  </div>
);

export const VALF001BatteryBuffer: React.FC<any> = ({
  title,
  usablePct,
  bufferPct,
  usableLabel,
  bufferLabel,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const usable = Math.min(100, Math.max(0, Number(usablePct)));
  const reserve = Math.min(100 - usable, Math.max(0, Number(bufferPct)));
  const remaining = Math.max(0, 100 - usable - reserve);

  const shellP = enter(frame, fps, 9);
  const usableP = linearPhase(frame, 16, 30);
  const reserveP = linearPhase(frame, 38, 18);
  const labelP = fade(frame, 42, 10);

  return (
    <AbsoluteFill>
      <Title
        title={title || "Gross capacity vs usable capacity"}
        kicker="Battery architecture"
      />

      <div
        style={{
          position: "absolute",
          left: 210,
          right: 210,
          top: 330,
          height: 420,
          opacity: shellP,
          transform: `translateY(${(1 - shellP) * 18}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            top: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          <span
            style={{
              fontSize: 27,
              fontWeight: 700,
              color: lfTheme.slate,
              letterSpacing: 1.2,
            }}
          >
            PACK CAPACITY WINDOW
          </span>
          <span
            style={{
              padding: "8px 15px",
              borderRadius: 999,
              fontSize: 25,
              fontWeight: 800,
              color: lfTheme.white,
              background: "rgba(20,36,64,0.9)",
              border: `1px solid ${lfTheme.navyLine}`,
            }}
          >
            GROSS 100%
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 55,
            right: 55,
            top: 78,
            height: 210,
            border: `5px solid ${lfTheme.slate}`,
            borderRadius: 32,
            padding: 14,
            display: "flex",
            overflow: "visible",
            background: "rgba(20,36,64,0.68)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${usable * usableP}%`,
              background: lfTheme.teal,
              borderRadius: "16px 5px 5px 16px",
              boxShadow: `0 0 34px ${lfTheme.teal}22`,
            }}
          />
          <div
            style={{
              height: "100%",
              width: `${reserve * reserveP}%`,
              background: lfTheme.heat,
              opacity: 0.96,
              marginLeft: reserve > 0 ? 4 : 0,
              borderRadius: "5px",
              boxShadow: `0 0 28px ${lfTheme.heat}22`,
            }}
          />
          <div
            style={{
              height: "100%",
              flex: 1,
              marginLeft: remaining > 0 ? 4 : 0,
              background: "rgba(36,55,90,0.82)",
              borderRadius: "5px 16px 16px 5px",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 44,
              height: 96,
              right: -49,
              top: 56,
              borderRadius: "0 14px 14px 0",
              background: lfTheme.slate,
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 325,
            display: "flex",
            justifyContent: "center",
            gap: 18,
            opacity: labelP,
          }}
        >
          <LegendPill
            color={lfTheme.teal}
            label={usableLabel || "Usable"}
            value={`${Math.round(usable)}%`}
          />
          {reserve > 0 ? (
            <LegendPill
              color={lfTheme.heat}
              label={bufferLabel || "Reserve"}
              value={`${Math.round(reserve)}%`}
            />
          ) : null}
          {remaining > 0.5 ? (
            <LegendPill
              color={lfTheme.navyLine}
              label="Remaining"
              value={`${Math.round(remaining)}%`}
            />
          ) : null}
        </div>
      </div>

      <Footer text={footer} />
    </AbsoluteFill>
  );
};

const HorizontalBattery: React.FC<{
  label: string;
  pct: number;
  accent: string;
  delay: number;
}> = ({ label, pct, accent, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, delay);
  const fillP = linearPhase(frame, delay + 10, 28);
  return (
    <Panel
      style={{
        width: 650,
        height: 360,
        padding: "34px 42px",
        boxSizing: "border-box",
        opacity: p,
        transform: `translateY(${(1 - p) * 22}px)`,
      }}
    >
      <div
        style={{
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: 29,
          fontWeight: 750,
          color: lfTheme.slate,
          marginBottom: 28,
          letterSpacing: 0.4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          position: "relative",
          width: 535,
          height: 128,
          border: `4px solid ${lfTheme.slate}`,
          borderRadius: 22,
          padding: 10,
          background: "rgba(20,36,64,0.84)",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, pct)) * fillP}%`,
            height: "100%",
            borderRadius: 12,
            background: accent,
            boxShadow: `0 0 26px ${accent}2b`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -30,
            top: 34,
            width: 28,
            height: 54,
            borderRadius: "0 9px 9px 0",
            background: lfTheme.slate,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 26,
          fontFamily: "Space Grotesk, Arial, sans-serif",
          fontSize: 68,
          lineHeight: 1,
          fontWeight: 750,
          color: accent,
          letterSpacing: -1.5,
        }}
      >
        {Math.round(pct)}%
      </div>
    </Panel>
  );
};

export const VALF002BeforeAfter: React.FC<any> = ({
  title,
  beforeLabel,
  beforePct,
  afterLabel,
  afterPct,
  deltaLabel,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const diff = Number(afterPct) - Number(beforePct);
  const arrowP = enter(frame, fps, 30, 150);

  return (
    <AbsoluteFill>
      <Title title={title || "Before vs after"} kicker="Capacity comparison" />

      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 310,
          bottom: 130,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 46,
        }}
      >
        <HorizontalBattery
          label={beforeLabel}
          pct={Number(beforePct)}
          accent={lfTheme.slate}
          delay={8}
        />

        <div
          style={{
            width: 170,
            textAlign: "center",
            opacity: arrowP,
            transform: `scale(${0.9 + 0.1 * arrowP})`,
          }}
        >
          <div
            style={{
              fontFamily: "Space Grotesk, Arial, sans-serif",
              fontSize: 70,
              fontWeight: 700,
              color: diff < 0 ? lfTheme.heat : lfTheme.teal,
              lineHeight: 1,
            }}
          >
            →
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: diff < 0 ? lfTheme.heat : lfTheme.teal,
              whiteSpace: "nowrap",
            }}
          >
            {deltaLabel || `${diff > 0 ? "+" : ""}${diff.toFixed(0)} pts`}
          </div>
        </div>

        <HorizontalBattery
          label={afterLabel}
          pct={Number(afterPct)}
          accent={diff < 0 ? lfTheme.heat : lfTheme.teal}
          delay={22}
        />
      </div>

      <Footer text={footer} />
    </AbsoluteFill>
  );
};

const makePath = (
  values: number[],
  w: number,
  h: number,
  min: number,
  max: number
) => {
  const range = Math.max(1e-6, max - min);
  return values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
};

const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 100) return String(Math.round(v));
  if (Math.abs(v) >= 10) return v.toFixed(1).replace(/\.0$/, "");
  return v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

export const VALF003LineChart: React.FC<any> = ({
  title,
  seriesALabel,
  seriesA,
  seriesBLabel,
  seriesB,
  xLabel,
  yLabel,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, 7);
  const draw = linearPhase(frame, 20, 42);
  const all = [...seriesA, ...(seriesB || [])].map(Number);
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const spread = Math.max(1e-6, rawMax - rawMin);
  const niceStep =
    spread <= 1 ? 0.2 :
    spread <= 5 ? 1 :
    spread <= 15 ? 5 :
    spread <= 40 ? 10 :
    spread <= 100 ? 20 :
    spread <= 250 ? 50 : 100;
  let min = Math.floor(rawMin / niceStep) * niceStep;
  let max = Math.ceil(rawMax / niceStep) * niceStep;
  if (min === max) max = min + niceStep;

  const chartW = 1320;
  const chartH = 430;
  const originX = 110;
  const originY = 62;

  const aPath = makePath(seriesA.map(Number), chartW, chartH, min, max);
  const bPath = seriesB
    ? makePath(seriesB.map(Number), chartW, chartH, min, max)
    : "";

  const lastA = Number(seriesA[seriesA.length - 1]);
  const lastB = seriesB ? Number(seriesB[seriesB.length - 1]) : null;
  const yFor = (v: number) => originY + chartH - ((v - min) / (max - min)) * chartH;

  return (
    <AbsoluteFill>
      <Title title={title || "Trend over time"} kicker="Animated chart" />

      <Panel
        style={{
          position: "absolute",
          left: 155,
          right: 155,
          top: 275,
          height: 650,
          opacity: p,
          transform: `translateY(${(1 - p) * 18}px)`,
        }}
      >
        <svg
          width="1610"
          height="620"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1={originX}
              y1={originY + chartH * g}
              x2={originX + chartW}
              y2={originY + chartH * g}
              stroke={lfTheme.navyLine}
              strokeWidth={g === 1 ? 4 : 2}
              opacity={g === 1 ? 1 : 0.72}
            />
          ))}
          <line
            x1={originX}
            y1={originY}
            x2={originX}
            y2={originY + chartH}
            stroke={lfTheme.navyLine}
            strokeWidth="4"
          />

          <path
            d={aPath}
            transform={`translate(${originX},${originY})`}
            fill="none"
            stroke={lfTheme.teal}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - draw}
          />
          {seriesB ? (
            <path
              d={bPath}
              transform={`translate(${originX},${originY})`}
              fill="none"
              stroke={lfTheme.slate}
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - draw}
            />
          ) : null}

          {draw > 0.98 ? (
            <>
              <circle
                cx={originX + chartW}
                cy={yFor(lastA)}
                r="10"
                fill={lfTheme.teal}
              />
              {lastB !== null ? (
                <circle
                  cx={originX + chartW}
                  cy={yFor(lastB)}
                  r="9"
                  fill={lfTheme.slate}
                />
              ) : null}
            </>
          ) : null}

          <text
            x="30"
            y={originY + 8}
            fill={lfTheme.slate}
            fontFamily="Inter"
            fontSize="25"
          >
            {fmtAxis(max)}
          </text>
          <text
            x="30"
            y={originY + chartH + 8}
            fill={lfTheme.slate}
            fontFamily="Inter"
            fontSize="25"
          >
            {fmtAxis(min)}
          </text>
        </svg>

        <div
          style={{
            position: "absolute",
            left: originX,
            top: 22,
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 26,
            color: lfTheme.slate,
            fontWeight: 650,
          }}
        >
          {yLabel || ""}
        </div>

        <div
          style={{
            position: "absolute",
            right: 180,
            top: 24,
            display: "flex",
            gap: 28,
            padding: "10px 16px",
            borderRadius: 999,
            background: "rgba(20,36,64,0.82)",
            border: `1px solid ${lfTheme.navyLine}`,
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 25,
            fontWeight: 700,
          }}
        >
          <span style={{ color: lfTheme.teal }}>
            ● {seriesALabel || "A"}
          </span>
          {seriesB ? (
            <span style={{ color: lfTheme.slate }}>
              ● {seriesBLabel || "B"}
            </span>
          ) : null}
        </div>

        <div
          style={{
            position: "absolute",
            right: 175,
            bottom: 34,
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 26,
            color: lfTheme.slate,
            fontWeight: 650,
          }}
        >
          {xLabel || ""}
        </div>
      </Panel>

      <Footer text={footer} />
    </AbsoluteFill>
  );
};

export const VALF004ProcessFlow: React.FC<any> = ({
  title,
  nodes,
  centerLabel,
  direction,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = nodes.length;
  const panelP = enter(frame, fps, 7);
  const flowStart = 48;
  const loopFrames = Math.round(fps * 1.9);
  const loopP =
    frame < flowStart ? 0 : ((frame - flowStart) % loopFrames) / loopFrames;

  const panelLeft = 155;
  const panelWidth = 1610;
  const innerLeft = 95;
  const innerRight = 95;
  const usableW = panelWidth - innerLeft - innerRight;
  const gap = n <= 3 ? 90 : 62;
  const nodeW = Math.min(280, (usableW - gap * (n - 1)) / n);
  const nodeH = 165;
  const y = 245;
  const positions = nodes.map(
    (_: string, i: number) => innerLeft + i * (nodeW + gap)
  );

  const connectorStart = positions[0] + nodeW;
  const connectorEnd = positions[n - 1];
  const pulseX = connectorStart + (connectorEnd - connectorStart) * loopP;

  return (
    <AbsoluteFill>
      <Title title={title || "Energy flow"} kicker="Process diagram" />

      <Panel
        style={{
          position: "absolute",
          left: panelLeft,
          top: 285,
          width: panelWidth,
          height: 620,
          opacity: panelP,
          transform: `translateY(${(1 - panelP) * 18}px)`,
        }}
      >
        {centerLabel ? (
          <div
            style={{
              position: "absolute",
              left: 90,
              right: 90,
              top: 45,
              textAlign: "center",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: 29,
              lineHeight: 1.25,
              fontWeight: 650,
              color: lfTheme.slate,
            }}
          >
            {centerLabel}
          </div>
        ) : null}

        <svg
          width={panelWidth}
          height="620"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {positions.slice(0, -1).map((x: number, i: number) => {
            const x1 = x + nodeW;
            const x2 = positions[i + 1];
            const midY = y + nodeH / 2;
            return (
              <g key={i}>
                <line
                  x1={x1 + 12}
                  y1={midY}
                  x2={x2 - 12}
                  y2={midY}
                  stroke={lfTheme.navyLine}
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={midY + 12}
                  textAnchor="middle"
                  fill={lfTheme.teal}
                  fontFamily="Inter"
                  fontSize="37"
                  fontWeight="700"
                >
                  {direction === "reverse"
                    ? "←"
                    : direction === "bidirectional"
                    ? "↔"
                    : "→"}
                </text>
              </g>
            );
          })}

          {frame >= flowStart && connectorEnd > connectorStart ? (
            <circle
              cx={pulseX}
              cy={y + nodeH / 2}
              r="13"
              fill={lfTheme.teal}
              opacity="0.98"
            />
          ) : null}
        </svg>

        {nodes.map((node: string, i: number) => {
          const q = enter(frame, fps, 14 + i * 7);
          return (
            <div
              key={node + i}
              style={{
                position: "absolute",
                left: positions[i],
                top: y,
                width: nodeW,
                height: nodeH,
                boxSizing: "border-box",
                border: `2px solid ${
                  i === 0 || i === n - 1
                    ? lfTheme.teal + "88"
                    : lfTheme.navyLine
                }`,
                borderRadius: 23,
                background: "rgba(20,36,64,0.92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 22px",
                textAlign: "center",
                fontFamily: "Space Grotesk, Arial, sans-serif",
                fontSize: node.length > 13 ? 30 : 34,
                lineHeight: 1.08,
                fontWeight: 700,
                color: lfTheme.white,
                opacity: q,
                transform: `scale(${0.95 + 0.05 * q})`,
              }}
            >
              {node}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: 100,
            right: 100,
            bottom: 48,
            textAlign: "center",
            fontFamily: "Inter, Arial, sans-serif",
            color: lfTheme.teal,
            fontSize: 27,
            fontWeight: 750,
            letterSpacing: 0.4,
            opacity: fade(frame, 45, 10),
          }}
        >
          {direction === "reverse"
            ? "REVERSE FLOW"
            : direction === "bidirectional"
            ? "BIDIRECTIONAL FLOW"
            : "FORWARD FLOW"}
        </div>
      </Panel>

      <Footer text={footer} />
    </AbsoluteFill>
  );
};

export const VALF005Timeline: React.FC<any> = ({
  title,
  milestones,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, 7);
  const lineP = linearPhase(frame, 18, 40);

  const left = 150;
  const width = 1310;
  const y = 300;
  const step = width / Math.max(1, milestones.length - 1);

  return (
    <AbsoluteFill>
      <Title title={title || "Timeline"} kicker="Milestones" />

      <Panel
        style={{
          position: "absolute",
          left: 155,
          top: 300,
          width: 1610,
          height: 590,
          opacity: p,
          transform: `translateY(${(1 - p) * 18}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left,
            top: y,
            width,
            height: 7,
            borderRadius: 10,
            background: lfTheme.navyLine,
          }}
        />
        <div
          style={{
            position: "absolute",
            left,
            top: y,
            width: width * lineP,
            height: 7,
            borderRadius: 10,
            background: lfTheme.teal,
            boxShadow: `0 0 20px ${lfTheme.teal}33`,
          }}
        />

        {milestones.map((m: any, i: number) => {
          const x = left + i * step;
          const revealAt = 20 + i * 8;
          const q = enter(frame, fps, revealAt, 145);
          const c = toneColor(m.tone);
          const labelSize =
            String(m.label || "").length > 14 ? 25 : 29;
          return (
            <div
              key={String(m.label) + i}
              style={{
                position: "absolute",
                left: x - 110,
                top: y - 150,
                width: 220,
                height: 300,
                textAlign: "center",
                opacity: q,
                transform: `translateY(${(1 - q) * 15}px)`,
              }}
            >
              <div
                style={{
                  height: 70,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  fontFamily: "Space Grotesk, Arial, sans-serif",
                  fontSize: 40,
                  fontWeight: 750,
                  color: c,
                  lineHeight: 1,
                }}
              >
                {m.value || ""}
              </div>

              <div
                style={{
                  width: 30,
                  height: 30,
                  margin: "55px auto 0",
                  borderRadius: "50%",
                  background: c,
                  border: `5px solid ${lfTheme.navySurface}`,
                  boxShadow: `0 0 24px ${c}66`,
                }}
              />

              <div
                style={{
                  marginTop: 33,
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: labelSize,
                  lineHeight: 1.15,
                  fontWeight: 650,
                  color: lfTheme.white,
                }}
              >
                {m.label}
              </div>
            </div>
          );
        })}
      </Panel>

      <Footer text={footer} />
    </AbsoluteFill>
  );
};

const formatCount = (value: number, decimals: number) => {
  if (decimals > 0) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return Math.round(value).toLocaleString("en-US");
};

export const VALF006Counter: React.FC<any> = ({
  title,
  value,
  decimals,
  prefix,
  suffix,
  label,
  tone,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = toneColor(tone);
  const boxP = enter(frame, fps, 8);
  const countP = linearPhase(frame, 18, 46);
  const eased = 1 - Math.pow(1 - countP, 3);
  const shown = Number(value) * eased;
  const digits = String(Math.abs(Math.round(Number(value)))).length;
  const numberSize = digits >= 7 ? 150 : digits >= 5 ? 178 : 205;

  return (
    <AbsoluteFill>
      <Title title={title} kicker="Key number" />

      <Panel
        style={{
          position: "absolute",
          left: 380,
          right: 380,
          top: 330,
          height: 430,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: boxP,
          transform: `scale(${0.97 + 0.03 * boxP})`,
        }}
      >
        <div style={{ textAlign: "center", width: "100%" }}>
          <div
            style={{
              fontFamily: "Space Grotesk, Arial, sans-serif",
              fontSize: numberSize,
              lineHeight: 0.9,
              fontWeight: 750,
              color: accent,
              letterSpacing: digits >= 6 ? -5 : -3,
              whiteSpace: "nowrap",
            }}
          >
            {prefix || ""}
            {formatCount(shown, Number(decimals || 0))}
            {suffix || ""}
          </div>

          {label ? (
            <div
              style={{
                marginTop: 30,
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: 40,
                lineHeight: 1.15,
                color: lfTheme.white,
                fontWeight: 650,
              }}
            >
              {label}
            </div>
          ) : null}

          <div
            style={{
              width: 190 * fade(frame, 54, 14),
              height: 5,
              margin: "34px auto 0",
              borderRadius: 99,
              background: accent,
              boxShadow: `0 0 18px ${accent}55`,
            }}
          />
        </div>
      </Panel>

      <Footer text={footer} />
    </AbsoluteFill>
  );
};

export const VALF007SystemDelta: React.FC<any> = ({
  title,
  beforeLabel,
  afterLabel,
  beforeItems,
  afterItems,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leftP = enter(frame, fps, 8);
  const arrowP = enter(frame, fps, 27, 155);
  const rightP = enter(frame, fps, 34);

  const renderSide = (
    label: string,
    items: string[],
    accent: string,
    p: number,
    direction: -1 | 1
  ) => (
    <Panel
      style={{
        width: 660,
        height: 455,
        padding: "38px 42px",
        boxSizing: "border-box",
        border: `2px solid ${accent}66`,
        opacity: p,
        transform: `translateX(${direction * (1 - p) * 28}px)`,
      }}
    >
      <div
        style={{
          fontFamily: "Space Grotesk, Arial, sans-serif",
          fontSize: 43,
          fontWeight: 750,
          color: accent,
          marginBottom: 32,
          lineHeight: 1.05,
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 19,
        }}
      >
        {items.map((item: string, i: number) => {
          const q = fade(frame, (direction < 0 ? 20 : 40) + i * 6, 10);
          return (
            <div
              key={item + i}
              style={{
                display: "flex",
                gap: 17,
                alignItems: "flex-start",
                opacity: q,
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: item.length > 28 ? 29 : 32,
                lineHeight: 1.18,
                color: lfTheme.white,
                fontWeight: 620,
              }}
            >
              <span
                style={{
                  width: 11,
                  height: 11,
                  flex: "0 0 11px",
                  borderRadius: 99,
                  background: accent,
                  marginTop: 12,
                  boxShadow: `0 0 12px ${accent}55`,
                }}
              />
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );

  return (
    <AbsoluteFill>
      <Title title={title || "System change"} kicker="Before / after" />

      <div
        style={{
          position: "absolute",
          left: 180,
          right: 180,
          top: 320,
          bottom: 135,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 42,
        }}
      >
        {renderSide(
          beforeLabel,
          beforeItems,
          lfTheme.slate,
          leftP,
          -1
        )}

        <div
          style={{
            width: 95,
            textAlign: "center",
            fontFamily: "Space Grotesk, Arial, sans-serif",
            fontSize: 72,
            fontWeight: 750,
            color: lfTheme.teal,
            opacity: arrowP,
            transform: `scale(${0.86 + 0.14 * arrowP})`,
          }}
        >
          →
        </div>

        {renderSide(
          afterLabel,
          afterItems,
          lfTheme.teal,
          rightP,
          1
        )}
      </div>

      <Footer text={footer} />
    </AbsoluteFill>
  );
};

export const animationRegistry: Record<string, AnimEntry> = {
  ...continuousAnimationRegistry,
  "VA-LF-001": {
    component: VALF001BatteryBuffer,
    schema: batteryBufferSchema,
    description:
      "Animated battery fill with usable, reserve, and optional remaining regions.",
    slots: [
      "title",
      "usablePct",
      "bufferPct",
      "usableLabel",
      "bufferLabel",
      "footer",
    ],
    defaultDurationSec: 8,
  },
  "VA-LF-002": {
    component: VALF002BeforeAfter,
    schema: beforeAfterSchema,
    description:
      "Two animated horizontal battery gauges for before/after capacity, usable-window, or SOC comparison.",
    slots: [
      "title",
      "beforeLabel",
      "beforePct",
      "afterLabel",
      "afterPct",
      "deltaLabel",
      "footer",
    ],
    defaultDurationSec: 8,
  },
  "VA-LF-003": {
    component: VALF003LineChart,
    schema: lineChartSchema,
    description: "Animated one- or two-series line chart drawn over time.",
    slots: [
      "title",
      "seriesALabel",
      "seriesA",
      "seriesBLabel",
      "seriesB",
      "xLabel",
      "yLabel",
      "footer",
    ],
    defaultDurationSec: 9,
  },
  "VA-LF-004": {
    component: VALF004ProcessFlow,
    schema: processFlowSchema,
    description:
      "Animated process/energy-flow diagram with 2-5 nodes and a repeating flow pulse.",
    slots: ["title", "nodes", "centerLabel", "direction", "footer"],
    defaultDurationSec: 8,
  },
  "VA-LF-005": {
    component: VALF005Timeline,
    schema: timelineSchema,
    description:
      "Animated milestone timeline for software, recalls, legal events, or development stages.",
    slots: ["title", "milestones", "footer"],
    defaultDurationSec: 9,
  },
  "VA-LF-006": {
    component: VALF006Counter,
    schema: counterSchema,
    description:
      "Large animated numeric count-up for money, percentages, capacity, fleet size, range, or cycle count.",
    slots: [
      "title",
      "value",
      "decimals",
      "prefix",
      "suffix",
      "label",
      "tone",
      "footer",
    ],
    defaultDurationSec: 7,
  },
  "VA-LF-007": {
    component: VALF007SystemDelta,
    schema: systemDeltaSchema,
    description:
      "Animated before/after system or software-version comparison with short change lists.",
    slots: [
      "title",
      "beforeLabel",
      "afterLabel",
      "beforeItems",
      "afterItems",
      "footer",
    ],
    defaultDurationSec: 9,
  },
};

export const availableAnimations = () =>
  Object.keys(animationRegistry).sort();
