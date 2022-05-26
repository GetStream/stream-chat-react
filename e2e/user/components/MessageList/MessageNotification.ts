import type { Page } from '@playwright/test';

import selectors from '../../selectors';

function getMessageNotification(page: Page, text: string) {
  return page.locator(`${selectors.messageNotification} :text(${text})`);
}

export default (page: Page) => ({
  click: {
    text(text: string) {
      return page.click(`${selectors.messageNotification} >> text="${text}"`);
    },
  },
  get: (text: string) => getMessageNotification(page, text),
});
