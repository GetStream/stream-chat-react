import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MediaRecorderController, MediaRecordingState } from '../classes';
import { useTranslationContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useInteractionAnnouncements } from '../../Accessibility';

import type { LocalVoiceRecordingAttachment } from 'stream-chat';
import type { CustomAudioRecordingConfig } from '../classes';
import type { MessageComposerContextValue } from '../../../context';
import { useSendMessageFn } from '../../MessageComposer/hooks/useSendMessageFn';

export type RecordingController = {
  completeRecording: () => void;
  permissionState?: PermissionState;
  recorder?: MediaRecorderController;
  recording?: LocalVoiceRecordingAttachment;
  recordingState?: MediaRecordingState;
};

type UseMediaRecorderParams = Pick<
  MessageComposerContextValue,
  'asyncMessagesMultiSendEnabled'
> & {
  enabled: boolean;
  generateRecordingTitle?: (mimeType: string) => string;
  recordingConfig?: CustomAudioRecordingConfig;
};

export const useMediaRecorder = ({
  asyncMessagesMultiSendEnabled,
  enabled,
  generateRecordingTitle,
  recordingConfig,
}: UseMediaRecorderParams): RecordingController => {
  const { t } = useTranslationContext('useMediaRecorder');
  const { announceInteraction } = useInteractionAnnouncements();
  const messageComposer = useMessageComposerController();
  const sendMessageFn = useSendMessageFn();
  const [recording, setRecording] = useState<LocalVoiceRecordingAttachment>();
  const [recordingState, setRecordingState] = useState<MediaRecordingState>();
  const [permissionState, setPermissionState] = useState<PermissionState>();

  const recorder = useMemo(
    () =>
      enabled
        ? new MediaRecorderController({
            config: recordingConfig ?? {},
            generateRecordingTitle,
            t,
          })
        : undefined,
    [recordingConfig, enabled, generateRecordingTitle, t],
  );

  const completeRecording = useCallback(async () => {
    if (!recorder) return;
    const recording = await recorder.stop();
    if (!recording) return;
    await messageComposer.attachmentManager.uploadAttachment(recording);
    if (!asyncMessagesMultiSendEnabled) {
      await sendMessageFn();
      announceInteraction('voiceRecording.sent');
    } else {
      announceInteraction('voiceRecording.attached');
    }
    recorder.cleanUp();
  }, [
    announceInteraction,
    asyncMessagesMultiSendEnabled,
    messageComposer,
    recorder,
    sendMessageFn,
  ]);

  const previousRecordingStateRef = useRef(recordingState);
  useEffect(() => {
    const previous = previousRecordingStateRef.current;
    previousRecordingStateRef.current = recordingState;
    if (previous === recordingState) return;
    if (recordingState === MediaRecordingState.RECORDING) {
      announceInteraction(
        previous === MediaRecordingState.PAUSED
          ? 'voiceRecording.resumed'
          : 'voiceRecording.started',
      );
    } else if (recordingState === MediaRecordingState.PAUSED) {
      announceInteraction('voiceRecording.paused');
    }
  }, [announceInteraction, recordingState]);

  useEffect(() => {
    if (!recorder) return;
    recorder.permission.watch();
    const recordingSubscription = recorder.recording.subscribe(setRecording);
    const recordingStateSubscription =
      recorder.recordingState.subscribe(setRecordingState);
    const permissionStateSubscription =
      recorder.permission.state.subscribe(setPermissionState);

    return () => {
      recorder.cancel();
      recorder.permission.unwatch();
      recordingSubscription.unsubscribe();
      recordingStateSubscription.unsubscribe();
      permissionStateSubscription.unsubscribe();
    };
  }, [recorder]);

  return {
    completeRecording,
    permissionState,
    recorder,
    recording,
    recordingState,
  };
};
