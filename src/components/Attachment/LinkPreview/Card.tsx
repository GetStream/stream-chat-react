import React from 'react';
import { BaseImage } from '../../Gallery';
import { SafeAnchor } from '../../SafeAnchor';
import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { Attachment } from 'stream-chat';
import type { RenderAttachmentProps } from '../utils';
import type { Dimensions } from '../../../types/types';
import { IconChainLink } from '../../Icons';
import { UnableToRenderCard } from './UnableToRenderCard';
import clsx from 'clsx';

type CardRootProps = {
  cardUrl: string | undefined;
  children: React.ReactNode;
  type?: CardProps['type'];
};

const CardRoot = ({ cardUrl, children, type }: CardRootProps) => {
  const className = clsx(
    `str-chat__message-attachment-card str-chat__message-attachment-card--${type}`,
  );

  return cardUrl ? (
    <SafeAnchor
      className={className}
      href={cardUrl}
      rel='noopener noreferrer'
      target='_blank'
    >
      {children}
    </SafeAnchor>
  ) : (
    <div className={className}>{children}</div>
  );
};

type CardHeaderProps = Pick<CardProps, 'title' | 'type' | 'image_url' | 'thumb_url'> & {
  dimensions: Dimensions;
  image?: string;
};

const CardHeader = (props: CardHeaderProps) => {
  const { dimensions, image, image_url, thumb_url, title } = props;

  return image ? (
    <div
      className='str-chat__message-attachment-card--header str-chat__message-attachment-card-react--header'
      data-testid={'card-header'}
    >
      <BaseImage
        alt={title || image}
        data-testid='image-test'
        src={image_url ?? thumb_url}
        title={title || image}
        {...dimensions}
      />
    </div>
  ) : null;
};

type CardContentProps = RenderAttachmentProps['attachment'];

const CardContent = (props: CardContentProps) => {
  const { og_scrape_url, text, title, title_link } = props;
  const url = title_link || og_scrape_url;

  return (
    <div className='str-chat__message-attachment-card--content'>
      {title && <div className='str-chat__message-attachment-card--title'>{title}</div>}
      {text && <div className='str-chat__message-attachment-card--text'>{text}</div>}
      {url && (
        <div
          className='str-chat__message-attachment-card--source-link'
          data-testid='card-source-link'
        >
          <IconChainLink />
          <div className='str-chat__message-attachment-card--url'>{url}</div>
        </div>
      )}
    </div>
  );
};

export type CardProps = RenderAttachmentProps['attachment'] & {
  compact?: boolean;
};

const UnMemoizedCard = (props: CardProps) => {
  const { giphy, image_url, og_scrape_url, thumb_url, title, title_link, type } = props;
  const { giphyVersion: giphyVersionName } = useChannelStateContext('CardHeader');
  const cardUrl = title_link || og_scrape_url;

  let image = thumb_url || image_url;
  const dimensions: { height?: string; width?: string } = {};

  if (type === 'giphy' && typeof giphy !== 'undefined') {
    const giphyVersion =
      giphy[giphyVersionName as keyof NonNullable<Attachment['giphy']>];
    image = giphyVersion.url;
    dimensions.height = giphyVersion.height;
    dimensions.width = giphyVersion.width;
  }

  if (!title && !cardUrl && !image) {
    return <UnableToRenderCard />;
  }

  return (
    <CardRoot cardUrl={cardUrl} type={type}>
      <CardHeader {...props} dimensions={dimensions} image={image} />
      <CardContent {...props} />
    </CardRoot>
  );
};

/**
 * Simple Card Layout for displaying links
 */
export const Card = React.memo(UnMemoizedCard) as typeof UnMemoizedCard;
