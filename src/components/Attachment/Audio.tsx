import React from 'react';
import type { Attachment } from 'stream-chat';

import { DownloadButton, FileSizeIndicator, PlayButton, ProgressBar } from './components';
import { useAudioPlayer } from '../AudioPlayer/WithAudioPlayback';
import type { AudioPlayerState } from '../AudioPlayer/AudioPlayer';
import { useStateStore } from '../../store';
import { useMessageContext } from '../../context';

export type AudioProps = {
  // fixme: rename og to attachment
  og: Attachment;
};

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  isPlaying: state.isPlaying,
  progress: state.progressPercent,
});

const UnMemoizedAudio = (props: AudioProps) => {
  const {
    og: { asset_url, file_size, mime_type, title },
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
  const { message } = useMessageContext() ?? {};

  const audioPlayer = useAudioPlayer({
    mimeType: mime_type,
    requester: message?.id && `${message.parent_id}${message.id}`,
    src: asset_url,
  });

  const { isPlaying, progress } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  if (!audioPlayer) return null;

  const dataTestId = 'audio-widget';
  const rootClassName = 'str-chat__message-attachment-audio-widget';

  return (
    <div className={rootClassName} data-testid={dataTestId}>
      <div className='str-chat__message-attachment-audio-widget--play-controls'>
        <PlayButton isPlaying={!!isPlaying} onClick={audioPlayer.togglePlay} />
      </div>
      <div className='str-chat__message-attachment-audio-widget--text'>
        <div className='str-chat__message-attachment-audio-widget--text-first-row'>
          <div className='str-chat__message-attachment-audio-widget--title'>{title}</div>
          <DownloadButton assetUrl={asset_url} />
        </div>
        <div className='str-chat__message-attachment-audio-widget--text-second-row'>
          <FileSizeIndicator fileSize={file_size} />
          <ProgressBar onClick={audioPlayer.seek} progress={progress ?? 0} />
        </div>
      </div>
    </div>
  );
};

/**
 * Audio attachment with play/pause button and progress bar
 */
export const Audio = React.memo(UnMemoizedAudio) as typeof UnMemoizedAudio;
