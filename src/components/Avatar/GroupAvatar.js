// @ts-check
import React from 'react';

/**
 * Avatar - A round avatar image with fallback to username's first letter
 *
 * @example ../../docs/Avatar.md
 * @typedef {import('types').GroupAvatarProps} Props
 * @type { React.FC<Props>}
 */
const GroupAvatar = ({ images, size = 32 }) => {
  return (
    <div
      className="str-chat__group-avatar"
      style={{ width: size, height: size, borderRadius: size }}
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
