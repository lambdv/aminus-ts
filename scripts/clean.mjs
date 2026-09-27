import { rmSync } from "node:fs";
// Fixed package-local build output; never follows a caller-supplied path.
rmSync(new URL("../dist/", import.meta.url), { recursive: true, force: true });
