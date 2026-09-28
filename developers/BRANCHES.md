# Branches

We have two base branches:

- `master` — the v15 line. Releases from it are published as release candidates (`15.0.0-rc.N`) under the npm `rc` tag.
- `release-v14` — the stable v14 line. Releases from it are published under the npm `latest` tag.

If you want to implement a solution, create a branch from the base branch it belongs to: `master` for v15 work, `release-v14` for a v14 fix. A base branch should receive updates only through squash-merging feature branches - each of these squashed commits should be up to date with its base branch and should be passing CI requirements.

A fix that applies to both lines is merged into `release-v14` and ported to `master`.

`release-v14` must not receive breaking changes (`!` or a `BREAKING CHANGE:` footer). It is the release branch in `.releaserc.json`, which semantic-release cannot limit to `14.x`, so a breaking change there would publish v15 under `latest`.

The branch architecture in this repository is as follows:

```shell
NPM (rc)     <--- master      <--- branch_solution_x
                              <--- branch_solution_y
                              ...
NPM (latest) <--- release-v14 <--- branch_fix_x
                              ...
```
