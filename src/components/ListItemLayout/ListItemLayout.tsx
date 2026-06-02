import clsx from 'clsx';
import type { ComponentProps, ComponentType, HTMLAttributes, ReactNode } from 'react';
import React from 'react';

export type ListItemLayoutRootElement = Extract<
  keyof React.JSX.IntrinsicElements,
  keyof HTMLElementTagNameMap
>;

export type ListItemLayoutBaseProps = {
  description?: ReactNode;
  destructive?: boolean;
  LeadingIcon?: ComponentType;
  LeadingSlot?: ComponentType;
  selected?: boolean;
  subtitle?: ReactNode;
  textClassName?: string;
  title: ReactNode;
  TrailingIcon?: ComponentType;
  TrailingSlot?: ComponentType;
};

export type ListItemLayoutProps<RootElement extends ListItemLayoutRootElement = 'div'> =
  ListItemLayoutBaseProps & {
    RootElement?: RootElement;
    rootProps?: Omit<ComponentProps<RootElement>, 'children'>;
  };

export const ListItemLayout = <RootElement extends ListItemLayoutRootElement = 'div'>({
  description,
  destructive,
  LeadingIcon,
  LeadingSlot,
  RootElement,
  rootProps,
  selected,
  subtitle,
  textClassName,
  title,
  TrailingIcon,
  TrailingSlot,
}: ListItemLayoutProps<RootElement>) => {
  const RootComponent = RootElement ?? 'div';
  const resolvedRootProps = {
    ...rootProps,
    className: clsx(
      'str-chat__list-item-layout',
      rootProps?.className,
      destructive && 'str-chat__list-item-layout--destructive',
      selected && 'str-chat__list-item-layout--selected',
    ),
  } as HTMLAttributes<HTMLElement>;

  // JSX cannot type-check a generic intrinsic element with generic root props here.
  // Call sites still get RootElement-specific rootProps; createElement keeps rendering simple internally.
  return React.createElement(
    RootComponent,
    resolvedRootProps,
    LeadingIcon && (
      <span className='str-chat__list-item-layout__leading-icon'>
        <LeadingIcon />
      </span>
    ),
    LeadingSlot && <LeadingSlot />,
    <ListItemLayoutText
      className={textClassName}
      description={description}
      subtitle={subtitle}
      title={title}
    />,
    TrailingIcon && (
      <span className='str-chat__list-item-layout__trailing-icon'>
        <TrailingIcon />
      </span>
    ),
    TrailingSlot && <TrailingSlot />,
  );
};

export type ListItemLayoutTextProps = Omit<ComponentProps<'div'>, 'title'> & {
  description?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
};

export const ListItemLayoutText = ({
  className,
  description,
  subtitle,
  title,
  ...props
}: ListItemLayoutTextProps) => (
  <div
    {...props}
    className={clsx('str-chat__list-item-layout__text', className, {
      'str-chat__list-item-layout__text--described': description,
      'str-chat__list-item-layout__text--subtitled': subtitle,
      'str-chat__list-item-layout__text--titled': title,
    })}
  >
    {title && <div className='str-chat__list-item-layout__title'>{title}</div>}
    {subtitle && <div className='str-chat__list-item-layout__subtitle'>{subtitle}</div>}
    {description && (
      <div className='str-chat__list-item-layout__description'>{description}</div>
    )}
  </div>
);
