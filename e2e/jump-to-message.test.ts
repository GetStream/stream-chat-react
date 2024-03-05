/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { expect } from '@playwright/test';
import { test } from './user/test';

import Message from './user/components/Message/MessageSimple';
import QuotedMessage from './user/components/Message/QuotedMessage';

const suiteArray = [
  ['virtualized', 'jump-to-message--jump-in-virtualized-message-list'],
  ['regular', 'jump-to-message--jump-in-regular-message-list'],
];

const controlsButtonSelector = 'data-testid=jump-to-message';
const onPageLoadWaitForMessage149 = 'data-testid=message-text-inner-wrapper >> text=Message 149';

suiteArray.forEach(([mode, story]) => {
  test.describe(`jump to message - ${mode}`, () => {
    test.beforeEach(async ({ controller }) => {
      await controller.openStory(story, onPageLoadWaitForMessage149);
    });

    test(`${mode} jumps to message 29 and then back to bottom`, async ({ page, user }) => {
      const message29 = await user.sees(Message).not.displayed('Message 29');
      await page.click(controlsButtonSelector);
      await expect(message29).toBeVisible();
    });

    test(`${mode} jumps to quoted message`, async ({ user }) => {
      const text = 'Message 20';
      await user.clicks(QuotedMessage).nth(text);
      await user.sees(Message).displayed(text);
    });
  });
});
