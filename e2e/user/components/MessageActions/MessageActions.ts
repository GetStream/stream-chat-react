import { getMessage } from '../Message/MessageSimple';
import selectors from '../../selectors';
import type { Page } from '@playwright/test';

export default (page: Page) => ({
  click: {
    async reply(targetMessageText: string, nthMessageWithText?: number) {
      const message = getMessage(page, targetMessageText, nthMessageWithText);
      await message.hover();
      await message.locator(selectors.buttonOpenThread).click();
    },
  },
});
