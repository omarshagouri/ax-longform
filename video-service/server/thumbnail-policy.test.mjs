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
  assert.equal(s.overlayStrength,0.75);
  assert.throws(()=>normalizeThumbnailStyle({headline:"ok",overlay_strength:4}), /overlay_strength/);
  assert.throws(()=>normalizeThumbnailStyle({headline:"ok",layout:"unknown"}), /layout/);
  assert.throws(()=>normalizeThumbnailStyle({headline:"ok",background_brightness:2}), /brightness/);
});
