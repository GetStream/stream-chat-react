import { test as _test } from '@playwright/test';
import { Controller } from './Controller';
import { makeUser, TestingUser } from './User';

export type CustomTestContext = {
  controller: Controller;
  user: TestingUser;
};

export const test = _test.extend<CustomTestContext>({
  controller: async ({ baseURL, page }, use) => {
    await use(new Controller(baseURL, page));
  },
  user: async ({ page }, use) => {
    await use(makeUser(page));
  },
});
