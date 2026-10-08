import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, OffthreadVideo, staticFile } from "remotion";
import { VideoManifest } from "./manifest";
import { registry } from "./registry";
import { Frame } from "./Frame";
import { theme } from "./theme";

const asset = (s: string) => (s.startsWith("http") || s.startsWith("data:") ? s : staticFile(s));

/** A single 16:9 long-form chapter. Full videos will later stitch chapter MP4s. */
export const Video: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  return (
    <AbsoluteFill>
      <Frame />
      {manifest.timeline.map((item, i) => {
        const key = `t-${item.beat}-${i}`;
        if (item.track === "image" && item.src) {
          return (
            <Sequence key={key} from={item.startFrame} durationInFrames={item.durationFrames}>
              <AbsoluteFill style={{ backgroundColor: theme.navy }}>
                <Img src={asset(item.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </AbsoluteFill>
            </Sequence>
          );
        }
        if ((item.track === "clip" || item.track === "anim") && item.src) {
          return (
            <Sequence key={key} from={item.startFrame} durationInFrames={item.durationFrames}>
              <AbsoluteFill style={{ backgroundColor: theme.navy }}>
                <OffthreadVideo src={asset(item.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </AbsoluteFill>
            </Sequence>
          );
        }
        const entry = registry[item.component];
        if (!entry) return null;
        const Card = entry.component;
        const customBg = item.track === "anim" ? String((item.props as any)?.backgroundSrc || "") : "";
        const rawBgOpacity = Number((item.props as any)?.backgroundOpacity ?? 0.72);
        const bgOpacity = Math.max(0, Math.min(1, Number.isFinite(rawBgOpacity) ? rawBgOpacity : 0.72));
        return (
          <Sequence key={key} from={item.startFrame} durationInFrames={item.durationFrames} name={`${item.beat}: ${item.component}`}>
            {customBg ? (
              <AbsoluteFill>
                <Img src={asset(customBg)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: bgOpacity }} />
                <AbsoluteFill style={{ backgroundColor: "rgba(10,22,40,0.40)" }} />
              </AbsoluteFill>
            ) : null}
            <Card {...item.props} __holdFrames={item.durationFrames} />
          </Sequence>
        );
      })}
      {manifest.audio.filter((a) => a.src).map((a, i) => (
        <Sequence key={`audio-${i}`} from={a.startFrame} durationInFrames={a.durationFrames}>
          <Audio src={asset(a.src)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
