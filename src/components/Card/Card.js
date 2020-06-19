// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import giphyLogo from '../../assets/Poweredby_100px-White_VertText.png';
import { TranslationContext } from '../../context';
import { SafeAnchor } from '../SafeAnchor';

/**
 * Card - Simple Card Layout
 *
 * @example ../../docs/Card.md
 * @typedef {import('types').CardProps} Props
 * @type React.FC<Props>
 */
const Card = ({
  title,
  title_link,
  og_scrape_url,
  image_url,
  thumb_url,
  text,
  type,
}) => {
  const { t } = useContext(TranslationContext);
  const image = thumb_url || image_url;

  /** @type {(url?: string) => string | null} Typescript syntax */
  const trimUrl = (url) => {
    if (url !== undefined && url !== null) {
      const [trimmedUrl] = url
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
        .split('/');

      return trimmedUrl;
    }
    return null;
  };

  if (!title && !title_link && !image) {
    return (
      <div
        className={`str-chat__message-attachment-card str-chat__message-attachment-card--${type}`}
      >
        <div className="str-chat__message-attachment-card--content">
          <div className="str-chat__message-attachment-card--text">
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
    <div
      className={`str-chat__message-attachment-card str-chat__message-attachment-card--${type}`}
    >
      {image && (
        <div className="str-chat__message-attachment-card--header">
          <img src={image} alt={image} />
        </div>
      )}
      <div className="str-chat__message-attachment-card--content">
        <div className="str-chat__message-attachment-card--flex">
          {title && (
            <div className="str-chat__message-attachment-card--title">
              {title}
            </div>
          )}
          {text && (
            <div className="str-chat__message-attachment-card--text">
              {text}
            </div>
          )}
          {(title_link || og_scrape_url) && (
            <SafeAnchor
              href={title_link || og_scrape_url}
              target="_blank"
              rel="noopener noreferrer"
              className="str-chat__message-attachment-card--url"
            >
              {trimUrl(title_link || og_scrape_url)}
            </SafeAnchor>
          )}
        </div>
        {type === 'giphy' && (
          <img
            className="str-chat__message-attachment-card__giphy-logo"
            data-testid="card-giphy"
            src={giphyLogo}
            alt="giphy logo"
          />
        )}
      </div>
    </div>
  );
};

Card.propTypes = {
  /** Title returned by the OG scraper */
  title: PropTypes.string,
  /** Link returned by the OG scraper */
  title_link: PropTypes.string,
  /** The scraped url, used as a fallback if the OG-data doesn't include a link */
  og_scrape_url: PropTypes.string,
  /** The url of the full sized image */
  image_url: PropTypes.string,
  /** The url for thumbnail sized image */
  thumb_url: PropTypes.string,
  /** Description returned by the OG scraper */
  text: PropTypes.string,
};

export default React.memo(Card);
