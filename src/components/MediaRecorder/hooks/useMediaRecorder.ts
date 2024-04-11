import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageInputContextValue, useTranslationContext } from '../../../context';
import {
  AudioRecorderConfig,
  MediaRecorderController,
  MediaRecordingState,
} from '../classes/MediaRecorderController';

import type { LocalVoiceRecordingAttachment } from '../../MessageInput';
import type { DefaultStreamChatGenerics } from '../../../types';

export type CustomAudioRecordingConfig = Partial<AudioRecorderConfig>;

export type RecordingController = {
  completeRecording: () => void;
  permissionState?: PermissionState;
  recorder?: MediaRecorderController;
  recording?: LocalVoiceRecordingAttachment;
  recordingState?: MediaRecordingState;
};

type UseMediaRecorderParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'asyncMessagesMultiSendEnabled' | 'handleSubmit' | 'uploadAttachment'
> & {
  enabled: boolean;
  audioRecordingConfig?: CustomAudioRecordingConfig;
  generateRecordingTitle?: (mimeType: string) => string;
};

export const useMediaRecorder = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  asyncMessagesMultiSendEnabled = true,
  audioRecordingConfig,
  enabled,
  generateRecordingTitle,
  handleSubmit,
  uploadAttachment,
}: UseMediaRecorderParams<StreamChatGenerics>): RecordingController => {
  const { t } = useTranslationContext('useMediaRecorder');

  const [recording, setRecording] = useState<LocalVoiceRecordingAttachment>();
  const [recordingState, setRecordingState] = useState<MediaRecordingState>();
  const [permissionState, setPermissionState] = useState<PermissionState>();
  const [isScheduledForSubmit, scheduleForSubmit] = useState(false);

  const recorder = useMemo(
    () =>
      enabled
        ? new MediaRecorderController({
            config: audioRecordingConfig ?? {},
            generateRecordingTitle,
            t,
          })
        : undefined,
    [audioRecordingConfig, enabled, generateRecordingTitle, t],
  );

  const completeRecording = useCallback(async () => {
    if (!recorder) return;
    const recording = await recorder.stop();
    if (!recording) return;
    await uploadAttachment(recording);
    if (!asyncMessagesMultiSendEnabled) {
      // FIXME: cannot call handleSubmit() directly as the function has stale reference to attachments
      scheduleForSubmit(true);
    }
    recorder.cleanUp();
  }, [asyncMessagesMultiSendEnabled, recorder, uploadAttachment]);

  useEffect(() => {
    if (!isScheduledForSubmit) return;
    handleSubmit();
    scheduleForSubmit(false);
  }, [handleSubmit, isScheduledForSubmit]);

  useEffect(() => {
    if (!recorder) return;
    recorder.permission.watch();
    const recordingSubscription = recorder.recording.subscribe(setRecording);
    const recordingStateSubscription = recorder.recordingState.subscribe(setRecordingState);
    const permissionStateSubscription = recorder.permission.state.subscribe(setPermissionState);

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
