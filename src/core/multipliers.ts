import { StatTable } from "./stat.js";

export function avg_crit_multiplier(stats: StatTable): number {
  const rate = Math.max(0, Math.min(1, stats.get("CritRate")));
  return 1 + rate * stats.get("CritDMG");
}

export function def_multiplier(characterLevel: number, enemyLevel: number,
  defenseReduction: number, defenseIgnore: number): number {
  if (!Number.isInteger(characterLevel) || characterLevel < 1 || characterLevel > 100)
    throw new Error("character_level must be between 1 and 100");
  if (!Number.isFinite(enemyLevel) || enemyLevel < 1) throw new Error("enemy_level must be at least 1");
  return (characterLevel + 100) /
    (characterLevel + 100 + (enemyLevel + 100)
      * Math.max(0, 1 - defenseReduction) * Math.max(0, 1 - defenseIgnore));
}

export function res_multiplier(enemyBaseResistance: number,
  resistanceReduction: number): number {
  const resistance = enemyBaseResistance - resistanceReduction;
  return resistance < 0 ? 1 - resistance / 2
    : resistance < 0.75 ? 1 - resistance : 1 / (4 * resistance + 1);
}

export function amplifier_multiplier(amplifier: number,
  elementalMastery: number, reactionBonus: number): number {
  return amplifier * (1 + 2.78 * elementalMastery / (1400 + elementalMastery) + reactionBonus);
}
