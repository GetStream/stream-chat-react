import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';

import { selectors } from '../Controller';

export function getMessageList(page: Page) {
  return page.locator(selectors.messageList);
}


export default (page: Page) => {
  const get = () => getMessageList(page);

  return {
    async empty() {
      return await expect(get()).toBeEmpty();
    },
    contains: {
      async message(text: string | RegExp) {
        const newMessage = page.locator('.str-chat__message').first();
        return await expect(newMessage).toContainText(text);
      }
    },
    not: {
      async empty() {
        return await expect(get()).not.toBeEmpty();
      }
    }
  }
}



