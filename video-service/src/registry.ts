import React from "react";
import { z } from "zod";
import { makeHtmlCard, schemaFromSlots } from "./HtmlCard";
import { allCards } from "./cards/generated/allCards";
import { animationRegistry } from "./animations";

export type CardEntry = {
  component: React.FC<any>;
  schema: z.ZodTypeAny;
};

export const registry: Record<string, CardEntry> = { ...animationRegistry };
for (const id of Object.keys(allCards)) {
  const data = allCards[id];
  registry[id] = {
    component: makeHtmlCard(data),
    schema: schemaFromSlots(data.slots),
  };
}

export function validateTimeline(
  timeline: { component: string; props: unknown; beat: number }[]
): string[] {
  const errors: string[] = [];
  for (const item of timeline) {
    const entry = registry[item.component];
    if (!entry) {
      errors.push(`beat ${item.beat}: unknown visual "${item.component}"`);
      continue;
    }
    const r = entry.schema.safeParse(item.props);
    if (!r.success) {
      errors.push(
        `beat ${item.beat} (${item.component}): ${r.error.issues.map((i) => i.message).join(", ")}`
      );
    }
  }
  return errors;
}

export const availableCards = () => Object.keys(registry).filter((id) => id.startsWith("VC-LF-")).sort();
export const availableAnimations = () => Object.keys(registry).filter((id) => id.startsWith("VA-LF-")).sort();
export const availableVisuals = () => Object.keys(registry).sort();
