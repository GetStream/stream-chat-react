/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import selectors from './user/selectors';
import { test } from './user/test';

import Attachment from './user/components/Attachment/Attachment';
import EditMessageForm from './user/components/EditMessageForm/EditMessageForm';
import MessageInput from './user/components/MessageInput';
import MessageActionsBox from './user/components/MessageActions/MessageActionsBox';

test.describe('edit text message', () => {
  test.beforeEach(async ({ controller, page }) => {
    await controller.openStory('edit-message--user1', selectors.buttonAddMessage);
    await controller.clearChannel();

    await Promise.all([page.waitForSelector(selectors.attachmentCard), controller.sendMessage()]);
  });

  test('message has 3 attachments (2 cards and 1 gallery)', ({ user }) => {
    user.sees(Attachment.Card).count(2);
    user.sees(Attachment.Gallery).count(1);
  });

  test('message has 2 attachments (1 card and 1 gallery) after updating text', async ({
    page,
    user,
  }) => {
    await user.clicks(MessageActionsBox).editMessage('', 0);

    await user.typesTo(MessageInput).text('jest: https://jestjs.io/docs/cli');

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      page.waitForSelector(`${selectors.attachmentCard} >> text=jestjs.io`),
      user.clicks(EditMessageForm).send(),
    ]);

    user.sees(Attachment.Card).count(1);
    user.sees(Attachment.Gallery).count(1);
  });

  test('gallery attachment changes to image attachment after removing one image attachment', async ({
    page,
    user,
  }) => {
    await user.clicks(MessageActionsBox).editMessage('', 0);

    await user.clicks(EditMessageForm).removeAttachment(0);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      page.waitForSelector(selectors.attachmentImage),
      user.clicks(EditMessageForm).send(),
    ]);

    user.sees(Attachment.Card).count(2);
    user.sees(Attachment.Gallery).count(0);
    user.sees(Attachment.Image).count(3);
  });

  test('message has only 1 attachment after removing all of the links from the message', async ({
    page,
    user,
  }) => {
    await user.clicks(MessageActionsBox).editMessage('', 0);

    await user.typesTo(MessageInput).text('no links');

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      user.clicks(EditMessageForm).send(),
    ]);

    user.sees(Attachment.Card).count(0);
    user.sees(Attachment.Gallery).count(1);
  });

  test('edit button does nothing if there are no attachments and text input is empty', async ({
    page,
    user,
  }) => {
    await user.clicks(MessageActionsBox).editMessage('', 0);

    await user.typesTo(MessageInput).text('');

    // remove all attachments
    const locator = page.locator(selectors.buttonCancelUpload);
    const count = await locator.count();
    for (let i = 0; i < count; ++i) {
      await user.clicks(EditMessageForm).removeAttachment(0);
    }

    await Promise.all([
      page.waitForSelector(selectors.modalOpen),
      user.clicks(EditMessageForm).send(),
    ]);

    user.sees(Attachment.Card).count(2);
    user.sees(Attachment.Gallery).count(1);
  });
});
