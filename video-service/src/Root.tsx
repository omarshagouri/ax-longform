import React from "react";
import { Composition, Still } from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Video } from "./Video";
import { Thumbnail } from "./Thumbnail";
import { AnimationPreview, AnimationPreviewProps } from "./AnimationPreview";
import { sampleManifest } from "./sample-manifest";
import { totalFrames, VideoManifest } from "./manifest";

const { waitUntilDone: waitSpace } = loadSpaceGrotesk("normal", {
  weights: ["500", "600", "700"],
});
const { waitUntilDone: waitInter } = loadInter("normal", {
  weights: ["500", "600", "700"],
});

const waitForFonts = async () => {
  await Promise.all([waitSpace(), waitInter()]);
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AXLongForm"
      component={Video}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={totalFrames(sampleManifest)}
      defaultProps={{ manifest: sampleManifest }}
      calculateMetadata={async ({ props }) => {
        await waitForFonts();
        const m = props.manifest as VideoManifest;
        return {
          durationInFrames: totalFrames(m),
          fps: m.fps,
          width: 1920,
          height: 1080,
        };
      }}
    />

    <Composition
      id="AXAnimationPreview"
      component={AnimationPreview}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={240}
      defaultProps={{
        animationId: "VA-LF-001",
        values: {
          title: "Gross capacity vs usable capacity",
          usablePct: 82,
          bufferPct: 18,
          usableLabel: "Usable",
          bufferLabel: "Reserve",
          footer: "Animation QA",
        },
        durationFrames: 240,
      }}
      calculateMetadata={async ({ props }) => {
        await waitForFonts();
        const p = props as AnimationPreviewProps;
        return {
          durationInFrames: Math.max(1, Number(p.durationFrames || 240)),
          fps: 30,
          width: 1920,
          height: 1080,
        };
      }}
    />

    <Still
      id="AXThumbnail"
      component={Thumbnail}
      width={1280}
      height={720}
      defaultProps={{
        backgroundSrc: "",
        logoSrc: "",
        series: "BATTERY INTELLIGENCE",
        headline: "Battery intelligence",
        subhead: "",
      }}
    />
  </>
);
