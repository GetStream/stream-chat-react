import { execSync } from 'node:child_process';
import packageJson from '../package.json' with { type: 'json' };

// get the latest version so that "process.env.STREAM_CHAT_REACT_VERSION" can be replaced with it in the source code (used for reporting purposes), see bundle-cjs.mjs/bundle-esm.mjs for source
export default function getPackageVersion() {
  // "build" script ("prepack" hook) gets invoked when semantic-release runs "npm publish", at that point package.json#version already contains updated next version which we can use
  let version = packageJson.version;

  // if it fails (loads a default), try pulling version from git
  if (version === '0.0.0-development') {
    try {
      version = execSync('git describe --tags --abbrev=0').toString().trim();
    } catch (error) {
      console.error(error);
      console.warn(
        'Could not get latest version from git tags, falling back to package.json',
      );
      version = packageJson.version;
    }
  }

  console.log(`Determined the build package version to be ${version}`);

  return version;
}
