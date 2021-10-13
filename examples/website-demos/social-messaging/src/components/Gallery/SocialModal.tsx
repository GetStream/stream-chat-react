import React, { PropsWithChildren } from 'react';

import { createPortal } from 'react-dom';
import { ModalWrapperProps } from 'stream-chat-react';

import { CloseXCircle } from '../../assets';

import './SocialGallery.scss';

type SocialModalProps = Partial<ModalWrapperProps> & {
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SocialModal = (props: PropsWithChildren<Partial<ModalWrapperProps>>) => {
  const { children, modalIsOpen } = props;
  if (!modalIsOpen) return null;

  return createPortal(
    <>
      <div className='gallery-overlay' />
      <div className='gallery-modal'>
        <div className='gallery-modal-children'>{children}</div>
      </div>
    </>,
    document.getElementById('portal')!,
  );
};

export const SocialModalWrapper = (props: PropsWithChildren<SocialModalProps>) => {
  const { images, modalIsOpen, setModalOpen } = props;

  return (
    <>
      {modalIsOpen ? (
        <SocialModal modalIsOpen={modalIsOpen}>
          <div className='gallery-modal-header'>
            <span>Photos</span>
            <CloseXCircle closeModal={setModalOpen} modalIsOpen={modalIsOpen} />
          </div>
          {images?.map((image: any, i: number) => (
            <div className='gallery-modal-image-wrapper' key={`modal-container-${i}`}>
              <img
                className='gallery-modal-image-wrapper-image'
                alt='social-demo-gallery-element'
                key={i}
                src={image.source}
              />
            </div>
          ))}
        </SocialModal>
      ) : null}
    </>
  );
};
