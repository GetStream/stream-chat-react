// @ts-check
import React, { useState, useEffect } from 'react';
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
      data-testid="avatar"
      className={`str-chat__avatar str-chat__avatar--${shape}`}
      title={name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        flexBasis: `${size}px`,
        lineHeight: `${size}px`,
        fontSize: `${size / 2}px`,
      }}
      onClick={onClick}
      onMouseOver={onMouseOver}
    >
      {image && !error ? (
        <img
          data-testid="avatar-img"
          src={image}
          alt={initials}
          className={`str-chat__avatar-image${
            loaded ? ' str-chat__avatar-image--loaded' : ''
          }`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            flexBasis: `${size}px`,
            objectFit: 'cover',
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      ) : (
        <div
          data-testid="avatar-fallback"
          className="str-chat__avatar-fallback"
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
  /** shape of the avatar, circle, rounded or square */
  shape: PropTypes.oneOf(['circle', 'rounded', 'square']),
  /** size in pixels */
  size: PropTypes.number,
  /** click event handler */
  onClick: PropTypes.func,
  /** mouseOver event handler */
  onMouseOver: PropTypes.func,
};

export default Avatar;
