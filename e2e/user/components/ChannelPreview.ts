import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';

import selectors from '../selectors';

export default (page: Page) => {
  function getChannelPreview(text: string) {
    return page.locator(`${selectors.channelPreviewButton}`, {hasText: text});
  }

  return {
    get: (text: string) => getChannelPreview(text),
    click: {
      async text(text: string) {
        await page.click(`${selectors.channelPreviewButton} :has-text("${text}")`, {strict: false})
      }
    },
    see(text: string) {
      const target = getChannelPreview(text);
      return {
        async empty() {
          return await expect(target).toContainText('Nothing yet...');
        },
        async read() {
          return await expect(target).not.toHaveClass(/str-chat__channel-preview-messenger--unread/);
        },
        contains: {
          async message(text: string | RegExp) {
            return await expect(target).toContainText(text);
          },
          async lastMessage(text: string | RegExp) {
            await expect(target.locator(selectors.channelPreviewLastMessage)).toContainText(text)
          }
        },
        not: {
          async read() {
            return await expect(target).toHaveClass(/str-chat__channel-preview-messenger--unread/);
          }
        }
      }
    },
  }
}



