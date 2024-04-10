import { nanoid } from 'nanoid';
import { Dispatch, useCallback, useEffect, useMemo, useState } from 'react';
import {
  MessageInputContextValue,
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useTranslationContext,
} from '../../../context';
import { checkUploadPermissions } from '../../MessageInput/hooks/utils';
import type { MessageInputReducerAction, VoiceRecordingAttachment } from '../../MessageInput';

import type { SendFileAPIResponse } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types';
import {
  AudioRecorderConfig,
  MediaRecorderController,
  MediaRecordingState,
} from '../classes/MediaRecorderController';

export type CustomAudioRecordingConfig = Partial<AudioRecorderConfig>;

export type AudioRecordingController = {
  completeRecording: () => void;
  uploadRecording: (recording: VoiceRecordingAttachment) => Promise<void>;
  permissionState?: PermissionState;
  recorder?: MediaRecorderController;
  recording?: VoiceRecordingAttachment;
  recordingState?: MediaRecordingState;
};

type UseMediaRecorderParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'asyncMessagesMultiSendEnabled' | 'doFileUploadRequest' | 'errorHandler' | 'handleSubmit'
> & {
  dispatch: Dispatch<MessageInputReducerAction<StreamChatGenerics>>;
  enabled: boolean;
  audioRecordingConfig?: CustomAudioRecordingConfig;
  generateRecordingTitle?: (mimeType: string) => string;
};

export const useMediaRecorder = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  asyncMessagesMultiSendEnabled = true,
  audioRecordingConfig,
  dispatch,
  doFileUploadRequest,
  enabled,
  errorHandler,
  generateRecordingTitle,
  handleSubmit,
}: UseMediaRecorderParams<StreamChatGenerics>): AudioRecordingController => {
  const { getAppSettings } = useChatContext<StreamChatGenerics>('useMediaRecorder');
  const { addNotification } = useChannelActionContext<StreamChatGenerics>('useMediaRecorder');
  const { channel } = useChannelStateContext<StreamChatGenerics>('useMediaRecorder');
  const { t } = useTranslationContext('useMediaRecorder');

  const [recording, setRecording] = useState<VoiceRecordingAttachment>();
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

  const uploadRecording = useCallback(
    async ({ $internal, ...recording }: VoiceRecordingAttachment) => {
      if (!$internal?.file) return;
      const id = $internal?.id ?? nanoid();
      const { file } = $internal;
      const canUpload = await checkUploadPermissions({
        addNotification,
        file,
        getAppSettings,
        t,
        uploadType: 'file',
      });

      if (!canUpload) {
        const notificationText = t('Missing permissions to upload the recording');
        console.error(new Error(notificationText));
        addNotification(notificationText, 'error');
      }

      if (asyncMessagesMultiSendEnabled) {
        dispatch({
          attachment: {
            ...recording,
            $internal: {
              ...$internal,
              id,
              uploadState: 'uploading',
            },
          },
          type: 'upsertAttachment',
        });
      }

      try {
        let response: SendFileAPIResponse;
        if (doFileUploadRequest) {
          response = await doFileUploadRequest(file, channel);
        } else {
          response = await channel.sendFile(file as File);
        }
        dispatch({
          attachment: {
            ...recording,
            $internal: {
              ...$internal,
              uploadState: 'finished',
            },
            asset_url: response.file,
          },
          type: 'upsertAttachment',
        });
      } catch (error) {
        let finalError: Error = { message: t('Error uploading file'), name: 'Error' };
        if (typeof (error as Error).message === 'string') {
          finalError = error as Error;
        } else if (typeof error === 'object') {
          finalError = Object.assign(finalError, error);
        }

        console.error(finalError);
        addNotification(finalError.message, 'error');

        dispatch({
          attachment: {
            ...recording,
            $internal: {
              ...$internal,
              uploadState: 'failed',
            },
          },
          type: 'upsertAttachment',
        });

        if (errorHandler) {
          errorHandler(finalError as Error, 'upload-file', file);
        }

        return;
      }
    },
    [
      addNotification,
      asyncMessagesMultiSendEnabled,
      channel,
      doFileUploadRequest,
      dispatch,
      errorHandler,
      getAppSettings,
      t,
    ],
  );

  const completeRecording = useCallback(async () => {
    if (!recorder) return;
    const recording = await recorder.stop();
    if (!recording) return;
    await uploadRecording(recording);
    if (!asyncMessagesMultiSendEnabled) {
      // FIXME: cannot call handleSubmit() directly as the function has stale reference to attachments
      scheduleForSubmit(true);
    }
    recorder.cleanUp();
  }, [asyncMessagesMultiSendEnabled, recorder, uploadRecording]);

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
    uploadRecording,
  };
};
