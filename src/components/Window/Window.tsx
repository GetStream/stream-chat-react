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
} from '../../../types/types';

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

  const { thread } = useChannelStateContext<At, Ch, Co, Me, Re, Us>();

  // If thread is active and window should hide on thread. Return null
  if (thread && hideOnThread) return null;

  return <div className={`str-chat__main-panel`}>{children}</div>;
};

/**
 * Window - A UI component for conditionally displaying a Thread or Channel. If you want the Thread to be displayed side by side with the Channel that's also possible with the Window.
 * It's a very minimal component that might fit some usecases, and if not it's an easy to modify and rewrite component.
 */
export const Window = React.memo(UnMemoizedWindow) as typeof UnMemoizedWindow;
