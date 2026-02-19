import { type ComponentProps, type ComponentType, forwardRef } from 'react';
import clsx from 'clsx';

export const Root = forwardRef<HTMLDivElement, ComponentProps<'div'>>(function PromptRoot(
  { children, className, ...props }: ComponentProps<'div'>,
  ref,
) {
  return (
    <div {...props} className={clsx('str-chat__prompt-root', className)} ref={ref}>
      {children}
    </div>
  );
});

export type PromptHeaderProps = ComponentProps<'div'> & {
  title?: string;
  description?: string;
  Icon?: ComponentType;
};

export const Header = forwardRef<HTMLDivElement, PromptHeaderProps>(function PromptRoot(
  { children, className, description, Icon, title, ...props },
  ref,
) {
  return (
    <div {...props} className={clsx('str-chat__prompt-header', className)} ref={ref}>
      {title ? (
        <>
          {Icon && <Icon />}
          <div className='str-chat__prompt-header__copy'>
            <div className='str-chat__prompt-header__title'>{title}</div>
            {description && (
              <div className='str-chat__prompt-header__description'>{description}</div>
            )}
          </div>
        </>
      ) : (
        children
      )}
    </div>
  );
});

const Actions = forwardRef<HTMLDivElement, ComponentProps<'div'>>(function PromptRoot(
  { children, className, ...props },
  ref,
) {
  return (
    <div {...props} className={clsx('str-chat__prompt-actions', className)} ref={ref}>
      {children}
    </div>
  );
});

export const Prompt = {
  Actions,
  Header,
  Root,
};
