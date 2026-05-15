import clsx from 'clsx';
import React, { type ComponentProps, type ReactNode } from 'react';
import type { AvatarProps } from '../../Avatar';
import { Avatar } from '../../Avatar';

export type SuggestionItemWithAvatarProps = {
  avatarClassName?: string;
  avatarFallbackIcon?: AvatarProps['FallbackIcon'];
  avatarImageUrl?: string;
  avatarName?: string;
  contentClassName?: string;
  decorativeAvatar?: boolean;
  details?: ReactNode;
  detailsClassName?: string;
  focused?: boolean;
  title: string;
  titleClassName?: string;
  useSuggestionLayoutClasses?: boolean;
} & ComponentProps<'button'>;

export const SuggestionItemWithAvatar = ({
  avatarClassName,
  avatarFallbackIcon,
  avatarImageUrl,
  avatarName,
  children,
  className,
  contentClassName,
  decorativeAvatar = true,
  details,
  detailsClassName,
  focused,
  role = 'menuitem',
  title,
  titleClassName,
  useSuggestionLayoutClasses = true,
  ...buttonProps
}: SuggestionItemWithAvatarProps) => {
  void focused;

  return (
    <button
      {...buttonProps}
      className={clsx(
        'str-chat__context-menu__button',
        useSuggestionLayoutClasses && 'str-chat__suggestion-list__item-with-avatar',
        className,
      )}
      role={role}
      title={title}
      type='button'
    >
      <Avatar
        aria-hidden={decorativeAvatar || undefined}
        className={clsx(
          useSuggestionLayoutClasses && 'str-chat__suggestion-list__item-avatar',
          avatarClassName,
        )}
        FallbackIcon={avatarFallbackIcon}
        imageUrl={avatarImageUrl}
        role={decorativeAvatar ? undefined : 'button'}
        size='sm'
        userName={avatarName}
      />
      <div
        className={clsx(
          useSuggestionLayoutClasses && 'str-chat__suggestion-list__item-content',
          contentClassName,
        )}
      >
        <div
          className={clsx(
            useSuggestionLayoutClasses && 'str-chat__suggestion-list__item-title',
            titleClassName,
          )}
        >
          {children}
        </div>
        {details ? (
          <div
            className={clsx(
              useSuggestionLayoutClasses && 'str-chat__suggestion-list__item-details',
              detailsClassName,
            )}
          >
            {details}
          </div>
        ) : null}
      </div>
    </button>
  );
};
