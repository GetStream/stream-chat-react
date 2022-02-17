import React from 'react';

import { createPortal } from 'react-dom';
import { ModalWrapperProps } from 'stream-chat-react';

import { CloseXCircle } from '../../assets';

import './SocialGallery.scss';

type SocialModalProps = Partial<ModalWrapperProps> & {
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SocialModal: React.FC<SocialModalProps> = (props) => {
  const { children, setModalOpen } = props;

  return createPortal(
    <>
      <div className='gallery-overlay' />
      <div className='gallery-modal'>
        <div className='gallery-modal-header'>
          <span>Photos</span>
          <CloseXCircle closeModal={setModalOpen} />
        </div>
        <div className='gallery-modal-children'>{children}</div>
      </div>
    </>,
    document.getElementById('portal')!,
  );
};

export const SocialModalWrapper: React.FC<SocialModalProps> = (props) => {
  const { images, setModalOpen } = props;

  return (
    <SocialModal setModalOpen={setModalOpen}>
      {images?.map(({ original }, index) => (
        <div className='gallery-modal-image-wrapper' key={`modal-image-container-${index}`}>
          <img
            className='gallery-modal-image-wrapper-image'
            alt='social-demo-gallery-element'
            key={index}
            src={original}
          />
        </div>
      ))}
    </SocialModal>
  );
};
