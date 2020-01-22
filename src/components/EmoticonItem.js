import React from 'react';

export const EmoticonItem = (props) => {
  const { native, name, char } = props.entity;

  return (
    <div className="str-chat__emoji-item">
      <span className="str-chat__emoji-item--entity">
        {native}
      </span>
      <span className="str-chat__emoji-item--name">
        {name}
      </span>
      <span className="str-chat__emoji-item--char">
        {char}
      </span>
    </div>
  )
}
