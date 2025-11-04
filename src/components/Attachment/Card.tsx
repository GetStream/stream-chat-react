import React from 'react';
import clsx from 'clsx';
import ReactPlayer from 'react-player';

import type { AudioProps } from './Audio';
import { ImageComponent } from '../Gallery';
import { SafeAnchor } from '../SafeAnchor';
import { PlayButton, ProgressBar } from './components';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { Attachment } from 'stream-chat';
import type { RenderAttachmentProps } from './utils';
import type { Dimensions } from '../../types/types';
import { useAudioPlayer } from '../AudioPlayer/WithAudioPlayback';
import { useStateStore } from '../../store';
import type { AudioPlayerState } from '../AudioPlayer/AudioPlayer';
import { useMessageContext } from '../../context';

const getHostFromURL = (url?: string | null) => {
  if (url !== undefined && url !== null) {
    const [trimmedUrl] = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/');

    return trimmedUrl;
  }
  return null;
};

const UnableToRenderCard = ({ type }: { type?: CardProps['type'] }) => {
  const { t } = useTranslationContext('Card');

  return (
    <div
      className={clsx('str-chat__message-attachment-card', {
        [`str-chat__message-attachment-card--${type}`]: type,
      })}
    >
      <div className='str-chat__message-attachment-card--content'>
        <div className='str-chat__message-attachment-card--text'>
          {t('this content could not be displayed')}
        </div>
      </div>
    </div>
  );
};

const SourceLink = ({
  author_name,
  url,
}: Pick<CardProps, 'author_name'> & { url: string }) => (
  <div
    className='str-chat__message-attachment-card--source-link'
    data-testid='card-source-link'
  >
    <SafeAnchor
      className='str-chat__message-attachment-card--url'
      href={url}
      rel='noopener noreferrer'
      target='_blank'
    >
      {author_name || getHostFromURL(url)}
    </SafeAnchor>
  </div>
);

type CardHeaderProps = Pick<
  CardProps,
  'asset_url' | 'title' | 'type' | 'image_url' | 'thumb_url'
> & {
  dimensions: Dimensions;
  image?: string;
};

const CardHeader = (props: CardHeaderProps) => {
  const { asset_url, dimensions, image, image_url, thumb_url, title, type } = props;

  let visual = null;
  if (asset_url && type === 'video') {
    visual = (
      <ReactPlayer
        className='react-player'
        controls
        height='100%'
        url={asset_url}
        width='100%'
      />
    );
  } else if (image) {
    visual = (
      <ImageComponent
        dimensions={dimensions}
        fallback={title || image}
        image_url={image_url}
        thumb_url={thumb_url}
      />
    );
  }

  return visual ? (
    <div
      className='str-chat__message-attachment-card--header str-chat__message-attachment-card-react--header'
      data-testid={'card-header'}
    >
      {visual}
    </div>
  ) : null;
};

type CardContentProps = RenderAttachmentProps['attachment'];

const CardContent = (props: CardContentProps) => {
  const { author_name, og_scrape_url, text, title, title_link, type } = props;
  const url = title_link || og_scrape_url;

  return (
    <div className='str-chat__message-attachment-card--content'>
      {type === 'audio' ? (
        <CardAudio og={props} />
      ) : (
        <div className='str-chat__message-attachment-card--flex'>
          {url && <SourceLink author_name={author_name} url={url} />}
          {title && (
            <div className='str-chat__message-attachment-card--title'>{title}</div>
          )}
          {text && <div className='str-chat__message-attachment-card--text'>{text}</div>}
        </div>
      )}
    </div>
  );
};

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  isPlaying: state.isPlaying,
  progress: state.progressPercent,
});

const AudioWidget = ({ mimeType, src }: { src: string; mimeType?: string }) => {
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
    mimeType,
    requester:
      message?.id &&
      `${threadList ? (message.parent_id ?? message.id) : ''}${message.id}`,
    src,
  });

  const { isPlaying, progress } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  if (!audioPlayer) return;

  return (
    <div className='str-chat__message-attachment-card-audio-widget--first-row'>
      <div className='str-chat__message-attachment-audio-widget--play-controls'>
        <PlayButton isPlaying={!!isPlaying} onClick={audioPlayer.togglePlay} />
      </div>
      <ProgressBar onClick={audioPlayer.seek} progress={progress ?? 0} />
    </div>
  );
};

export const CardAudio = ({
  og: { asset_url, author_name, mime_type, og_scrape_url, text, title, title_link },
}: AudioProps) => {
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

export type CardProps = RenderAttachmentProps['attachment'];

const UnMemoizedCard = (props: CardProps) => {
  const { asset_url, giphy, image_url, thumb_url, title, title_link, type } = props;
  const { giphyVersion: giphyVersionName } = useChannelStateContext('CardHeader');

  let image = thumb_url || image_url;
  const dimensions: { height?: string; width?: string } = {};

  if (type === 'giphy' && typeof giphy !== 'undefined') {
    const giphyVersion =
      giphy[giphyVersionName as keyof NonNullable<Attachment['giphy']>];
    image = giphyVersion.url;
    dimensions.height = giphyVersion.height;
    dimensions.width = giphyVersion.width;
  }

  if (!title && !title_link && !asset_url && !image) {
    return <UnableToRenderCard />;
  }

  return (
    <div
      className={`str-chat__message-attachment-card str-chat__message-attachment-card--${type}`}
    >
      <CardHeader {...props} dimensions={dimensions} image={image} />
      <CardContent {...props} />
    </div>
  );
};

/**
 * Simple Card Layout for displaying links
 */
export const Card = React.memo(UnMemoizedCard) as typeof UnMemoizedCard;
