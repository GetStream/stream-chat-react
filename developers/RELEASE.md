# Release process

The `stream-chat-react` package follows semantic versioning and the release is to a big part automated by `semantic-release`. The utility automates:

1. release notes collection from the commits added since the last release
2. [GitHub release](https://github.com/GetStream/stream-chat-react/releases) creation
3. release notes (`CHANGELOG.md`) update
4. version bump and package release to the NPM

In order to get the above generated outputs, each contributor should follow [Angular's Commit Message Format rules](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format).

## Branches and npm dist-tags

The Release workflow runs `semantic-release` on the branch you pick, so that branch's own `.releaserc.json` decides where its releases go. `master` and `release-v14` keep the same `branches` list:

| Branch        | Entry in `branches`                                            | Versions | npm dist-tag  |
| ------------- | -------------------------------------------------------------- | -------- | ------------- |
| `master`      | `{ "name": "master", "channel": "latest" }`                    | 15.x     | `latest`      |
| `release-v14` | `{ "name": "release-v14", "channel": "v14", "range": "14.x" }` | 14.x     | `release-v14` |

`@semantic-release/npm` publishes a release under its channel as the dist-tag, and prefixes a channel that reads as a version range with `release-`: the `v14` channel publishes under `release-v14`. Older maintenance branches work the same way (`release-v13` publishes under `release-v13`).

A maintenance branch only publishes versions inside its `range`. If its commits call for a version outside it, for example 15.0.0 from a breaking change on `release-v14`, the release fails with `EINVALIDNEXTVERSION` and nothing is published.

## Major version release preparations

While the next major is in prerelease, `master` is a prerelease branch, for example `{ "name": "master", "prerelease": "rc", "channel": "rc" }`, and the previous line's branch (for example `release-v14`) is the release branch on `latest`. When the major goes GA:

1. Make the previous line a maintenance branch. On that branch, set the `branches` list in `.releaserc.json` to `master` on `latest` plus the branch with its own channel and range, as in the table above. Merge this first: once it is in, a release from that branch can no longer move `latest`. Example PR: https://github.com/GetStream/stream-chat-react/pull/3122
2. On `master`, replace the prerelease entry with `{ "name": "master", "channel": "latest" }` and list the maintenance branch next to it, the same list as in step 1. Example PR: https://github.com/GetStream/stream-chat-react/pull/3121
3. Run the Release workflow on `master`, with a dry run first. A release branch ignores the `-rc.N` tags, so `semantic-release` compares `master` with its last stable tag. The breaking commits since then make the release `X.0.0`, published under `latest`. No extra commit is needed.
4. Run the Release workflow on the maintenance branch once, at any time after step 1. With no new fixes it only adds the branch's last version to the branch's dist-tag (for example `14.16.1` to `release-v14`), so `npm install stream-chat-react@release-v14` works before the first maintenance release. The workflow publishes through npm trusted publishing (OIDC). If this step fails with `E401` on `npm dist-tag`, the package's trusted publisher settings on npmjs.com do not allow `npm dist-tag`: allow it, or add the tag by hand with `npm dist-tag add stream-chat-react@14.16.1 release-v14`. A re-run does not retry the step.

If step 3 runs before step 1, the next release from the previous line's branch publishes under `latest` and replaces the new major there.

## Required steps

At the moment these manual actions have to be taken to achieve a successful release:

1. make sure that all the new required features and bug fixes in peer dependency repositories `@stream-io/stream-chat-css` and `stream-chat-js` are released
2. make sure that the peer dependencies `@stream-io/stream-chat-css` and `stream-chat-js` are installed at their latest version (see `package.json`, `yarn.lock`) (if applicable)
3. squash-merge required pull requests to their base branch (`master` or `release-v14`) with appropriate message name, for example: `fix(scope): new feature`. A breaking change (`!` or a `BREAKING CHANGE: <reason>` footer) releases a new major from `master`, so merge one only when the next major is planned (see `developers/BRANCHES.md`)
4. navigate to ["Actions"](https://github.com/GetStream/stream-chat-react/actions) and in the left bar select the "Release" workflow
5. click "Run workflow" and select the branch you want to release from then adjust the prompt options and click "Run workflow", note that allowed branches are branch names starting with `release`, `rc` and `master` (a dry run can use any branch), extend the workflow condition and `.releaserc.json` as needed. Releases from `master` go to `latest`, releases from `release-v14` to `release-v14` (see [Branches and npm dist-tags](#branches-and-npm-dist-tags)).

## Available release prompt options

- `dry_run` option if checked will run the `semantic-release` command in ["dry run" mode](https://semantic-release.gitbook.io/semantic-release/usage/configuration#dryrun)

## After the release

We maintain multiple demo applications developed with `stream-chat-react`. With each new version of the package, the applications should have their dependencies upgraded explicitly in their `package.json`.

The demo apps repositories are:

- GetStream/website-react-examples
- GetStream/watercooler
