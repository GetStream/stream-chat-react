import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import type { UserResponse } from 'stream-chat';

import { Icon } from '../Threads/icons';
import { getWholeChar } from '../../utils';

export type AvatarProps = {
  /** Custom root element class that will be merged with the default class */
  className?: string;
  /** Image URL or default is an image of the first initial of the name if there is one  */
  image?: string | null;
  /** Name of the image, used for title tag fallback */
  name?: string;
  /** click event handler attached to the component root element */
  onClick?: (event: React.BaseSyntheticEvent) => void;
  /** mouseOver event handler attached to the component root element */
  onMouseOver?: (event: React.BaseSyntheticEvent) => void;
  /** The entire user object for the chat user displayed in the component */
  user?: UserResponse;
};

/**
 * A round avatar image with fallback to username's first letter
 */
export const Avatar = (props: AvatarProps) => {
  const {
    className,
    image,
    name,
    onClick = () => undefined,
    onMouseOver = () => undefined,
  } = props;

  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [image]);

  const nameStr = name?.toString() || '';
  const initials = getWholeChar(nameStr, 0);
  const showImage = image && !error;

  return (
    <div
      className={clsx(`str-chat__avatar str-chat__message-sender-avatar`, className, {
        ['str-chat__avatar--multiple-letters']: initials.length > 1,
        ['str-chat__avatar--no-letters']: !initials.length,
        ['str-chat__avatar--one-letter']: initials.length === 1,
      })}
      data-testid='avatar'
      onClick={onClick}
      onMouseOver={onMouseOver}
      role='button'
      title={name}
    >
      {showImage ? (
        <img
          alt={initials}
          className='str-chat__avatar-image'
          data-testid='avatar-img'
          onError={() => setError(true)}
          src={image}
        />
      ) : (
        <>
          {!!initials.length && (
            <div
              className={clsx('str-chat__avatar-fallback')}
              data-testid='avatar-fallback'
            >
              {initials}
            </div>
          )}
          {!initials.length && <Icon.User />}
        </>
      )}
    </div>
  );
};
