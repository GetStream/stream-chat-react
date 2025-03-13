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

const DropzoneInner = <V extends CustomTrigger = CustomTrigger>({
  children,
}: PropsWithChildren<UnknownType>) => {
  const { acceptedFiles, multipleUploads } = useChannelStateContext('DropzoneProvider');

  const { cooldownRemaining, isUploadEnabled, maxFilesLeft, uploadNewFiles } =
    useMessageInputContext<V>('DropzoneProvider');

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

export const DropzoneProvider = <V extends CustomTrigger = CustomTrigger>(
  props: PropsWithChildren<MessageInputProps<V>>,
) => {
  const cooldownTimerState = useCooldownTimer();
  const messageInputState = useMessageInputState<V>(props);

  const messageInputContextValue = useCreateMessageInputContext<V>({
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
