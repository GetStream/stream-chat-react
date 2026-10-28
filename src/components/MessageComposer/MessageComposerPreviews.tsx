import React from 'react';

import { useMessageComposerPreviewSetFilter } from './hooks/useMessageComposerPreviewSetFilter';
import type { MessageComposerPreviewState } from './hooks/useMessageComposerPreviewState';
import { defaultMessageComposerPreviewSet } from './MessageComposerPreviews.defaults';

/**
 * The preview types {@link defaultMessageComposerPreviewSet} ships, listed for autocomplete. Any
 * string is accepted, so custom previews name themselves.
 */
export type DefaultMessageComposerPreviewType =
  | 'attachments'
  | 'editedMessage'
  | 'linkPreviews'
  | 'location'
  | 'poll'
  | 'quotedMessage'
  | 'voiceRecording';

export type MessageComposerPreviewSetItem = {
  /** Rendered without props while `isVisible` holds. Read the composer with `useMessageComposerController()`. */
  Component: React.ComponentType;
  /** Whether the preview shows for the current composer state. */
  isVisible: (state: MessageComposerPreviewState) => boolean;
  /** Names the preview; unique within a set. */
  type: DefaultMessageComposerPreviewType | (string & {});
};

export type MessageComposerPreviewsProps = {
  /** Previews in render order. Defaults to {@link defaultMessageComposerPreviewSet}. */
  messageComposerPreviewSet?: MessageComposerPreviewSetItem[];
};

/**
 * Renders the composer's visible previews (edited or quoted message, voice recording,
 * attachments, link previews, location, poll) above the textarea, or nothing when none is visible.
 */
export const MessageComposerPreviews = ({
  messageComposerPreviewSet = defaultMessageComposerPreviewSet,
}: MessageComposerPreviewsProps) => {
  const visiblePreviewSet = useMessageComposerPreviewSetFilter(messageComposerPreviewSet);

  if (!visiblePreviewSet.length) return null;

  return (
    <div className='str-chat__message-composer-previews'>
      {visiblePreviewSet.map(({ Component, type }) => (
        <Component key={type} />
      ))}
    </div>
  );
};
