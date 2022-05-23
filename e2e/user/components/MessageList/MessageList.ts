import { expect, Page } from '@playwright/test';

import selectors from '../../selectors';
import { getMessage } from '../Message/MessageSimple';

export function getMessageList(page: Page) {
  return page.locator(selectors.messageList);
}

export default (page: Page) => ({
  get: () => getMessageList(page),
  see: {
    contains: {
      async nthMessage(text: string, nth?: number) {
        return await expect(getMessage(page, text, nth)).toBeVisible();
      },
    },
    async empty() {
      return await expect(getMessageList(page)).toBeEmpty();
    },
    async hasLength(count: number) {
      const listItems = page.locator(selectors.messagesInMessageList);
      return await expect(listItems).toHaveCount(count);
    },
    not: {
      async empty() {
        return await expect(getMessageList(page)).not.toBeEmpty();
      },
    },
  },
});
