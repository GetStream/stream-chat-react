import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';


export default (page: Page) => {
  function get() {
    return page.locator('data-testid=channel-preview-button');
  }

  return {
    async empty() {
      return await expect(get()).toContainText('Nothing yet...');
    },
    async read() {
      return await expect(get()).not.toHaveClass(/str-chat__channel-preview-messenger--unread/);
    },
    contains: {
      async message(text: string | RegExp) {
        return await expect(get()).toContainText(text);
      }
    },
    not: {
      async read() {
        return await expect(get()).toHaveClass(/str-chat__channel-preview-messenger--unread/);
      }
    }
  }
}



