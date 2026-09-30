import React from "react";
import { AbsoluteFill, staticFile, Img } from "remotion";
import { theme } from "./theme";

/** 1920x1080 AmpCoreX long-form background. */
export const Frame: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: theme.navy }}>
    <Img
      src={staticFile("background.png")}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);
