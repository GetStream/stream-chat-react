import type React from 'react';
import { useMessageInputText } from './useMessageInputText';
import { useSubmitHandler } from './useSubmitHandler';
import { usePasteHandler } from './usePasteHandler';
import { useMediaRecorder } from '../../MediaRecorder/hooks/useMediaRecorder';
import type { RecordingController } from '../../MediaRecorder/hooks/useMediaRecorder';
import type { UpdatedMessage } from 'stream-chat';
import type { MessageInputProps } from '../MessageInput';

export type MessageInputHookProps = {
  handleSubmit: (
    event?: React.BaseSyntheticEvent,
    customMessageData?: Omit<UpdatedMessage, 'mentioned_users'>,
  ) => void;
  insertText: (textToInsert: string) => void;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  recordingController: RecordingController;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null | undefined>;
};

export const useMessageInputControls = (
  props: MessageInputProps,
): MessageInputHookProps => {
  const { asyncMessagesMultiSendEnabled, audioRecordingConfig, audioRecordingEnabled } =
    props;

  const { insertText, textareaRef } = useMessageInputText(props);

  const { handleSubmit } = useSubmitHandler(props);

  const recordingController = useMediaRecorder({
    asyncMessagesMultiSendEnabled,
    enabled: !!audioRecordingEnabled,
    handleSubmit,
    recordingConfig: audioRecordingConfig,
  });

  const { onPaste } = usePasteHandler(insertText);

  return {
    handleSubmit,
    insertText,
    onPaste,
    recordingController,
    textareaRef,
  };
};
