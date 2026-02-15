import { StatType, StatTable, Rotation } from "./stat";
import { ArtifactBuilder } from "./artifact-builder";
import { Artifact, ArtifactType } from "./artifact-constants";

type ArtifactRollQuality = "MAX" | "HIGH" | "MID" | "LOW" | "AVG";

export { ArtifactBuilder };
export type { Artifact, ArtifactType, ArtifactRollQuality };
