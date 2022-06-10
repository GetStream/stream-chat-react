import type { Page } from '@playwright/test';
import selectors from '../../selectors';
import { expect } from '@playwright/test';
import { getMessage } from '../Message/MessageSimple';
// import { getMessage, getMessageSelector } from '../Message/MessageSimple';
// import { isVisible } from '../../utls';


export default (page: Page) => {
  return {
    get: (prependSelectors?: string) => page.locator(`${prependSelectors || ''} ${selectors.threadMessageList}`),
    click: {
      async close() {
        await page.click(selectors.buttonCloseThread);
      },
      async openFor(messageText: string, nth: number = 0) {
        await page
          .locator(selectors.message, { hasText: messageText })
          .locator(selectors.messageRepliesButton).nth(nth).click();
      },
    },
    see: {
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
      async empty() {
        const replies = page.locator(`${selectors.threadReplyList}`);
        await expect(replies).toBeEmpty();
      },
      async start() {
        await expect(page.locator(selectors.threadStart)).toBeVisible();
      },
      not: {
        async empty() {
          const replies = page.locator(selectors.threadReplyListWithReplies);
          await expect(replies).not.toBeEmpty();
        },
        inDOM: {
          async nthMessage(text: string, nth?: number) {
            const isThread = true;
            const msgLocator = getMessage(page, text, nth, isThread);
            await expect(msgLocator).toHaveCount(0);
          }
        },
        inViewport: {
          async nthMessage(text: string, nth?: number) {
            const isThread = true;
            const msgLocator = getMessage(page, text, nth, isThread);
            await expect(msgLocator).not.toBeVisible();

            // todo: playwright's toBeVisible() does not differ, whether the element is in viewport or not
            // => needed custom function to determine

            // await expect(msgLocator).toBeVisible();
            // const threadMsgListBox = await page.locator(selectors.threadMessageList).boundingBox();
            // const msgBox = await msgLocator.boundingBox();
            // expect(isVisible(msgBox, threadMsgListBox)).toBeFalsy();
          },
        },
      },
    },
  };
}
