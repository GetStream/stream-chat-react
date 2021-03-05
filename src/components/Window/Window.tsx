import React, { PropsWithChildren } from 'react';

import { useChannelContext } from '../../context/ChannelContext';

import type { MessageResponse } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type WindowProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /** show or hide the window when a thread is active */
  hideOnThread?: boolean;
  /** optional prop to manually trigger the opening of a thread*/
  thread?: MessageResponse<At, Ch, Co, Me, Re, Us>;
};

const UnMemoizedWindow = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: PropsWithChildren<WindowProps<At, Ch, Co, Me, Re, Us>>,
) => {
  const { children, hideOnThread = false } = props;

  const { thread } = useChannelContext<At, Ch, Co, Me, Re, Us>();

  // If thread is active and window should hide on thread. Return null
  if (thread && hideOnThread) return null;

  return <div className={`str-chat__main-panel`}>{children}</div>;
};

/**
 * Window - A UI component for conditionally displaying thread or channel.
 * @example ./Window.md
 */
export const Window = React.memo(UnMemoizedWindow) as typeof UnMemoizedWindow;
