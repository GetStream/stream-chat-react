import fixWebmDuration from 'fix-webm-duration';
import { nanoid } from 'nanoid';
import {
  AmplitudeRecorder,
  DEFAULT_AMPLITUDE_RECORDER_CONFIG,
} from './AmplitudeRecorder';
import { BrowserPermission } from './BrowserPermission';
import { BehaviorSubject, Subject } from '../observable';
import type { TranscoderConfig } from '../transcode';
import { transcode } from '../transcode';
import { resampleWaveformData } from '../../Attachment';
import type { RecordedMediaType } from '../../ReactFileUtilities';
import {
  createFileFromBlobs,
  getExtensionFromMimeType,
  getRecordedMediaTypeFromMimeType,
} from '../../ReactFileUtilities';
import { defaultTranslatorFunction } from '../../../i18n';
import { mergeDeepUndefined } from '../../../utils/mergeDeep';
import type { LocalVoiceRecordingAttachment } from 'stream-chat';
import type { AmplitudeRecorderConfig } from './AmplitudeRecorder';
import type { TranslationContextValue } from '../../../context';

export const RECORDED_MIME_TYPE_BY_BROWSER = {
  audio: {
    others: 'audio/webm',
    safari: 'audio/mp4;codecs=mp4a.40.2',
  },
} as const;

export const DEFAULT_AUDIO_TRANSCODER_CONFIG: TranscoderConfig = {
  sampleRate: 16000,
} as const;

const disposeOfMediaStream = (stream?: MediaStream) => {
  if (!stream?.active) return;
  stream.getTracks().forEach((track) => {
    track.stop();
    stream.removeTrack(track);
  });
};

const logError = (e?: Error) => e && console.error('[MEDIA RECORDER ERROR]', e);

type MediaRecorderConfig = Omit<MediaRecorderOptions, 'mimeType'> &
  Required<Pick<MediaRecorderOptions, 'mimeType'>>;

export type AudioRecorderConfig = {
  amplitudeRecorderConfig: AmplitudeRecorderConfig;
  mediaRecorderConfig: MediaRecorderOptions;
  transcoderConfig: TranscoderConfig;
};

type PartialValues<T> = { [P in keyof T]?: Partial<T[P]> };

export type CustomAudioRecordingConfig = PartialValues<AudioRecorderConfig>;

export type AudioRecorderOptions = {
  config?: CustomAudioRecordingConfig;
  generateRecordingTitle?: (mimeType: string) => string;
  t?: TranslationContextValue['t'];
};

export enum MediaRecordingState {
  PAUSED = 'paused',
  RECORDING = 'recording',
  STOPPED = 'stopped',
}

export enum RecordingAttachmentType {
  VOICE_RECORDING = 'voiceRecording',
}

export class MediaRecorderController {
  permission: BrowserPermission;
  mediaRecorder: MediaRecorder | undefined;
  amplitudeRecorder: AmplitudeRecorder | undefined;

  amplitudeRecorderConfig: AmplitudeRecorderConfig;
  mediaRecorderConfig: MediaRecorderConfig;
  transcoderConfig: TranscoderConfig;

  startTime: number | undefined;
  recordedChunkDurations: number[] = [];
  recordedData: Blob[] = [];
  recordingUri: string | undefined;
  mediaType: RecordedMediaType;

  signalRecordingReady: ((r: LocalVoiceRecordingAttachment) => void) | undefined;

  recordingState = new BehaviorSubject<MediaRecordingState | undefined>(undefined);
  recording = new BehaviorSubject<LocalVoiceRecordingAttachment | undefined>(undefined);
  error = new Subject<Error | undefined>();
  notification = new Subject<{ text: string; type: 'success' | 'error' } | undefined>();

  customGenerateRecordingTitle: ((mimeType: string) => string) | undefined;
  t: TranslationContextValue['t'];

  constructor({ config, generateRecordingTitle, t }: AudioRecorderOptions = {}) {
    this.t = t || defaultTranslatorFunction;

    this.amplitudeRecorderConfig = mergeDeepUndefined(
      { ...config?.amplitudeRecorderConfig },
      DEFAULT_AMPLITUDE_RECORDER_CONFIG,
    );

    this.mediaRecorderConfig = mergeDeepUndefined(
      { ...config?.mediaRecorderConfig },
      {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? RECORDED_MIME_TYPE_BY_BROWSER.audio.others
          : RECORDED_MIME_TYPE_BY_BROWSER.audio.safari,
      },
    );

    this.transcoderConfig = mergeDeepUndefined(
      { ...config?.transcoderConfig },
      DEFAULT_AUDIO_TRANSCODER_CONFIG,
    );

    const mediaType = getRecordedMediaTypeFromMimeType(this.mediaRecorderConfig.mimeType);
    if (!mediaType) {
      throw new Error(
        `Unsupported media type (supported audio or video only). Provided mimeType: ${this.mediaRecorderConfig.mimeType}`,
      );
    }
    this.mediaType = mediaType;

    this.permission = new BrowserPermission({ mediaType });

    this.customGenerateRecordingTitle = generateRecordingTitle;
  }

  get durationMs() {
    return this.recordedChunkDurations.reduce((acc, val) => acc + val, 0);
  }

  generateRecordingTitle = (mimeType: string) => {
    if (this.customGenerateRecordingTitle) {
      return this.customGenerateRecordingTitle(mimeType);
    }
    return `${this.mediaType}_recording_${new Date().toISOString()}.${getExtensionFromMimeType(
      mimeType,
    )}`; // extension needed so that desktop Safari can play the asset
  };

  makeVoiceRecording = async () => {
    if (this.recordingUri) URL.revokeObjectURL(this.recordingUri);

    if (!this.recordedData.length) return;
    const { mimeType } = this.mediaRecorderConfig;
    let blob = new Blob(this.recordedData, { type: mimeType });
    if (mimeType.match('audio/webm')) {
      // The browser does not include duration metadata with the recorded blob
      blob = await fixWebmDuration(blob, this.durationMs, {
        logger: () => null, // prevents polluting the browser console
      });
    }
    if (!mimeType.match('audio/mp4')) {
      blob = await transcode({
        blob,
        ...this.transcoderConfig,
      });
    }

    if (!blob) return;

    this.recordingUri = URL.createObjectURL(blob);
    const file = createFileFromBlobs({
      blobsArray: [blob],
      fileName: this.generateRecordingTitle(blob.type),
      mimeType: blob.type,
    });

    return {
      asset_url: this.recordingUri,
      duration: this.durationMs / 1000,
      file_size: blob.size,
      localMetadata: {
        file,
        id: nanoid(),
      },
      mime_type: blob.type,
      title: file.name,
      type: RecordingAttachmentType.VOICE_RECORDING,
      waveform_data: resampleWaveformData(
        this.amplitudeRecorder?.amplitudes.value ?? [],
        this.amplitudeRecorderConfig.sampleCount,
      ),
    } as LocalVoiceRecordingAttachment;
  };

  handleErrorEvent = (e: Event) => {
    const { error } = e as ErrorEvent;
    logError(error);
    this.error.next(error);
    this.notification.next({
      text: this.t('An error has occurred during recording'),
      type: 'error',
    });
  };

  handleDataavailableEvent = async (e: BlobEvent) => {
    if (!e.data.size) return;
    if (this.mediaType !== 'audio') return;
    try {
      this.recordedData.push(e.data);
      const recording = await this.makeVoiceRecording();
      if (!recording) return;
      this.signalRecordingReady?.(recording);
      this.recording.next(recording);
    } catch (e) {
      logError(e as Error);
      this.error.next(e as Error);
      this.notification.next({
        text: this.t('An error has occurred during the recording processing'),
        type: 'error',
      });
    }
  };

  resetRecordingState = () => {
    this.recordedData = [];
    this.recording.next(undefined);
    this.recordingState.next(undefined);
    this.recordedChunkDurations = [];
    this.startTime = undefined;
  };

  cleanUp = () => {
    this.resetRecordingState();
    if (this.recordingUri) URL.revokeObjectURL(this.recordingUri);
    this.amplitudeRecorder?.close();
    if (this.mediaRecorder) {
      disposeOfMediaStream(this.mediaRecorder.stream);
      this.mediaRecorder.removeEventListener(
        'dataavailable',
        this.handleDataavailableEvent,
      );
      this.mediaRecorder.removeEventListener('error', this.handleErrorEvent);
    }
  };

  start = async () => {
    if (
      [MediaRecordingState.RECORDING, MediaRecordingState.PAUSED].includes(
        this.recordingState.value as MediaRecordingState,
      )
    ) {
      const error = new Error('Cannot start recording. Recording already in progress');
      logError(error);
      this.error.next(error);
      return;
    }

    // account for requirement on iOS as per this bug report: https://bugs.webkit.org/show_bug.cgi?id=252303
    if (!navigator.mediaDevices) {
      const error = new Error('Media recording is not supported');
      logError(error);
      this.error.next(error);
      this.notification.next({ text: this.t('Error starting recording'), type: 'error' });
      return;
    }

    if (this.mediaType === 'video') {
      const error = new Error(
        `Video recording is not supported. Provided MIME type: ${this.mediaRecorderConfig.mimeType}`,
      );
      logError(error);
      this.error.next(error);
      this.notification.next({ text: this.t('Error starting recording'), type: 'error' });
      return;
    }

    if (!this.permission.state.value) {
      await this.permission.check();
    }

    if (this.permission.state.value === 'denied') {
      logError(new Error('Permission denied'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, this.mediaRecorderConfig);

      this.mediaRecorder.addEventListener('dataavailable', this.handleDataavailableEvent);
      this.mediaRecorder.addEventListener('error', this.handleErrorEvent);

      this.startTime = new Date().getTime();
      this.mediaRecorder.start();

      if (this.mediaType === 'audio' && stream) {
        this.amplitudeRecorder = new AmplitudeRecorder({
          config: this.amplitudeRecorderConfig,
          stream,
        });
        this.amplitudeRecorder.start();
      }

      this.recordingState.next(MediaRecordingState.RECORDING);
    } catch (error) {
      logError(error as Error);
      this.cancel();
      this.error.next(error as Error);
      this.notification.next({ text: this.t('Error starting recording'), type: 'error' });
    }
  };

  pause = () => {
    if (this.recordingState.value !== MediaRecordingState.RECORDING) return;
    if (this.startTime) {
      this.recordedChunkDurations.push(new Date().getTime() - this.startTime);
      this.startTime = undefined;
    }
    this.mediaRecorder?.pause();
    // Flush current chunk so preview is available while paused.
    this.mediaRecorder?.requestData();
    this.amplitudeRecorder?.stop();
    this.recordingState.next(MediaRecordingState.PAUSED);
  };

  resume = () => {
    if (this.recordingState.value !== MediaRecordingState.PAUSED) return;
    this.startTime = new Date().getTime();
    this.mediaRecorder?.resume();
    this.amplitudeRecorder?.start();
    this.recordingState.next(MediaRecordingState.RECORDING);
  };

  stop = () => {
    const recording = this.recording.value;
    if (recording && this.mediaRecorder?.state === 'inactive')
      return Promise.resolve(recording);

    if (
      ![MediaRecordingState.PAUSED, MediaRecordingState.RECORDING].includes(
        (this.mediaRecorder?.state || '') as MediaRecordingState,
      )
    )
      return Promise.resolve(undefined);

    if (this.startTime) {
      this.recordedChunkDurations.push(new Date().getTime() - this.startTime);
      this.startTime = undefined;
    }
    const result = new Promise<LocalVoiceRecordingAttachment>((res) => {
      this.signalRecordingReady = res;
    });
    this.mediaRecorder?.stop();
    this.amplitudeRecorder?.stop();
    this.recordingState.next(MediaRecordingState.STOPPED);
    return result;
  };

  cancel = () => {
    this.stop();
    this.cleanUp();
  };
}
