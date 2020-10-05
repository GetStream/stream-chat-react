import React from 'react';

const GroupAvatar = ({ images, size = 32 }) => {
  console.log(images);
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
            height: size / 2,
            flex: `1 0 ${size / 2}px`,
          }}
          src={img}
        />
      ))}
    </div>
  );
};

export default React.memo(GroupAvatar);
