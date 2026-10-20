import React, { useEffect, useMemo, useRef } from 'react';
import type { Action, Attachment } from 'stream-chat';

import { useTranslationContext } from '../../context';

import { useFocusReturn, useInteractionAnnouncements } from '../Accessibility';
import { getGiphyDescriptiveTitle } from './giphyAccessibility';
import type { ActionHandlerReturnType } from '../Message/hooks/useActionHandler';
import { Button } from '../Button';
import { VisuallyHidden } from '../VisuallyHidden';
import { useStableId } from '../UtilityComponents/useStableId';
import clsx from 'clsx';
import { asDynamicKey } from '../../i18n/utils';

export type AttachmentActionsProps = Attachment & {
  /** Actions to render as buttons. */
  actions: Action[];
  /** Prefix of each action button's React key (`${id}-${action.value}`). */
  id: string;
  /** Text rendered before the action buttons. */
  text: string;
  /** Called with the action's name and value and the click event. */
  actionHandler?: ActionHandlerReturnType;
  /** `value` of the action button to focus on initial render. */
  defaultFocusedActionValue?: string;
};

export type AttachmentActionsDefaultFocusByType = Partial<
  Record<NonNullable<Attachment['type']>, string>
>;

export const defaultAttachmentActionsDefaultFocus: AttachmentActionsDefaultFocusByType = {
  giphy: 'send',
};

const UnMemoizedAttachmentActions = (props: AttachmentActionsProps) => {
  const {
    actionHandler,
    actions,
    defaultFocusedActionValue,
    giphy,
    id,
    image_url: imageUrl,
    text,
    thumb_url: thumbUrl,
    title,
    type,
  } = props;
  const { t } = useTranslationContext();
  const { announceInteraction } = useInteractionAnnouncements();
  const { reserve: reserveFocusReturn, restore: restoreFocusReturn } = useFocusReturn();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const isGiphy = type === 'giphy';
  // The giphy preview auto-focuses its primary action, so its description is attached to that
  // control with `aria-describedby`: a live-region announcement would be preempted by the focus
  // change and never heard.
  const giphyDescriptionId = useStableId();

  // Human-readable, non-URL title of the giphy, usually absent. Included in the shuffle
  // announcement.
  const descriptiveTitle = isGiphy ? getGiphyDescriptiveTitle(title) : undefined;
  // Identifies the GIF: its URL changes on every shuffle. A giphy attachment usually has no
  // `image_url`, so `giphy.original.url` and `thumb_url` come first.
  const giphyImageIdentity = isGiphy
    ? (giphy?.original?.url ?? thumbUrl ?? imageUrl ?? null)
    : null;
  const previousGiphyImageRef = useRef<string | null>(null);
  const giphyImageInitializedRef = useRef(false);

  const handleActionClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    name?: string,
    value?: string,
  ) => {
    actionHandler?.(name, value, event);

    // Giphy send/cancel: restore focus first, then announce on the next frame. The screen reader
    // speaks the focus change immediately, and a live-region message in the same tick races with it
    // and can be dropped. The frame is not cancelled on unmount: the preview unmounts on send, but
    // the announcer lives at the Chat root.
    if (isGiphy && (value === 'send' || value === 'cancel')) {
      restoreFocusReturn();
      const interaction = value === 'send' ? 'giphy.sent' : 'giphy.canceled';
      requestAnimationFrame(() => announceInteraction(interaction));
    }
  };

  const knownActionText = useMemo<Record<string, string>>(
    () => ({
      Cancel: t('common.cancel.label', 'Cancel'),
      Send: t('common.send.label', 'Send'),
      Shuffle: t('attachment.actions.shuffle.label', 'Shuffle'),
    }),
    [t],
  );

  const focusIndex = useMemo(() => {
    if (!defaultFocusedActionValue) return null;
    const index = actions.findIndex(
      (action) => action.value === defaultFocusedActionValue,
    );
    return index >= 0 ? index : null;
  }, [actions, defaultFocusedActionValue]);

  useEffect(() => {
    if (focusIndex === null) return;
    const button = buttonRefs.current[focusIndex];
    if (button && document.activeElement !== button) {
      // Remember where focus is (e.g. the composer) before taking it, so a terminal action can
      // return it with `restoreFocusReturn()`.
      reserveFocusReturn();
      button.focus();
    }
  }, [focusIndex, reserveFocusReturn]);

  // Shuffle swaps the GIF in place and focus stays on the Shuffle button, so the change is
  // announced via the live region. The initial mount is skipped: the focused control's
  // description already conveys the preview.
  useEffect(() => {
    if (!isGiphy) return;
    if (!giphyImageInitializedRef.current) {
      giphyImageInitializedRef.current = true;
      previousGiphyImageRef.current = giphyImageIdentity;
      return;
    }
    if (giphyImageIdentity === previousGiphyImageRef.current) return;
    previousGiphyImageRef.current = giphyImageIdentity;
    // Giphy payloads rarely have a title, so this usually announces just "Giphy image changed".
    announceInteraction('giphy.shuffled', { title: descriptiveTitle });
  }, [announceInteraction, descriptiveTitle, giphyImageIdentity, isGiphy]);

  const groupProps = isGiphy
    ? {
        'aria-label': t('attachment.actions.giphyActions.ariaLabel', 'Giphy actions'),
        role: 'group' as const,
      }
    : {};

  return (
    <div className='str-chat__message-attachment-actions'>
      <div className='str-chat__message-attachment-actions-form' {...groupProps}>
        <span>{text}</span>
        {actions.map((action, index) => {
          const label = action.text
            ? (knownActionText[action.text] ?? t(asDynamicKey(action.text)))
            : null;

          return (
            <Button
              appearance='ghost'
              // Only the auto-focused action carries the preview description, so it is spoken with
              // the focus announcement.
              aria-describedby={
                isGiphy && action.value === defaultFocusedActionValue
                  ? giphyDescriptionId
                  : undefined
              }
              // Gives giphy buttons a self-contained accessible name so surrounding list or
              // group context does not swallow the action label.
              aria-label={isGiphy ? (label ?? undefined) : undefined}
              className={clsx(
                `str-chat__message-attachment-actions-button str-chat__message-attachment-actions-button--${action.style}`,
              )}
              data-testid={`${action.name}`}
              data-value={action.value}
              key={`${id}-${action.value}`}
              onClick={(event) => handleActionClick(event, action.name, action.value)}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              variant='secondary'
            >
              {label}
            </Button>
          );
        })}
        {isGiphy && (
          <VisuallyHidden id={giphyDescriptionId}>
            {t(
              'attachment.actions.giphyPreviewOnlyVisible.ariaLabel',
              'Giphy preview, only visible to you. Use the Send, Shuffle, or Cancel actions.',
            )}
          </VisuallyHidden>
        )}
      </div>
    </div>
  );
};

/** Renders the actions that can be taken on an attachment. */
export const AttachmentActions = React.memo(
  UnMemoizedAttachmentActions,
) as typeof UnMemoizedAttachmentActions;
