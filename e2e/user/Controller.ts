import type { Page } from '@playwright/test';

import selectors from './selectors';

export class Controller {
  constructor(private baseURL: string | undefined, private page: Page) {}

  async openStory(story: string, waitForPresence: string) {
    await Promise.all([
      this.page.waitForSelector(waitForPresence),
      this.page.goto(`${this.baseURL}/?story=${story}`),
    ]);
  }

  async reloadPage(waitForSelector: string) {
    await Promise.all([
      this.page.waitForSelector(waitForSelector),
      this.page.reload({ waitUntil: 'networkidle' }),
    ]);
  }

  async clearChannel() {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/truncate') && r.ok()),
      this.page.waitForSelector('.str-chat__empty-channel'),
      this.page.click(selectors.truncateChannelButton),
    ]);
  }

  async sendMessage(waitForSelector?: string) {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      waitForSelector ? this.page.waitForSelector(waitForSelector) : Promise.resolve(),
      this.page.click(selectors.buttonAddMessage),
    ]);
  }

  async sendOtherUserMessage() {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      this.page.click(selectors.buttonAddOtherUserMessage),
    ]);
  }

  async sendOtherUserReply() {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      this.page.click(selectors.buttonSendOtherUserReply),
    ]);
  }

  async deleteMyLastReply() {
    await this.page.click(selectors.controlsBtnDeleteLastReply);
  }

  async deleteOtherUserLastReply() {
    await this.page.click(selectors.controlsBtnDeleteOtherUserLastReply);
  }

  async deleteOtherUserLastMessage() {
    await this.page.click(selectors.controlsBtnDeleteOtherUserLastMessage);
  }
}
