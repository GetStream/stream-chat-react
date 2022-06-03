import type { Page } from '@playwright/test';

import selectors from '../../selectors';

export function getQuotedMessage(page: Page, text: string) {
  return page.locator(`${selectors.quotedMessage} :text("${text}")`);
}

export default (page: Page) => ({
  click: {
    //"nth-match" engine expects a one-based index as the last argument
    nth(text: string, index = 1) {
      return page.click(`${selectors.quotedMessage} :nth-match(:text("${text}"),${index})`);
    },
  },
  get: (text: string) => getQuotedMessage(page, text),
});
