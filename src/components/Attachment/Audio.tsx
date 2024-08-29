import React from 'react';

import type { Attachment } from 'stream-chat';

import { DownloadButton } from './components/DownloadButton';
import { FileSizeIndicator } from './components/FileSizeIndicator';
import { PlayButton } from './components/PlayButton';
import { ProgressBar } from './components/ProgressBar';
import { useAudioController } from './hooks/useAudioController';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type AudioProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  // fixme: rename og to attachment
  og: Attachment<StreamChatGenerics>;
};

const UnMemoizedAudio = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: AudioProps<StreamChatGenerics>,
) => {
  const {
    og: { asset_url, file_size, mime_type, title },
  } = props;
  const { audioRef, isPlaying, progress, seek, togglePlay } = useAudioController({
    mimeType: mime_type,
  });

  if (!asset_url) return null;

  const dataTestId = 'audio-widget';
  const rootClassName = 'str-chat__message-attachment-audio-widget';

  return (
    <div className={rootClassName} data-testid={dataTestId}>
      <audio ref={audioRef}>
        <source data-testid='audio-source' src={asset_url} type='audio/mp3' />
      </audio>
      <div className='str-chat__message-attachment-audio-widget--play-controls'>
        <PlayButton isPlaying={isPlaying} onClick={togglePlay} />
      </div>
      <div className='str-chat__message-attachment-audio-widget--text'>
        <div className='str-chat__message-attachment-audio-widget--text-first-row'>
          <div className='str-chat__message-attachment-audio-widget--title'>{title}</div>
          <DownloadButton assetUrl={asset_url} />
        </div>
        <div className='str-chat__message-attachment-audio-widget--text-second-row'>
          <FileSizeIndicator fileSize={file_size} />
          <ProgressBar onClick={seek} progress={progress} />
        </div>
      </div>
    </div>
  );
};

/**
 * Audio attachment with play/pause button and progress bar
 */
export const Audio = React.memo(UnMemoizedAudio) as typeof UnMemoizedAudio;
