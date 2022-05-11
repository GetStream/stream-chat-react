import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';

import selectors from '../../selectors';

export function getMessageList(page: Page) {
  return page.locator(selectors.messageList);
}

export default (page: Page) => {
  const get = () => getMessageList(page);

  return {
    see: {
      async empty() {
        return await expect(get()).toBeEmpty();
      },
      async hasLength(count: number) {
        const listItems = page.locator(selectors.messagesInMessageList);
        return await expect(listItems).toHaveCount(count);
      },
      contains: {
        async message(text: string, index?: number) {
          let component = page.locator(`${selectors.message} :text("${text}")`);
          if (index !== undefined) {
            component = component.nth(index)
          }
          return await expect(component).toBeVisible();
        }
      },
      not: {
        async empty() {
          return await expect(get()).not.toBeEmpty();
        }
      }
    }

  }
}



