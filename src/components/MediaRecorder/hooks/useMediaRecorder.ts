import fixWebmDuration from 'fix-webm-duration';
import { nanoid } from 'nanoid';
import { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createFileFromBlobs,
  getExtensionFromMimeType,
  getRecordedMediaTypeFromMimeType,
} from '../../ReactFileUtilities';
import {
  MessageInputContextValue,
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useTranslationContext,
} from '../../../context';
import { resampleWaveformData } from '../../Attachment';
import { transcode } from '../AudioRecorder/transcode';
import { mergeDeep } from '../../../utils/mergeDeep';
import { isSafari } from '../../../utils/browsers';
import { checkUploadPermissions } from '../../MessageInput/hooks/utils';
import {
  PermissionNotGrantedHandler,
  useBrowserPermissionState,
} from './useBrowserPermissionState';
import { AttachmentUploadState } from '../../MessageInput';

import type { SendFileAPIResponse } from 'stream-chat';
import type { MessageInputReducerAction, VoiceRecordingAttachment } from '../../MessageInput';
import type { DefaultStreamChatGenerics } from '../../../types';

const MAX_FREQUENCY_AMPLITUDE = 255 as const;

/**
 * fftSize
 * An unsigned integer, representing the window size of the FFT, given in number of samples.
 * A higher value will result in more details in the frequency domain but fewer details
 * in the amplitude domain.
 *
 * Must be a power of 2 between 2^5 and 2^15, so one of: 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, and 32768.
 * Defaults to 32.
 *
 * maxDecibels
 * A double, representing the maximum decibel value for scaling the FFT analysis data,
 * where 0 dB is the loudest possible sound, -10 dB is a 10th of that, etc.
 * The default value is -30 dB.
 *
 * minDecibels
 * A double, representing the minimum decibel value for scaling the FFT analysis data,
 * where 0 dB is the loudest possible sound, -10 dB is a 10th of that, etc.
 * The default value is -100 dB.
 */
type AnalyserConfig = Pick<AnalyserNode, 'fftSize' | 'maxDecibels' | 'minDecibels'>;

type SupportedTranscodeMimeTypes = 'audio/wav' | 'audio/mp3';

export enum RecordingAttachmentType {
  VOICE_RECORDING = 'voiceRecording',
}

export enum MediaRecordingState {
  PAUSED = 'paused',
  RECORDING = 'recording',
  STOPPED = 'stopped',
}

type AmplitudeRecorderConfig = {
  analyserConfig: AnalyserConfig;
  sampleCount: number;
  samplingFrequencyMs: number;
};

export type AudioRecordingConfig = {
  amplitudeRecorderConfig: AmplitudeRecorderConfig;
  generateRecordingTitle: (mimeType: string) => string;
  // Number of samples recorded per second. Default 44100Hz.
  sampleRate: number;
  // Defaults to audio/mp3;
  transcodeToMimeType: SupportedTranscodeMimeTypes;
  audioBitsPerSecond?: number;
  handleNotGrantedPermission?: PermissionNotGrantedHandler;
};

export type CustomAudioRecordingConfig = Partial<AudioRecordingConfig>;

const RECORDED_MIME_TYPE_BY_BROWSER = {
  audio: {
    others: 'audio/webm',
    safari: 'audio/mp4;codecs=mp4a.40.2',
  },
};

const DEFAULT_CONFIG: {
  audio: AudioRecordingConfig;
} = {
  audio: {
    amplitudeRecorderConfig: {
      analyserConfig: {
        fftSize: 32,
        maxDecibels: 0,
        minDecibels: -100,
      } as AnalyserConfig,
      sampleCount: 100,
      samplingFrequencyMs: 60,
    },
    generateRecordingTitle: (mimeType: string) =>
      `audio_recording_${new Date().toISOString()}.${getExtensionFromMimeType(mimeType)}`, // extension needed so that desktop Safari can play the asset
    sampleRate: 16000,
    transcodeToMimeType: 'audio/mp3',
  },
} as const;

const rootMeanSquare = (values: Uint8Array) =>
  Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val, 2), 0) / values.length);

const disposeOfMediaStream = (stream?: MediaStream) => {
  if (!stream?.active) return;
  stream.getTracks().forEach((track) => {
    track.stop();
    stream.removeTrack(track);
  });
};

const logError = (e: Error) => console.error('[VOICE RECORDING ERROR]', e);

export type AudioRecordingController = {
  amplitudes: number[];
  cancelRecording: () => void;
  completeRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  uploadRecording: (recording: VoiceRecordingAttachment) => Promise<void>;
  analyserNode?: AnalyserNode;
  error?: Error;
  mediaRecorder?: MediaRecorder;
  permissionState?: PermissionState;
  recordingState?: MediaRecordingState;
  voiceRecording?: VoiceRecordingAttachment;
};

type UseMediaRecorderParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'asyncMessagesMultiSendEnabled' | 'doFileUploadRequest' | 'errorHandler' | 'handleSubmit'
> & {
  dispatch: Dispatch<MessageInputReducerAction<StreamChatGenerics>>;
  audioRecordingConfig?: CustomAudioRecordingConfig;
};

export const useMediaRecorder = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  asyncMessagesMultiSendEnabled = true,
  audioRecordingConfig: audioRecordingConfigProps = {},
  dispatch,
  doFileUploadRequest,
  errorHandler,
  handleSubmit,
}: UseMediaRecorderParams<StreamChatGenerics>): AudioRecordingController => {
  const { getAppSettings } = useChatContext<StreamChatGenerics>('useMediaRecorder');
  const { addNotification } = useChannelActionContext<StreamChatGenerics>('useMediaRecorder');
  const { channel } = useChannelStateContext<StreamChatGenerics>('useMediaRecorder');
  const { t } = useTranslationContext('useMediaRecorder');

  const [recordingState, setRecordingState] = useState<MediaRecordingState>();
  const [error, setError] = useState<Error>();
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecordingAttachment>();
  const [isScheduledForSubmit, scheduleForSubmit] = useState(false);

  const mediaRecorder = useRef<MediaRecorder>();
  const analyserNode = useRef<AnalyserNode>();
  const audioContext = useRef<AudioContext>();
  const microphone = useRef<MediaStreamAudioSourceNode>();

  const samplingInterval = useRef<ReturnType<typeof setInterval>>();
  const recordedData = useRef<Array<Blob>>([]);
  const amplitudesRef = useRef<number[]>([]);
  const recordingUri = useRef<string>();
  const startTime = useRef<number>();
  const durations = useRef<number[]>([]);
  const resolveProcessingPromise = useRef<(r: VoiceRecordingAttachment) => void>();

  const mimeType = useMemo(
    () =>
      isSafari()
        ? RECORDED_MIME_TYPE_BY_BROWSER.audio.safari
        : RECORDED_MIME_TYPE_BY_BROWSER.audio.others,
    [],
  );

  const mediaType = useMemo(() => getRecordedMediaTypeFromMimeType(mimeType), [mimeType]);

  const {
    amplitudeRecorderConfig,
    audioBitsPerSecond,
    generateRecordingTitle,
    handleNotGrantedPermission,
    sampleRate,
    transcodeToMimeType,
  } = useMemo(() => mergeDeep({ ...audioRecordingConfigProps }, DEFAULT_CONFIG.audio), [
    audioRecordingConfigProps,
  ]);

  const onError = useCallback(
    (e: Error, notificationText?: string) => {
      logError(e);
      setError(e);
      if (notificationText) addNotification(notificationText, 'error');
    },
    [addNotification],
  );

  const { checkPermissions, permissionState } = useBrowserPermissionState({
    handleNotGrantedPermission,
    mediaType,
    onError,
  });

  const stopCollectingAudioData = useCallback(() => {
    clearInterval(samplingInterval.current);
  }, []);

  const startCollectingAudioData = useCallback(() => {
    if (!analyserNode.current) return;
    const frequencyBinCount = analyserNode.current.frequencyBinCount;
    stopCollectingAudioData();
    samplingInterval.current = setInterval(() => {
      const frequencyBins = new Uint8Array(frequencyBinCount);
      try {
        analyserNode.current?.getByteFrequencyData(frequencyBins);
      } catch (e) {
        onError(e as Error);
        return;
      }
      const normalizedSignalStrength = rootMeanSquare(frequencyBins) / MAX_FREQUENCY_AMPLITUDE;
      setAmplitudes((prev) => {
        const newAmplitudes = prev.concat(normalizedSignalStrength);
        amplitudesRef.current = newAmplitudes;
        return newAmplitudes;
      });
    }, amplitudeRecorderConfig.samplingFrequencyMs);
  }, [amplitudeRecorderConfig.samplingFrequencyMs, onError, stopCollectingAudioData]);

  const resetRecordingState = useCallback(() => {
    recordedData.current = [];
    setVoiceRecording(undefined);
    setRecordingState(undefined);
    setAmplitudes([]);
    amplitudesRef.current = [];
    durations.current = [];
    startTime.current = undefined;
  }, []);

  const handleDataavailable = useCallback(
    (e: BlobEvent) => {
      const durationMs = durations.current.reduce((acc, val) => acc + val, 0);
      if (!e.data.size) return;
      recordedData.current.push(e.data);
      if (!recordedData.current.length) return;

      const initialBlob = new Blob(recordedData.current, { type: mimeType });

      const makeVoiceRecording = async (blob: Blob) => {
        if (recordingUri.current) URL.revokeObjectURL(recordingUri.current);

        const finalBlob = await transcode({
          blob,
          sampleRate,
          targetMimeType: transcodeToMimeType,
        });
        if (!finalBlob) return;

        const uri = URL.createObjectURL(finalBlob);
        recordingUri.current = uri;
        const title = generateRecordingTitle(finalBlob.type);
        const recording = {
          $internal: {
            file: createFileFromBlobs({
              blobsArray: [finalBlob],
              fileName: title,
              mimeType: finalBlob.type,
            }),
            id: nanoid(),
          },
          asset_url: uri,
          duration: durationMs / 1000,
          file_size: finalBlob.size,
          mime_type: finalBlob.type,
          title,
          type: RecordingAttachmentType.VOICE_RECORDING,
          waveform_data: resampleWaveformData(
            amplitudesRef.current,
            amplitudeRecorderConfig.sampleCount,
          ),
        };
        resolveProcessingPromise.current?.(recording);
        setVoiceRecording(recording);
      };

      if (mimeType.match('audio/webm')) {
        // The browser does not include duration metadata with the recorded blob
        fixWebmDuration(initialBlob, durationMs, {
          logger: () => null,
        })
          .then(makeVoiceRecording)
          .catch(onError);
      } else {
        makeVoiceRecording(initialBlob);
      }
    },
    [
      amplitudeRecorderConfig.sampleCount,
      generateRecordingTitle,
      mimeType,
      onError,
      sampleRate,
      transcodeToMimeType,
    ],
  );

  const handleErrorEvent = useCallback(
    (e: Event) => {
      const error = (e as ErrorEvent).error;
      onError(error);
    },
    [onError],
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
        onError(new Error(notificationText), notificationText);
      }

      if (asyncMessagesMultiSendEnabled) {
        dispatch({
          attachment: {
            ...recording,
            $internal: {
              ...$internal,
              id,
              uploadState: AttachmentUploadState.UPLOADING,
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
              uploadState: AttachmentUploadState.UPLOADED,
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

        onError(finalError, finalError.message);

        dispatch({
          attachment: {
            ...recording,
            $internal: {
              ...$internal,
              uploadState: AttachmentUploadState.FAILED,
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
      onError,
      t,
    ],
  );

  const cleanUp = useCallback(() => {
    resetRecordingState();
    if (recordingUri.current) URL.revokeObjectURL(recordingUri.current);
    microphone.current?.disconnect();
    analyserNode.current?.disconnect();
    if (audioContext.current?.state !== 'closed') audioContext.current?.close();
    if (mediaRecorder.current) {
      disposeOfMediaStream(mediaRecorder.current.stream);
      mediaRecorder.current.removeEventListener('dataavailable', handleDataavailable);
      mediaRecorder.current.removeEventListener('error', handleErrorEvent);
    }
  }, [handleDataavailable, handleErrorEvent, resetRecordingState]);

  const pauseRecording = useCallback(() => {
    if (startTime.current) {
      durations.current.push(new Date().getTime() - startTime.current);
      startTime.current = undefined;
    }
    mediaRecorder.current?.pause();
    stopCollectingAudioData();
    setRecordingState(MediaRecordingState.PAUSED);
  }, [stopCollectingAudioData]);

  const resumeRecording = useCallback(() => {
    startTime.current = new Date().getTime();
    mediaRecorder.current?.resume();
    startCollectingAudioData();
    setRecordingState(MediaRecordingState.RECORDING);
  }, [startCollectingAudioData]);

  const stopRecording = useCallback(() => {
    if (!['paused', 'recording'].includes(mediaRecorder.current?.state || ''))
      return Promise.resolve(undefined);

    if (startTime.current) {
      durations.current.push(new Date().getTime() - startTime.current);
    }
    const result = new Promise<VoiceRecordingAttachment>((res) => {
      resolveProcessingPromise.current = res;
    });
    mediaRecorder.current?.stop();
    stopCollectingAudioData();
    setRecordingState(MediaRecordingState.STOPPED);
    return result;
  }, [stopCollectingAudioData]);

  const cancelRecording = useCallback(() => {
    stopRecording();
    cleanUp();
  }, [cleanUp, stopRecording]);

  const completeRecording = useCallback(async () => {
    let recording = voiceRecording;
    if (!recording) recording = await stopRecording();
    if (!recording) return;
    await uploadRecording(recording);
    if (!asyncMessagesMultiSendEnabled) {
      // FIXME: cannot call handleSubmit() directly as the function has stale reference to attachments
      scheduleForSubmit(true);
    }
    cleanUp();
  }, [asyncMessagesMultiSendEnabled, cleanUp, stopRecording, voiceRecording, uploadRecording]);

  const startRecording = useCallback(() => {
    const notificationText = t(`Error starting recording`);

    if (!navigator.mediaDevices) {
      // account for requirement on iOS as per this bug report: https://bugs.webkit.org/show_bug.cgi?id=252303
      onError(new Error(t('Media recording is not supported')), notificationText);
      return;
    }

    const start = async () => {
      const permissionState = await checkPermissions();

      if (permissionState === 'denied') return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream, {
          audioBitsPerSecond,
          mimeType,
        });

        mediaRecorder.current.addEventListener('dataavailable', handleDataavailable);
        mediaRecorder.current.addEventListener('error', handleErrorEvent);

        audioContext.current = new AudioContext();

        analyserNode.current = audioContext.current.createAnalyser();
        const { fftSize, maxDecibels, minDecibels } = amplitudeRecorderConfig.analyserConfig;
        analyserNode.current.fftSize = fftSize;
        analyserNode.current.maxDecibels = maxDecibels;
        analyserNode.current.minDecibels = minDecibels;

        microphone.current = audioContext.current.createMediaStreamSource(stream);
        microphone.current.connect(analyserNode.current);

        startTime.current = new Date().getTime();
        mediaRecorder.current?.start();
        startCollectingAudioData();
        setRecordingState(MediaRecordingState.RECORDING);
      } catch (error) {
        onError(error as Error, notificationText);
        cancelRecording();
      }
    };

    start();
  }, [
    amplitudeRecorderConfig.analyserConfig,
    audioBitsPerSecond,
    cancelRecording,
    checkPermissions,
    handleDataavailable,
    handleErrorEvent,
    onError,
    mimeType,
    startCollectingAudioData,
    t,
  ]);

  useEffect(() => {
    if (!isScheduledForSubmit) return;
    handleSubmit();
    scheduleForSubmit(false);
  }, [handleSubmit, isScheduledForSubmit]);

  useEffect(
    () => () => {
      cancelRecording();
    },
    [cancelRecording],
  );

  return {
    amplitudes,
    analyserNode: analyserNode.current,
    cancelRecording,
    completeRecording,
    error,
    mediaRecorder: mediaRecorder.current,
    pauseRecording,
    permissionState,
    recordingState,
    resumeRecording,
    startRecording,
    stopRecording,
    uploadRecording,
    voiceRecording,
  };
};
