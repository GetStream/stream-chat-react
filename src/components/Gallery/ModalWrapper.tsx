import React from 'react';
import ImageGallery, { ReactImageGalleryItem } from 'react-image-gallery';

import { Modal } from '../Modal';

export type ModalWrapperProps = {
  /** The images for the Carousel component */
  images: ReactImageGalleryItem[];
  /** Boolean for if modal is open*/
  modalIsOpen: boolean;
  /** click event handler for toggling modal */
  toggleModal: () => void | ((event?: React.BaseSyntheticEvent) => void);
  /** The index for the component */
  index?: number;
};

export const ModalComponent = (props: ModalWrapperProps) => {
  const { images, index, modalIsOpen, toggleModal } = props;

  return (
    <Modal onClose={toggleModal} open={modalIsOpen}>
      <ImageGallery
        items={images}
        showIndex={true}
        showPlayButton={false}
        showThumbnails={false}
        startIndex={index}
      />
    </Modal>
  );
};
