/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { expect } from '@playwright/test';

import {test} from './user/test';
import { getMessageInput } from './user/components/MessageInput';
import selectors from './user/selectors';

const MENTION_TRIGGER = '@';

test.describe('autocomplete a mention', () => {
  test('should fill in textarea with username', async ({ controller, user, page }) => {
    await controller.openStory('hello--basic-setup', selectors.messageInput );

    await user.typesTo.MessageInput.text(MENTION_TRIGGER);

    const autocompleteSuggestionItem = await user.clicks.AutocompleteSuggestionItem.nth(1)
    const textContent = await autocompleteSuggestionItem.textContent();

    await expect(getMessageInput(page)).toContainText(`${MENTION_TRIGGER}${textContent}`);
  });
})
