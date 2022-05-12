import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';

import selectors from '../../selectors';

function getMessage(page: Page, text?: string, nth: number = 1) {
  let selector = `${selectors.message}`;
  if (text) {
    selector += `${selectors.messageWithText} >> :nth-match(:text("${text}"), ${nth})`;
  }
  return page.locator(selector);
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
