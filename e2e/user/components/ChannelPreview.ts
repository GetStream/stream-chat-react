import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';

import selectors from '../selectors';

export default (page: Page) => {
  function getChannelPreview(text: string) {
    return page.locator(`${selectors.channelPreviewButton}`, { hasText: text });
  }

  return {
    click: {
      text(text: string) {
        return page.click(`${selectors.channelPreviewButton} :has-text("${text}")`, {
          strict: false,
        });
      },
    },
    get: (text: string) => getChannelPreview(text),
    see(text: string) {
      const target = getChannelPreview(text);
      return {
        contains: {
          lastMessage(text: string | RegExp) {
            return expect(target.locator(selectors.channelPreviewLastMessage)).toContainText(text);
          },
          message(text: string | RegExp) {
            return expect(target).toContainText(text);
          },
        },
        empty() {
          return expect(target).toContainText('Nothing yet...');
        },
        not: {
          read() {
            return expect(target).toHaveClass(/str-chat__channel-preview-messenger--unread/);
          },
        },
        read() {
          return expect(target).not.toHaveClass(/str-chat__channel-preview-messenger--unread/);
        },
      };
    },
  };
};
