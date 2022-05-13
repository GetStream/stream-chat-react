import type { Page } from '@playwright/test';
import selectors from '../../selectors';
import { expect } from '@playwright/test';
import { getMessage } from '../Message/MessageSimple';
// import { getMessage, getMessageSelector } from '../Message/MessageSimple';
// import { isVisible } from '../../utls';


export default (page: Page) => {
  return {
    click: {
      async close() {
        await page.click(selectors.buttonCloseThread);
      },
      async open(text: string) {
        await page.locator(selectors.messageRepliesButton, { hasText: text }).click();
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
