import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// import.meta.dirname is not available before Node 20
const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = await import(resolve(__dirname, '../package.json'), {
    assert: { type: 'json' },
});

// Get the latest version so that magic string __STREAM_CHAT_REACT_VERSION__ can be replaced with it in the source code (used for reporting purposes)
export default function getPackageVersion() {
    let version;
    // During release, use the version being released
    // see .releaserc.json where the `NEXT_VERSION` env variable is set
    if (process.env.NEXT_VERSION) {
        version = process.env.NEXT_VERSION;
    } else {
        // Otherwise use the latest git tag
        try {
            version = execSync('git describe --tags --abbrev=0').toString().trim();
        } catch (error) {
            console.error(error);
            console.warn('Could not get latest version from git tags, falling back to package.json');
            version = packageJson.default.version;
        }
    }
    console.log(`Determined the build package version to be ${version}`);
    return version;
};