import type { Page } from '@playwright/test';

import selectors from '../../selectors';

export function getQuotedMessage(page: Page, text: string) {
  return page.locator(`${selectors.quotedMessage} :text("${text}")`);
}

export default (page: Page) => {
  return {
    get: (text: string) => getQuotedMessage(page, text),
    click: {
      //"nth-match" engine expects a one-based index as the last argument
      async nth(text: string, index: number = 1) {
        return page.click(`${selectors.quotedMessage} :nth-match(:text("${text}"),${index})`)
      }
    }
  }
}
