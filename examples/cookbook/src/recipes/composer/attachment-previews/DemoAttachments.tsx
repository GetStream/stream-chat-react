import { useEffect } from 'react';
import type { LocalAttachment } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

/**
 * For the screenshots only, not part of the recipe: `?attachments=images|event|voice` adds
 * attachments to the channel's composer (`?channel=`) on this device, as if the user had picked
 * them. Nothing is uploaded or sent.
 */

// Gradient tiles in the SDK's default blues, drawn locally so no image is fetched.
const drawTile = async (from: string, to: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 96, 96);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 96, 96);
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
  return new File([blob ?? new Blob()], 'tile.png', { type: 'image/png' });
};

// One second of silence, so the audio player has something to load.
const silentWav = () => {
  const sampleRate = 8000;
  const buffer = new ArrayBuffer(44 + sampleRate);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) =>
    [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  write(0, 'RIFF');
  view.setUint32(4, 36 + sampleRate, true);
  write(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, 'data');
  view.setUint32(40, sampleRate, true);
  new Uint8Array(buffer, 44).fill(128);
  return new File([buffer], 'voice-message.wav', { type: 'audio/wav' });
};

const buildAttachments = (kind: string): Promise<LocalAttachment[]> => {
  if (kind === 'images') {
    const tiles = [
      ['#a5c5ff', '#005fff', 'finished', undefined],
      ['#c3d9ff', '#4586ff', 'finished', undefined],
      ['#e3edff', '#78a8ff', 'uploading', 60],
    ] as const;
    return Promise.all(
      tiles.map(async ([from, to, uploadState, uploadProgress], index) => {
        const file = await drawTile(from, to);
        return {
          custom: {},
          fallback: file.name,
          localMetadata: {
            file,
            id: `cookbook-demo-image-${index}`,
            previewUri: URL.createObjectURL(file),
            uploadProgress,
            uploadState,
          },
          type: 'image',
        };
      }),
    );
  }
  if (kind === 'event') {
    return Promise.resolve([
      {
        custom: {},
        // The type requires a file and an upload state, though an event has nothing to upload.
        localMetadata: {
          file: new File([], 'event'),
          id: 'cookbook-demo-event',
          uploadState: 'finished',
        },
        title: 'Garden plot meetup, Saturday 10:00',
        type: 'event',
      },
    ]);
  }
  if (kind === 'voice') {
    const file = silentWav();
    return Promise.resolve([
      {
        custom: { duration: 1 },
        localMetadata: {
          file,
          id: 'cookbook-demo-voice',
          previewUri: URL.createObjectURL(file),
          uploadState: 'finished',
        },
        title: file.name,
        type: 'voiceRecording',
      },
    ]);
  }
  return Promise.resolve([]);
};

export const DemoAttachments = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel');
    const kind = params.get('attachments');
    if (!channelId || !kind) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    void buildAttachments(kind).then((attachments) => {
      // Waits for the channel's composer to be on screen: it resets its state while it sets up.
      timer = setInterval(() => {
        if (cancelled || !document.querySelector('.str-chat__channel textarea')) return;
        clearInterval(timer);
        client
          .channel('messaging', channelId)
          .messageComposer.attachmentManager.upsertAttachments(attachments);
      }, 200);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [client]);

  return null;
};
