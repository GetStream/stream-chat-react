import type { Page } from '@playwright/test';

import { selectors } from '../Controller';

export function getMessageInput(page: Page) {
  return page.locator(selectors.messageInput);
}

export function actions(page: Page) {
  return {
    async typeIn(text: string) {
      await page.fill(selectors.messageInput, text);
    }
  }
}

export default (page: Page) => {
  const get = () => getMessageInput(page)
  return {
    async todo() {
      await get();
    }
  }
}
