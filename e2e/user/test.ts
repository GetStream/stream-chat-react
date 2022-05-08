import { test as base } from '@playwright/test';
import { Controller } from './Controller';
import { makeUser, TestingUser } from './User';

export const test = base.extend<{ controller: Controller; user: TestingUser }>({
  controller: async ({ baseURL, page }, use) => {
    await use(new Controller(baseURL, page));
  },
  user: async ({ page }, use) => {
    await use(makeUser(page));
  },
});
