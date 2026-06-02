import type { ComponentProps, ComponentType } from 'react';
import React, { useMemo } from 'react';
import clsx from 'clsx';
import { ListItemLayout, type ListItemLayoutBaseProps } from '../ListItemLayout';

export type ListItemButtonProps = Omit<ComponentProps<'button'>, 'children' | 'title'> &
  Omit<ListItemLayoutBaseProps, 'LeadingIcon' | 'textClassName' | 'TrailingIcon'> & {
    LeadingIcon?: ComponentType<ComponentProps<'svg'>>;
    TrailingIcon?: ComponentType<ComponentProps<'svg'>>;
  };

export const ListItemButton = ({
  'aria-current': ariaCurrent,
  'aria-label': ariaLabel,
  className,
  description,
  destructive,
  disabled,
  LeadingIcon,
  LeadingSlot,
  onClick,
  selected,
  subtitle,
  title,
  TrailingIcon,
  TrailingSlot,
  type,
}: ListItemButtonProps) => {
  const LayoutLeadingIcon = useMemo(() => {
    if (!LeadingIcon) return undefined;

    const Icon = LeadingIcon;

    function ListItemButtonLeadingIcon() {
      return <Icon className='str-chat__list-item-button__leading-icon' />;
    }

    return ListItemButtonLeadingIcon;
  }, [LeadingIcon]);
  const LayoutTrailingIcon = useMemo(() => {
    if (!TrailingIcon) return undefined;

    const Icon = TrailingIcon;

    function ListItemButtonTrailingIcon() {
      return <Icon className='str-chat__list-item-button__trailing-icon' />;
    }

    return ListItemButtonTrailingIcon;
  }, [TrailingIcon]);
  const rootProps = useMemo(
    () => ({
      'aria-current': ariaCurrent,
      'aria-label': ariaLabel,
      className: clsx('str-chat__list-item-button', className),
      disabled,
      onClick,
      type: type ?? 'button',
    }),
    [ariaCurrent, ariaLabel, className, disabled, onClick, type],
  );

  return (
    <ListItemLayout
      description={description}
      destructive={destructive}
      LeadingIcon={LayoutLeadingIcon}
      LeadingSlot={LeadingSlot}
      RootElement='button'
      rootProps={rootProps}
      selected={selected}
      subtitle={subtitle}
      title={title}
      TrailingIcon={LayoutTrailingIcon}
      TrailingSlot={TrailingSlot}
    />
  );
};
