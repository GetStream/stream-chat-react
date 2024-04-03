import { encodeToWaw } from './wav';
import { encodeToMp3 } from './mp3';
import { createFileFromBlobs, getExtensionFromMimeType } from '../../../ReactFileUtilities';

type TranscodeParams = {
  blob: Blob;
  sampleRate: number;
  targetMimeType: string;
};
export const transcode = ({ blob, sampleRate, targetMimeType }: TranscodeParams): Promise<Blob> => {
  const file = createFileFromBlobs({
    blobsArray: [blob],
    fileName: `audio_recording_${new Date().toISOString()}.${getExtensionFromMimeType(blob.type)}`,
    mimeType: blob.type,
  });

  if (targetMimeType.match('audio/wav')) {
    return encodeToWaw(file, sampleRate);
  }

  if (targetMimeType.match('audio/mp3')) {
    return encodeToMp3(file, sampleRate);
  }
  return Promise.resolve(blob);
};
