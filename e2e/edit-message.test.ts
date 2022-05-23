/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import selectors from './user/selectors';
import { test } from './user/test';
import { expect } from '@playwright/test';

// const CHANNEL_NAME = 'edit-message-channel';

test.describe('edit text message', () => {
  test.beforeEach(async ({ controller, page }) => {
    await controller.openStory('edit-message--user1', selectors.buttonAddMessage);
    await controller.clearChannel();

    await Promise.all([page.waitForSelector(selectors.attachmentCard), controller.sendMessage()]);
  });

  test('message has 3 attachments (2 cards and 1 gallery)', ({ page }) => {
    expect(page.locator(selectors.attachmentCard)).toHaveCount(2);
    expect(page.locator(selectors.attachmentGallery)).toHaveCount(1);
  });

  test('message has 2 attachments (1 card and 1 gallery) after updating text', async ({
    page,
    user,
  }) => {
    await user.clicks.MessageActionsBox.editMessage('', 0);

    await user.typesTo.MessageInput.text('jest: https://jestjs.io/docs/cli');

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      page.waitForSelector(`${selectors.attachmentCard} >> text=jestjs.io`),
      user.clicks.Modal.send(),
    ]);

    expect(page.locator(selectors.attachmentCard)).toHaveCount(1);
    expect(page.locator(selectors.attachmentGallery)).toHaveCount(1);
  });

  test('gallery attachment changes to image attachment after removing one image attachment', async ({
    page,
    user,
  }) => {
    await user.clicks.MessageActionsBox.editMessage('', 0);

    await user.clicks.Modal.removeAttachment(0);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      page.waitForSelector(selectors.attachmentImage),
      user.clicks.Modal.send(),
    ]);

    expect(page.locator(selectors.attachmentCard)).toHaveCount(2);
    expect(page.locator(selectors.attachmentGallery)).toHaveCount(0);
    expect(page.locator(selectors.attachmentImage)).toHaveCount(1);
  });

  test('message has only 1 attachment after removing all of the links from the message', async ({
    page,
    user,
  }) => {
    await user.clicks.MessageActionsBox.editMessage('', 0);

    await user.typesTo.MessageInput.text('no links');

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      user.clicks.Modal.send(),
    ]);

    expect(page.locator(selectors.attachmentCard)).toHaveCount(0);
    expect(page.locator(selectors.attachmentGallery)).toHaveCount(1);
  });

  test('edit button does nothing if there are no attachments and text input is empty', async ({
    page,
    user,
  }) => {
    await user.clicks.MessageActionsBox.editMessage('', 0);

    await user.typesTo.MessageInput.text('');

    // remove all attachments
    const locator = page.locator(selectors.buttonCancelUpload);
    const count = await locator.count();
    for (let i = 0; i < count; ++i) {
      await user.clicks.Modal.removeAttachment(0);
    }

    await Promise.all([page.waitForSelector(selectors.modalOpen), user.clicks.Modal.send()]);

    expect(page.locator(selectors.attachmentCard)).toHaveCount(2);
    expect(page.locator(selectors.attachmentGallery)).toHaveCount(1);
  });
});
