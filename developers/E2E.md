note: this document is a WIP

# E2E tests

End-to-end tests are a great mean of:
- quality assurance
- feature documentation

They play a crucial role in communicating the expected behavior and interaction between the components. E2E test suites are great for documenting the user journeys - a good start to developing a given feature.

 Our E2E tests live in the [`e2e` folder](./e2e). They rely on so-called stories located in [`src/stories` folder](./src/components). E2E tests are run with the combination of [ladle](https://www.ladle.dev/) (utility used for documenting our components in form of stories) and [playwright](https://playwright.dev/) (E2E test runner).

To run the E2E tests you need to:

1. Create your Stream chat application in the [Stream Dashboard](https://dashboard.getstream.io/) (we recommend you to use a dedicated app).
2. Create a `.env` file in the repository's root directory with env variable names corresponding to those in [`.env.example` file](./.env.example).
3. Populate channels with messages in your chat application running the fixtures script `yarn e2e-fixtures`
4. Run E2E tests with `yarn e2e` script
