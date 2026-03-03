import { type ComponentProps, type ComponentType, forwardRef } from 'react';
import clsx from 'clsx';

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
  title?: string;
  description?: string;
  Icon?: ComponentType;
};

export const Header = forwardRef<HTMLDivElement, AlertHeaderProps>(function AlertHeader(
  { children, className, description, Icon, title, ...props },
  ref,
) {
  return (
    <div {...props} className={clsx('str-chat__alert-header', className)} ref={ref}>
      {title ? (
        <>
          {Icon && <Icon />}
          <div className='str-chat__alert-header__copy'>
            <div className='str-chat__alert-header__title'>{title}</div>
            {description && (
              <div className='str-chat__alert-header__description'>{description}</div>
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
