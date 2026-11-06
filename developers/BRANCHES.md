# Branches

We have two base branches:

- `master` — the v15 line. Releases from it are published under the npm `latest` tag.
- `release-v14` — the v14 maintenance line. Releases from it are published under the npm `release-v14` tag (`npm install stream-chat-react@release-v14`).

Older lines (`release-v13`, `release-v12`, …) are maintenance branches as well, published under the npm `release-v13`, `release-v12`, … tags.

If you want to implement a solution, create a branch from the base branch it belongs to: `master` for v15 work, `release-v14` for a v14 fix. A base branch should receive updates only through squash-merging feature branches - each of these squashed commits should be up to date with its base branch and should be passing CI requirements.

A fix that applies to both lines is merged into `release-v14` and ported to `master`.

`release-v14` accepts only 14.x releases and must not receive breaking changes. It is a maintenance branch in `.releaserc.json` (`"range": "14.x"`), so semantic-release refuses a release that would leave 14.x: a `fix:` or `feat:` commit with a `BREAKING CHANGE:` footer makes the release fail with `EINVALIDNEXTVERSION` instead of publishing v15. Its commit analyzer uses the `angular` preset, which does not read `!` in a header, so a `fix!:` commit on `release-v14` releases nothing.

A breaking change on `master` releases the next major (16.0.0) under `latest`. Mark a commit on `master` as breaking only when the next major is planned.

The branch architecture in this repository is as follows:

```shell
NPM (latest)      <--- master      <--- branch_solution_x
                                   <--- branch_solution_y
                                   ...
NPM (release-v14) <--- release-v14 <--- branch_fix_x
                                   ...
```
