import { encodeToWav } from './wav';
import { createFileFromBlobs, getExtensionFromMimeType } from '../../ReactFileUtilities';

export type TranscoderConfig = {
  /** Output sample rate in Hz. Defaults to 16000. */
  sampleRate: number;
  /** Converts the recorded audio file into a blob of the desired MIME type. Defaults to WAV. */
  encoder?: (file: File, sampleRate: number) => Promise<Blob>;
};

export type TranscodeParams = TranscoderConfig & {
  blob: Blob;
};

export const transcode = ({
  blob,
  encoder = encodeToWav,
  sampleRate,
}: TranscodeParams): Promise<Blob> =>
  encoder(
    createFileFromBlobs({
      blobsArray: [blob],
      fileName: `audio_recording_${new Date().toISOString()}.${getExtensionFromMimeType(
        blob.type,
      )}`,
      mimeType: blob.type,
    }),
    sampleRate,
  );
