import test from "node:test";
import assert from "node:assert/strict";
import {selectThumbnailLayout,selectThumbnailHighlights,normalizeThumbnailStyle} from "./thumbnail-policy.mjs";

test("comparison from metadata visual concept", () => {
  assert.equal(selectThumbnailLayout("LFP vs NMC", ""), "comparison");
  assert.equal(selectThumbnailLayout("Which One?", "side-by-side two vehicles"), "comparison");
  assert.equal(selectThumbnailLayout("Battery Life", "", "hero"), "hero");
});
test("problem and hero layouts", () => {
  assert.equal(selectThumbnailLayout("Why Heat Is the Silent Killer of EV Batteries"), "problem");
  assert.equal(selectThumbnailLayout("Who Controls Your EV Usable Battery?"), "hero");
});
test("emphasis is selective and supports explicit override", () => {
  const h = selectThumbnailHighlights("Why Heat Is the Silent Killer of EV Batteries");
  assert.deepEqual(h, ["KILLER","HEAT","BATTERIES"]);
  assert.deepEqual(selectThumbnailHighlights("Battery Life Truth", "Life"), ["Life"]);
});
test("style defaults and validation", () => {
  const s = normalizeThumbnailStyle({headline:"LFP vs NMC",visual_concept:"split-screen"});
  assert.equal(s.layout,"comparison");
  assert.equal(s.showSubhead,false);
  assert.equal(s.showSubhead,true);
  assert.equal(normalizeThumbnailStyle({headline:"OK",show_subhead:false}).showSubhead,false);
  assert.equal(s.overlayStrength,0.84);
  assert.equal(s.vignetteStrength,0.96);
  assert.equal(normalizeThumbnailStyle({headline:"OK",vignette_strength:0}).vignetteStrength,0);
  assert.equal(normalizeThumbnailStyle({headline:"OK",vignette_strength:1}).vignetteStrength,1);
  assert.throws(()=>normalizeThumbnailStyle({headline:"OK",vignette_strength:-0.1}), /vignette_strength/);
  assert.throws(()=>normalizeThumbnailStyle({headline:"OK",vignette_strength:1.01}), /vignette_strength/);
  assert.throws(()=>normalizeThumbnailStyle({headline:"ok",overlay_strength:4}), /overlay_strength/);
  assert.throws(()=>normalizeThumbnailStyle({headline:"ok",layout:"unknown"}), /layout/);
  assert.throws(()=>normalizeThumbnailStyle({headline:"ok",background_brightness:2}), /brightness/);
});

test("reference badge labels require accurate topic metadata", () => {
  const r=normalizeThumbnailStyle({headline:"ONE EV ONE MODEL TWO CHEMISTRIES",video_title:"LFP vs NMC"});
  assert.equal(r.layout,"comparison");
  assert.equal(r.comparisonLeftLabel,"NMC");
  assert.equal(r.comparisonRightLabel,"LFP");
  assert.equal(r.comparisonLeftSub,"");
  const nca=normalizeThumbnailStyle({headline:"LFP vs NMC vs NCA"});
  assert.equal(nca.comparisonLeftSub,"NCA");
  const unknown=normalizeThumbnailStyle({headline:"ONE EV ONE MODEL TWO CHEMISTRIES"});
  assert.equal(unknown.comparisonLeftLabel,"");
});
