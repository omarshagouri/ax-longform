import React from "react";
import { AbsoluteFill } from "remotion";
import { Frame } from "./Frame";
import { animationRegistry } from "./animations";

export type AnimationPreviewProps = {
  animationId: string;
  values: Record<string, unknown>;
  durationFrames: number;
};

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({
  animationId,
  values,
  durationFrames,
}) => {
  const entry = animationRegistry[animationId];
  if (!entry) {
    return (
      <AbsoluteFill
        style={{
          background: "#0A1628",
          color: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          fontSize: 54,
        }}
      >
        Unknown animation: {animationId}
      </AbsoluteFill>
    );
  }

  const Anim = entry.component;
  return (
    <AbsoluteFill>
      <Frame />
      <Anim {...values} __holdFrames={durationFrames} />
    </AbsoluteFill>
  );
};
