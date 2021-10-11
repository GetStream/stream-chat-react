import React, { PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
// import { Modal, ModalGateway } from 'react-images';

import { ModalWrapperProps } from 'stream-chat-react';
import { CloseXCircle } from '../../assets';

import './SocialGallery.scss';

/**
 * Small modal component
 */
// export type ModalWrapperProps = {
//   /** The images for the Carousel component */
//   images: ViewType[];
//   /** Boolean for if modal is open*/
//   modalIsOpen: boolean;
//   /** click event handler for toggling modal */
//   toggleModal: (event: React.SyntheticEvent<HTMLButtonElement>) => void;
//   /** The index for the component */
//   index?: number;
// };

type SocialModalProps = {
  modalIsOpen: boolean;
};

const SocialModal = (props: PropsWithChildren<SocialModalProps>) => {
  const { children, modalIsOpen } = props;
  if (!modalIsOpen) return null;

  return createPortal(
    <>
      <div className='gallery-overlay' />
      <div className='gallery-modal'>
        <div className='gallery-modal-header'>
          <span>Photos</span>
          <CloseXCircle />
        </div>
        <div className='gallery-modal-children'>
          {children}
        </div>
      </div>
    </>,
    document.getElementById('portal')!,
  );
};

export const SocialModalWrapper: React.FC<ModalWrapperProps> = (props) => {
  const { images, modalIsOpen, toggleModal } = props;

  return (
    //   <div className='social-model'>
    //     {modalIsOpen ? (
    //         <div onClick={() =>toggleModal}>
    //         {images.map((image: any, i: number) => (
    //             <img alt='social-demo' key={`${index}-${i}`} src={image.source} />
    //         ))}
    //         </div>
    //   ) : null}
    //   </div>
    // <div onClick={() => toggleModal}>
    <SocialModal modalIsOpen={modalIsOpen}>
      {images.map((image: any, i: number) => (
        <div className='gallery-modal-images' key={`modal-container-${i}`}>
          <img
            className='gallery-modal-images-image'
            alt='social-demo'
            key={i}
            src={image.source}
          />
        </div>
      ))}
    </SocialModal>
    // </div>
  );
};
