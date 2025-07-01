# Contributing to stream-chat-react

As a contributor, here are the guidelines we would like you to follow:

- [Asking questions](#asking-questions)
- [Filing an issue](#filing-an-issue)
- [Contribution Standards](#coding-standards)
- [Submission Guidelines](#submission-guidelines)
- [Signing the CLA](#contributor-licence-agreement)

## <a name="asking-questions"></a>Are you looking for answers?

There are many ways you can get your questions answered. It can be hard to decide, where to begin if you are just starting out. We suggest you take a look at the resources in the following order:

### 1. Stream chat API documentation

Package `stream-chat-react` has a peer dependency [stream-chat-js](https://github.com/GetStream/stream-chat-js) - a client library for interacting with the Stream Chat API (see the [API docs](https://getstream.io/chat/docs/javascript/?language=javascript)).

### 2. Documentation for stream-chat-react

The [stream-chat-react](https://getstream.io/chat/docs/sdk/react/) documentation is held separately from the Stream Chat API docs. Besides documenting the component API, it provides examples of their use in various scenarios.

### 3. Read the source code

When you plan on contributing to the repository try to get acquainted with the existing code base. The best way to learn :)

### 4. Take a look at our tutorials

### Get help from our Customer Success team

If what you are looking for is technical support embedding Stream in your application, we suggest emailing our Customer Success team at support@getstream.io with your application key and the SDK versions you're using. The Issue section of this GitHub repo is now reserved only for bug reports, feature improvements and suggestions.

## <a name="filing-an-issue"></a>Filing an issue

Spotting imperfections and not keeping them to yourself is the first step to make this library better. We are very grateful for reports concerning imperfections in the source code or the [documentation](<(https://getstream.io/chat/docs/sdk/react/)>). Before filing an issue, please, review the list of [open issues](https://github.com/GetStream/stream-chat-react/issues) first.

### Reporting bugs

You can report a source code bug by using the [Bug Report template](https://github.com/GetStream/stream-chat-react/issues/new/choose). Make sure you include "steps to reproduce" section. Bug that cannot be reproduced cannot be solved.

Do not be afraid to report imperfections in our [documentation](<(https://getstream.io/chat/docs/sdk/react/)>) as well. In such case, please attach the `docs` tag to the issue.

### Requesting a feature

You can request a feature by submitting a [Feature request issue](https://github.com/GetStream/stream-chat-react/issues/new?assignees=&labels=feature&template=feature_request.md&title=) in our repository. If you would like to implement the proposal, please state it in the issue. It will allow us to discuss the proposal and better coordinate the efforts. You can even ping us - mention `@GetStream/stream-react-developers ` in the issue.

## <a name="contribution-standards"></a> Contributing to the repo

### Set up for success

It is always good to get acquainted with the specifics of the package. For example the `stream-chat-react` package has its peer dependencies (`stream-chat-js`, `stream-chat-css`), which you may need to tweak at the same time, while developing the feature for `stream-chat-react`. To get more into those specifics, please read [development guide](./developers/DEVELOPMENT.md).

### Good first issue

###<a name="#coding-rules"></a> Coding rules
Any contributions to the library should follow Stream's coding rules.

#### 1. Code should be tested

All the code submitted should be covered by unit tests. Mocking utilities are provided in `src/mock-builders`. Optimally a suite of E2E tests should be included as well.

#### 2. API Changes should be documented

Changes to components interface exposed to the library integrators should be documented. We keep the documentation `docusaurus/docs/React` folder. Please see the [dedicated documentation guide](./developers/DOCUMENTATION.md) for more information on how to maintain our documentation.

#### 3. Code should be DRY & correctly formatted

If you find yourself copying source code from one place to another, please extract it into a separate component or function.

#### 4. Keep an eye on performance

Keep in mind that the chat application may need to work with thousands of messages.

#### 5. Follow commit formatting rules

We follow [Angular's Commit Message Format rules](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format) with [possible deviations](./developers/COMMIT.md). The same rules are used by our release automation tool. Therefore, every commit message should strictly comply with these rules.

## <a name="submission-guidelines"></a> Submitting your work

1. Make sure you have signed our Contributor License agreement
2. [Fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) the repo and create a dedicated git branch locally
3. Follow the [coding rules](#coding-rules)
4. Create a descriptive PR ([see more on PR requirements](./developers/PR_REVIEW.md))

## <a name="contributor-licence-agreement"></a> Contributor License Agreement

Before we can merge your contribution into our repository, we would like to ask you to sign the [Contributor License Agreement](https://docs.google.com/forms/d/e/1FAIpQLScFKsKkAJI7mhCr7K9rEIOpqIDThrWxuvxnwUq2XkHyG154vQ/viewform).
