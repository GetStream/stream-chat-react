import React, { useContext } from 'react';
import type { Attachment, VoiceRecordingAttachment } from 'stream-chat';

import {
  AttachmentUploadProgressIndicator as DefaultAttachmentUploadProgressIndicator,
  FileSizeIndicator as DefaultFileSizeIndicator,
  DownloadButton,
} from './components';
import type { AudioPlayerState } from '../AudioPlayback/AudioPlayer';
import { useAudioPlayer } from '../AudioPlayback/WithAudioPlayback';
import { useStateStore } from '../../store';
import { MessageContext, useComponentContext } from '../../context';
import type { AudioPlayer } from '../AudioPlayback/AudioPlayer';
import { PlayButton } from '../Button/PlayButton';
import { FileIcon } from '../FileIcon';
import { DurationDisplay, ProgressBar } from '../AudioPlayback';
import { useThreadContext } from '../Threads';
import { getAttachmentPreviewUrl } from 'stream-chat';
import { useAttachmentUploadState } from './hooks/useAttachmentUploadState';

type AudioAttachmentUIProps = {
  attachment?: Attachment;
  audioPlayer: AudioPlayer;
};

// todo: finish creating a BaseAudioPlayer derived from VoiceRecordingPlayerUI and AudioAttachmentUI
const AudioAttachmentUI = ({ attachment, audioPlayer }: AudioAttachmentUIProps) => {
  const {
    AttachmentUploadProgressIndicator = DefaultAttachmentUploadProgressIndicator,
    FileSizeIndicator = DefaultFileSizeIndicator,
  } = useComponentContext();
  const { isUploading } = useAttachmentUploadState(attachment);
  const dataTestId = 'audio-widget';
  const rootClassName = 'str-chat__message-attachment-audio-widget';

  const { durationSeconds, isPlaying, progress, secondsElapsed } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  return (
    <div className={rootClassName} data-testid={dataTestId}>
      <div className='str-chat__message-attachment-audio-widget--play-controls'>
        <PlayButton isPlaying={!!isPlaying} onClick={audioPlayer.togglePlay} />
      </div>
      <div className='str-chat__message-attachment-audio-widget--data'>
        <div className='str-chat__message-attachment-audio-widget--text-first-row'>
          <div className='str-chat__message-attachment-audio-widget--title'>
            {audioPlayer.title}
          </div>
        </div>
        <div className='str-chat__message-attachment-audio-widget--text-second-row'>
          {/*
            While uploading, the upload progress takes this slot — ahead of both the duration and
            the file size. It has to outrank the duration: an audio attachment can carry one
            (`attachment.duration`, or the player reading it off the local blob), and showing it
            would leave an uploading attachment with no upload indication at all.
          */}
          {isUploading ? (
            <AttachmentUploadProgressIndicator attachment={attachment} />
          ) : durationSeconds ? (
            <DurationDisplay
              duration={durationSeconds}
              isPlaying={!!isPlaying}
              secondsElapsed={secondsElapsed}
            />
          ) : (
            <FileSizeIndicator fileSize={audioPlayer.fileSize} />
          )}
          <ProgressBar
            durationSeconds={durationSeconds}
            progress={progress ?? 0}
            secondsElapsed={secondsElapsed}
            seek={audioPlayer.seek}
          />
        </div>
      </div>
      <FileIcon className='str-chat__file-icon' mimeType={audioPlayer.mimeType} />
      <DownloadButton assetUrl={audioPlayer.src} suggestedFileName={audioPlayer.title} />
    </div>
  );
};

export type AudioProps = {
  attachment: Attachment;
};

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  durationSeconds: state.durationSeconds,
  isPlaying: state.isPlaying,
  progress: state.progressPercent,
  secondsElapsed: state.secondsElapsed,
});

/**
 * Audio attachment with play/pause button and progress bar
 */
export const Audio = (props: AudioProps) => {
  const { attachment } = props;
  const { asset_url, title } = attachment;
  const { duration, file_size, mime_type, waveform_data } =
    (attachment as VoiceRecordingAttachment).custom ?? {};

  /**
   * Introducing message context. This could be breaking change, therefore the fallback to {} is provided.
   * If this component is used outside the message context, then there will be no audio player namespacing
   * => scrolling away from the message in virtualized ML would create a new AudioPlayer instance.
   *
   * Edge case: the requester (message) has multiple attachments with the same assetURL - does not happen
   * with the default SDK components, but can be done with custom API calls.In this case all the Audio
   * widgets will share the state.
   */
  // also rendered from composer previews, where there is no message
  const { message } = useContext(MessageContext) ?? {};
  const threadInstance = useThreadContext();

  const audioPlayer = useAudioPlayer({
    durationSeconds: duration,
    fileSize: file_size,
    mimeType: mime_type,
    requester:
      message?.id &&
      `${threadInstance ? (message.parent_id ?? message.id) : ''}${message.id}`,
    // Falls back to the local blob preview while the upload is still in flight.
    src: getAttachmentPreviewUrl(attachment, asset_url),
    title,
    waveformData: waveform_data,
  });

  return audioPlayer ? (
    <AudioAttachmentUI attachment={attachment} audioPlayer={audioPlayer} />
  ) : null;
};
