import React, { type PropsWithChildren } from 'react';
import { DialogAnchor, type DialogAnchorProps } from '../service';
import { useDialogIsOpen } from '../hooks';
import { Button } from '../../Button';
import clsx from 'clsx';
import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../../context';

export type CalloutProps = PropsWithChildren<
  DialogAnchorProps & {
    onClose: () => void;
    className?: string;
  }
>;

/**
 * A dialog anchored to a reference element that stays open until it is dismissed.
 * @param children - Content of the callout.
 * @param className - Class name passed to the `CalloutDialog`.
 * @param dialogManagerId - ID of the dialog manager holding the dialog.
 * @param dialogId - ID of the dialog.
 * @param onClose - Called by the close button of the default `CalloutDialog`.
 * @param anchorProps - Remaining `DialogAnchor` props.
 * @constructor
 */

export const Callout = ({
  children,
  className,
  dialogManagerId,
  id: dialogId,
  onClose,
  ...anchorProps
}: CalloutProps) => {
  const { CalloutDialog = DefaultCalloutDialog } = useComponentContext();

  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManagerId);
  return (
    <DialogAnchor {...anchorProps} dialogManagerId={dialogManagerId} id={dialogId}>
      {dialogIsOpen && (
        <CalloutDialog className={className} onClose={onClose}>
          {children}
        </CalloutDialog>
      )}
    </DialogAnchor>
  );
};

export type CalloutDialogProps = Pick<CalloutProps, 'children' | 'className' | 'onClose'>;

const DefaultCalloutDialog = ({ children, className, onClose }: CalloutDialogProps) => {
  const { IconXmark } = useComponentContextIcons();
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__callout'>
      {children}
      <Button
        appearance='ghost'
        aria-label={t(
          'dialog.callout.closeCalloutDialog.ariaLabel',
          'Close callout dialog',
        )}
        circular
        className={clsx(className, 'str-chat__callout__close-button')}
        onClick={onClose}
        size='sm'
        variant='secondary'
      >
        <IconXmark />
      </Button>
    </div>
  );
};
