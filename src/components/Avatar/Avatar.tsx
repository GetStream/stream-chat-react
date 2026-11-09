import clsx from 'clsx';
import React, {
  type ComponentPropsWithoutRef,
  type ComponentType,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useComponentContextIcons } from '../../context';

export type AvatarProps = {
  /** Rendered when there is no image and no initials. Defaults to the `IconUser` icon slot. */
  FallbackIcon?: ComponentType<ComponentPropsWithoutRef<'svg'>>;
  imageUrl?: string;
  /** Name of the user, used to generate the initials and as the `title` and image `alt`. */
  userName?: string;
  /**
   * Initials shown instead of the ones generated from `userName`.
   * @note Providing more than two characters will break the default UI.
   */
  initials?: string;
  /** Renders an online or offline status badge when set to a boolean. */
  isOnline?: boolean;
  size: '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs' | (string & {}) | null;
} & ComponentPropsWithoutRef<'div'>;

const getInitials = (name?: string) => {
  const regex = /(\p{L}{1})\p{L}+/gu;

  if (!name || name.trim().length === 0) {
    return '';
  }

  const initials = Array.from(name?.matchAll(regex) || []);

  if (!initials.length) {
    return '';
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const startInitial = initials.at(0)![1];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const endInitial = initials.length > 1 ? initials.at(-1)![1] : '';

  return `${startInitial}${endInitial}`;
};

/** Round avatar showing the image, falling back to initials and then `FallbackIcon`. */
export const Avatar = ({
  className,
  FallbackIcon,
  imageUrl,
  initials: customInitials,
  isOnline,
  size,
  userName,
  ...rest
}: AvatarProps) => {
  const { IconUser } = useComponentContextIcons();
  // The prop wins over the context slot: it targets one avatar, the slot rebrands all of them.
  const ResolvedFallbackIcon = FallbackIcon ?? IconUser;
  const [error, setError] = useState(false);

  useEffect(() => () => setError(false), [imageUrl]);

  const nameString = userName?.toString().trim() || '';

  const sizeAwareInitials = useMemo(() => {
    const initials = customInitials || getInitials(nameString);

    if (size === 'sm' || size === 'xs') {
      return initials.charAt(0);
    }

    return initials;
  }, [nameString, size, customInitials]);

  const showImage = typeof imageUrl === 'string' && imageUrl && !error;

  return (
    <div
      className={clsx(`str-chat__avatar`, className, {
        'str-chat__avatar--multiple-letters': sizeAwareInitials.length > 1,
        'str-chat__avatar--no-letters': !sizeAwareInitials.length,
        'str-chat__avatar--one-letter': sizeAwareInitials.length === 1,
        [`str-chat__avatar--size-${size}`]: typeof size === 'string',
      })}
      data-testid='avatar'
      role='button'
      title={userName}
      {...rest}
    >
      {typeof isOnline === 'boolean' && (
        <div
          className={clsx('str-chat__avatar-status-badge', {
            'str-chat__avatar-status-badge--offline': !isOnline,
            'str-chat__avatar-status-badge--online': isOnline,
          })}
        />
      )}
      {showImage ? (
        <img
          alt={nameString}
          className='str-chat__avatar-image'
          data-testid='avatar-img'
          onError={() => setError(true)}
          src={imageUrl}
        />
      ) : (
        <>
          {!!sizeAwareInitials.length && (
            <div className='str-chat__avatar-initials' data-testid='avatar-fallback'>
              {sizeAwareInitials}
            </div>
          )}
          {!sizeAwareInitials.length && <ResolvedFallbackIcon />}
        </>
      )}
    </div>
  );
};
