import type React from 'react';
import { useTextareaRef } from './useTextareaRef';
import { useSubmitHandler } from './useSubmitHandler';
import { usePasteHandler } from './usePasteHandler';
import type { RecordingController } from '../../MediaRecorder/hooks/useMediaRecorder';
import { useMediaRecorder } from '../../MediaRecorder/hooks/useMediaRecorder';
import type { MessageInputProps } from '../MessageInput';

export type MessageInputHookProps = {
  handleSubmit: (event?: React.BaseSyntheticEvent) => void;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  recordingController: RecordingController;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null | undefined>;
};

export const useMessageInputControls = (
  props: MessageInputProps,
): MessageInputHookProps => {
  const { asyncMessagesMultiSendEnabled, audioRecordingConfig, audioRecordingEnabled } =
    props;

  const { textareaRef } = useTextareaRef(props);

  const { handleSubmit } = useSubmitHandler(props);

  const recordingController = useMediaRecorder({
    asyncMessagesMultiSendEnabled,
    enabled: !!audioRecordingEnabled,
    handleSubmit,
    recordingConfig: audioRecordingConfig,
  });

  const { onPaste } = usePasteHandler();

  return {
    handleSubmit,
    onPaste,
    recordingController,
    textareaRef,
  };
};
