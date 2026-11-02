// AmpCoreX LF thumbnail input policy. No change to chapter/video APIs.
const LAYOUTS = new Set(["auto", "hero", "comparison", "problem"]);
const EMPHASIS = [
  "FAST CHARGING", "BATTERY HEALTH", "BATTERY LIFE", "RANGE LOSS",
  "CHEMISTRIES", "CONTROLS", "USABLE", "KILLER", "HEAT", "COLD",
  "LFP", "NMC", "DEGRADATION", "WARRANTY", "RANGE", "CHARGING",
  "BATTERIES", "BATTERY", "EV", "COST"
];

export function selectThumbnailLayout(headline = "", visualConcept = "", requested = "auto", videoTitle = "") {
  const layout = String(requested || "auto").toLowerCase();
  if (!LAYOUTS.has(layout)) throw new Error("Invalid thumbnail layout; use auto, hero, comparison, or problem");
  if (layout !== "auto") return layout;
  const text = `${headline} ${visualConcept} ${videoTitle}`.toLowerCase();
  if (/\b(vs\.?|versus|compare|comparison|split.screen|side.by.side|two chemistries|one model|heat and cold|hot vs cold|lfp.{0,30}nmc|nmc.{0,30}lfp)\b/i.test(text)) return "comparison";
  if (/\b(kill|killer|danger|damage|risk|degrad|lose|loss|worse|problem|fails?|warning)\w*\b/i.test(text)) return "problem";
  return "hero";
}

function normalizePhrase(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function selectThumbnailHighlights(headline = "", supplied = undefined) {
  const text = normalizePhrase(headline);
  if (!text) return [];
  let phrases = [];
  if (Array.isArray(supplied)) phrases = supplied;
  else if (typeof supplied === "string" && supplied.trim()) phrases = supplied.split("|");
  phrases = phrases.map(normalizePhrase).filter(Boolean);
  const choices = phrases.length ? phrases : EMPHASIS;
  const limit = Math.min(3, Math.max(1, Math.round(text.split(/\s+/).length * 0.30)));
  const used = [];
  for (const phrase of choices) {
    const match = text.toUpperCase().indexOf(phrase.toUpperCase());
    if (match < 0) continue;
    const before = match === 0 ? " " : text[match - 1];
    const after = text[match + phrase.length] || " ";
    if (/\w/.test(before) || /\w/.test(after)) continue;
    const key = phrase.toUpperCase();
    if (used.some(p => p.toUpperCase().includes(key) || key.includes(p.toUpperCase()))) continue;
    used.push(phrase);
    if (used.length === limit) break;
  }
  return used;
}


function comparisonLabels(headline, visualConcept, videoTitle) {
  const text = [headline, visualConcept, videoTitle].join(" ").toUpperCase();
  if (/\bLFP\b/.test(text) && /\bNMC\b/.test(text)) {
    return { comparisonLeftLabel: "NMC", comparisonLeftSub: /\bNCA\b/.test(text) ? "NCA" : "", comparisonCenterLabel: "VS", comparisonRightLabel: "LFP" };
  }
  if (/\bHEAT\b/.test(text) && /\bCOLD\b/.test(text)) {
    return { comparisonLeftLabel: "HEAT", comparisonLeftSub: "", comparisonCenterLabel: "VS", comparisonRightLabel: "COLD" };
  }
  return {comparisonLeftLabel: "", comparisonLeftSub: "", comparisonCenterLabel: "", comparisonRightLabel: ""};
}

export function normalizeThumbnailStyle(body = {}) {
  const headline = String(body.headline || "").trim();
  if (!headline) throw new Error("headline is required");
  if (headline.length > 180) throw new Error("headline is too long for a thumbnail (180 character maximum)");
  const opacity = body.overlay_strength === undefined ? 0.78 : Number(body.overlay_strength);
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new Error("overlay_strength must be between 0 and 1");
  const vignette = body.vignette_strength === undefined ? 0.84 : Number(body.vignette_strength);
  if (!Number.isFinite(vignette) || vignette < 0 || vignette > 1) throw new Error("vignette_strength must be between 0 and 1");
  const brightness = body.background_brightness === undefined ? 1.08 : Number(body.background_brightness);
  if (!Number.isFinite(brightness) || brightness < 0.8 || brightness > 1.35) throw new Error("background_brightness must be between 0.8 and 1.35");
  const visualConcept = String(body.visual_concept || "");
  const videoTitle = String(body.video_title || "");
  const layout = selectThumbnailLayout(headline, visualConcept, body.layout || "auto", videoTitle);
  const labels = layout === "comparison" ? comparisonLabels(headline, visualConcept, videoTitle) : comparisonLabels("", "", "");
  return {
    layout,
    highlightPhrases: selectThumbnailHighlights(headline, body.highlight_phrases),
    overlayStrength: opacity,
    vignetteStrength: vignette,
    backgroundBrightness: brightness,
    showSubhead: body.show_subhead === true || body.show_subhead === "true",
    ...labels,
  };
}
