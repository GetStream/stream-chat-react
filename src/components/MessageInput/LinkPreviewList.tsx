import clsx from 'clsx';
import React from 'react';
import { useMessageInputContext } from '../../context';
import type { LinkPreview } from './types';
import { LinkPreviewState } from './types';

export const LinkPreviewList = () => {
  const { linkPreviews } = useMessageInputContext('AttachmentPreviewList');
  const showLinkPreviews = linkPreviews.size > 0;

  if (!showLinkPreviews) return null;

  return (
    <div className='str-chat__link-preview-list'>
      {Array.from(linkPreviews.values()).map((linkPreview) =>
        linkPreview.state === LinkPreviewState.LOADED ? (
          <LinkPreviewCard key={linkPreview.og_scrape_url} linkPreview={linkPreview} />
        ) : null,
      )}
    </div>
  );
};

type LinkPreviewProps = {
  linkPreview: LinkPreview;
};

const LinkPreviewCard = ({ linkPreview }: LinkPreviewProps) => {
  const { dismissLinkPreview } = useMessageInputContext();
  return (
    <div
      className={clsx('str-chat__link-preview-card', {
        'str-chat__link-preview-card--loading': linkPreview.state === LinkPreviewState.LOADING,
      })}
      data-testid='link-preview-card'
    >
      {linkPreview.og_scrape_url}
      <button
        data-testid='link-preview-card-dismiss-btn'
        onClick={() => dismissLinkPreview(linkPreview)}
      >
        X
      </button>
    </div>
  );
};
