import clsx from 'clsx';
import type {
  ComponentProps,
  ComponentType,
  ElementType,
  HTMLAttributes,
  ReactNode,
} from 'react';
import React from 'react';

export type ListItemLayoutRootElement = Extract<
  keyof React.JSX.IntrinsicElements,
  keyof HTMLElementTagNameMap
>;

export type ListItemLayoutBaseProps = {
  ContentSlot?: ComponentType<ListItemLayoutContentProps>;
  contentClassName?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  destructive?: boolean;
  LeadingIcon?: ComponentType;
  LeadingSlot?: ComponentType;
  selected?: boolean;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  title: ReactNode;
  titleClassName?: string;
  TrailingIcon?: ComponentType;
  TrailingSlot?: ComponentType;
};

export type ListItemLayoutProps<RootElement extends ListItemLayoutRootElement = 'div'> =
  ListItemLayoutBaseProps & {
    RootElement?: RootElement;
    rootProps?: Omit<ComponentProps<RootElement>, 'children'>;
  };

export const ListItemLayout = <RootElement extends ListItemLayoutRootElement = 'div'>({
  ContentSlot = ListItemLayoutContent,
  contentClassName,
  description,
  descriptionClassName,
  destructive,
  LeadingIcon,
  LeadingSlot,
  RootElement,
  rootProps,
  selected,
  subtitle,
  subtitleClassName,
  title,
  titleClassName,
  TrailingIcon,
  TrailingSlot,
}: ListItemLayoutProps<RootElement>) => {
  // The inner container is the interactive element (button/anchor). The outer
  // wrapper is a plain spacing buffer so the container's focus ring (2px offset)
  // never overlaps adjacent items or gets clipped by an overflow ancestor.
  const ContainerComponent = (RootElement ?? 'div') as ElementType<
    HTMLAttributes<HTMLElement>
  >;
  const containerProps = {
    ...(ContainerComponent === 'button' ? { type: 'button' } : undefined),
    ...rootProps,
    className: clsx(
      'str-chat__list-item-layout__container',
      rootProps?.className,
      destructive && 'str-chat__list-item-layout__container--destructive',
      selected && 'str-chat__list-item-layout__container--selected',
    ),
  } as HTMLAttributes<HTMLElement>;

  return (
    <div className='str-chat__list-item-layout'>
      <ContainerComponent {...containerProps}>
        {LeadingIcon && (
          <div className='str-chat__list-item-layout__leading-icon'>
            <LeadingIcon />
          </div>
        )}
        {LeadingSlot && <LeadingSlot />}
        <ContentSlot
          className={contentClassName}
          description={description}
          descriptionClassName={descriptionClassName}
          subtitle={subtitle}
          subtitleClassName={subtitleClassName}
          title={title}
          titleClassName={titleClassName}
        />
        {TrailingIcon && (
          <div className='str-chat__list-item-layout__trailing-icon'>
            <TrailingIcon />
          </div>
        )}
        {TrailingSlot && <TrailingSlot />}
      </ContainerComponent>
    </div>
  );
};

export type ListItemLayoutContentProps = Omit<ComponentProps<'div'>, 'title'> & {
  description?: ReactNode;
  descriptionClassName?: string;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  title: ReactNode;
  titleClassName?: string;
};

export const ListItemLayoutContent = ({
  className,
  description,
  descriptionClassName,
  subtitle,
  subtitleClassName,
  title,
  titleClassName,
  ...props
}: ListItemLayoutContentProps) => (
  <div
    {...props}
    className={clsx('str-chat__list-item-layout__content', className, {
      'str-chat__list-item-layout__content--withDescription': description,
      'str-chat__list-item-layout__content--withSubtitle': subtitle,
      'str-chat__list-item-layout__content--withTitle': title,
    })}
  >
    {title && (
      <div className={clsx('str-chat__list-item-layout__title', titleClassName)}>
        {title}
      </div>
    )}
    {subtitle && (
      <div className={clsx('str-chat__list-item-layout__subtitle', subtitleClassName)}>
        {subtitle}
      </div>
    )}
    {description && (
      <div
        className={clsx('str-chat__list-item-layout__description', descriptionClassName)}
      >
        {description}
      </div>
    )}
  </div>
);
