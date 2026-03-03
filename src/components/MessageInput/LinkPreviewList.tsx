import clsx from 'clsx';
import React, { useState } from 'react';
import type { LinkPreview, LinkPreviewsManagerState } from 'stream-chat';
import { LinkPreviewsManager } from 'stream-chat';
import { useStateStore } from '../../store';
import { PopperTooltip } from '../Tooltip';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';
import { useMessageComposer } from './hooks';
import { BaseImage } from '../Gallery';
import { RemoveAttachmentPreviewButton } from './RemoveAttachmentPreviewButton';
import { IconChainLink } from '../Icons';

export type LinkPreviewListProps = {
  displayLinkCount?: number;
};

const linkPreviewsManagerStateSelector = (state: LinkPreviewsManagerState) => ({
  linkPreviews: Array.from(state.previews.values()).filter(
    (preview) =>
      LinkPreviewsManager.previewIsLoaded(preview) ||
      LinkPreviewsManager.previewIsLoading(preview),
  ),
});

export const LinkPreviewList = ({ displayLinkCount = 1 }: LinkPreviewListProps) => {
  const messageComposer = useMessageComposer();
  const { linkPreviewsManager } = messageComposer;
  const { linkPreviews } = useStateStore(
    linkPreviewsManager.state,
    linkPreviewsManagerStateSelector,
  );

  if (linkPreviews.length === 0) return null;

  return (
    <div className='str-chat__link-preview-list'>
      {linkPreviews.slice(0, displayLinkCount).map((linkPreview) => (
        <LinkPreviewCard key={linkPreview.og_scrape_url} linkPreview={linkPreview} />
      ))}
    </div>
  );
};

type LinkPreviewProps = {
  linkPreview: LinkPreview;
};

export const LinkPreviewCard = ({ linkPreview }: LinkPreviewProps) => {
  const { linkPreviewsManager } = useMessageComposer();
  const { handleEnter, handleLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLDivElement>();
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const { image_url, thumb_url, title } = linkPreview;

  if (
    !LinkPreviewsManager.previewIsLoaded(linkPreview) &&
    !LinkPreviewsManager.previewIsLoading(linkPreview)
  )
    return null;

  return (
    <div
      className={clsx('str-chat__link-preview-card', {
        'str-chat__link-preview-card--loading':
          LinkPreviewsManager.previewIsLoading(linkPreview),
      })}
      data-testid='link-preview-card'
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      ref={setReferenceElement}
    >
      <PopperTooltip
        offset={[0, 5]}
        referenceElement={referenceElement}
        visible={tooltipVisible}
      >
        {linkPreview.og_scrape_url}
      </PopperTooltip>

      {(image_url || thumb_url) && (
        <BaseImage
          alt={title}
          className='str-chat__attachment-preview__thumbnail'
          src={thumb_url ?? image_url}
          title={title}
        />
      )}
      <div className='str-chat__link-preview-card__content'>
        <div className='str-chat__link-preview-card__content-title'>
          {linkPreview.title}
        </div>
        <div className='str-chat__link-preview-card__content-description'>
          {linkPreview.text}
        </div>
        <div className='str-chat__link-preview-card__content__url'>
          <IconChainLink />
          <span>{linkPreview.og_scrape_url}</span>
        </div>
      </div>

      <RemoveAttachmentPreviewButton
        className='str-chat__link-preview-card__dismiss-button'
        data-testid='link-preview-card-dismiss-btn'
        onClick={() => linkPreviewsManager.dismissPreview(linkPreview.og_scrape_url)}
      />
    </div>
  );
};
