import type React from 'react';
import { useTextareaRef } from './useTextareaRef';
import { usePasteHandler } from './usePasteHandler';
import type { RecordingController } from '../../MediaRecorder/hooks/useMediaRecorder';
import { useMediaRecorder } from '../../MediaRecorder/hooks/useMediaRecorder';
import { useSameValuesReference } from '../../../utils/useSameValuesReference';
import { useStableCallback } from '../../../utils/useStableCallback';
import type { MessageComposerProps } from '../MessageComposer';

export type UseMessageComposerBindingsParams = {
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  recordingController: RecordingController;
  textareaRef: React.RefObject<HTMLTextAreaElement | null | undefined>;
};

export const useMessageComposerBindings = (
  props: MessageComposerProps,
): UseMessageComposerBindingsParams => {
  const {
    asyncMessagesMultiSendEnabled,
    audioRecordingConfig,
    audioRecordingEnabled,
    generateRecordingTitle,
  } = props;

  const { textareaRef } = useTextareaRef(props);

  // A new recorder cancels the recording in progress, so inline props must not create one on
  // every render: `audioRecordingConfig` does only when its values change, and
  // `generateRecordingTitle` only when it is set or unset.
  const recordingConfig = useSameValuesReference(audioRecordingConfig);
  const stableGenerateRecordingTitle = useStableCallback(
    (mimeType: string) => generateRecordingTitle?.(mimeType) ?? '',
  );

  const recordingController = useMediaRecorder({
    asyncMessagesMultiSendEnabled,
    enabled: !!audioRecordingEnabled,
    generateRecordingTitle: generateRecordingTitle
      ? stableGenerateRecordingTitle
      : undefined,
    recordingConfig,
  });

  const { onPaste } = usePasteHandler();

  return {
    onPaste,
    recordingController,
    textareaRef,
  };
};
