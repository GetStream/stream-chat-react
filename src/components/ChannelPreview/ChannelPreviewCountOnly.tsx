import React from 'react';

import type { ChannelPreviewUIComponentProps } from './ChannelPreview';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

const UnMemoizedChannelPreviewCountOnly = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: ChannelPreviewUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, displayTitle, setActiveChannel, unread, watchers } = props;

  return (
    <div className={unread && unread >= 1 ? 'unread' : ''}>
      <button
        onClick={() => {
          if (setActiveChannel) {
            setActiveChannel(channel, watchers);
          }
        }}
      >
        {' '}
        {displayTitle} <span>{unread}</span>
      </button>
    </div>
  );
};

/**
 * @deprecated - This UI component will be removed in the next major release.
 */
export const ChannelPreviewCountOnly = React.memo(
  UnMemoizedChannelPreviewCountOnly,
) as typeof UnMemoizedChannelPreviewCountOnly;
