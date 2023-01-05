import { expect, Page } from '@playwright/test';

import selectors from '../../selectors';
import { getMessage } from '../Message/MessageSimple';

export function getMessageList(page: Page) {
  return page.locator(selectors.messageListContainer);
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
      return await expect(getMessageList(page)).toContainText('No chats here yet…');
    },
    async hasLength(count: number) {
      const listItems = page.locator(selectors.messagesInMessageList);
      return await expect(listItems).toHaveCount(count);
    },
    async isScrolledToBottom(selector: string) {
      expect(
        await page.evaluate(
          ([selector]) => {
            const messageList = document.querySelector(selector);
            if (!messageList) return false;
            return messageList.scrollTop + messageList.clientHeight === messageList.scrollHeight;
          },
          [selector],
        ),
      ).toBeTruthy();
    },
    not: {
      async empty() {
        // eslint-disable-next-line jest/no-standalone-expect
        await expect(getMessageList(page)).not.toBeEmpty();
      },
    },
  },
});
