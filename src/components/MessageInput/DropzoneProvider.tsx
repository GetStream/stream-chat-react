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

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const DropzoneInner = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>({
  children,
}: PropsWithChildren<UnknownType>) => {
  const { acceptedFiles, multipleUploads } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>(
    'DropzoneProvider',
  );

  const {
    cooldownRemaining,
    isUploadEnabled,
    maxFilesLeft,
    uploadNewFiles,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>('DropzoneProvider');

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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  props: PropsWithChildren<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>>,
) => {
  const cooldownTimerState = useCooldownTimer<At, Ch, Co, Ev, Me, Re, Us>();
  const messageInputState = useMessageInputState<At, Ch, Co, Ev, Me, Re, Us, V>(props);

  const messageInputContextValue = useCreateMessageInputContext<At, Ch, Co, Ev, Me, Re, Us, V>({
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
