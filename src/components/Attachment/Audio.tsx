import React from 'react';
import type { Attachment } from 'stream-chat';

import { DownloadButton, FileSizeIndicator, ProgressBar } from './components';
import { type AudioPlayerState, useAudioPlayer } from '../AudioPlayback';
import { useStateStore } from '../../store';
import { useMessageContext } from '../../context';
import type { AudioPlayer } from '../AudioPlayback/AudioPlayer';
import { PlayButton } from '../Button/PlayButton';

type AudioAttachmentUIProps = {
  audioPlayer: AudioPlayer;
};

// todo: finish creating a BaseAudioPlayer derived from VoiceRecordingPlayerUI and AudioAttachmentUI
const AudioAttachmentUI = ({ audioPlayer }: AudioAttachmentUIProps) => {
  const dataTestId = 'audio-widget';
  const rootClassName = 'str-chat__message-attachment-audio-widget';

  const { isPlaying, progress } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  return (
    <div className={rootClassName} data-testid={dataTestId}>
      <div className='str-chat__message-attachment-audio-widget--play-controls'>
        <PlayButton isPlaying={!!isPlaying} onClick={audioPlayer.togglePlay} />
      </div>
      <div className='str-chat__message-attachment-audio-widget--text'>
        <div className='str-chat__message-attachment-audio-widget--text-first-row'>
          <div className='str-chat__message-attachment-audio-widget--title'>
            {audioPlayer.title}
          </div>
          <DownloadButton assetUrl={audioPlayer.src} />
        </div>
        <div className='str-chat__message-attachment-audio-widget--text-second-row'>
          <FileSizeIndicator fileSize={audioPlayer.fileSize} />
          <ProgressBar onClick={audioPlayer.seek} progress={progress ?? 0} />
        </div>
      </div>
    </div>
  );
};

export type AudioProps = {
  attachment: Attachment;
};

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  isPlaying: state.isPlaying,
  progress: state.progressPercent,
});

const UnMemoizedAudio = (props: AudioProps) => {
  const {
    attachment: { asset_url, file_size, mime_type, title },
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

/**
 * Audio attachment with play/pause button and progress bar
 */
export const Audio = React.memo(UnMemoizedAudio) as typeof UnMemoizedAudio;
