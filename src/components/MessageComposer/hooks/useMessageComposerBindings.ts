import type React from 'react';
import { useTextareaRef } from './useTextareaRef';
import { useSubmitHandler } from './useSubmitHandler';
import { usePasteHandler } from './usePasteHandler';
import type { RecordingController } from '../../MediaRecorder/hooks/useMediaRecorder';
import { useMediaRecorder } from '../../MediaRecorder/hooks/useMediaRecorder';
import type { MessageComposerProps } from '../MessageComposer';

export type UseMessageComposerBindingsParams = {
  handleSubmit: (event?: React.BaseSyntheticEvent) => void;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  recordingController: RecordingController;
  textareaRef: React.RefObject<HTMLTextAreaElement | null | undefined>;
};

export const useMessageComposerBindings = (
  props: MessageComposerProps,
): UseMessageComposerBindingsParams => {
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
