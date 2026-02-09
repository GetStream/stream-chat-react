import React, {
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  useState,
} from 'react';
import { useComponentContext, useTranslationContext } from '../../../../context';
import {
  isImageAttachment,
  isVideoAttachment,
  type LocalUploadAttachment,
} from 'stream-chat';
import { GlobalModal } from '../../../Modal';
import { ModalGallery } from '../../../Gallery';
import { VideoPlayer } from '../../../VideoPlayer';

type AttachmentPreviewRootProps = Omit<ComponentProps<'div'>, 'onClick' | 'onKeyDown'> & {
  attachment: LocalUploadAttachment;
  /**
   * Returns boolean value to signal whether the event handling should be terminated immediately (return false)
   *  or default logic can be executed next (return true)
   */
  onPressed?: (e: MouseEvent<Element> | KeyboardEvent<Element>) => boolean;
};

const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, [role="button"], [role="link"], [data-interactive="true"]';

function hasInteractiveAncestorBeforeRoot(
  target: EventTarget | null,
  root: HTMLElement | null,
): boolean {
  if (!(target instanceof Element) || !root) return false;

  let el: Element | null = target;
  while (el && el !== root) {
    if (el.matches(INTERACTIVE_SELECTOR)) return true;
    el = el.parentElement;
  }
  return false;
}

// todo: use this component for all the attachment previews
export const AttachmentPreviewRoot = ({
  attachment,
  onPressed,
  tabIndex = 0,
  ...props
}: AttachmentPreviewRootProps) => {
  const { t } = useTranslationContext('FilePreview');
  const { Modal = GlobalModal } = useComponentContext();
  const [showPreview, setShowPreview] = useState(false);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const url =
    attachment.asset_url || attachment.image_url || attachment.localMetadata.previewUri;

  const canDownloadAttachment = false; //!!url;

  const canPreviewAttachment =
    (!!url && isImageAttachment(attachment)) || isVideoAttachment(attachment);

  const handlePressed = (e: MouseEvent<Element> | KeyboardEvent<Element>) => {
    if (e.defaultPrevented) return;

    if (hasInteractiveAncestorBeforeRoot(e.target as Element, root)) return;

    if (onPressed) {
      const shouldContinue = onPressed(e);
      if (!shouldContinue) return;
    }

    if (canPreviewAttachment) {
      setShowPreview(true);
      return;
    }

    if (canDownloadAttachment) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      aria-label={t(showPreview ? 'aria/Show preview' : 'aria/Download attachment')}
      {...props}
      onClick={handlePressed}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        handlePressed(e);
      }}
      ref={setRoot}
      role={showPreview ? 'button' : canDownloadAttachment ? 'link' : props.role}
      tabIndex={showPreview || canDownloadAttachment ? tabIndex : -1}
    >
      {props.children}
      <Modal
        className='str-chat__gallery-modal'
        onClose={(e) => {
          e.stopPropagation();
          setShowPreview(false);
        }}
        open={showPreview && canPreviewAttachment}
      >
        {isImageAttachment(attachment) ? (
          <ModalGallery images={[{ image_url: url }]} />
        ) : isVideoAttachment(attachment) && url ? (
          <VideoPlayer thumbnailUrl={attachment.thumb_url} url={url} />
        ) : null}
      </Modal>
    </div>
  );
};
