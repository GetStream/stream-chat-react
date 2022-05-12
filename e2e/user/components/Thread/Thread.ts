import type { Page } from '@playwright/test';
import selectors from '../../selectors';
import { expect } from '@playwright/test';
import { getMessage } from '../Message/MessageSimple';

export default (page: Page) => {
  return {
    click: {
      async close() {
        await page.click(selectors.buttonCloseThread);
      },
      async open() {
        await page.click(selectors.buttonCloseThread);
      },
    },
    see: {
      contains: {
        async nthMessage(text: string, nth?: number) {
          const isThread = true;
          await expect(getMessage(page, text, nth, isThread)).toBeVisible();
        },
      },
      async empty() {
        const replies = page.locator(`${selectors.threadReplyList}`);
        await expect(replies).toBeEmpty();
      },
      not: {
        async empty() {
          const replies = page.locator(`${selectors.threadReplyList} ul`);
          await expect(replies).not.toBeEmpty();
        },
      },
    },
  };
}
