import {
  createFileFromBlobs,
  getExtensionFromMimeType,
  getRecordedMediaTypeFromMimeType,
  RecordedMediaType,
} from '../../ReactFileUtilities';
import { mergeDeep } from '../../../utils/mergeDeep';
import { transcode } from '../transcode';
import { nanoid } from 'nanoid';
import { resampleWaveformData } from '../../Attachment';
import fixWebmDuration from 'fix-webm-duration';
import { isSafari } from '../../../utils/browsers';
import { VoiceRecordingAttachment } from '../../MessageInput';
import { BrowserPermission } from './BrowserPermission';
import { TranslationContextValue } from '../../../context';
import { defaultTranslatorFunction } from '../../../i18n';
import { Subject } from '../observable/Subject';
import { BehaviorSubject } from '../observable/BehaviorSubject';
import {
  AmplitudeAnalyserConfig,
  AmplitudeRecorder,
  AmplitudeRecorderConfig,
} from './AmplitudeRecorder';

const RECORDED_MIME_TYPE_BY_BROWSER = {
  audio: {
    others: 'audio/webm',
    safari: 'audio/mp4;codecs=mp4a.40.2',
  },
} as const;

export const DEFAULT_AUDIO_RECORDER_CONFIG: AudioRecorderConfig = {
  amplitudeRecorderConfig: {
    analyserConfig: {
      fftSize: 32,
      maxDecibels: 0,
      minDecibels: -100,
    } as AmplitudeAnalyserConfig,
    sampleCount: 100,
    samplingFrequencyMs: 60,
  },
  mediaRecorderConfig: {
    mimeType: isSafari()
      ? RECORDED_MIME_TYPE_BY_BROWSER.audio.safari
      : RECORDED_MIME_TYPE_BY_BROWSER.audio.others,
  },
  transcoderConfig: {
    sampleRate: 16000,
    targetMimeType: 'audio/mp3',
  },
} as const;

const disposeOfMediaStream = (stream?: MediaStream) => {
  if (!stream?.active) return;
  stream.getTracks().forEach((track) => {
    track.stop();
    stream.removeTrack(track);
  });
};

const logError = (e?: Error) => e && console.error('[MEDIA RECORDER ERROR]', e);

type SupportedTranscodeMimeTypes = 'audio/wav' | 'audio/mp3';

type TranscoderConfig = {
  // defaults to 16000Hz
  sampleRate: number;
  // Defaults to audio/mp3;
  targetMimeType: SupportedTranscodeMimeTypes;
};

type MediaRecorderConfig = Omit<MediaRecorderOptions, 'mimeType'> &
  Required<Pick<MediaRecorderOptions, 'mimeType'>>;

export type AudioRecorderConfig = {
  amplitudeRecorderConfig: AmplitudeRecorderConfig;
  mediaRecorderConfig: MediaRecorderOptions;
  transcoderConfig: TranscoderConfig;
};

export type AudioRecorderOptions = {
  config?: Partial<AudioRecorderConfig>;
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

  signalRecordingReady: ((r: VoiceRecordingAttachment) => void) | undefined;

  recordingState = new BehaviorSubject<MediaRecordingState | undefined>(undefined);
  recording = new BehaviorSubject<VoiceRecordingAttachment | undefined>(undefined);
  error = new Subject<Error | undefined>();
  notification = new Subject<{ text: string; type: 'success' | 'error' } | undefined>();

  customGenerateRecordingTitle: ((mimeType: string) => string) | undefined;
  t: TranslationContextValue['t'];

  constructor({
    config,
    generateRecordingTitle,
    t = defaultTranslatorFunction,
  }: AudioRecorderOptions) {
    const { amplitudeRecorderConfig, mediaRecorderConfig, transcoderConfig } = mergeDeep(
      { ...config },
      DEFAULT_AUDIO_RECORDER_CONFIG,
    );

    this.t = t;
    this.mediaRecorderConfig = mediaRecorderConfig as MediaRecorderConfig;
    this.transcoderConfig = transcoderConfig;
    this.amplitudeRecorderConfig = amplitudeRecorderConfig;

    const mediaType = getRecordedMediaTypeFromMimeType(this.mediaRecorderConfig.mimeType);
    if (!mediaType) {
      throw new Error(
        `Unsupported media type (supported audio or video only). Provided mimeType: ${this.mediaRecorderConfig.mimeType}}`,
      );
    }
    this.mediaType = mediaType;

    this.permission = new BrowserPermission({ mediaType });

    this.customGenerateRecordingTitle = generateRecordingTitle;

    this.handleErrorEvent = this.handleErrorEvent.bind(this);
    this.handleDataavailableEvent = this.handleDataavailableEvent.bind(this);
    this.resetRecordingState = this.resetRecordingState.bind(this);
    this.cleanUp = this.cleanUp.bind(this);
    this.start = this.start.bind(this);
    this.pause = this.pause.bind(this);
    this.resume = this.resume.bind(this);
    this.stop = this.stop.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  generateRecordingTitle(mimeType: string) {
    if (this.customGenerateRecordingTitle) {
      return this.customGenerateRecordingTitle(mimeType);
    }
    return `${this.mediaType}_recording_${new Date().toISOString()}.${getExtensionFromMimeType(
      mimeType,
    )}`; // extension needed so that desktop Safari can play the asset
  }

  handleErrorEvent = (e: Event) => {
    const { error } = e as ErrorEvent;
    logError(error);
    this.error.next(error);
    this.notification.next({
      text: this.t('An error has occurred during recording'),
      type: 'error',
    });
  };

  handleDataavailableEvent(e: BlobEvent) {
    const durationMs = this.recordedChunkDurations.reduce((acc, val) => acc + val, 0);
    if (!e.data.size) return;
    this.recordedData.push(e.data);
    if (!this.recordedData.length) return;

    const { mimeType } = this.mediaRecorderConfig;
    const initialBlob = new Blob(this.recordedData, { type: mimeType });

    const makeVoiceRecording = async (blob: Blob) => {
      if (this.recordingUri) URL.revokeObjectURL(this.recordingUri);

      const finalBlob = await transcode({
        blob,
        ...this.transcoderConfig,
      });
      if (!finalBlob) return;

      this.recordingUri = URL.createObjectURL(finalBlob);
      const file = createFileFromBlobs({
        blobsArray: [finalBlob],
        fileName: this.generateRecordingTitle(finalBlob.type),
        mimeType: finalBlob.type,
      });

      const recording = {
        $internal: {
          file,
          id: nanoid(),
        },
        asset_url: this.recordingUri,
        duration: durationMs / 1000,
        file_size: finalBlob.size,
        mime_type: finalBlob.type,
        title: file.name,
        type: RecordingAttachmentType.VOICE_RECORDING,
        waveform_data: resampleWaveformData(
          this.amplitudeRecorder?.amplitudes.value ?? [],
          this.amplitudeRecorderConfig.sampleCount,
        ),
      };
      this.signalRecordingReady?.(recording);
      this.recording.next(recording);
    };

    const handleError = (e: Error) => {
      logError(e);
      this.error.next(e);
      this.notification.next({
        text: this.t('An error has occurred during the recording processing'),
        type: 'error',
      });
    };

    if (mimeType.match('audio/webm')) {
      // The browser does not include duration metadata with the recorded blob
      fixWebmDuration(initialBlob, durationMs, {
        logger: () => null,
      })
        .then(makeVoiceRecording)
        .catch(handleError);
    } else {
      makeVoiceRecording(initialBlob).catch(handleError);
    }
  }

  resetRecordingState() {
    this.recordedData = [];
    this.recording.next(undefined);
    this.recordingState.next(undefined);
    this.recordedChunkDurations = [];
    this.startTime = undefined;
  }

  cleanUp() {
    this.resetRecordingState();
    if (this.recordingUri) URL.revokeObjectURL(this.recordingUri);
    this.amplitudeRecorder?.close();
    if (this.mediaRecorder) {
      disposeOfMediaStream(this.mediaRecorder.stream);
      this.mediaRecorder.removeEventListener('dataavailable', this.handleDataavailableEvent);
      this.mediaRecorder.removeEventListener('error', this.handleErrorEvent);
    }
  }

  async start() {
    // account for requirement on iOS as per this bug report: https://bugs.webkit.org/show_bug.cgi?id=252303
    if (!navigator.mediaDevices) {
      const error = new Error('Media recording is not supported');
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
      const stream = await navigator.mediaDevices.getUserMedia(
        this.mediaType === 'video' ? { audio: true, video: true } : { audio: true },
      );
      this.mediaRecorder = new MediaRecorder(stream, this.mediaRecorderConfig);

      this.mediaRecorder.addEventListener('dataavailable', this.handleDataavailableEvent);
      this.mediaRecorder.addEventListener('error', this.handleErrorEvent);

      this.startTime = new Date().getTime();
      this.mediaRecorder.start();

      if (this.mediaType === 'audio') {
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
  }

  pause() {
    if (this.startTime) {
      this.recordedChunkDurations.push(new Date().getTime() - this.startTime);
      this.startTime = undefined;
    }
    this.mediaRecorder?.pause();
    this.amplitudeRecorder?.stop();
    this.recordingState.next(MediaRecordingState.PAUSED);
  }

  resume() {
    this.startTime = new Date().getTime();
    this.mediaRecorder?.resume();
    this.amplitudeRecorder?.start();
    this.recordingState.next(MediaRecordingState.RECORDING);
  }

  stop() {
    const recording = this.recording.value;
    if (recording) return recording;

    if (!['paused', 'recording'].includes(this.mediaRecorder?.state || ''))
      return Promise.resolve(undefined);

    if (this.startTime) {
      this.recordedChunkDurations.push(new Date().getTime() - this.startTime);
    }
    const result = new Promise<VoiceRecordingAttachment>((res) => {
      this.signalRecordingReady = res;
    });
    this.mediaRecorder?.stop();
    this.amplitudeRecorder?.stop();
    this.recordingState.next(MediaRecordingState.STOPPED);
    return result;
  }

  cancel() {
    this.stop();
    this.cleanUp();
  }
}
