import React from 'react';

import { ImageUploadButton } from './ImageUploadButton';

export type ThumbnailPlaceholderProps = {
  handleFiles: (files: File[]) => void;
  multiple: boolean;
};

export const ThumbnailPlaceholder = ({
  handleFiles,
  multiple = false,
}: ThumbnailPlaceholderProps) => (
  <ImageUploadButton handleFiles={handleFiles} multiple={multiple}>
    <div className='rfu-thumbnail-placeholder'>
      <svg height='15' viewBox='0 0 14 15' width='14' xmlns='http://www.w3.org/2000/svg'>
        <path d='M14 8.998H8v6H6v-6H0v-2h6v-6h2v6h6z' fill='#A0B2B8' fillRule='nonzero' />
      </svg>
    </div>
  </ImageUploadButton>
);
