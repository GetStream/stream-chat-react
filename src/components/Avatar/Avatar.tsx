import React, { useEffect, useState } from 'react';

enum AvatarShape {
  'circle',
  'rounded',
  'square',
}

export type AvatarProps = {
  /** Image URL for the avatar */
  image: string;
  /** Name of the image, used for title tag fallback */
  name?: string;
  /** Click event handler */
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /** mouseOver event handler */
  onMouseOver?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /** Shape of the avatar - circle, rounded or square, and the default is circle */
  shape?: AvatarShape;
  /** Size in pixels and the default is 32px */
  size?: number;
};

const Avatar: React.FC<AvatarProps> = (props) => {
  const {
    image,
    name,
    onClick,
    onMouseOver,
    shape = 'circle',
    size = 32,
  } = props;

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [image]);

  const initials: string = (name || '').charAt(0);

  return (
    <div
      className={`str-chat__avatar str-chat__avatar--${shape}`}
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

export default Avatar;
