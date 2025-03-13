import type { PropsWithChildren } from 'react';
import React from 'react';
import { ImageDropzone } from '../ReactFileUtilities';

import { useCooldownTimer } from './hooks/useCooldownTimer';
import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { useMessageInputState } from './hooks/useMessageInputState';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import {
  MessageInputContextProvider,
  useMessageInputContext,
} from '../../context/MessageInputContext';

import type { MessageInputProps } from './MessageInput';

import type { CustomTrigger, UnknownType } from '../../types/types';
import { useMessageComposer } from './hooks/messageComposer/useMessageComposer';
import { useIsUploadEnabled } from './hooks/messageComposer/useIsUploadEnabled';

// const attachmentManagerStateSelector = <
//
// >(
//   state: AttachmentManagerState,
// ) => ({ isUploadEnabled: state.isUploadEnabled });

const DropzoneInner = <V extends CustomTrigger = CustomTrigger>({
  children,
}: PropsWithChildren<UnknownType>) => {
  const { acceptedFiles } = useChannelStateContext('DropzoneProvider');

  const { cooldownRemaining } = useMessageInputContext<V>('DropzoneProvider');
  const messageComposer = useMessageComposer();
  const { availableUploadSlots, isUploadEnabled } = useIsUploadEnabled();

  return (
    <ImageDropzone
      accept={acceptedFiles}
      disabled={!isUploadEnabled || !!cooldownRemaining}
      handleFiles={messageComposer.attachmentManager.uploadFiles}
      maxNumberOfFiles={availableUploadSlots}
      multiple={messageComposer.attachmentManager.maxNumberOfFilesPerMessage > 1}
    >
      {children}
    </ImageDropzone>
  );
};

export const DropzoneProvider = <V extends CustomTrigger = CustomTrigger>(
  props: PropsWithChildren<MessageInputProps<V>>,
) => {
  const cooldownTimerState = useCooldownTimer();
  const messageInputState = useMessageInputState<V>(props);
  const messageComposer = useMessageComposer({ message: props.message });

  const messageInputContextValue = useCreateMessageInputContext<V>({
    ...cooldownTimerState,
    ...messageInputState,
    ...props,
    messageComposer,
  });

  return (
    <MessageInputContextProvider value={messageInputContextValue}>
      <DropzoneInner>{props.children}</DropzoneInner>
    </MessageInputContextProvider>
  );
};
