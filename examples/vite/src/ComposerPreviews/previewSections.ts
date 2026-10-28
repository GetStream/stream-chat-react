import {
  defaultMessageComposerPreviewSet,
  type DefaultMessageComposerPreviewType,
  type MessageComposerPreviewSetItem,
} from 'stream-chat-react';

type PreviewSectionInfo = {
  label: string;
  /** What else leaving the section out turns off, so the composer never holds what it cannot show. */
  removes: string;
};

export const PREVIEW_SECTION_INFO: Record<
  DefaultMessageComposerPreviewType,
  PreviewSectionInfo
> = {
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
      'The Poll option in the attachment selector. While shown, the poll dialog attaches the poll to the message instead of sending it.',
  },
  quotedMessage: {
    label: 'Quoted message',
    removes: 'The Quote message action.',
  },
  voiceRecording: {
    label: 'Voice recording',
    removes: 'The record button.',
  },
};

const DEFAULT_TYPES = defaultMessageComposerPreviewSet.map(({ type }) => type);

/**
 * The stored order, minus types the SDK no longer ships, plus default types it does not list yet
 * (appended), so the setting survives SDK upgrades.
 */
export const resolvePreviewSectionOrder = (order: string[]) => [
  ...order.filter((type) => DEFAULT_TYPES.includes(type)),
  ...DEFAULT_TYPES.filter((type) => !order.includes(type)),
];

/** `defaultMessageComposerPreviewSet` reordered and filtered by the Composer settings. */
export const buildPreviewSet = (
  order: string[],
  disabled: string[],
): MessageComposerPreviewSetItem[] =>
  resolvePreviewSectionOrder(order)
    .filter((type) => !disabled.includes(type))
    .flatMap((type) =>
      defaultMessageComposerPreviewSet.filter((item) => item.type === type),
    );
