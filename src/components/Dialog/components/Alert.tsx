import React, { type ComponentProps, type ComponentType, forwardRef } from 'react';
import clsx from 'clsx';
import { useModalContext } from '../../../context';
import { useAriaIdentifiers } from '../../../hooks/useAriaIdentifiers';

export const Root = forwardRef<HTMLDivElement, ComponentProps<'div'>>(function AlertRoot(
  { children, className, ...props }: ComponentProps<'div'>,
  ref,
) {
  return (
    <div {...props} className={clsx('str-chat__alert-root', className)} ref={ref}>
      {children}
    </div>
  );
});

export type AlertHeaderProps = ComponentProps<'div'> & {
  description?: string;
  descriptionId?: string;
  Icon?: ComponentType;
  title?: string;
  titleId?: string;
};

export const Header = forwardRef<HTMLDivElement, AlertHeaderProps>(function AlertHeader(
  { children, className, description, descriptionId, Icon, title, titleId, ...props },
  ref,
) {
  const { dialogId } = useModalContext();
  const { descriptionId: derivedDescriptionId, titleId: derivedTitleId } =
    useAriaIdentifiers(dialogId);
  const resolvedTitleId = titleId ?? derivedTitleId;
  const resolvedDescriptionId = descriptionId ?? derivedDescriptionId;

  return (
    <div {...props} className={clsx('str-chat__alert-header', className)} ref={ref}>
      {title ? (
        <>
          {Icon && <Icon />}
          <div className='str-chat__alert-header__copy'>
            <h2 className='str-chat__alert-header__title' id={resolvedTitleId}>
              {title}
            </h2>
            {description && (
              <p
                className='str-chat__alert-header__description'
                id={resolvedDescriptionId}
              >
                {description}
              </p>
            )}
          </div>
        </>
      ) : (
        children
      )}
    </div>
  );
});

const Actions = forwardRef<HTMLDivElement, ComponentProps<'div'>>(function AlertActions(
  { children, className, ...props },
  ref,
) {
  return (
    <div {...props} className={clsx('str-chat__alert-actions', className)} ref={ref}>
      {children}
    </div>
  );
});

export const Alert = {
  Actions,
  Header,
  Root,
};
