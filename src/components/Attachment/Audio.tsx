import React from 'react';
import type { Attachment } from 'stream-chat';

import {
  FileSizeIndicator as DefaultFileSizeIndicator,
  DownloadButton,
} from './components';
import type { AudioPlayerState } from '../AudioPlayback/AudioPlayer';
import { useAudioPlayer } from '../AudioPlayback/WithAudioPlayback';
import { useStateStore } from '../../store';
import { useComponentContext, useMessageContext } from '../../context';
import type { AudioPlayer } from '../AudioPlayback/AudioPlayer';
import { PlayButton } from '../Button/PlayButton';
import { FileIcon } from '../FileIcon';
import { DurationDisplay, ProgressBar } from '../AudioPlayback';

type AudioAttachmentUIProps = {
  audioPlayer: AudioPlayer;
};

// todo: finish creating a BaseAudioPlayer derived from VoiceRecordingPlayerUI and AudioAttachmentUI
const AudioAttachmentUI = ({ audioPlayer }: AudioAttachmentUIProps) => {
  const { FileSizeIndicator = DefaultFileSizeIndicator } = useComponentContext();
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
          {durationSeconds ? (
            <>
              <DurationDisplay
                duration={durationSeconds}
                isPlaying={!!isPlaying}
                secondsElapsed={secondsElapsed}
              />
              <ProgressBar progress={progress ?? 0} seek={audioPlayer.seek} />
            </>
          ) : (
            <>
              <FileSizeIndicator fileSize={audioPlayer.fileSize} />
              <ProgressBar progress={progress ?? 0} seek={audioPlayer.seek} />
            </>
          )}
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
  const {
    attachment: { asset_url, duration, file_size, mime_type, title },
  } = props;

  /**
   * Introducing message context. This could be breaking change, therefore the fallback to {} is provided.
   * If this component is used outside the message context, then there will be no audio player namespacing
   * => scrolling away from the message in virtualized ML would create a new AudioPlayer instance.
   *
   * Edge case: the requester (message) has multiple attachments with the same assetURL - does not happen
   * with the default SDK components, but can be done with custom API calls.In this case all the Audio
   * widgets will share the state.
   */
  const { message, threadList } = useMessageContext() ?? {};

  const audioPlayer = useAudioPlayer({
    durationSeconds: duration,
    fileSize: file_size,
    mimeType: mime_type,
    requester:
      message?.id &&
      `${threadList ? (message.parent_id ?? message.id) : ''}${message.id}`,
    src: asset_url,
    title,
    waveformData: props.attachment.waveform_data,
  });

  return audioPlayer ? <AudioAttachmentUI audioPlayer={audioPlayer} /> : null;
};
