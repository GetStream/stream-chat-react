// @ts-check
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Avatar - A round avatar image with fallback to username's first letter
 *
 * @example ../../docs/Avatar.md
 * @typedef {import('types').AvatarProps} Props
 * @type { React.FC<Props>}
 */
const Avatar = ({
  size = 32,
  name,
  shape = 'circle',
  image,
  onClick = () => {},
  onMouseOver = () => {},
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [image]);

  const initials = (name || '').charAt(0);

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

Avatar.propTypes = {
  /** image url */
  image: PropTypes.string,
  /** name of the picture, used for title tag fallback */
  name: PropTypes.string,
  /** click event handler */
  onClick: PropTypes.func,
  /** mouseOver event handler */
  onMouseOver: PropTypes.func,
  /** shape of the avatar, circle, rounded or square */
  shape: PropTypes.oneOf(['circle', 'rounded', 'square']),
  /** size in pixels */
  size: PropTypes.number,
};

export default Avatar;
