import React from 'react';
import { ArrowLeft, ArrowRight } from './icons';

import { CarouselProps, useCarouselController } from './hooks/useCarouselController';

export const Carousel = ({ images, startAt }: CarouselProps) => {
  const {
    carouselClassName,
    makeItemID,
    scrollInDirection,
    setCarouselElement,
    snapClassName,
  } = useCarouselController({
    images,
    startAt,
  });

  return (
    <div className='str-chat__image-carousel str-chat__image-carousel--scrollable'>
      <button className='str-chat__image-carousel-stepper' onClick={() => scrollInDirection(-1)}>
        <ArrowLeft />
      </button>
      <div className='str-chat__image-carousel--aperture'>
        <div className={`${carouselClassName} ${snapClassName}`} ref={setCarouselElement}>
          {images.map((image, i) => (
            <img
              alt='User uploaded content'
              className='str-chat__image-carousel-image'
              data-testid='carousel-image'
              id={makeItemID(i)}
              key={image.image_url || image.thumb_url}
              src={image.image_url || image.thumb_url}
            />
          ))}
        </div>
      </div>
      <button className='str-chat__image-carousel-stepper' onClick={() => scrollInDirection(1)}>
        <ArrowRight />
      </button>
    </div>
  );
};
