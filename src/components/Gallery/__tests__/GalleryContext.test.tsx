import React from 'react';
import { renderHook } from '@testing-library/react';

import { GalleryContext, useGalleryContext } from '../GalleryContext';

import type { GalleryContextValue } from '../GalleryContext';

describe('useGalleryContext', () => {
  it('should throw when used outside provider', () => {
    expect(() => renderHook(() => useGalleryContext())).toThrow(
      /useGalleryContext was called outside of Gallery/,
    );
  });

  it('should return context value when used inside provider', () => {
    const mockContextValue: GalleryContextValue = {
      closeOnBackgroundClick: true,
      currentIndex: 0,
      currentItem: {
        image_url: 'http://test.jpg',
        type: 'image',
      } as GalleryContextValue['currentItem'],
      goToIndex: vi.fn(),
      goToNext: vi.fn(),
      goToPrevious: vi.fn(),
      hasNext: true,
      hasPrevious: false,
      itemCount: 2,
      items: [] as GalleryContextValue['items'],
      onRequestClose: vi.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GalleryContext.Provider value={mockContextValue}>
        {children}
      </GalleryContext.Provider>
    );

    const { result } = renderHook(() => useGalleryContext(), { wrapper });

    expect(result.current).toBe(mockContextValue);
  });
});
