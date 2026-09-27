import { ArtifactBuilder } from "./artifact-builder.js";
import type { Artifact, ArtifactType } from "./artifact-constants.js";

type ArtifactRollQuality = "MAX" | "HIGH" | "MID" | "LOW" | "AVG";

export { ArtifactBuilder };
export type { Artifact, ArtifactType, ArtifactRollQuality };
