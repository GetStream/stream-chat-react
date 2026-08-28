import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';

import { Chat } from '../../Chat';
import { VideoPlayer } from '../../VideoPlayer';
import { Audio } from '../Audio';
import { FileAttachment } from '../FileAttachment';
import { VideoAttachment } from '../VideoAttachment';
import { VoiceRecording } from '../VoiceRecording';
import { WithAudioPlayback } from '../../AudioPlayback';
import { FileContainer } from '../AttachmentContainer';
import { AttachmentUploadProgressIndicator } from '../components';
import { getTestClientWithUser } from '../../../mock-builders';
import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { fromPartial } from '@total-typescript/shoehorn';

import type { StreamChat } from 'stream-chat';

const UPLOAD_ID = 'local-attachment-id';

const uploadedFile = {
  asset_url: 'https://example.com/dummy.pdf',
  file_size: 1337,
  mime_type: 'application/pdf',
  title: 'Nice file',
  type: 'file',
};

const uploadingFile = {
  file_size: 1337,
  localMetadata: {
    // resolveAttachmentFullByteSize prefers the real File size over `file_size`.
    file: new File(['x'.repeat(1337)], 'Nice file'),
    id: UPLOAD_ID,
    previewUri: 'blob:http://localhost/preview',
    uploadState: 'uploading',
  },
  mime_type: 'application/pdf',
  title: 'Nice file',
  type: 'file',
};

const renderWithClient = (client: StreamChat, ui: React.ReactElement) =>
  render(<Chat client={client}>{ui}</Chat>);

describe('AttachmentUploadProgressIndicator', () => {
  let client: StreamChat;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'test-user' });
  });

  it('renders nothing for an attachment that is not uploading', () => {
    renderWithClient(
      client,
      <AttachmentUploadProgressIndicator attachment={uploadedFile} />,
    );

    expect(screen.queryByTestId('attachment-upload-progress')).not.toBeInTheDocument();
  });

  it('renders nothing until uploadManager holds a live record, making the UI opt-in', () => {
    // `uploadState: 'uploading'` on the payload is not enough on its own — an integration that
    // never drives uploads through uploadManager gets none of this UI.
    renderWithClient(
      client,
      <AttachmentUploadProgressIndicator attachment={uploadingFile} />,
    );

    expect(screen.queryByTestId('attachment-upload-progress')).not.toBeInTheDocument();
  });

  it('stops reporting progress once the live record is gone (no phantom spinner)', () => {
    // Regression guard. A message can outlive its request — upload aborted, disconnectUser
    // calling uploadManager.reset(), or a message rehydrated from an offline store with a
    // stale localMetadata.uploadState. Keying off the frozen payload left such an attachment
    // showing an indeterminate spinner forever.
    renderWithClient(
      client,
      <AttachmentUploadProgressIndicator attachment={uploadingFile} />,
    );

    act(() => {
      client.uploadManager.state.partialNext({
        uploads: { [UPLOAD_ID]: { id: UPLOAD_ID, uploadProgress: 40 } },
      });
    });
    expect(screen.getByTestId('attachment-upload-progress')).toBeInTheDocument();

    act(() => {
      client.uploadManager.state.partialNext({ uploads: {} });
    });
    expect(screen.queryByTestId('attachment-upload-progress')).not.toBeInTheDocument();
  });

  it('falls back to the shared loading indicator when a live upload reports no progress', () => {
    renderWithClient(
      client,
      <AttachmentUploadProgressIndicator attachment={uploadingFile} />,
    );

    act(() => {
      // Live record, but the transfer length is not computable.
      client.uploadManager.state.partialNext({
        uploads: { [UPLOAD_ID]: { id: UPLOAD_ID } },
      });
    });

    expect(screen.getByTestId('attachment-upload-progress')).toBeInTheDocument();
    // Same component the composer previews use when the transfer length is not computable.
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('circular-progress-ring')).not.toBeInTheDocument();
  });

  it('goes indeterminate when the record reports uploadConfirmationPending', () => {
    // Upload progress counts bytes written to the socket, not bytes the server acknowledged, so
    // it hits 100% while the CDN is still ingesting. `UploadRecord.uploadConfirmationPending` marks that
    // window; a bar parked at 100% would claim the upload is confirmed when it is not.
    renderWithClient(
      client,
      <AttachmentUploadProgressIndicator attachment={uploadingFile} />,
    );

    act(() => {
      client.uploadManager.state.partialNext({
        uploads: {
          [UPLOAD_ID]: {
            id: UPLOAD_ID,
            uploadConfirmationPending: true,
            uploadProgress: 100,
          },
        },
      });
    });

    expect(screen.getByTestId('attachment-upload-progress')).toBeInTheDocument();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('circular-progress-ring')).not.toBeInTheDocument();
    // The byte readout still tells the truth: everything has been sent.
    expect(screen.getByTestId('upload-size-fraction')).toHaveTextContent(
      '1.31 kB / 1.31 kB',
    );
  });

  it('keeps the determinate ring while the record says confirmation is not pending', () => {
    // Guards against reading 100% as "awaiting" when the transport says otherwise.
    renderWithClient(
      client,
      <AttachmentUploadProgressIndicator attachment={uploadingFile} />,
    );

    act(() => {
      client.uploadManager.state.partialNext({
        uploads: {
          [UPLOAD_ID]: {
            id: UPLOAD_ID,
            uploadConfirmationPending: false,
            uploadProgress: 100,
          },
        },
      });
    });

    expect(screen.getByTestId('circular-progress-ring')).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });

  it('infers the awaiting window when the record has no uploadConfirmationPending field', () => {
    // Back-compat: `uploadConfirmationPending` was added in stream-chat v9.51. Against an older resolved
    // stream-chat the field is absent and a live record at 100% means the same thing.
    renderWithClient(
      client,
      <AttachmentUploadProgressIndicator attachment={uploadingFile} />,
    );

    act(() => {
      client.uploadManager.state.partialNext({
        uploads: { [UPLOAD_ID]: { id: UPLOAD_ID, uploadProgress: 100 } },
      });
    });

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('circular-progress-ring')).not.toBeInTheDocument();
  });

  it('renders the same progress ring and uploaded/total size as the composer previews', () => {
    renderWithClient(
      client,
      <AttachmentUploadProgressIndicator attachment={uploadingFile} />,
    );

    act(() => {
      client.uploadManager.state.partialNext({
        uploads: { [UPLOAD_ID]: { id: UPLOAD_ID, uploadProgress: 50 } },
      });
    });

    const ring = screen.getByTestId('circular-progress-ring');
    expect(ring).toHaveAttribute('aria-valuenow', '50');
    // UploadedSizeIndicator: half of the 1337-byte file has been sent.
    expect(screen.getByTestId('upload-size-fraction')).toHaveTextContent(
      '669 B / 1.31 kB',
    );
  });
});

describe('FileAttachment upload progress integration', () => {
  let client: StreamChat;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'test-user' });
  });

  it('keeps showing the file size for an already uploaded attachment', () => {
    renderWithClient(client, <FileAttachment attachment={uploadedFile} />);

    expect(screen.getByTestId('file-size-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('attachment-upload-progress')).not.toBeInTheDocument();
  });

  it('replaces the file size with the upload progress while a request is in flight', () => {
    const { container } = renderWithClient(
      client,
      <FileAttachment attachment={uploadingFile} />,
    );
    const dataRow = () =>
      container.querySelector('.str-chat__message-attachment-file--item__data');

    // Without a live record the widget is untouched — the opt-in property, at widget level.
    expect(screen.getByTestId('file-size-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('attachment-upload-progress')).not.toBeInTheDocument();

    act(() => {
      client.uploadManager.state.partialNext({
        uploads: { [UPLOAD_ID]: { id: UPLOAD_ID, uploadProgress: 10 } },
      });
    });

    // The size slot now holds the progress instead. (Its own uploaded/total readout reuses
    // FileSizeIndicator internally, so assert on the slot's contents rather than a global
    // testid count.)
    expect(dataRow()?.children).toHaveLength(1);
    expect(
      dataRow()?.querySelector('[data-testid="attachment-upload-progress"]'),
    ).toBeInTheDocument();
  });
});

describe('VideoPlayer controls', () => {
  const renderPlayer = (props: React.ComponentProps<typeof VideoPlayer>) =>
    render(<VideoPlayer {...props} />);

  it('renders controls by default', async () => {
    const { container } = renderPlayer({ videoUrl: 'https://example.com/clip.mp4' });
    const video = await waitFor(() => {
      const el = container.querySelector('video');
      expect(el).toBeInTheDocument();
      return el;
    });
    expect(video).toHaveAttribute('controls');
  });

  it('omits controls when asked to', async () => {
    const { container } = renderPlayer({
      controls: false,
      videoUrl: 'blob:http://localhost/preview',
    });
    const video = await waitFor(() => {
      const el = container.querySelector('video');
      expect(el).toBeInTheDocument();
      return el;
    });
    expect(video).not.toHaveAttribute('controls');
  });
});

describe('VideoAttachment during upload', () => {
  let client: StreamChat;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'test-user' });
  });

  const uploadingVideo = {
    localMetadata: {
      file: new File(['x'], 'clip.mp4', { type: 'video/mp4' }),
      id: UPLOAD_ID,
      previewUri: 'blob:http://localhost/preview',
      uploadState: 'uploading',
    },
    title: 'clip.mp4',
    type: 'video',
  };

  it('stays on the player once the upload settles, instead of falling back to the thumbnail', async () => {
    // Otherwise the rendered element swaps twice — to the CDN thumbnail when `thumb_url` arrives,
    // then back to a player when the user clicks — and each swap resizes the bubble, which is
    // sized to its content.
    const { container, rerender } = renderWithClient(
      client,
      <VideoAttachment attachment={uploadingVideo} />,
    );
    await waitFor(() => expect(container.querySelector('video')).toBeInTheDocument());

    rerender(
      <Chat client={client}>
        <VideoAttachment
          attachment={{
            asset_url: 'https://cdn.example.com/clip.mp4',
            thumb_url: 'https://cdn.example.com/clip.jpg?oh=360&ow=640',
            title: 'clip.mp4',
            type: 'video',
          }}
        />
      </Chat>,
    );

    // The thumbnail is the fallback we are avoiding. (The player's own `src` comes from
    // `videoAttachmentSizeHandler`, which lives on ChannelStateContext, so it stays empty in
    // this standalone render — hence asserting on the thumbnail's absence rather than the
    // player's presence.)
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('video-wrapper')).toBeInTheDocument();
  });

  it('does not start playing by itself when the upload finishes', () => {
    // A video watched from its local blob used to restart on its own: `isPlaying` was derived
    // from "a thumbnail exists", and `thumb_url` arrives with the upload's response.
    const VideoPlayerSpy = vi.fn(() => null);
    const { rerender } = renderWithClient(
      client,
      <VideoAttachment attachment={uploadingVideo} VideoPlayer={VideoPlayerSpy} />,
    );

    expect(VideoPlayerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ isPlaying: false }),
      undefined,
    );
    VideoPlayerSpy.mockClear();

    rerender(
      <Chat client={client}>
        <VideoAttachment
          attachment={{
            asset_url: 'https://cdn.example.com/clip.mp4',
            thumb_url: 'https://cdn.example.com/clip.jpg?oh=360&ow=640',
            title: 'clip.mp4',
            type: 'video',
          }}
          VideoPlayer={VideoPlayerSpy}
        />
      </Chat>,
    );

    expect(VideoPlayerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ isPlaying: false }),
      undefined,
    );
  });

  it('plays when the user clicks the thumbnail of an already uploaded video', () => {
    const VideoPlayerSpy = vi.fn(() => null);
    renderWithClient(
      client,
      // `shouldGenerateVideoThumbnail` comes from ChannelStateContext; without it the widget goes
      // straight to the player and there is no thumbnail to click.
      <ChannelStateProvider value={fromPartial({ shouldGenerateVideoThumbnail: true })}>
        <VideoAttachment
          attachment={{
            asset_url: 'https://cdn.example.com/clip.mp4',
            thumb_url: 'https://cdn.example.com/clip.jpg?oh=360&ow=640',
            title: 'clip.mp4',
            type: 'video',
          }}
          VideoPlayer={VideoPlayerSpy}
        />
      </ChannelStateProvider>,
    );

    // Thumbnail first for a video that was never uploaded from this composer.
    expect(VideoPlayerSpy).not.toHaveBeenCalled();

    act(() => {
      screen.getByLabelText('Play video').click();
    });

    expect(VideoPlayerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ isPlaying: true }),
      undefined,
    );
  });

  it('keeps the transport controls while the upload is in flight', async () => {
    // The local blob plays, so there is something to play; withholding the controls here would
    // make video the only message-list widget that cannot be played mid-upload.
    const { container } = renderWithClient(
      client,
      <VideoAttachment
        attachment={{
          localMetadata: {
            file: new File(['x'], 'clip.mp4', { type: 'video/mp4' }),
            id: UPLOAD_ID,
            previewUri: 'blob:http://localhost/preview',
            uploadState: 'uploading',
          },
          title: 'clip.mp4',
          type: 'video',
        }}
      />,
    );

    const video = await waitFor(() => {
      const el = container.querySelector('video');
      expect(el).toBeInTheDocument();
      return el;
    });
    expect(video).toHaveAttribute('controls');
  });
});

describe('audio and voice recording widgets during upload', () => {
  let client: StreamChat;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'test-user' });
  });

  const uploading = (extra: Record<string, unknown>) => ({
    file_size: 2048,
    localMetadata: {
      file: new File(['x'.repeat(2048)], 'recording.webm'),
      id: UPLOAD_ID,
      previewUri: 'blob:http://localhost/preview',
      uploadState: 'uploading',
    },
    mime_type: 'audio/webm',
    ...extra,
  });

  const startUpload = () =>
    act(() => {
      client.uploadManager.state.partialNext({
        uploads: { [UPLOAD_ID]: { id: UPLOAD_ID, uploadProgress: 30 } },
      });
    });

  it('shows upload progress on a voice recording that already knows its duration', () => {
    // `MediaRecorderController` stamps `duration` on every recording before it is uploaded, so a
    // duration-first check left an uploading voice message with no upload indication at all.
    renderWithClient(
      client,
      <WithAudioPlayback>
        <VoiceRecording
          attachment={uploading({
            duration: 4,
            type: 'voiceRecording',
            waveform_data: [0.1, 0.9],
          })}
        />
      </WithAudioPlayback>,
    );
    startUpload();

    expect(screen.getByTestId('attachment-upload-progress')).toBeInTheDocument();
    // Playback stays available: the local blob plays, and every message-list widget behaves this
    // way (video keeps its transport controls), as does stream-chat-react-native.
    expect(screen.getByTestId('play-audio')).toBeEnabled();
  });

  it('shows the duration again once the voice recording is uploaded', () => {
    renderWithClient(
      client,
      <WithAudioPlayback>
        <VoiceRecording
          attachment={{
            asset_url: 'https://example.com/recording.webm',
            duration: 4,
            type: 'voiceRecording',
            waveform_data: [0.1, 0.9],
          }}
        />
      </WithAudioPlayback>,
    );

    expect(screen.queryByTestId('attachment-upload-progress')).not.toBeInTheDocument();
    expect(screen.getByTestId('play-audio')).toBeEnabled();
  });

  it('shows upload progress on an audio attachment that already knows its duration', () => {
    renderWithClient(
      client,
      <WithAudioPlayback>
        <Audio attachment={uploading({ duration: 12, type: 'audio' })} />
      </WithAudioPlayback>,
    );
    startUpload();

    expect(screen.getByTestId('attachment-upload-progress')).toBeInTheDocument();
    expect(screen.getByTestId('play-audio')).toBeEnabled();
  });
});

describe('FileContainer source guard', () => {
  let client: StreamChat;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'test-user' });
  });

  const renderContainer = (attachment: Record<string, unknown>) =>
    render(
      <Chat client={client}>
        <WithAudioPlayback>
          <FileContainer attachment={attachment as never} />
        </WithAudioPlayback>
      </Chat>,
    );

  const failedUpload = (extra: Record<string, unknown>) => ({
    localMetadata: {
      file: new File(['x'], 'attachment'),
      id: 'failed-id',
      previewUri: 'blob:http://localhost/preview',
      uploadState: 'failed',
    },
    ...extra,
  });

  it.each([
    ['audio', { mime_type: 'audio/mp3', title: 'a.mp3', type: 'audio' }],
    ['voiceRecording', { duration: 3, type: 'voiceRecording', waveform_data: [0.2] }],
    ['file', { mime_type: 'application/pdf', title: 'f.pdf', type: 'file' }],
  ])(
    'renders nothing for a %s attachment with no source at all',
    (_label, attachment) => {
      // The audio widgets return null without a source anyway, but their containers would still
      // occupy layout.
      const { container } = renderContainer(attachment);

      expect(container).toBeEmptyDOMElement();
    },
  );

  it.each([
    ['file', { mime_type: 'application/pdf', title: 'f.pdf', type: 'file' }],
    ['audio', { mime_type: 'audio/mp3', title: 'a.mp3', type: 'audio' }],
    ['voiceRecording', { duration: 3, type: 'voiceRecording', waveform_data: [0.2] }],
  ])(
    'keeps a %s attachment whose upload failed, so a retry has something to show',
    (_label, attachment) => {
      const { container } = renderContainer(failedUpload(attachment));

      expect(container).not.toBeEmptyDOMElement();
    },
  );
});
