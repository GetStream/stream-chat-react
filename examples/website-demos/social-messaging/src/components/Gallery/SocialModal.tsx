import React from 'react';

import { createPortal } from 'react-dom';
import { ModalWrapperProps } from 'stream-chat-react';

import { CloseXCircle } from '../../assets';

import type { ViewType } from 'react-images';

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
      {images?.map((image: ViewType, i: number) => (
        <div className='gallery-modal-image-wrapper' key={`modal-image-container-${i}`}>
          <img
            className='gallery-modal-image-wrapper-image'
            alt='social-demo-gallery-element'
            key={i}
            src={image.source as string}
          />
        </div>
      ))}
    </SocialModal>
  );
};
