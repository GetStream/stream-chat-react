import React, { PropsWithChildren } from 'react';

import { StreamMessage, useChannelStateContext } from '../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type WindowProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /** show or hide the window when a thread is active */
  hideOnThread?: boolean;
  /** optional prop to manually trigger the opening of a thread*/
  thread?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
};

const UnMemoizedWindow = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: PropsWithChildren<WindowProps<At, Ch, Co, Me, Re, Us>>,
) => {
  const { children, hideOnThread = false } = props;

  const { thread } = useChannelStateContext<At, Ch, Co, Me, Re, Us>('Window');

  // If thread is active and window should hide on thread. Return null
  if (thread && hideOnThread) return null;

  return <div className={`str-chat__main-panel`}>{children}</div>;
};

/**
 * A UI component for conditionally displaying a Thread or Channel
 */
export const Window = React.memo(UnMemoizedWindow) as typeof UnMemoizedWindow;
