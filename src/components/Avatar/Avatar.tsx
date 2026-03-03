import clsx from 'clsx';
import React, {
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { IconPeople } from '../Icons';

export type AvatarProps = {
  /** URL of the avatar image */
  imageUrl?: string;
  /** Name of the user, used for title tag fallback */
  userName?: string;
  /** Online status indicator, not rendered if not of type boolean */
  isOnline?: boolean;

  size: '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs' | null;
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

/**
 * A round avatar image with fallback to username's first letter
 */
export const Avatar = ({
  className,
  imageUrl,
  isOnline,
  size,
  userName,
  ...rest
}: AvatarProps) => {
  const [error, setError] = useState(false);

  useEffect(() => () => setError(false), [imageUrl]);

  const nameString = userName?.toString() || '';

  const sizeAwareInitials = useMemo(() => {
    const initials = getInitials(nameString);

    if (size === 'sm' || size === 'xs') {
      return initials.charAt(0);
    }

    return initials;
  }, [nameString, size]);

  const showImage = typeof imageUrl === 'string' && !error;

  return (
    <div
      className={clsx(`str-chat__avatar`, className, {
        'str-chat__avatar--multiple-letters': sizeAwareInitials.length > 1,
        'str-chat__avatar--no-letters': !sizeAwareInitials.length,
        'str-chat__avatar--one-letter': sizeAwareInitials.length === 1,
        'str-chat__avatar--online': typeof isOnline === 'boolean' && isOnline,
        // eslint-disable-next-line sort-keys
        'str-chat__avatar--offline': typeof isOnline === 'boolean' && !isOnline,
        [`str-chat__avatar--size-${size}`]: typeof size === 'string',
      })}
      data-testid='avatar'
      role='button'
      title={userName}
      {...rest}
    >
      {showImage ? (
        <img
          alt={sizeAwareInitials}
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
          {!sizeAwareInitials.length && <IconPeople />}
        </>
      )}
    </div>
  );
};
