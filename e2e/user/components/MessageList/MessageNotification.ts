import type { Page } from '@playwright/test';

import selectors from '../../selectors';

function getMessageNotification(page: Page, text: string) {
  return page.locator(`${selectors.messageNotification} :text(${text})`)
}

export default (page: Page) => {
  return {
    get: (text: string) => getMessageNotification(page, text),
    click: {
      async text(text: string) {
        await page.click(`${selectors.messageNotification} >> text="${text}"`)
      }
    }
  }
}
