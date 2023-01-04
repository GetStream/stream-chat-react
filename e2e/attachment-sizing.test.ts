import * as dotenv from 'dotenv';
import { expect } from '@playwright/test';

import selectors from './user/selectors';
import { test } from './user/test';

import ChannelPreview from './user/components/ChannelPreview';
import MessageList from './user/components/MessageList/MessageList';

dotenv.config();
dotenv.config({ path: `.env.local` });

const CHANNEL_NAME = 'attachment-sizing' as const;
const user1Id = process.env.E2E_TEST_USER_1;
const USER1_CHAT_VIEW_CLASSNAME = `.${user1Id}`;

test.describe('add height to video and image attachments', () => {
  test.beforeEach(async ({ controller, user }) => {
    await controller.openStory('attachment-sizing--user1', selectors.channelPreviewButton);
    await user.clicks(ChannelPreview).text(CHANNEL_NAME);
  });

  test('should add height for video attachments', async ({ page, user }) => {
    const videoElementsLocator = page.locator('[data-testid="video-wrapper"]');
    const result = await videoElementsLocator.evaluateAll<boolean>(
      (videoElements) =>
        videoElements.length > 0 &&
        videoElements.every((element) => getComputedStyle(element).height.includes('px')),
    );

    expect(result).toBeTruthy();
    await user
      .sees(MessageList)
      .isScrolledToBottom(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageListContainer}`);
  });

  test('should add height for single image attachments', async ({ page, user }) => {
    const imageElementsLocator = page.locator('[data-testid="image-test"]');
    const result = await imageElementsLocator.evaluateAll(
      (imageElements) =>
        imageElements.length > 0 &&
        imageElements.every((element) => getComputedStyle(element).height.includes('px')),
    );

    expect(result).toBe(true);
    await user
      .sees(MessageList)
      .isScrolledToBottom(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageListContainer}`);
  });

  test('should add height for gallery image attachments', async ({ page, user }) => {
    const imageElementsLocator = page.locator(
      '[data-testid="gallery-image-last"],[data-testid="gallery-image"]',
    );
    const result = await imageElementsLocator.evaluateAll(
      (imageElements) =>
        imageElements.length > 0 &&
        imageElements.every((element) => getComputedStyle(element).height.includes('px')),
    );

    expect(result).toBe(true);
    await user
      .sees(MessageList)
      .isScrolledToBottom(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageListContainer}`);
  });
});
