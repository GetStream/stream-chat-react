import React from 'react';

import { SafeAnchor } from '../SafeAnchor';

import giphyLogo from '../../assets/Poweredby_100px-White_VertText.png';
import { useTranslationContext } from '../../context/TranslationContext';

export type CardProps = {
  /** The url of the full sized image */
  image_url?: string;
  /** The scraped url, used as a fallback if the OG-data doesn't include a link */
  og_scrape_url?: string;
  /** Description returned by the OG scraper */
  text?: string;
  /** The url for thumbnail sized image */
  thumb_url?: string;
  /** Title returned by the OG scraper */
  title?: string;
  /** Link returned by the OG scraper */
  title_link?: string;
  /** The card type used in the className attribute */
  type?: string;
};

const UnMemoizedCard: React.FC<CardProps> = (props) => {
  const { image_url, og_scrape_url, text, thumb_url, title, title_link, type } = props;

  const { t } = useTranslationContext('Card');

  const image = thumb_url || image_url;

  const trimUrl = (url?: string | null) => {
    if (url !== undefined && url !== null) {
      const [trimmedUrl] = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/');

      return trimmedUrl;
    }
    return null;
  };

  if (!title && !title_link && !image) {
    return (
      <div
        className={`str-chat__message-attachment-card str-chat__message-attachment-card--${type}`}
      >
        <div className='str-chat__message-attachment-card--content'>
          <div className='str-chat__message-attachment-card--text'>
            {t('this content could not be displayed')}
          </div>
        </div>
      </div>
    );
  }

  if (!title_link && !og_scrape_url) {
    return null;
  }

  return (
    <div className={`str-chat__message-attachment-card str-chat__message-attachment-card--${type}`}>
      {image && (
        <div className='str-chat__message-attachment-card--header'>
          <img alt={image} src={image} />
        </div>
      )}
      <div className='str-chat__message-attachment-card--content'>
        <div className='str-chat__message-attachment-card--flex'>
          {title && <div className='str-chat__message-attachment-card--title'>{title}</div>}
          {text && <div className='str-chat__message-attachment-card--text'>{text}</div>}
          {(title_link || og_scrape_url) && (
            <SafeAnchor
              className='str-chat__message-attachment-card--url'
              href={title_link || og_scrape_url}
              rel='noopener noreferrer'
              target='_blank'
            >
              {trimUrl(title_link || og_scrape_url)}
            </SafeAnchor>
          )}
        </div>
        {type === 'giphy' && (
          <img
            alt='giphy logo'
            className='str-chat__message-attachment-card__giphy-logo'
            data-testid='card-giphy'
            src={giphyLogo}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Simple Card Layout for displaying links
 */
export const Card = React.memo(UnMemoizedCard) as typeof UnMemoizedCard;
