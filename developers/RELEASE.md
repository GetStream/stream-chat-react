# Release
The `stream-chat-react` package follows semantic versioning and the release is to a big part automated by `semantic-release`. The utility automates:

1. Collects release notes from the commits added since the last release
2. Creates a [GitHub release](https://github.com/GetStream/stream-chat-react/releases)
3. Appends release notes to `CHANGELOG.md`
4. Publishes a new package version to NPM.

In order the above generates correct outputs, each contributor should [Angular's Commit Messag Format rules](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format).

At the moment these manual actions have to be taken while doing a release:

0. Make sure that all the new required features and bug fixes in peer dependency repositories `@stream-io/stream-chat-css` and `stream-chat-js` are released
1. Make sure that the peer dependencies `@stream-io/stream-chat-css` and `stream-chat-js` are installed at their latest version (see `package.json`, `yarn.lock`)
2. Create a new PR request from `develop` to `master` branch.
   - The PR name should correspond to the next package version that is to be released (e.g. v1.1, v8, v9.1.2). You can use GitHub's CLI utility (e.g. `gh pr create —base master`)
   - The PR description should list all the changes in form of commit messages (therefore we require squashing the commit history when merging into `develop`).
3. Solve potential conflicts between the two branches
   - As `master` receives updates only from `develop`, there should be no conflicts.
4. Merge the PR and make sure that:
   - the `CHANGELOG.md` file has been correctly updated
   - a new (correct) version of the package has been published at NPM
   - a new release with correct version number has be created in GitHub

## After the release
We maintain multiple demo applications developed with `stream-chat-react`. With each new version of the package, the applications should have their dependencies upgraded explicitly in their `package.json`.

The demo apps repositories are:

- GetStream/website-react-examples
- GetStream/watercooler
