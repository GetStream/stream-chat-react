
## Creating PR
To [create a PR](https://docs.github.com/en/enterprise-cloud@latest/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request), we use a [PR template](../PULL_REQUEST_TEMPLATE.md) `PULL_REQUEST_TEMPLATE.md`. It consists of 3 sections:

1. [🎯 Goal](#goal) *(mandatory)*
2. [🛠 Implementation details](#implementation-details) *(recommended)*
3. [🎨 UI Changes](#ui-changes) *(optional)*
4. [References](#references) *(mandatory if exist)*

#### <a name="goal"></a>🎯 Goal
High level description on what is changing and what benefits do the change bring. Without

#### <a name="implementation-details"></a>🛠 Implementation details
Should include an explanation of the logic applied to solving the problem. It provides a context that will make the review much easier.

#### <a name="ui-changes"></a>🎨 UI Changes
This is a great place to showcase:

- screenshots of “before” and “after”
- short videos demonstrating user interaction (“before” and “after”)

A good way to keep this section readable is to [include collapsed sections](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections)

#### References
If the PR solves one or more previously filed issues, then it should contain one reference per each issue - [link the issues](https://docs.github.com/en/enterprise-cloud@latest/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue).

It may often be the case, that you are implementing a feature with changes in styling ([`stream-chat-css`](https://github.com/GetStream/stream-chat-css)) or Stream Chat API client (`stream-chat-js`). Those PRs may contain changes on which depends the functionality of the currently created PR in `stream-chat-react`. In such case, you should include references to PRs in those repos as well (e.g. `Depends on https://github.com/GetStream/stream-chat-css/issues/66`).

Create PRs to be merged into branches other than the `master` branch (i.e. `develop` or other).

Each PR should be assigned to least one reviewer from the [Stream React Developers group](https://github.com/orgs/GetStream/teams/stream-react-developers/members).

## PR review

The review should verify that the contributor has delivered a complete solution. If a PR has linked one or more well-documented issues, then the reviewer can rely on acceptance criteria listed there. Another source of context information for the reviewer may be the PR sections [🛠 Implementation details](#implementation-details) or [🎨 UI Changes](#ui-changes). If you are not satisfied with the inputs provided, ask for their addition.

Having a good context, the reviewer can then check that the source code follows the [Coding rules](../CONTRIBUTING.md#coding-rules) as well as is free of bugs by executing the following steps:

1. read the changed source code
2. review the added unit tests for completeness
3. review the [E2E tests'](../e2e) scenarios for their completeness
4. review the changes in the documentation
5. build, run and click through the example application locally (
   - are there some regression bugs?
   - are there all changes claimed in the PR and do they work as documented?
   - do the changes have impact on app performance?
   - are there any errors in the browser console?

The PR should be returned for rework if any of the steps stumble upon shortcomings in regard to the [Coding rules](../CONTRIBUTING.md#coding-rules).

### Usual scenarios to click through

- Add a message to the channel message list and to a thread (text message, file upload, image upload, audio file upload, giphy)
- Update, delete a message in the channel message list and in a thread (text message, file upload, image upload, audio file upload, giphy)
- Messages are loaded while scroll through the message list
- Add a new message while scrolled up not seeing the latest messages (should be automatically scrolled to the latest message)
- Receive a new message while scrolled up not seeing the latest messages (a new message notification should appear)
- Reactions to messages in the channel message list and in the thread (add emoji, quote, pin, start thread)
- Change channel
- Load more channels in the channel list

## Merging the PR

PRs should be squash-merged in order to keep the git history clean. The resulting commit message should follow the [Angular's Commit Messag Format rules](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format).

