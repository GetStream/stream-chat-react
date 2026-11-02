import { useEffect, useId, useRef } from 'react';
import type { AttachmentActionsProps } from 'stream-chat-react';
import {
  AttachmentActions,
  useComponentContextIcons,
  useFocusReturn,
  useInteractionAnnouncements,
  useTranslationContext,
  VisuallyHidden,
} from 'stream-chat-react';
import './GiphyPreviewActions.css';

/** A Giphy title that is a media URL is no use to a screen reader, so it counts as no title. */
const readableTitle = (title?: string) =>
  title && !/^(https?:|\/\/)/i.test(title) ? title : undefined;

/**
 * The buttons under a Giphy preview: the search term, then Send, Shuffle and Cancel with icons.
 * Actions of other attachments keep the default UI.
 */
export const GiphyPreviewActions = (props: AttachmentActionsProps) => {
  const { IconRefresh, IconSend, IconXmark } = useComponentContextIcons();
  const { t } = useTranslationContext();
  const { announceInteraction } = useInteractionAnnouncements();
  const { reserve, restore } = useFocusReturn();
  const focusedButton = useRef<HTMLButtonElement>(null);
  const descriptionId = useId();
  const isGiphy = props.type === 'giphy';

  // The button `Attachment.attachmentActionsDefaultFocus` names (Send by default) takes the focus
  // when the preview appears; Send and Cancel give it back to where it was. A button that already
  // has the focus is left alone, so an effect that runs twice doesn't remember the button itself.
  useEffect(() => {
    if (!isGiphy) return;
    const button = focusedButton.current;
    if (button && document.activeElement !== button) {
      reserve();
      button.focus();
    }
  }, [isGiphy, reserve]);

  // Shuffle swaps the GIF in place while the focus stays on Shuffle, so the new GIF is announced.
  // Its URL tells one GIF from the next. The first GIF isn't announced: the focused button's
  // description already says what the preview is.
  const imageUrl = isGiphy
    ? (props.giphy?.original?.url ?? props.thumb_url ?? props.image_url)
    : undefined;
  const previousImageUrl = useRef(imageUrl);
  const title = readableTitle(props.title);
  useEffect(() => {
    if (!isGiphy || imageUrl === previousImageUrl.current) return;
    previousImageUrl.current = imageUrl;
    announceInteraction('giphy.shuffled', { title });
  }, [announceInteraction, imageUrl, isGiphy, title]);

  if (!isGiphy) return <AttachmentActions {...props} />;

  const { actionHandler, actions, defaultFocusedActionValue } = props;
  const icons: Record<string, typeof IconSend> = {
    cancel: IconXmark,
    send: IconSend,
    shuffle: IconRefresh,
  };
  // The same translation keys as the default AttachmentActions.
  const labels: Record<string, string> = {
    cancel: t('common.cancel.label', 'Cancel'),
    send: t('common.send.label', 'Send'),
    shuffle: t('attachment.actions.shuffle.label', 'Shuffle'),
  };

  return (
    <div
      aria-label={t('attachment.actions.giphyActions.ariaLabel', 'Giphy actions')}
      className='cookbook-giphy-actions'
      role='group'
    >
      {props.title && (
        <span className='cookbook-giphy-actions__query'>/giphy {props.title}</span>
      )}
      <div className='cookbook-giphy-actions__buttons'>
        {actions.map((action) => {
          const Icon = action.value ? icons[action.value] : undefined;
          const isFocused = action.value === defaultFocusedActionValue;
          return (
            <button
              // The focused button carries the preview's description, so it's read with the focus.
              aria-describedby={isFocused ? descriptionId : undefined}
              className={`cookbook-giphy-actions__button cookbook-giphy-actions__button--${action.value}`}
              key={action.value}
              onClick={(event) => {
                void actionHandler?.(action.name, action.value, event);
                if (action.value !== 'send' && action.value !== 'cancel') return;
                // The focus goes back first and the announcement follows a frame later, so the
                // screen reader doesn't drop it for the focus change.
                restore();
                const interaction =
                  action.value === 'send' ? 'giphy.sent' : 'giphy.canceled';
                requestAnimationFrame(() => announceInteraction(interaction));
              }}
              ref={isFocused ? focusedButton : undefined}
              type='button'
            >
              {Icon && <Icon />}
              {(action.value && labels[action.value]) ?? action.text}
            </button>
          );
        })}
      </div>
      <VisuallyHidden id={descriptionId}>
        {t(
          'attachment.actions.giphyPreviewOnlyVisible.ariaLabel',
          'Giphy preview, only visible to you. Use the Send, Shuffle, or Cancel actions.',
        )}
      </VisuallyHidden>
    </div>
  );
};
