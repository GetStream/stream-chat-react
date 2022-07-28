import { useCallback, useLayoutEffect, useState } from 'react';

import { useDragScrolling } from './useDragScrolling';

import type { Attachment } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export type CarouselProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  images: Attachment<StreamChatGenerics>[];
  dragScrollEnabled?: boolean;
  startAt?: number;
};

export const useCarouselController = ({
  dragScrollEnabled = true,
  images,
  startAt = 0,
}: CarouselProps) => {
  const [displayedImageAtIndex, setDisplayedImageAtIndex] = useState(startAt);
  const [carouselElement, setCarouselElement] = useState<HTMLDivElement | null>(null);

  const carouselClassName = 'str-chat__image-carousel--track';
  const snapClassName = `${carouselClassName}-scroll-snap`;

  const makeItemID = (index: number) => `carousel-image-${index}`;

  const scrollTo = useCallback(
    (index: number, scrollBehavior: ScrollBehavior = 'auto') => {
      if (!carouselElement) return;
      const target = carouselElement.querySelector(`#${makeItemID(index)}`);
      if (target) {
        target.scrollIntoView({ behavior: scrollBehavior, inline: 'center' });
        setDisplayedImageAtIndex(index);
      }
    },
    [carouselElement, images],
  );

  const scrollInDirection = useCallback(
    (step: 1 | -1, roundRobinEnabled = true) => {
      const nextStep = displayedImageAtIndex + step;
      const isRoundRobinStep = nextStep === images.length || nextStep < 0;
      if (!roundRobinEnabled && isRoundRobinStep) return;

      const roundRobinIndex = (images.length + displayedImageAtIndex + step) % images.length;
      scrollTo(roundRobinIndex, 'smooth');
    },
    [displayedImageAtIndex, scrollTo],
  );

  const setApertureWidth = (aperture: HTMLElement, track: HTMLDivElement) => {
    const images = track.querySelectorAll(`.${carouselClassName} img`);
    let maxApertureWidth = 0;
    images.forEach((img) => {
      const { width } = img.getBoundingClientRect();
      if (maxApertureWidth < width) {
        maxApertureWidth = width;
      }
    });
    aperture.style.width = maxApertureWidth + 'px';
  };

  useLayoutEffect(() => {
    scrollTo(startAt);

    if (carouselElement && carouselElement.parentElement) {
      setApertureWidth(carouselElement.parentElement, carouselElement);
    }
  }, [carouselElement, scrollTo]);

  useDragScrolling({
    enabled: dragScrollEnabled,
    scrolledElement: carouselElement,
    scrollLeft: (roundRobinEnabled: boolean) => scrollInDirection(-1, roundRobinEnabled),
    scrollRight: (roundRobinEnabled: boolean) => scrollInDirection(1, roundRobinEnabled),
    snapClassName,
  });

  return {
    carouselClassName,
    carouselElement,
    makeItemID,
    scrollInDirection,
    setCarouselElement,
    snapClassName,
  };
};
