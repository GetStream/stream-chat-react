import type { Page } from '@playwright/test';

import selectors from '../selectors';

export function getMessageInput(page: Page) {
  return page.locator(selectors.messageInput);
}


export default (page: Page) => {
  return {
    see: {

    },
    typeTo: {
      async text(text: string) {
        await page.fill(selectors.messageInput, text);
      }
    },
    submit: {
      async message(text: string) {
        await page.fill(selectors.messageInput, text);
        await page.keyboard.press('Enter');
      },
      async reply(text: string) {
        await page.fill(selectors.messageInputTextareaThread, text);
        await page.keyboard.press('Enter');
      }
    }
  };
}
