/** Optional aggregation of caller-calculated damage. No character or effect resolution. */
export interface DamageContribution { id: string; owner: string; damage: number }
export interface TeamDamageResult {
  contributions: DamageContribution[];
  owners: Record<string, { dpr: number; dps: number; share: number }>;
  teamDpr: number;
  teamDps: number;
  rotationSeconds: number;
}

export function aggregateTeam(contributions: readonly DamageContribution[], rotationSeconds: number): TeamDamageResult {
  if (!Number.isFinite(rotationSeconds) || rotationSeconds <= 0)
    throw new Error("rotationSeconds must be positive and finite");
  const owners: TeamDamageResult["owners"] = Object.create(null);
  let teamDpr = 0;
  for (const { owner, damage } of contributions) {
    if (!Number.isFinite(damage)) throw new Error("damage must be finite");
    owners[owner] ??= { dpr: 0, dps: 0, share: 0 };
    owners[owner].dpr += damage;
    teamDpr += damage;
  }
  if (!Number.isFinite(teamDpr)) throw new Error("team damage must be finite");
  for (const result of Object.values(owners)) {
    result.dps = result.dpr / rotationSeconds;
    result.share = teamDpr === 0 ? 0 : result.dpr / teamDpr;
  }
  return { contributions: contributions.map(row => ({ ...row })), owners,
    teamDpr, teamDps: teamDpr / rotationSeconds, rotationSeconds };
}
