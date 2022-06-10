import type { Page } from '@playwright/test';
import selectors from '../../selectors';
import { expect } from '@playwright/test';
import { getMessage } from '../Message/MessageSimple';

export default (page: Page) => ({
  click: {
    close() {
      return page.click(selectors.buttonCloseThread);
    },
    async openFor(messageText: string, nth: number = 0) {
      await page
        .locator(selectors.message, { hasText: messageText })
        .locator(selectors.messageRepliesButton).nth(nth).click();
    },
  },
  get: (prependSelectors?: string) =>
    page.locator(`${prependSelectors || ''} ${selectors.threadMessageList}`),
  see: {
    empty() {
      const replies = page.locator(`${selectors.threadReplyList}`);
      return expect(replies).toBeEmpty();
    },
    inViewport: {
      async nthMessage(text: string, nth?: number) {
        const isThread = true;
        await expect(getMessage(page, text, nth, isThread)).toBeVisible();
        // todo: playwright's toBeVisible() does not differ, whether the element is in viewport or not
        // => needed custom function to determine
        // await page.waitForSelector(getMessageSelector(text, nth, isThread))
        // const threadMsgListBox = await page.locator(selectors.threadMessageList).boundingBox();
        // const msgBox = await getMessage(page, text, nth, isThread).boundingBox();
        // expect(isVisible(msgBox, threadMsgListBox)).toBeTruthy();
      },
    },
    not: {
      empty() {
        const replies = page.locator(selectors.threadReplyListWithReplies);
        return expect(replies).not.toBeEmpty();
      },
      inDOM: {
        nthMessage(text: string, nth?: number) {
          const isThread = true;
          const msgLocator = getMessage(page, text, nth, isThread);
          return expect(msgLocator).toHaveCount(0);
        },
      },
      inViewport: {
        nthMessage(text: string, nth?: number) {
          const isThread = true;
          const msgLocator = getMessage(page, text, nth, isThread);
          return expect(msgLocator).not.toBeVisible();

          // todo: playwright's toBeVisible() does not differ, whether the element is in viewport or not
          // => needed custom function to determine

          // await expect(msgLocator).toBeVisible();
          // const threadMsgListBox = await page.locator(selectors.threadMessageList).boundingBox();
          // const msgBox = await msgLocator.boundingBox();
          // expect(isVisible(msgBox, threadMsgListBox)).toBeFalsy();
        },
      },
    },
    start() {
      return expect(page.locator(selectors.threadStart)).toBeVisible();
    },
  },
});
