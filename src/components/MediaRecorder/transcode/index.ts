import { encodeToWaw } from './wav';
import { createFileFromBlobs, getExtensionFromMimeType } from '../../ReactFileUtilities';

export type TranscoderConfig = {
  // defaults to 16000Hz
  sampleRate: number;
  // Custom encoder function that converts the recorded audio file into a blob with the desired MIME type
  encoder?: (file: File, sampleRate: number) => Promise<Blob>;
};

export type TranscodeParams = TranscoderConfig & {
  blob: Blob;
};

export const transcode = ({
  blob,
  encoder = encodeToWaw,
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
