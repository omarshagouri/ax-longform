import React from "react";
import { Composition, Still } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { Video } from "./Video";
import { Thumbnail } from "./Thumbnail";
import { sampleManifest } from "./sample-manifest";
import { totalFrames, VideoManifest } from "./manifest";

const { waitUntilDone } = loadFont("normal", { weights: ["500", "600", "700"] });

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="AmpCoreXLongForm"
    component={Video}
    fps={30}
    width={1920}
    height={1080}
    durationInFrames={totalFrames(sampleManifest)}
    defaultProps={{ manifest: sampleManifest }}
    calculateMetadata={async ({ props }) => {
      await waitUntilDone();
      const m = props.manifest as VideoManifest;
      return {
        durationInFrames: totalFrames(m),
        fps: m.fps,
        width: 1920,
        height: 1080,
      };
    }}
  />
  <Still
    id="AmpCoreXThumbnail"
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