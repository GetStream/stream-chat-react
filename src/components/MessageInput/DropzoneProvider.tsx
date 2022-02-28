import React, { PropsWithChildren } from 'react';
import { ImageDropzone } from 'react-file-utils';

import { useCooldownTimer } from './hooks/useCooldownTimer';
import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { useMessageInputState } from './hooks/useMessageInputState';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import {
  MessageInputContextProvider,
  useMessageInputContext,
} from '../../context/MessageInputContext';

import type { MessageInputProps } from './MessageInput';

import type { CustomTrigger, DefaultStreamChatGenerics, UnknownType } from '../../types/types';

const DropzoneInner = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>({
  children,
}: PropsWithChildren<UnknownType>) => {
  const { acceptedFiles, multipleUploads } = useChannelStateContext<StreamChatGenerics>(
    'DropzoneProvider',
  );

  const {
    cooldownRemaining,
    isUploadEnabled,
    maxFilesLeft,
    uploadNewFiles,
  } = useMessageInputContext<StreamChatGenerics, V>('DropzoneProvider');

  return (
    <ImageDropzone
      accept={acceptedFiles}
      disabled={!isUploadEnabled || maxFilesLeft === 0 || !!cooldownRemaining}
      handleFiles={uploadNewFiles}
      maxNumberOfFiles={maxFilesLeft}
      multiple={multipleUploads}
    >
      {children}
    </ImageDropzone>
  );
};

export const DropzoneProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: PropsWithChildren<MessageInputProps<StreamChatGenerics, V>>,
) => {
  const cooldownTimerState = useCooldownTimer<StreamChatGenerics>();
  const messageInputState = useMessageInputState<StreamChatGenerics, V>(props);

  const messageInputContextValue = useCreateMessageInputContext<StreamChatGenerics, V>({
    ...cooldownTimerState,
    ...messageInputState,
    ...props,
  });

  return (
    <MessageInputContextProvider value={messageInputContextValue}>
      <DropzoneInner>{props.children}</DropzoneInner>
    </MessageInputContextProvider>
  );
};
