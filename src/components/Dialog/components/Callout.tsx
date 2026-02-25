import React, { type PropsWithChildren } from 'react';
import { DialogAnchor, type DialogAnchorProps } from '../service';
import { useDialogIsOpen } from '../hooks';
import { Button } from '../../Button';
import clsx from 'clsx';
import { IconCrossMedium } from '../../Icons';
import { useComponentContext } from '../../../context';

export type CalloutProps = PropsWithChildren<
  DialogAnchorProps & {
    onClose: () => void;
    className?: string;
  }
>;

/**
 * Callout is a general purpose component that displays content in dialog that has been previously opened by clicking on a reference element
 * and has to be dismissed to disappear.
 * Tooltip on the other side is a dialog that appears upon pointer device cursor hovering above a reference element.
 * @param children
 * @param className
 * @param dialogManagerId
 * @param dialogId
 * @param onClose
 * @param anchorProps
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

const DefaultCalloutDialog = ({ children, className, onClose }: CalloutDialogProps) => (
  <div className='str-chat__callout'>
    {children}
    <Button
      appearance='ghost'
      circular
      className={clsx(className, 'str-chat__callout__close-button')}
      onClick={onClose}
      size='sm'
      variant='secondary'
    >
      <IconCrossMedium />
    </Button>
  </div>
);
