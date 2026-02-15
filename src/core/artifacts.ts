import { StatType, StatTable, Rotation } from "./stat";
import { ArtifactBuilder } from "./artifact-builder";
import { ArtifactFactory } from "./artifact-factory";
import { Artifact, ArtifactType } from "./artifact-constants";

type ArtifactRollQuality = "MAX" | "HIGH" | "MID" | "LOW" | "AVG";

export { ArtifactBuilder, ArtifactFactory };
export type { Artifact, ArtifactType, ArtifactRollQuality };
