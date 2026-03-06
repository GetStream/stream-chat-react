import { useCallback, useEffect, useMemo, useState } from 'react';
import { MediaRecorderController } from '../classes';
import { useTranslationContext } from '../../../context';
import { useMessageComposer } from '../../MessageInput';

import type { LocalVoiceRecordingAttachment } from 'stream-chat';
import type { CustomAudioRecordingConfig, MediaRecordingState } from '../classes';
import type { MessageInputContextValue } from '../../../context';
import { useSendMessageFn } from '../../MessageInput/hooks/useSendMessageFn';

export type RecordingController = {
  completeRecording: () => void;
  permissionState?: PermissionState;
  recorder?: MediaRecorderController;
  recording?: LocalVoiceRecordingAttachment;
  recordingState?: MediaRecordingState;
};

type UseMediaRecorderParams = Pick<
  MessageInputContextValue,
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
  const messageComposer = useMessageComposer();
  const sendMessageFn = useSendMessageFn();
  const [recording, setRecording] = useState<LocalVoiceRecordingAttachment>();
  const [recordingState, setRecordingState] = useState<MediaRecordingState>();
  const [permissionState, setPermissionState] = useState<PermissionState>();
  // const [isScheduledForSubmit, scheduleForSubmit] = useState(false);

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
      // // FIXME: cannot call handleSubmit() directly as the function has stale reference to attachments
      // scheduleForSubmit(true);
    }
    recorder.cleanUp();
  }, [asyncMessagesMultiSendEnabled, messageComposer, recorder, sendMessageFn]);

  // useEffect(() => {
  //   if (!isScheduledForSubmit) return;
  //   handleSubmit();
  //   scheduleForSubmit(false);
  // }, [handleSubmit, isScheduledForSubmit]);

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
