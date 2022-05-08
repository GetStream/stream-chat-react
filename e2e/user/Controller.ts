import type { Page } from '@playwright/test';

export const selectors = {
  addMessageButton: 'data-testid=add-message',
  channelPreviewButton: 'data-testid=channel-preview-button',
  messageInput: 'data-testid=message-input',
  messageList: '.str-chat__list',
  truncateChannelButton: 'data-testid=truncate',
};

export class Controller {
  constructor(private baseURL: string | undefined, private page: Page) {
  }

  async openStory(story: string, isLoadedIfAppears: string) {
    await Promise.all([
      this.page.waitForSelector(isLoadedIfAppears),
      this.page.goto(`${this.baseURL}/?story=${story}`),
    ]);
  }

  activateChannel() {
    return this.page.locator(selectors.channelPreviewButton).click();
  }

  async clearChannel() {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/truncate') && r.ok()),
      this.page.click(selectors.truncateChannelButton),
    ]);
  }

  async sendMessage() {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      this.page.click(selectors.addMessageButton),
    ]);
  }

  async markChannelReadByClickingChannelPreview() {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/read') && r.ok()),
      this.activateChannel(),
    ]);

  }
}
