import React, { PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
// import { Modal, ModalGateway } from 'react-images';

import { ModalWrapperProps } from 'stream-chat-react';

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

const MODAL_STYLES: { [key: string]: string | number } = {
  position: 'fixed',
  top: '95%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  height: '75%',
  backgroundColor: 'red',
  padding: '50px',
  zIndex: 1001,
};

const OVERLAY_STYLES: { [key: string]: string | number } = {
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  background: 'rgba(0,0,0, 7)',
  zIndex: 1000,
};

const SocialModal = (props: PropsWithChildren<SocialModalProps>) => {
  const { children, modalIsOpen } = props;
  if (!modalIsOpen) return null;

  return createPortal(
    <>
      <div style={OVERLAY_STYLES} />
      <div style={MODAL_STYLES}>{children}</div>
    </>,
    document.getElementById('portal')!,
  );
};

export const SocialModalComponent: React.FC<ModalWrapperProps> = (props) => {
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
    <div onClick={() => toggleModal}>
      <SocialModal modalIsOpen={modalIsOpen}>
        {images.map((image: any, i: number) => (
          <img alt='social-demo' key={i} src={image.source} />
        ))}
      </SocialModal>
    </div>
  );
};
