# Release process (for package and documentation)

The `stream-chat-react` package follows semantic versioning and the release is to a big part automated by `semantic-release`. The utility automates:

1. release notes collection from the commits added since the last release
2. [GitHub release](https://github.com/GetStream/stream-chat-react/releases) creation
3. release notes (`CHANGELOG.md`) update
4. version bump and package release to the NPM

In order to get the above generated outputs, each contributor should follow [Angular's Commit Message Format rules](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format).

## Major version release preparations

We need to:

1. Convert the current latest branch to a version branch by creating a PR with adjusted `.releaserc.json`. Example PR: https://github.com/GetStream/stream-chat-react/pull/2507

2. Configure the `master` branch back from `prerelease` to `latest` and add a config for the next version branch also designated as `latest`. Example PR: https://github.com/GetStream/stream-chat-react/pull/2506.

## Required steps

At the moment these manual actions have to be taken to achieve a successful release:

1. make sure that all the new required features and bug fixes in peer dependency repositories `@stream-io/stream-chat-css` and `stream-chat-js` are released
2. make sure that the peer dependencies `@stream-io/stream-chat-css` and `stream-chat-js` are installed at their latest version (see `package.json`, `yarn.lock`) (if applicable)
3. squash-merge required pull requests to `master` branch with appropriate message name, for example: `fix(scope): new feature`, if this feature is breaking, make sure to include `BREAKING CHANGE: <reason>` in the message footer
4. navigate to ["Actions"](https://github.com/GetStream/stream-chat-react/actions) and in the left bar select the "Release" workflow
5. click "Run workflow" and select the branch you want to release from then adjust the prompt options and click "Run workflow", note that allowed branches for **PACKAGE RELEASE** are: branch names starting with `release` and `master`, there _is no such limititation_ for the **DOCUMENTATION RELEASE**, extend the workflow condition and `.releaserc.json` as needed. The `master` branch is the release-candidate branch.

## Available release prompt options

- `docs_only` option if checked will skip the `package_release` job and will only run the `docs_release`
- `dry_run` option if checked will run the `semantic-release` command in ["dry run" mode](https://semantic-release.gitbook.io/semantic-release/usage/configuration#dryrun) and will skip `docs_release`
- `docs_env` (required) option offers two environment options to which the documentation will be pushed to via `GetStream/push-stream-chat-docusaurus-action` - defaults to `staging`

## After the release

We maintain multiple demo applications developed with `stream-chat-react`. With each new version of the package, the applications should have their dependencies upgraded explicitly in their `package.json`.

The demo apps repositories are:

- GetStream/website-react-examples
- GetStream/watercooler
