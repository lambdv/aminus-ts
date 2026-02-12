const KazuhaKit = {
  Skill(): RotationEvent {
    return {
      actor: "Kazuha",
      enterState: "instructor",
      hits: [Hit("Skill", swirl_formula)],
    };
  },
};

const RaidenKit = {
  Burst(): RotationEvent {
    return {
      actor: "Raiden",
      enterState: "buffed",
      hits: [Hit("Burst Hit 1", dmg_formula), Hit("Burst Hit 2", dmg_formula)],
    };
  },
};

Character("Kazuha")
  .states(["normal", "instructor"])
  .buffs([PartyBuff("ElementalDMG%", 0.4, { when: "instructor" })]);

Character("Raiden")
  .states(["normal", "buffed"])
  .buffs([
    FromOther("ElementalDMG%", "Kazuha", (s) => s.get("ElementalDMG%"), {
      when: "buffed",
      fromState: "instructor",
    }),
  ]);

const team = Team({
  characters: [
    Character("Raiden")
      .base(stats.raiden)
      .buffs([
        SelfBuff("EnergyRecharge", 0.32),
        FromOther("ATKPercent", "Bennett", (s) => s.get("BaseATK") * 0.5),
      ])
      .hits([Hit("Burst Hit 1", dmg_formula), Hit("Burst Hit 2", dmg_formula)]),

    Character("Bennett")
      .base(stats.bennett)
      .buffs([SelfBuff("ATKPercent", 0.6)]),

    Character("Xiangling")
      .base(stats.xiangling)
      .hits([Hit("Pyronado", dmg_formula)]),

    Character("Kazuha")
      .base(stats.kazuha)
      .buffs([PartyBuff("ElementalDMG%", 0.4)]),
  ],

  rotation: [Use("Bennett"), Use("Kazuha"), Use("Raiden"), Use("Xiangling")],
});

const Kazuha = Kit("Kazuha", {
  Skill: Ability().enter("instructor").hit(swirl_formula),

  Burst: Ability().hit(swirl_formula),
});

const Raiden = Kit("Raiden", {
  Burst: Ability().enter("buffed").hits(2, dmg_formula),
});
