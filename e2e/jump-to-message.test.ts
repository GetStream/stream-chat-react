/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { test } from './user/test';

import Message from './user/components/Message/MessageSimple';
import QuotedMessage from './user/components/Message/QuotedMessage';

const suiteArray = [
  ['virtualized', 'jump-to-message--jump-in-virtualized-message-list'],
  ['regular', 'jump-to-message--jump-in-regular-message-list'],
];

const onPageLoadWaitForMessage149 = 'data-testid=message-text-inner-wrapper >> text=Message 149';

suiteArray.forEach(([mode, story]) => {
  test.describe(`jump to message - ${mode}`, () => {
    test.beforeEach(async ({ controller }) => {
      await controller.openStory(story, onPageLoadWaitForMessage149);
    });

    test(`${mode} jumps to quoted message`, async ({ user }) => {
      const text = 'Message 20';
      await user.clicks(QuotedMessage).nth(text);
      await user.sees(Message).displayed(text);
    });
  });
});
