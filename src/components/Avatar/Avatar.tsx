import clsx from 'clsx';
import React, {
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type AvatarProps = {
  /** Image URL or default is an image of the first initial of the name if there is one  */
  imageUrl?: string | null;
  // /** Name of the image, used for title tag fallback */
  userName?: string;
  /** Online status indicator, not rendered if not of type boolean */
  isOnline?: boolean;

  size: 'xl' | 'lg' | 'md' | 'sm' | 'xs' | null;
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
      return getInitials(nameString).charAt(0);
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
            <div
              className={clsx('str-chat__avatar-initials')}
              data-testid='avatar-fallback'
            >
              {sizeAwareInitials}
            </div>
          )}
          {!sizeAwareInitials.length && (
            <svg
              className='str-chat__avatar-icon'
              fill='none'
              height='32'
              viewBox='0 0 32 32'
              width='32'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M21 8.66666C21 11.4281 18.7615 13.6667 16 13.6667C13.2386 13.6667 11 11.4281 11 8.66666C11 5.90523 13.2386 3.66666 16 3.66666C18.7615 3.66666 21 5.90523 21 8.66666Z'
                stroke='#142F63'
                strokeLinejoin='round'
                strokeWidth='2'
              />
              <path
                d='M16.0015 17.6667C11.48 17.6667 8.04948 20.3524 6.6448 24.1505C6.09973 25.6243 7.35925 27 8.93061 27H23.0724C24.6437 27 25.9032 25.6243 25.3581 24.1505C23.9535 20.3524 20.5231 17.6667 16.0015 17.6667Z'
                stroke='#142F63'
                strokeLinejoin='round'
                strokeWidth='2'
              />
            </svg>
          )}
        </>
      )}
    </div>
  );
};
