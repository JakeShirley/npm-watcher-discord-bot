const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);

export default class NPMRegistry {
  readonly registryUrl: string;

  constructor(registryUrl: string) {
    this.registryUrl = registryUrl;
  }

  async getPackageInfo(packageName: string) {
    const { stdout, stderr } = await exec(
      `npm view ${packageName} --json --registry ${this.registryUrl}`
    );

    return JSON.parse(stdout);
  }

  async getPackageVersions(packageName: string) {
    const { stdout, stderr } = await exec(
      `npm view ${packageName} versions --json --registry ${this.registryUrl}`
    );

    return JSON.parse(stdout);
  }

  async getPackageTags(packageName: string) {
    const { stdout, stderr } = await exec(
      `npm view ${packageName} dist-tags --json --registry ${this.registryUrl}`
    );

    return JSON.parse(stdout);
  }
}
