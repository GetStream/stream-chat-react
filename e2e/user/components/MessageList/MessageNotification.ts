import type { Page } from '@playwright/test';

import selectors from '../../selectors';

export function getMessageNotificationSelector(text: string) {
  return `${selectors.messageNotification} >> text="${text}"`;
}

function getMessageNotification(page: Page, text: string) {
  return page.locator(getMessageNotificationSelector(text));
}

export default (page: Page) => ({
  click: {
    text(text: string) {
      return page.click(getMessageNotificationSelector(text));
    },
  },
  get: (text: string) => getMessageNotification(page, text),
});
