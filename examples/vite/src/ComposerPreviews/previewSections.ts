import {
  defaultMessageComposerPreviewSet,
  type DefaultMessageComposerPreviewType,
  type MessageComposerPreviewSetItem,
} from 'stream-chat-react';

import { pollPreviewItem } from './PollPreview';

type PreviewSectionInfo = {
  label: string;
  /** What else leaving the section out turns off, so the composer never holds what it cannot show. */
  removes: string;
};

/** The SDK's default previews plus this app's poll preview, which the SDK does not ship. */
const examplePreviewSet: MessageComposerPreviewSetItem[] = [
  ...defaultMessageComposerPreviewSet,
  pollPreviewItem,
];

/** The preview types the Composer settings list. */
export type PreviewSectionType = DefaultMessageComposerPreviewType | 'poll';

export const PREVIEW_SECTION_INFO: Record<PreviewSectionType, PreviewSectionInfo> = {
  attachments: {
    label: 'Files',
    removes:
      'The File option in the attachment selector; dropped and pasted files are rejected.',
  },
  editedMessage: {
    label: 'Edited message',
    removes: 'The Edit and Edit inline message actions.',
  },
  linkPreviews: {
    label: 'Link previews',
    removes: 'Link scraping while typing.',
  },
  location: {
    label: 'Location',
    removes: 'The Location option in the attachment selector.',
  },
  poll: {
    label: 'Poll',
    removes:
      "The Poll option in the attachment selector. This app's own preview (PollPreview.tsx), not one the SDK ships. While shown, the poll dialog attaches the poll to the message instead of sending it.",
  },
  quotedMessage: {
    label: 'Quoted message',
    removes: 'The Quote message action.',
  },
  scheduledMessage: {
    label: 'Scheduled message',
    removes: 'The Edit and Retry actions of the scheduled messages list.',
  },
  voiceRecording: {
    label: 'Voice recording',
    removes: 'The record button.',
  },
};

const DEFAULT_TYPES = examplePreviewSet.map(({ type }) => type);

/**
 * The stored order, minus types the SDK no longer ships, plus default types it does not list yet
 * (appended), so the setting survives SDK upgrades.
 */
export const resolvePreviewSectionOrder = (order: string[]) => [
  ...order.filter((type) => DEFAULT_TYPES.includes(type)),
  ...DEFAULT_TYPES.filter((type) => !order.includes(type)),
];

/** The app's preview set reordered and filtered by the Composer settings. */
export const buildPreviewSet = (
  order: string[],
  disabled: string[],
): MessageComposerPreviewSetItem[] =>
  resolvePreviewSectionOrder(order)
    .filter((type) => !disabled.includes(type))
    .flatMap((type) => examplePreviewSet.filter((item) => item.type === type));
