import clsx from 'clsx';
import React, { useState } from 'react';
import { useMessageInputContext } from '../../context';
import type { LinkPreview } from './types';
import { LinkPreviewState } from './types';
import { CloseIcon, LinkIcon } from './icons';
import { PopperTooltip } from '../Tooltip';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';
import { useMessageComposer } from './hooks/messageComposer/useMessageComposer';
import { useStateStore } from '../../store';

import type { MessageComposerState } from 'stream-chat';

export type LinkPreviewListProps = {
  linkPreviews: LinkPreview[];
};

const messageComposerStateSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

export const LinkPreviewList = ({ linkPreviews }: LinkPreviewListProps) => {
  const messageComposer = useMessageComposer();
  const { quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateSelector,
  );
  const showLinkPreviews = linkPreviews.length > 0 && !quotedMessage;

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
  const { handleEnter, handleLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLDivElement>();
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  return (
    <div
      className={clsx('str-chat__link-preview-card', {
        'str-chat__link-preview-card--loading':
          linkPreview.state === LinkPreviewState.LOADING,
      })}
      data-testid='link-preview-card'
    >
      <PopperTooltip
        offset={[0, 5]}
        referenceElement={referenceElement}
        visible={tooltipVisible}
      >
        {linkPreview.og_scrape_url}
      </PopperTooltip>
      <div
        className='str-chat__link-preview-card__icon-container'
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        ref={setReferenceElement}
      >
        <LinkIcon />
      </div>
      <div className='str-chat__link-preview-card__content'>
        <div className='str-chat__link-preview-card__content-title'>
          {linkPreview.title}
        </div>
        <div className='str-chat__link-preview-card__content-description'>
          {linkPreview.text}
        </div>
      </div>
      <button
        className='str-chat__link-preview-card__dismiss-button'
        data-testid='link-preview-card-dismiss-btn'
        onClick={() => dismissLinkPreview(linkPreview)}
      >
        <CloseIcon />
      </button>
    </div>
  );
};
