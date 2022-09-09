import clsx from 'clsx';
import React, { PropsWithChildren } from 'react';

import { StreamMessage, useChannelStateContext } from '../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type WindowProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** show or hide the window when a thread is active */
  hideOnThread?: boolean;
  /** optional prop to manually trigger the opening of a thread*/
  thread?: StreamMessage<StreamChatGenerics>;
};

const UnMemoizedWindow = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: PropsWithChildren<WindowProps<StreamChatGenerics>>,
) => {
  const { children, hideOnThread = false } = props;

  const { thread } = useChannelStateContext<StreamChatGenerics>('Window');

  return (
    <div
      className={clsx('str-chat__main-panel', {
        'str-chat__main-panel--hideOnThread': hideOnThread && thread,
      })}
      id='str-chat__main-panel'
    >
      {children}
    </div>
  );
};

/**
 * A UI component for conditionally displaying a Thread or Channel
 */
export const Window = React.memo(UnMemoizedWindow) as typeof UnMemoizedWindow;
