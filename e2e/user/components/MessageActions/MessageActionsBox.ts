import type { Page } from '@playwright/test';
import { getMessage } from '../Message/MessageSimple';
import selectors from '../../selectors';

type MessageBoxAction = 'Reply' | 'Pin' | 'Edit Message' | 'Delete';

export default (page: Page) => {
  const open = async (targetMessageText: string, action: MessageBoxAction, nthMessageWithText?: number) => {
    const message = getMessage(page, targetMessageText, nthMessageWithText);
    await message.hover();
    await message.locator(selectors.buttonOpenActionsBox).click()
    return await page.waitForSelector(`${selectors.messageActionsBox} >> text="${action}"`, {state: 'visible'});
  };


  return {
    click: {
      async reply(repliedMessageText: string, nthMessageWithText?: number) {
        await (await open(repliedMessageText, 'Reply', nthMessageWithText)).click();
      },
      async pin(repliedMessageText: string, nthMessageWithText?: number) {
        await (await open(repliedMessageText, 'Pin', nthMessageWithText)).click();
      },
      async editMessage(repliedMessageText: string, nthMessageWithText?: number) {
        await (await open(repliedMessageText, 'Edit Message', nthMessageWithText)).click();
      },
      async delete(repliedMessageText: string, nthMessageWithText?: number) {
        await (await open(repliedMessageText, 'Delete', nthMessageWithText)).click();
      }
    }
  }
}
