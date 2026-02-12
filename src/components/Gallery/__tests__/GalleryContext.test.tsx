import React from 'react';
import { renderHook } from '@testing-library/react';

import { GalleryContext, useGalleryContext } from '../GalleryContext';

import type { GalleryContextValue } from '../GalleryContext';

describe('useGalleryContext', () => {
  it('should warn and return empty object when used outside provider', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => null);

    const { result } = renderHook(() => useGalleryContext('TestComponent'));

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('useGalleryContext hook was called outside'),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('TestComponent'));
    expect(result.current).toEqual({});

    warnSpy.mockRestore();
  });

  it('should return context value when used inside provider', () => {
    const mockContextValue: GalleryContextValue = {
      currentIndex: 0,
      currentItem: {
        image_url: 'http://test.jpg',
        type: 'image',
      } as GalleryContextValue['currentItem'],
      goToIndex: jest.fn(),
      goToNext: jest.fn(),
      goToPrevious: jest.fn(),
      hasNext: true,
      hasPrevious: false,
      itemCount: 2,
      items: [] as GalleryContextValue['items'],
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GalleryContext.Provider value={mockContextValue}>
        {children}
      </GalleryContext.Provider>
    );

    const { result } = renderHook(() => useGalleryContext('TestComponent'), { wrapper });

    expect(result.current).toBe(mockContextValue);
  });
});
