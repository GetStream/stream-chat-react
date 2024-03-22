// import { Mp3Encoder } from '@breezystack/lamejs';
import { nanoid } from 'nanoid';
import { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import fixWebmDuration from 'fix-webm-duration';
import { AttachmentUploadState, VoiceRecordingAttachment } from '../types';
import { createFileFromBlobs, getExtensionFromMimeType } from '../../ReactFileUtilities';
import {
  MessageInputContextValue,
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useTranslationContext,
} from '../../../context';
import { resampleWaveformData } from '../../Attachment';
import { checkUploadPermissions } from './utils';
import type { SendFileAPIResponse } from '../../../../../stream-chat-js';
import type { DefaultStreamChatGenerics } from '../../../types';
import type { MessageInputReducerAction } from './useMessageInputState';
import { mergeDeep } from '../../../utils/mergeDeep';
import { isSafari } from '../../../utils/browsers';

const MAX_FREQUENCY_AMPLITUDE = 255;

type AnalyserConfig = Pick<AnalyserNode, 'fftSize' | 'maxDecibels' | 'minDecibels'>;

export enum RecordingAttachmentType {
  VOICE_RECORDING = 'voiceRecording',
}

export type AudioRecordingConfig = {
  analyserConfig: AnalyserConfig;
  attachmentType: RecordingAttachmentType;
  generateRecordingTitle: (mimeType: string) => string;
  mimeType: string;
  sampleCount: number;
  samplingFrequency: number;
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
    analyserConfig: {
      fftSize: 32,
      maxDecibels: 0,
      minDecibels: -100,
    } as AnalyserConfig,
    attachmentType: RecordingAttachmentType.VOICE_RECORDING,
    generateRecordingTitle: (mimeType: string) =>
      `audio_recording_${new Date().toISOString()}.${getExtensionFromMimeType(mimeType)}`, // extension needed so that desktop Safari can play the asset
    mimeType: RECORDED_MIME_TYPE_BY_BROWSER.audio.others,
    sampleCount: 100,
    samplingFrequency: 60,
  },
} as const;

// function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       if (reader.result instanceof ArrayBuffer) {
//         resolve(reader.result);
//       } else {
//         reject(new Error('Failed to read Blob as ArrayBuffer'));
//       }
//     };
//     reader.onerror = () => {
//       reject(reader.error || new Error('Unknown error reading Blob as ArrayBuffer'));
//     };
//     reader.readAsArrayBuffer(blob);
//   });
// }

// blobToArrayBuffer(new Blob(recordedData.current)).then((audioData) => {
//   const mp3Blob = encodeToMP3(new Uint8Array(audioData));
//   const uri = URL.createObjectURL(mp3Blob);
//   recordingUri.current = uri;
//   const title = generateRecordingTitle('audio/mp3');
//   const recording = {
//     $internal: {
//       file: new File([mp3Blob], title, { type: mp3Blob.type }),
//       id: nanoid(),
//     },
//     asset_url: uri,
//     duration: durationMs / 1000,
//     file_size: mp3Blob.size,
//     mime_type: 'audio/mp3',
//     title,
//     type: DEFAULT_CONFIG.audio.attachmentType,
//     waveform_data: resampleWaveformData(
//         amplitudesRef.current,
//         DEFAULT_CONFIG.audio.sampleCount,
//     ),
//   };
//   console.log('recording size', recording.$internal.file.size);
//   resolveProcessingPromise.current?.(recording);
//   setVoiceRecording(recording);
// });

// const encodeToMP3 = (data: Uint8Array) => {
//   const channels = 1; //1 for mono or 2 for stereo
//   const sampleRate = 44100; //44.1khz (normal mp3 samplerate)
//   const kbps = 128; //encode 128kbps mp3
//   const mp3encoder = new Mp3Encoder(channels, sampleRate, kbps);
//   const mp3Data = [];
//
//   const samples = new Int16Array(data); //one second of silence (get your data from the source you have)
//   const sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier
//
//   for (let i = 0; i < samples.length; i += sampleBlockSize) {
//     const sampleChunk = samples.subarray(i, i + sampleBlockSize);
//     const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
//     if (mp3buf.length > 0) {
//       mp3Data.push(mp3buf);
//     }
//   }
//   const lastMP3buf = mp3encoder.flush(); //finish writing mp3
//
//   if (lastMP3buf.length > 0) {
//     mp3Data.push(new Int8Array(lastMP3buf));
//   }
//
//   return new Blob(mp3Data, { type: 'audio/mp3' });
// };

const rootMeanSquare = (values: Uint8Array) =>
  Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val, 2), 0) / values.length);

const disposeOfMediaStream = (stream?: MediaStream) => {
  if (!stream?.active) return;
  stream.getTracks().forEach((track) => {
    track.stop();
    stream.removeTrack(track);
  });
};

const queryPermissions = (name: PermissionName) => navigator.permissions.query({ name });

const logError = (e: Error) => console.error('[VOICE RECORDING ERROR]', e);

export enum MediaRecordingState {
  PAUSED = 'paused',
  RECORDING = 'recording',
  STOPPED = 'stopped',
}

export enum RecordingPermission {
  CAM = 'camera',
  MIC = 'microphone',
}

export type VoiceRecordingController = {
  amplitudes: number[];
  cancelRecording: () => void;
  completeRecording: () => void;
  dismissPermissionNotification: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  uploadRecording: (recording: VoiceRecordingAttachment) => Promise<void>;
  analyserNode?: AnalyserNode;
  error?: Error;
  mediaRecorder?: MediaRecorder;
  permissionDenied?: RecordingPermission;
  recordingState?: MediaRecordingState;
  voiceRecording?: VoiceRecordingAttachment;
};

export type PermissionNotGrantedHandler = (params: {
  permissionName: PermissionName;
  permissionStatus: PermissionStatus;
}) => void;

type UseMediaRecorderParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'asyncMessagesMultiSendEnabled' | 'doFileUploadRequest' | 'errorHandler' | 'handleSubmit'
> & {
  dispatch: Dispatch<MessageInputReducerAction<StreamChatGenerics>>;
  audioRecordingConfig?: CustomAudioRecordingConfig;
  chooseMimeType?: () => string;
};

export const useMediaRecorder = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  asyncMessagesMultiSendEnabled = true,
  audioRecordingConfig: audioRecordingConfigProps,
  chooseMimeType,
  dispatch,
  doFileUploadRequest,
  errorHandler,
  handleSubmit,
}: UseMediaRecorderParams<StreamChatGenerics>): VoiceRecordingController => {
  const { getAppSettings } = useChatContext<StreamChatGenerics>('useMediaRecorder');
  const { addNotification } = useChannelActionContext<StreamChatGenerics>('useMediaRecorder');
  const { channel } = useChannelStateContext<StreamChatGenerics>('useMediaRecorder');
  const { t } = useTranslationContext('useMediaRecorder');

  const [recordingState, setRecordingState] = useState<MediaRecordingState>();
  const [error, setError] = useState<Error>();
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecordingAttachment>();
  const [isScheduledForSubmit, scheduleForSubmit] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState<RecordingPermission>();

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

  const audioRecordingConfig = useMemo(() => {
    const result = mergeDeep({ ...(audioRecordingConfigProps ?? {}) }, DEFAULT_CONFIG.audio);
    const propsMimeType = audioRecordingConfigProps?.mimeType;

    result.mimeType = DEFAULT_CONFIG.audio.mimeType;
    if (chooseMimeType) {
      result.mimeType = chooseMimeType();
    } else if (propsMimeType && MediaRecorder.isTypeSupported(propsMimeType)) {
      result.mimeType = propsMimeType;
    } else if (isSafari()) {
      result.mimeType = RECORDED_MIME_TYPE_BY_BROWSER.audio.safari;
    }

    return result;
  }, [audioRecordingConfigProps, chooseMimeType]);

  const {
    audioBitsPerSecond,
    generateRecordingTitle,
    handleNotGrantedPermission,
    mimeType,
  } = audioRecordingConfig;

  const dismissPermissionNotification = useCallback(() => setPermissionDenied(undefined), []);

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
        logError(e as Error);
        setError(e as Error);
        return;
      }
      const normalizedSignalStrength = rootMeanSquare(frequencyBins) / MAX_FREQUENCY_AMPLITUDE;
      setAmplitudes((prev) => {
        const newAmplitudes = prev.concat(normalizedSignalStrength);
        amplitudesRef.current = newAmplitudes;
        return newAmplitudes;
      });
    }, DEFAULT_CONFIG.audio.samplingFrequency);
  }, [stopCollectingAudioData]);

  const resetRecordingState = useCallback(() => {
    recordedData.current = [];
    setPermissionDenied(undefined);
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
      // The browser does not include duration metadata with the recorded blob
      fixWebmDuration(new Blob(recordedData.current, { type: mimeType }), durationMs, {
        logger: () => null,
      })
        .then((repairedBlob) => {
          if (recordingUri.current) URL.revokeObjectURL(recordingUri.current);
          const uri = URL.createObjectURL(repairedBlob);
          recordingUri.current = uri;
          const title = generateRecordingTitle(mimeType);
          const recording = {
            $internal: {
              file: createFileFromBlobs({
                blobsArray: [repairedBlob],
                fileName: title,
                mimeType,
              }),
              id: nanoid(),
            },
            asset_url: uri,
            duration: durationMs / 1000,
            file_size: repairedBlob.size,
            mime_type: mimeType,
            title,
            type: DEFAULT_CONFIG.audio.attachmentType,
            waveform_data: resampleWaveformData(
              amplitudesRef.current,
              DEFAULT_CONFIG.audio.sampleCount,
            ),
          };
          resolveProcessingPromise.current?.(recording);
          setVoiceRecording(recording);
        })
        .catch((e) => {
          logError(e);
          setError(e);
        });
    },
    [generateRecordingTitle, mimeType],
  );

  const handleError = useCallback((e: Event) => {
    const error = (e as ErrorEvent).error;
    logError(error);
    setError(error);
  }, []);

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
        addNotification(t('Missing permissions to upload the recording'), 'error');
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

        addNotification(finalError.message, 'error');
        logError(finalError);
        setError(finalError);

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
      mediaRecorder.current.removeEventListener('error', handleError);
    }
  }, [handleDataavailable, handleError, resetRecordingState]);

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
      // cannot call handleSubmit() directly as the function has stale reference to attachments
      scheduleForSubmit(true);
    }
    cleanUp();
  }, [asyncMessagesMultiSendEnabled, cleanUp, stopRecording, voiceRecording, uploadRecording]);

  const startRecording = useCallback(() => {
    const logErrorStarting = (error: Error) => {
      const message = t(`Error starting recording`);
      logError(error);
      setError(error);
      addNotification(message, 'error');
    };
    if (!navigator.mediaDevices) {
      // account for requirement on iOS as per this bug report: https://bugs.webkit.org/show_bug.cgi?id=252303
      logErrorStarting(new Error(t('Media recording is not supported')));
      return;
    }
    const start = async () => {
      const permissionName = 'microphone' as PermissionName;
      let permissionStatus;
      try {
        permissionStatus = await queryPermissions(permissionName);
      } catch (e) {
        logErrorStarting(t('Unsupported permission request'));
        return;
      }

      if (permissionStatus.state !== 'granted' && handleNotGrantedPermission) {
        handleNotGrantedPermission({ permissionName, permissionStatus });
      }
      if (permissionStatus.state === 'denied') {
        setPermissionDenied(RecordingPermission.MIC);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream, {
          audioBitsPerSecond,
          mimeType,
        });

        mediaRecorder.current.addEventListener('dataavailable', handleDataavailable);
        mediaRecorder.current.addEventListener('error', handleError);

        audioContext.current = new AudioContext();

        analyserNode.current = audioContext.current.createAnalyser();
        analyserNode.current.fftSize = DEFAULT_CONFIG.audio.analyserConfig.fftSize;
        analyserNode.current.maxDecibels = DEFAULT_CONFIG.audio.analyserConfig.maxDecibels;
        analyserNode.current.minDecibels = DEFAULT_CONFIG.audio.analyserConfig.minDecibels;

        microphone.current = audioContext.current.createMediaStreamSource(stream);
        microphone.current.connect(analyserNode.current);

        startTime.current = new Date().getTime();
        mediaRecorder.current?.start();
        startCollectingAudioData();
        setRecordingState(MediaRecordingState.RECORDING);
      } catch (error) {
        logErrorStarting(error as Error);
        cancelRecording();
      }
    };

    start();
  }, [
    addNotification,
    audioBitsPerSecond,
    cancelRecording,
    handleDataavailable,
    handleError,
    handleNotGrantedPermission,
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
    dismissPermissionNotification,
    error,
    mediaRecorder: mediaRecorder.current,
    pauseRecording,
    permissionDenied,
    recordingState,
    resumeRecording,
    startRecording,
    stopRecording,
    uploadRecording,
    voiceRecording,
  };
};
