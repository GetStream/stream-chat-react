import React, { useEffect, useState } from 'react';

export type AvatarProps = {
  /** Image URL or default is an image of the first initial of the name if there is one  */
  image?: string | null;
  /** Name of the image, used for title tag fallback */
  name?: string;
  /** click event handler */
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /** mouseOver event handler */
  onMouseOver?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /** Shape of the avatar - circle, rounded or square
   * @default circle
   */
  shape?: 'circle' | 'rounded' | 'square';
  /** Size in pixels
   * @default 32px
   */
  size?: number;
};

const noop = () => undefined;

/**
 * Avatar - A round avatar image with fallback to username's first letter.
 * @example ./Avatar.md
 */
export const Avatar: React.FC<AvatarProps> = (props) => {
  const {
    image,
    name,
    onClick = noop,
    onMouseOver = noop,
    shape = 'circle',
    size = 32,
  } = props;

  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [image]);

  const initials = (name || '').charAt(0);

  const clickableClass = onClick !== noop ? 'str-chat__avatar--clickable' : '';

  return (
    <div
      className={`str-chat__avatar str-chat__avatar--${shape} ${clickableClass}`}
      data-testid='avatar'
      onClick={onClick}
      onMouseOver={onMouseOver}
      style={{
        flexBasis: `${size}px`,
        fontSize: `${size / 2}px`,
        height: `${size}px`,
        lineHeight: `${size}px`,
        width: `${size}px`,
      }}
      title={name}
    >
      {image && !error ? (
        <img
          alt={initials}
          className={`str-chat__avatar-image${
            loaded ? ' str-chat__avatar-image--loaded' : ''
          }`}
          data-testid='avatar-img'
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
          src={image}
          style={{
            flexBasis: `${size}px`,
            height: `${size}px`,
            objectFit: 'cover',
            width: `${size}px`,
          }}
        />
      ) : (
        <div
          className='str-chat__avatar-fallback'
          data-testid='avatar-fallback'
        >
          {initials}
        </div>
      )}
    </div>
  );
};
