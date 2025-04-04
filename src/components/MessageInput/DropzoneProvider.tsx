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

import type { UnknownType } from '../../types/types';
import { useMessageComposer } from './hooks/messageComposer/useMessageComposer';
import { useAttachmentManagerState } from './hooks/messageComposer/useAttachmentManagerState';

// const attachmentManagerStateSelector = <
//
// >(
//   state: AttachmentManagerState,
// ) => ({ isUploadEnabled: state.isUploadEnabled });

const DropzoneInner = ({ children }: PropsWithChildren<UnknownType>) => {
  const { acceptedFiles } = useChannelStateContext('DropzoneProvider');

  const { cooldownRemaining } = useMessageInputContext('DropzoneProvider');
  const messageComposer = useMessageComposer();
  const { availableUploadSlots, isUploadEnabled } = useAttachmentManagerState();

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

export const DropzoneProvider = (props: PropsWithChildren<MessageInputProps>) => {
  const cooldownTimerState = useCooldownTimer();
  const messageInputState = useMessageInputState(props);

  const messageInputContextValue = useCreateMessageInputContext({
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
