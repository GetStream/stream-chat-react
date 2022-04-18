## 1. Set yourself up
If you are solving issues, that require adjustments in CSS or Stream Chat API client, then you want to fork the following repositories:

- `stream-chat-react`
- `stream-chat-css`
- `stream-chat-js`


GitHub provides guides on how to [fork and contribute to projects](https://docs.github.com/en/get-started/quickstart/contributing-to-projects).

## 2. Link the peer dependencies
If you are doing changes in peer dependencies and you want to see them reflected in a running application, you will need to [create symbolic links](https://classic.yarnpkg.com/en/docs/cli/link) to those repositories on your disk (`yarn link` in peer dependency's root folder --> `yarn link dep_name` in `stream-chat-react` root folder). No need to tweak `package.json` manually.

## 3. Create a new branch
Please create a new branch from the freshly pulled `develop` branch. We keep a simple [system of branches](./BRANCHES.md).

## 4. Write your code
Please follow our [Coding rules](../CONTRIBUTING.md#coding-rules). You can start by designing the user journeys by writing E2E tests.

## 4. Run your code
Again, if you are doing changes in peer dependencies, run `yarn start`:
1. in their root folders as well as
2. in the root folder of the `stream-chat-react` package.

Then you can start one of the applications in the `examples` folder. We recommend you to run the [`typescript` app](../examples/typescript).

## 5. Push your changes and create a PR
You are almost done. Please do not underestimate the role of a [well-prepared PR](./PR.md).

## 6. Fix imperfections
It can happen that the PR reviewer asks you to fix imperfections in your implementation. Please make adjustments agreed with the PR reviewer and push them back upstream.

## 7. Once the PR is merged
You can delete the local copy of your branch. Well done!
