import type React from 'react';
import { useTextareaRef } from './useTextareaRef';
import { usePasteHandler } from './usePasteHandler';
import type { RecordingController } from '../../MediaRecorder/hooks/useMediaRecorder';
import { useMediaRecorder } from '../../MediaRecorder/hooks/useMediaRecorder';
import type { MessageInputProps } from '../MessageInput';

export type MessageInputHookProps = {
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

  const recordingController = useMediaRecorder({
    asyncMessagesMultiSendEnabled,
    enabled: !!audioRecordingEnabled,
    recordingConfig: audioRecordingConfig,
  });

  const { onPaste } = usePasteHandler();

  return {
    onPaste,
    recordingController,
    textareaRef,
  };
};
