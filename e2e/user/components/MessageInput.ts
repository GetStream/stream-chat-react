import type { Page } from '@playwright/test';

import selectors from '../selectors';

export function getMessageInput(page: Page) {
  return page.locator(selectors.messageInput);
}

export default (page: Page) => ({
  see: {},
  submit: {
    async message(text: string) {
      await page.fill(selectors.messageInput, text);
      return page.keyboard.press('Enter');
    },
    async reply(text: string) {
      await page.fill(selectors.messageInputTextareaThread, text);
      return page.keyboard.press('Enter');
    },
  },
  typeTo: {
    text(text: string) {
      return page.fill(selectors.messageInput, text);
    },
  },
});
