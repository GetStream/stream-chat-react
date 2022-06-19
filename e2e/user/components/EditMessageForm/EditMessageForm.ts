import { Page } from '@playwright/test';

import selectors from '../../selectors';

export function getEditMessageForm(page: Page) {
  return page.locator(selectors.modalOpen);
}

export default (page: Page) => ({
  click: {
    cancel() {
      return page.click(selectors.buttonCancel);
    },
    removeAttachment(index: number) {
      // used keyboard press instead of a mouseclick as mouseclick causes unwanted Modal cancelation
      // which is a bug that should be addressed
      return page.locator(selectors.buttonCancelUpload).nth(index).press('Enter');
    },
    send() {
      return page.click(selectors.buttonSend);
    },
  },
  get: () => getEditMessageForm(page),
});
