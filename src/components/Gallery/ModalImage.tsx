import React from 'react';

export type ModalImageProps = {
  /** The src attribute for the image element */
  data: { source: string };
};

export const ModalImage: React.FC<ModalImageProps> = (props) => {
  const { data } = props;
  return (
    <div className='str-chat__modal-image__wrapper' data-testid='modal-image'>
      <img className='str-chat__modal-image__image' src={data.source} />
    </div>
  );
};
