import {
  StatTable,
  DamageCompute,
  DamageType,
  BaseScaling,
  Amplifier,
  Element,
} from "./stat";
function default_damage_formula(
  instances: number,
  total_scaling_stat: number,
  motion_value: number,
  base_dmg_multiplier: number,
  additive_base_dmg_bonus: number,
  avg_crit_multiplier: number,
  total_dmg_bonus: number,
  dmg_reduction_target: number,
  def_multiplier: number,
  res_multiplier: number,
  amplifier_multiplier: number,
): number {
  return (
    (total_scaling_stat * motion_value * base_dmg_multiplier +
      additive_base_dmg_bonus) *
    avg_crit_multiplier *
    (1.0 + total_dmg_bonus - dmg_reduction_target) *
    def_multiplier *
    res_multiplier *
    amplifier_multiplier *
    instances
  );
}

const total_attack = (stats: StatTable): number => {
  const base_atk = stats.get("BaseATK");
  if (base_atk === undefined)
    throw new Error("StatTable must have BaseATK to calculate total attack");
  const atk_percent = stats.get("ATKPercent") || 0;
  const flat_atk = stats.get("FlatATK") || 0;
  return base_atk * (1 + atk_percent) + flat_atk;
};

const total_defense = (stats: StatTable): number => {
  const base_def = stats.get("BaseDEF");
  if (base_def === undefined)
    throw new Error("StatTable must have BaseDEF to calculate total defense");
  const def_percent = stats.get("DEFPercent") || 0;
  const flat_def = stats.get("FlatDEF") || 0;
  return base_def * (1 + def_percent) + flat_def;
};

const total_health = (stats: StatTable): number => {
  const base_hp = stats.get("BaseHP");
  if (base_hp === undefined)
    throw new Error("StatTable must have BaseHP to calculate total health");
  const hp_percent = stats.get("HPPercent") || 0;
  const flat_hp = stats.get("FlatHP") || 0;
  return base_hp * (1 + hp_percent) + flat_hp;
};

const avg_crit_multiplier = (stats: StatTable): number => {
  let cr = stats.get("CritRate");
  cr = cr > 1.0 ? 1.0 : cr;
  cr = cr < 0.0 ? 0.0 : cr;

  const cd = stats.get("CritDMG");
  return 1.0 + cr * cd;
};

const def_multiplier = (
  character_level: number,
  enemy_level: number,
  def_reduction: number,
  def_ignore: number,
): number => {
  if (character_level < 1 || character_level > 90)
    throw new Error("character_level must be between 1 and 90");
  if (enemy_level < 1) throw new Error("enemy_level must be at least 1");

  return (
    (character_level + 100.0) /
    (character_level +
      100.0 +
      (enemy_level + 100.0) *
        (1.0 - Math.min(def_reduction, 0.9)) *
        (1.0 - def_ignore))
  );
};

const res_multiplier = (
  enemy_base_resistance: number,
  resistance_reduction: number,
): number => {
  const resistance = enemy_base_resistance - resistance_reduction;
  if (resistance < 0.0) {
    return 1.0 - resistance / 2.0;
  } else if (resistance < 0.75) {
    return 1.0 - resistance;
  } else {
    return 1.0 / (4.0 * resistance + 1.0);
  }
};

const amplifier_multiplier = (
  amplifier: number,
  elemental_mastery: number,
  reaction_bonus: number,
): number => {
  return (
    amplifier *
    (1.0 +
      (2.78 * elemental_mastery) / (1400.0 + elemental_mastery) +
      reaction_bonus)
  );
};

const calculate_damage = (
  element: Element,
  damage_type: DamageType,
  scaling: BaseScaling,
  amplifier: Amplifier,
  instances: number,
  motion_value: number,
  character: StatTable,
  buffs: StatTable | undefined,
): number => {
  if (amplifier === "Forward" || amplifier === "Reverse") {
    const validElements: Element[] = ["Pyro", "Hydro", "Cryo", "Anemo"];
    if (!validElements.includes(element)) {
      throw new Error(
        `Amplifier ${amplifier} requires Pyro, Hydro, Cryo, or Anemo element`,
      );
    }
  }

  const total = character.clone();
  if (buffs) {
    for (const [key, value] of buffs) {
      total.add(key, value);
    }
  }
  let total_base_scaling_stat: number;
  switch (scaling) {
    case "ATK":
      total_base_scaling_stat = total_attack(total);
      break;
    case "DEF":
      total_base_scaling_stat = total_defense(total);
      break;
    default:
      total_base_scaling_stat = total_health(total);
      break;
  }

  let amp_multiplier: number;
  switch (amplifier) {
    case "Forward":
      amp_multiplier = amplifier_multiplier(
        2.0,
        total.get("ElementalMastery"),
        total.get("ReactionBonus"),
      );
      break;
    case "Reverse":
      amp_multiplier = amplifier_multiplier(
        1.5,
        total.get("ElementalMastery"),
        total.get("ReactionBonus"),
      );
      break;
    default:
      amp_multiplier = 1.0;
      break;
  }

  let element_dmg_bonus: number;
  switch (element) {
    case "Pyro":
      element_dmg_bonus = total.get("PyroDMGBonus");
      break;
    case "Hydro":
      element_dmg_bonus = total.get("HydroDMGBonus");
      break;
    case "Electro":
      element_dmg_bonus = total.get("ElectroDMGBonus");
      break;
    case "Anemo":
      element_dmg_bonus = total.get("AnemoDMGBonus");
      break;
    case "Geo":
      element_dmg_bonus = total.get("GeoDMGBonus");
      break;
    case "Dendro":
      element_dmg_bonus = total.get("DendroDMGBonus");
      break;
    case "Cryo":
      element_dmg_bonus = total.get("CryoDMGBonus");
      break;
    case "Physical":
      element_dmg_bonus = total.get("PhysicalDMGBonus");
      break;
    default:
      element_dmg_bonus = 0.0;
      break;
  }

  let attack_type_dmg_bonus: number;
  switch (damage_type) {
    case "Normal":
      attack_type_dmg_bonus = total.get("NormalATKDMGBonus");
      break;
    case "Charged":
      attack_type_dmg_bonus = total.get("ChargeATKDMGBonus");
      break;
    case "Plunging":
      attack_type_dmg_bonus = total.get("PlungeATKDMGBonus");
      break;
    case "Skill":
      attack_type_dmg_bonus = total.get("SkillDMGBonus");
      break;
    case "Burst":
      attack_type_dmg_bonus = total.get("BurstDMGBonus");
      break;
    default:
      attack_type_dmg_bonus = 0.0;
      break;
  }

  const total_dmg_bonus =
    total.get("DMGBonus") +
    total.get("ElementalDMGBonus") +
    element_dmg_bonus +
    attack_type_dmg_bonus;

  const def_reduction = total.get("DefReduction");
  const def_ignore = total.get("DefIgnore");

  let resistance_reduction: number;
  switch (element) {
    case "Pyro":
      resistance_reduction = total.get("PyroResistanceReduction");
      break;
    case "Hydro":
      resistance_reduction = total.get("HydroResistanceReduction");
      break;
    case "Electro":
      resistance_reduction = total.get("ElectroResistanceReduction");
      break;
    case "Anemo":
      resistance_reduction = total.get("AnemoResistanceReduction");
      break;
    case "Geo":
      resistance_reduction = total.get("GeoResistanceReduction");
      break;
    case "Dendro":
      resistance_reduction = total.get("DendroResistanceReduction");
      break;
    case "Cryo":
      resistance_reduction = total.get("CryoResistanceReduction");
      break;
    case "Physical":
      resistance_reduction = total.get("PhysicalResistanceReduction");
      break;
    default:
      resistance_reduction = 0.0;
      break;
  }

  return default_damage_formula(
    instances,
    total_base_scaling_stat,
    motion_value,
    1.0,
    0.0,
    avg_crit_multiplier(total),
    total_dmg_bonus,
    0.0,
    def_multiplier(90, 100, def_reduction, def_ignore),
    res_multiplier(0.1, resistance_reduction),
    amp_multiplier,
  );
};

const dmg_formula =
  (
    element: Element,
    damage_type: DamageType,
    motion_value: number,
    buffs: StatTable = new StatTable(),
    instances = 1,
    scaling: BaseScaling = "ATK",
    amplifier: Amplifier = "None",
  ) =>
  (s: StatTable) =>
    default_damage_formula(
      instances,
      total_attack(s),
      1.0,
      1.0,
      0.0,
      avg_crit_multiplier(s),
      0.0,
      0.0,
      def_multiplier(90, 100, 0.0, 0.0),
      res_multiplier(0.1, 0.0),
      1.0,
    );

export {
  default_damage_formula,
  avg_crit_multiplier,
  def_multiplier,
  res_multiplier,
  amplifier_multiplier,
  calculate_damage,
  total_attack,
  total_defense,
  total_health,
  dmg_formula,
};
