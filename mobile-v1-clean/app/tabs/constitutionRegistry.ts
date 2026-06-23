// apps/api/src/tests/sanas_constitution_v2/constitutionRegistry.ts

import { TruthConstitutionV1 } from "../sanas_constitution/truthConstitutionV1";

export class ConstitutionRegistry {
  private versions: Record<string, TruthConstitutionV1> = {};
  private activeVersion: string = "v1";

  registerVersion(version: string, constitution: TruthConstitutionV1) {
    this.versions[version] = constitution;
  }

  setActive(version: string) {
    if (!this.versions[version]) {
      throw new Error(`Constitution ${version} not found`);
    }
    this.activeVersion = version;
  }

  getActive() {
    return this.versions[this.activeVersion];
  }

  get(version: string) {
    return this.versions[version];
  }
}
