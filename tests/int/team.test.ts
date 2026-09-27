import { aggregateTeam } from "@/team";
import { StatTable, character_damage, total_attack, total_health, reaction_damage,
  res_multiplier, additiveReactionBase } from "@/index";
it("aggregates explicit ownership, copies rows, and handles arbitrary owner names", () => {
  const rows=[{id:"hit",owner:"trigger",damage:100},{id:"bonus",owner:"donor",damage:50},
    {id:"proc",owner:"trigger",damage:20},{id:"zero",owner:"__proto__",damage:0}];
  const result=aggregateTeam(rows,10);
  expect(result.teamDpr).toBe(170); expect(result.teamDps).toBe(17);
  expect(result.owners.trigger).toEqual({dpr:120,dps:12,share:120/170});
  expect(result.owners.donor.dpr).toBe(50); expect(result.owners.__proto__.share).toBe(0);
  rows[0].damage=999; expect(result.contributions[0].damage).toBe(100);
});
it("handles empty and zero-damage teams and rejects invalid input", () => {
  expect(aggregateTeam([],20).teamDps).toBe(0);
  expect(aggregateTeam([{id:"zero",owner:"a",damage:0}],20).owners.a.share).toBe(0);
  for (const duration of [0,-1,NaN,Infinity]) expect(() => aggregateTeam([],duration)).toThrow();
  for (const damage of [NaN,Infinity,-Infinity])
    expect(() => aggregateTeam([{id:"bad",owner:"a",damage}],20)).toThrow();
});
it("recomputes a caller-composed donor buff and attributes donor damage for each candidate", () => {
  const trigger = new StatTable(["BaseATK",1000]);
  const evaluate = (donor: StatTable) => {
    const buffed=trigger.merge(new StatTable(["FlatATK",total_attack(donor)*.2]));
    return aggregateTeam([
      {id:"hit",owner:"trigger",damage:character_damage({element:"Pyro",damageType:"Skill",motionValue:1})(buffed)},
      {id:"donated",owner:"donor",damage:character_damage({element:"Pyro",damageType:"Skill",additiveDamage:total_attack(donor)*.5})(buffed)},
    ],20);
  };
  const candidates=[100,200].map(atk => evaluate(new StatTable(["BaseATK",atk])));
  expect(candidates[0].teamDpr).toBeCloseTo((1020+50)*.9*190/390,10);
  expect(candidates[1].teamDpr).toBeCloseTo((1040+100)*.9*190/390,10);
  expect(trigger.get("FlatATK")).toBe(0);
});
it("keeps healing, Clam and conditional reaction crits in caller code", () => {
  const healer=new StatTable(["BaseHP",10000],["HPPercent",.5],["HealingBonus",.2]);
  const healing=(total_health(healer)*.1+500)*(1+healer.get("HealingBonus"));
  expect(healing).toBe(2400);
  const clam=.9*Math.min(healing,30000)*res_multiplier(.1,0);
  expect(clam).toBe(1944);
  const bloom=reaction_damage({kind:"Bloom",element:"Dendro"});
  const c2Damage=bloom(new StatTable())*(1+.2*1);
  expect(c2Damage).toBeCloseTo(2*1446.8535*.9*1.2,8);
  // Aggravated Swirl: additive base receives resistance, not direct-hit crit/DEF.
  const swirl=reaction_damage({kind:"Swirl",element:"Electro"})(new StatTable())
    + additiveReactionBase("Aggravate",new StatTable())*res_multiplier(.1,0);
  expect(swirl).toBeCloseTo((.6+1.15)*1446.8535*.9,8);
  expect(aggregateTeam([{id:"clam",owner:"healer",damage:clam}],20).teamDpr).toBe(1944);
});
