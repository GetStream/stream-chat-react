import { useCallback, useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { getExtensionFromMimeType } from '../../ReactFileUtilities';

export enum LoadState {
  FAILED = 'failed',
  LOADED = 'loaded',
  LOADING = 'loading',
}

const FFMPEG_MIME_TYPE_TO_PARAMS: {
  audio: Record<string, (inputName: string, outputName: string) => string[]>;
} = {
  audio: {
    'audio/mp4;codecs=mp4a.40.2': (inputName: string, outputName: string) => [
      '-i',
      inputName,
      '-vn',
      '-c:a',
      'aac',
      '-strict',
      '-2',
      outputName,
    ],
  },
};

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read Blob as ArrayBuffer'));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Unknown error reading Blob as ArrayBuffer'));
    };
    reader.readAsArrayBuffer(blob);
  });
}

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

type UseTranscodingParams = {
  onError: (e: Error) => void;
  transcodeToMimeType?: string;
};

export const useTranscoding = ({ onError, transcodeToMimeType }: UseTranscodingParams) => {
  const [transcoderLoadState, setTranscodingLoadState] = useState<LoadState>();
  const [isTranscoding, setIsTranscoding] = useState(false);
  const ffmpegLoadPromise = useRef<Promise<void>>();
  const ffmpegRef = useRef(new FFmpeg());

  const loadFfmpeg = useCallback(async () => {
    setTranscodingLoadState(LoadState.LOADING);
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message, type }) => {
      console.log('[LOAD ffmpeg]:', type, message);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    ffmpegLoadPromise.current = ffmpeg
      .load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      })
      .then(() => {
        setTranscodingLoadState(LoadState.LOADED);
      })
      .catch((e) => {
        setTranscodingLoadState(LoadState.FAILED);
        onError(e);
      });
  }, [onError]);

  const transcode = useCallback(
    async (blob: Blob): Promise<Blob | void> => {
      if (!transcodeToMimeType) return;
      await ffmpegLoadPromise.current;
      setIsTranscoding(true);
      const sourceExtension = getExtensionFromMimeType(blob.type);
      const targetExtension = getExtensionFromMimeType(transcodeToMimeType);
      const inputName = `input.${sourceExtension}`;
      const outputName = `output.${targetExtension}`;
      const getParams =
        FFMPEG_MIME_TYPE_TO_PARAMS.audio[transcodeToMimeType] ??
        FFMPEG_MIME_TYPE_TO_PARAMS.audio['audio/mp4;codecs=mp4a.40.2'];
      const transcodeParams = getParams(inputName, outputName);

      const ffmpeg = ffmpegRef.current;
      try {
        const originalData = await blobToArrayBuffer(blob);
        await ffmpeg.writeFile(inputName, new Uint8Array(originalData));
        await ffmpeg.exec(transcodeParams);
        const fileData = await ffmpeg.readFile(outputName);
        const data = new Uint8Array(fileData as ArrayBuffer);
        setIsTranscoding(false);
        return new Blob([data.buffer], { type: transcodeToMimeType });
      } catch (e) {
        onError(e as Error);
      } finally {
        setIsTranscoding(false);
      }
    },
    [onError, transcodeToMimeType],
  );

  useEffect(() => {
    if (transcodeToMimeType && !ffmpegLoadPromise.current) {
      loadFfmpeg();
    }
  }, [loadFfmpeg, transcodeToMimeType]);

  return {
    isTranscoding,
    transcode:
      transcodeToMimeType && transcoderLoadState === LoadState.LOADED ? transcode : undefined,
    transcoderLoadState,
  };
};
