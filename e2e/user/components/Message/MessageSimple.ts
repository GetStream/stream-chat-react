import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';

import selectors from '../../selectors';

export function getMessage(page: Page, text?: string, index: number = 0, inThread: boolean = false) {
  let selector = `${selectors.message}`;
  if (text) {
    selector += `${selectors.messageWithText} :has-text("${text}")`;
  }
  if (inThread) {
    selector = `${selectors.threadReplyList} ${selector}`
  }

  let componentLocator = page.locator(selector);
  if (index !== undefined) {
    componentLocator = componentLocator.nth(index);
  }
  return componentLocator;
}

export default (page: Page) => {
  return {
    get: (text?: string) => getMessage(page, text),
    see: {
      async displayed(text?: string, nth?: number) {
        const target = getMessage(page, text, nth);
        await expect(target).toBeVisible();
        return target;
      },
      not: {
        async displayed(text?: string, nth?: number) {
          const target = getMessage(page, text, nth);
          await expect(getMessage(page, text, nth)).not.toBeVisible();
          return target;
        },
      }
    }
  }
}
