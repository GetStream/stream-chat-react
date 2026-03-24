import React, {
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  useState,
} from 'react';
import { useTranslationContext } from '../../../../context';
import {
  isImageAttachment,
  isVideoAttachment,
  type LocalUploadAttachment,
} from 'stream-chat';

type AttachmentPreviewRootProps = Omit<ComponentProps<'div'>, 'onClick' | 'onKeyDown'> & {
  attachment: LocalUploadAttachment;
  /**
   * Called when the attachment preview is pressed and can be previewed.
   * The parent is responsible for opening the gallery at the correct index.
   */
  openPreview?: () => void;
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
  openPreview,
  tabIndex = 0,
  ...props
}: AttachmentPreviewRootProps) => {
  const { t } = useTranslationContext();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const url =
    attachment.asset_url || attachment.image_url || attachment.localMetadata.previewUri;

  const canDownloadAttachment = false; //!!url;

  const canPreviewAttachment =
    !!openPreview &&
    ((!!url && isImageAttachment(attachment)) || isVideoAttachment(attachment));

  const handlePressed = (e: MouseEvent<Element> | KeyboardEvent<Element>) => {
    if (e.defaultPrevented) return;

    if (hasInteractiveAncestorBeforeRoot(e.target as Element, root)) return;

    if (onPressed) {
      const shouldContinue = onPressed(e);
      if (!shouldContinue) return;
    }

    if (canPreviewAttachment) {
      openPreview();
      return;
    }

    if (canDownloadAttachment) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const isInteractive = canPreviewAttachment || canDownloadAttachment;

  return (
    <div
      aria-label={
        isInteractive
          ? t(canPreviewAttachment ? 'aria/Show preview' : 'aria/Download attachment')
          : undefined
      }
      {...props}
      onClick={handlePressed}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              handlePressed(e);
            }
          : undefined
      }
      ref={setRoot}
      tabIndex={isInteractive ? tabIndex : -1}
    >
      {props.children}
    </div>
  );
};
