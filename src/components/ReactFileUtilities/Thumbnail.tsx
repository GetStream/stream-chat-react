import React, { MouseEventHandler, useCallback } from 'react';

import { IconButton } from './IconButton';
import { FilePlaceholder } from './FilePlaceholder';
import { CloseIcon } from './CloseIcon';

export type ThumbnailProps = {
  image: string;
  alt?: string;
  handleClose?: MouseEventHandler<HTMLButtonElement>;
  id?: string;
  size?: number;
};

export const Thumbnail = ({ alt, handleClose, image, size = 100 }: ThumbnailProps) => {
  const onClose: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => handleClose?.(event),
    [handleClose],
  );

  return (
    <div className='rfu-thumbnail__wrapper' style={{ height: size, width: size }}>
      <div className='rfu-thumbnail__overlay'>
        {handleClose ? (
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </div>
      {image ? (
        <img alt={alt ?? ''} className='rfu-thumbnail__image' src={image} />
      ) : (
        <FilePlaceholder className='rfu-thumbnail__image' preserveAspectRatio='xMinYMin slice' />
      )}
    </div>
  );
};
