import { expect, Page } from '@playwright/test';

const attachmentTypes = ['card', 'img', 'gallery', 'video', 'file', 'media'] as const;

type AttachmentType = typeof attachmentTypes[number];

export function getAttachment(page: Page, type: AttachmentType) {
  return page.locator(`.str-chat__message-attachment--${type}`);
}

const count = (page: Page, type: AttachmentType) => (elementCount: number) =>
  expect(getAttachment(page, type)).toHaveCount(elementCount);

export default {
  Card: (page: Page) => ({
    get: () => getAttachment(page, 'card'),
    see: { count: count(page, 'card') },
  }),
  File: (page: Page) => ({
    get: () => getAttachment(page, 'file'),
    see: { count: count(page, 'file') },
  }),
  Gallery: (page: Page) => ({
    get: () => getAttachment(page, 'gallery'),
    see: { count: count(page, 'gallery') },
  }),
  Image: (page: Page) => ({
    get: () => getAttachment(page, 'img'),
    see: { count: count(page, 'img') },
  }),
  Media: (page: Page) => ({
    get: () => getAttachment(page, 'media'),
    see: { count: count(page, 'media') },
  }),
  Video: (page: Page) => ({
    get: () => getAttachment(page, 'video'),
    see: { count: count(page, 'video') },
  }),
};
