import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Gallery } from '../Gallery';
import { useGalleryContext } from '../GalleryContext';
import {
  generateImageAttachment,
  generateLocalImageUploadAttachmentData,
} from '../../../mock-builders';

const makeImageItem = (overrides) =>
  generateLocalImageUploadAttachmentData(undefined, generateImageAttachment(overrides));

const ContextReader = () => {
  const ctx = useGalleryContext('ContextReader');
  return (
    <div data-testid='context-reader'>
      <span data-testid='current-index'>{ctx.currentIndex}</span>
      <span data-testid='item-count'>{ctx.itemCount}</span>
      <span data-testid='has-next'>{String(ctx.hasNext)}</span>
      <span data-testid='has-previous'>{String(ctx.hasPrevious)}</span>
      <span data-testid='current-item-url'>{ctx.currentItem?.image_url ?? ''}</span>
      <button data-testid='go-next' onClick={ctx.goToNext} type='button'>
        Next
      </button>
      <button data-testid='go-previous' onClick={ctx.goToPrevious} type='button'>
        Previous
      </button>
      <button data-testid='go-to-2' onClick={() => ctx.goToIndex(2)} type='button'>
        Go to 2
      </button>
    </div>
  );
};

describe('Gallery', () => {
  it('should render without errors when given valid items', () => {
    const items = [makeImageItem(), makeImageItem()];
    const { container } = render(<Gallery GalleryUI={ContextReader} items={items} />);
    expect(container).toBeDefined();
    expect(screen.getByTestId('context-reader')).toBeInTheDocument();
  });

  it('should render null when no GalleryUI is provided', () => {
    const items = [makeImageItem()];
    const { container } = render(<Gallery items={items} />);
    expect(container.innerHTML).toBe('');
  });

  it('should set initialIndex correctly', () => {
    const items = [
      makeImageItem({ image_url: 'http://img0.jpg' }),
      makeImageItem({ image_url: 'http://img1.jpg' }),
      makeImageItem({ image_url: 'http://img2.jpg' }),
    ];

    render(<Gallery GalleryUI={ContextReader} initialIndex={1} items={items} />);

    expect(screen.getByTestId('current-index')).toHaveTextContent('1');
    expect(screen.getByTestId('current-item-url')).toHaveTextContent('http://img1.jpg');
  });

  it('should provide correct hasNext/hasPrevious at boundaries', () => {
    const items = [makeImageItem(), makeImageItem(), makeImageItem()];

    render(<Gallery GalleryUI={ContextReader} items={items} />);

    // At index 0: hasPrevious=false, hasNext=true
    expect(screen.getByTestId('has-previous')).toHaveTextContent('false');
    expect(screen.getByTestId('has-next')).toHaveTextContent('true');
  });

  it('should provide hasNext=false and hasPrevious=false for single item', () => {
    const items = [makeImageItem()];

    render(<Gallery GalleryUI={ContextReader} items={items} />);

    expect(screen.getByTestId('has-previous')).toHaveTextContent('false');
    expect(screen.getByTestId('has-next')).toHaveTextContent('false');
  });

  it('should navigate forward with goToNext', () => {
    const items = [
      makeImageItem({ image_url: 'http://img0.jpg' }),
      makeImageItem({ image_url: 'http://img1.jpg' }),
    ];

    render(<Gallery GalleryUI={ContextReader} items={items} />);

    act(() => {
      screen.getByTestId('go-next').click();
    });

    expect(screen.getByTestId('current-index')).toHaveTextContent('1');
    expect(screen.getByTestId('current-item-url')).toHaveTextContent('http://img1.jpg');
  });

  it('should navigate backward with goToPrevious', () => {
    const items = [
      makeImageItem({ image_url: 'http://img0.jpg' }),
      makeImageItem({ image_url: 'http://img1.jpg' }),
    ];

    render(<Gallery GalleryUI={ContextReader} initialIndex={1} items={items} />);

    act(() => {
      screen.getByTestId('go-previous').click();
    });

    expect(screen.getByTestId('current-index')).toHaveTextContent('0');
    expect(screen.getByTestId('current-item-url')).toHaveTextContent('http://img0.jpg');
  });

  it('should not navigate past last item', () => {
    const items = [makeImageItem(), makeImageItem()];

    render(<Gallery GalleryUI={ContextReader} initialIndex={1} items={items} />);

    act(() => {
      screen.getByTestId('go-next').click();
    });

    expect(screen.getByTestId('current-index')).toHaveTextContent('1');
  });

  it('should not navigate before first item', () => {
    const items = [makeImageItem(), makeImageItem()];

    render(<Gallery GalleryUI={ContextReader} items={items} />);

    act(() => {
      screen.getByTestId('go-previous').click();
    });

    expect(screen.getByTestId('current-index')).toHaveTextContent('0');
  });

  it('should navigate to specific index with goToIndex', () => {
    const items = [makeImageItem(), makeImageItem(), makeImageItem()];

    render(<Gallery GalleryUI={ContextReader} items={items} />);

    act(() => {
      screen.getByTestId('go-to-2').click();
    });

    expect(screen.getByTestId('current-index')).toHaveTextContent('2');
  });

  it('should call onIndexChange when index changes', () => {
    const onIndexChange = jest.fn();
    const items = [makeImageItem(), makeImageItem()];

    render(
      <Gallery GalleryUI={ContextReader} items={items} onIndexChange={onIndexChange} />,
    );

    // Called on mount with initial index
    expect(onIndexChange).toHaveBeenCalledWith(0);

    act(() => {
      screen.getByTestId('go-next').click();
    });

    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('should render custom GalleryUI component', () => {
    const CustomUI = () => <div data-testid='custom-ui'>Custom Gallery</div>;
    const items = [makeImageItem()];

    render(<Gallery GalleryUI={CustomUI} items={items} />);

    expect(screen.getByTestId('custom-ui')).toBeInTheDocument();
    expect(screen.getByText('Custom Gallery')).toBeInTheDocument();
  });

  it('should provide correct itemCount', () => {
    const items = [makeImageItem(), makeImageItem(), makeImageItem()];

    render(<Gallery GalleryUI={ContextReader} items={items} />);

    expect(screen.getByTestId('item-count')).toHaveTextContent('3');
  });
});
