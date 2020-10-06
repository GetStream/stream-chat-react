// @ts-check
import React from 'react';

/**
 * GroupAvatar - A variation of our Avatar that displays up to 4 images.
 *
 * @typedef {import('types').GroupAvatarProps} Props
 * @type { React.FC<Props>}
 */
const GroupAvatar = ({ size = 32, shape = 'circle', images }) => {
  return (
    <div
      className={`str-chat__group-avatar  str-chat__group-avatar--${shape}`}
      style={{ width: size, height: size }}
    >
      {images.slice(0, 4).map((img) => (
        <img
          className="str-chat__group-avatar__image"
          key={img}
          style={{
            width: size / 2,
            height: images.length === 2 ? size : size / 2,
            flex: `1 0 ${size / 2}px`,
          }}
          src={img}
        />
      ))}
    </div>
  );
};

export default React.memo(GroupAvatar);
