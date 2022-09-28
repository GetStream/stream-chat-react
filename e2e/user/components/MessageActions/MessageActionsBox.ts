import type { Page } from '@playwright/test';
import { getMessage } from '../Message/MessageSimple';
import selectors from '../../selectors';

type MessageBoxAction = 'Reply' | 'Pin' | 'Unpin' | 'Edit Message' | 'Delete';

export default (page: Page) => {
  const open = async (
    targetMessageText: string,
    action: MessageBoxAction,
    nthMessageWithText?: number,
  ) => {
    const message = getMessage(page, targetMessageText, nthMessageWithText);
    await message.hover();

    const [elementHandle] = await Promise.all([
      page.waitForSelector(`${selectors.messageActionsBox} >> text="${action}"`, {
        state: 'visible',
      }),
      message.locator(selectors.buttonOpenActionsBox).click(),
    ]);

    return elementHandle;
  };

  return {
    click: {
      async delete(repliedMessageText: string, nthMessageWithText?: number) {
        return (await open(repliedMessageText, 'Delete', nthMessageWithText)).click();
      },
      async editMessage(repliedMessageText: string, nthMessageWithText?: number) {
        const buttonElementHandle = await open(
          repliedMessageText,
          'Edit Message',
          nthMessageWithText,
        );
        const [, clickEvent] = await Promise.all([
          page.waitForSelector(selectors.modalOpen),
          buttonElementHandle.click(),
        ]);
        return clickEvent;
      },
      async pin(repliedMessageText: string, nthMessageWithText?: number) {
        return (await open(repliedMessageText, 'Pin', nthMessageWithText)).click();
      },
      async reply(repliedMessageText: string, nthMessageWithText?: number) {
        return (await open(repliedMessageText, 'Reply', nthMessageWithText)).click();
      },
      async unpin(repliedMessageText: string, nthMessageWithText?: number) {
        return (await open(repliedMessageText, 'Unpin', nthMessageWithText)).click();
      },
    },
  };
};
