import { type AudioPlayerState, ProgressBar, useAudioPlayer } from '../../AudioPlayback';
import { MessageContext } from '../../../context';
import { useStateStore } from '../../../store';
import { PlayButton } from '../../Button';
import type { AudioProps } from '../Audio';
import React, { useContext } from 'react';
import { useComponentContextIcons } from '../../../context';
import { SafeAnchor } from '../../SafeAnchor';
import type { CardProps } from './Card';
import { useThreadContext } from '../../Threads';

const getHostFromURL = (url?: string | null) => {
  if (url !== undefined && url !== null) {
    const [trimmedUrl] = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/');

    return trimmedUrl;
  }
  return null;
};

const SourceLink = ({
  author_name,
  showUrl,
  url,
}: Pick<CardProps, 'author_name'> & { url: string; showUrl?: boolean }) => {
  const { IconLink } = useComponentContextIcons();

  return (
    <div
      className='str-chat__message-attachment-card--source-link'
      data-testid='card-source-link'
    >
      <IconLink />
      <SafeAnchor
        className='str-chat__message-attachment-card--url'
        href={url}
        rel='noopener noreferrer'
        target='_blank'
      >
        {showUrl ? url : author_name || getHostFromURL(url)}
      </SafeAnchor>
    </div>
  );
};

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  durationSeconds: state.durationSeconds,
  isPlaying: state.isPlaying,
  progress: state.progressPercent,
  secondsElapsed: state.secondsElapsed,
});

const AudioWidget = ({ mimeType, src }: { src: string; mimeType?: string }) => {
  // Players are namespaced by message (and thread) through `requester`. Outside a message, widgets
  // for the same URL share a player.
  const { message } = useContext(MessageContext) ?? {};
  const threadInstance = useThreadContext();

  const audioPlayer = useAudioPlayer({
    mimeType,
    requester:
      message?.id &&
      `${threadInstance ? (message.parent_id ?? message.id) : ''}${message.id}`,
    src,
  });

  const { durationSeconds, isPlaying, progress, secondsElapsed } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  if (!audioPlayer) return null;

  return (
    <div className='str-chat__message-attachment-card-audio-widget--first-row'>
      <div className='str-chat__message-attachment-audio-widget--play-controls'>
        <PlayButton isPlaying={!!isPlaying} onClick={audioPlayer.togglePlay} />
      </div>
      <ProgressBar
        durationSeconds={durationSeconds}
        progress={progress ?? 0}
        secondsElapsed={secondsElapsed}
        seek={audioPlayer.seek}
      />
    </div>
  );
};

export const CardAudio = ({
  attachment: { asset_url, author_name, custom, og_scrape_url, text, title, title_link },
}: AudioProps) => {
  const { mime_type } = custom;
  const url = title_link || og_scrape_url;
  const dataTestId = 'card-audio-widget';
  const rootClassName = 'str-chat__message-attachment-card-audio-widget';
  return (
    <div className={rootClassName} data-testid={dataTestId}>
      {asset_url && <AudioWidget mimeType={mime_type} src={asset_url} />}
      <div className='str-chat__message-attachment-audio-widget--second-row'>
        {url && <SourceLink author_name={author_name} url={url} />}
        {title && (
          <div className='str-chat__message-attachment-audio-widget--title'>{title}</div>
        )}
        {text && (
          <div className='str-chat__message-attachment-audio-widget--description'>
            {text}
          </div>
        )}
      </div>
    </div>
  );
};
