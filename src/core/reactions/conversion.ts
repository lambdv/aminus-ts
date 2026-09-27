import type { SpecialReaction } from "./types.js";

export type BaseReaction = "Electro-Charged" | "Bloom" | "Hydro Crystallize" |
  "Pyro Crystallize" | "Cryo Crystallize" | "Electro Crystallize" |
  "Superconduct" | "Cryo Swirl" | "Pyro Swirl" | "Hydro Swirl" | "Electro Swirl";

export interface ReactionEnabler {
  id: string;
  converts: readonly SpecialReaction[];
}

/** Conversion is party-wide, but does not transfer damage ownership to the enabler. */
export function resolveReaction(base: BaseReaction,
  enablers: readonly ReactionEnabler[]): BaseReaction | SpecialReaction {
  const mapping: Partial<Record<BaseReaction, SpecialReaction>> = {
    "Electro-Charged": "Lunar-Charged", Bloom: "Lunar-Bloom",
    "Hydro Crystallize": "Lunar-Crystallize", Superconduct: "Stellar-Conduct",
    "Cryo Swirl": "Stellar Swirl",
  };
  const converted = mapping[base];
  return converted && enablers.some(enabler => enabler.converts.includes(converted))
    ? converted : base;
}
