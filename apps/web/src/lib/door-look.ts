import type { CategoryType } from "@bestdoors/shared";

/** Default look for a product card, based on its material. */
export function defaultDoorColour(material: string): string {
  const m = material.toLowerCase();
  if (m.includes("oak") || m.includes("timber")) return "#b5803f";
  if (m.includes("pine")) return "#d2a76b";
  if (m.includes("steel")) return "#151515";
  if (m.includes("aluminium") || m.includes("composite")) return "#383e42";
  return "#f5f5f2";
}

export function isDoubleDoor(type: CategoryType) {
  return type === "FRENCH" || type === "PATIO" || type === "SLIDING";
}

export function defaultGlass(type: CategoryType): "none" | "frosted" | "clear" {
  return type === "PATIO" || type === "SLIDING" || type === "FRENCH" ? "clear" : "none";
}
