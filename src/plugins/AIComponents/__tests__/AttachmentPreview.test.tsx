import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { AIMessageComposer } from '..';
import { Item } from '../AIMessageComposer/AttachmentPreview';

const itemClass = 'str-chat__ai-attachment-preview__item';
const textFile = (name = 'notes.txt', size = 2048) =>
  new File([new Uint8Array(size)], name, { type: 'text/plain' });

describe('AttachmentPreview.Item', () => {
  it.each([
    ['failed', '--failed'],
    ['pending', '--pending'],
    ['uploaded', '--uploaded'],
    ['uploading', '--uploading'],
  ])('applies the modifier class for state %s', (state, modifier) => {
    const { container } = render(<Item file={textFile()} state={state} />);
    expect(container.querySelector(`.${itemClass}`)).toHaveClass(
      `${itemClass}${modifier}`,
    );
  });

  it('applies no state modifier for an unknown state', () => {
    const { container } = render(<Item file={textFile()} state='finished' />);
    const classes = [...(container.querySelector(`.${itemClass}`)?.classList ?? [])];
    expect(classes.filter((name) => name.startsWith(`${itemClass}--`))).toEqual([]);
  });

  it('calls onDelete from the delete button', () => {
    const onDelete = vi.fn();
    render(<Item file={textFile()} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('Delete attachment'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows the retry button only when failed and calls onRetry', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <Item file={textFile()} onRetry={onRetry} state='pending' />,
    );
    expect(screen.queryByLabelText('aria/Retry upload')).toBeNull();

    rerender(<Item file={textFile()} onRetry={onRetry} state='failed' />);
    fireEvent.click(screen.getByLabelText('aria/Retry upload'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('falls back to "Unknown file name" and prefers the title over the file name', () => {
    const { rerender } = render(<Item file={textFile('')} />);
    expect(screen.getByText('Unknown file name')).toBeInTheDocument();

    rerender(<Item file={textFile('notes.txt')} title='My title' />);
    expect(screen.getByText('My title')).toBeInTheDocument();
    expect(screen.queryByText('notes.txt')).toBeNull();
  });

  it('renders a file card with a compact size for non-images', () => {
    const { container } = render(<Item file={textFile('notes.txt', 2048)} />);
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__ai-attachment-preview__file-size'),
    ).toHaveTextContent('2KB');
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders an image preview for image files', () => {
    const file = new File(['x'], 'pic.png', { type: 'image/png' });
    const { container } = render(<Item file={file} imagePreviewSource='blob:pic' />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'blob:pic');
    expect(img).toHaveAttribute('alt', 'pic.png');
    expect(
      container.querySelector('.str-chat__ai-attachment-preview__file-name'),
    ).toBeNull();
  });
});

describe('AIMessageComposer.AttachmentPreview', () => {
  it('lists selected files and removes one via the delete button', () => {
    const { container } = render(
      <AIMessageComposer>
        <AIMessageComposer.FileInput name='attachments' />
        <AIMessageComposer.AttachmentPreview>
          {({ attachments, removeAttachment }) =>
            attachments.map(({ file, id }) => (
              <Item file={file} key={id} onDelete={() => removeAttachment(id)} />
            ))
          }
        </AIMessageComposer.AttachmentPreview>
      </AIMessageComposer>,
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [textFile('a.txt'), textFile('b.txt')];
    fireEvent.change(input, { target: { files } });

    expect(screen.getByText('a.txt')).toBeInTheDocument();
    expect(screen.getByText('b.txt')).toBeInTheDocument();

    fireEvent.click(screen.getAllByLabelText('Delete attachment')[0] as HTMLElement);
    expect(screen.queryByText('a.txt')).toBeNull();
    expect(screen.getByText('b.txt')).toBeInTheDocument();
  });

  it('renders nothing without children while nothing is picked', () => {
    const { container } = render(<AIMessageComposer.AttachmentPreview />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the picked attachments, each removable, without children', () => {
    const createObjectURL = vi.fn(() => 'blob:preview');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const { container, unmount } = render(
      <AIMessageComposer>
        <AIMessageComposer.FileInput name='attachments' />
        <AIMessageComposer.AttachmentPreview className='custom' />
      </AIMessageComposer>,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const image = new File([new Uint8Array(4)], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [textFile('a.txt'), image] } });

    const preview = container.querySelector('.str-chat__ai-attachment-preview');
    expect(preview).toHaveClass('str-chat__ai-attachment-preview', 'custom');
    expect(screen.getByText('a.txt')).toBeInTheDocument();
    expect(screen.getByAltText('photo.png')).toHaveAttribute('src', 'blob:preview');
    expect(createObjectURL).toHaveBeenCalledWith(image);

    fireEvent.click(screen.getAllByLabelText('Delete attachment')[0] as HTMLElement);
    expect(screen.queryByText('a.txt')).toBeNull();
    // The photo that stays keeps its URL rather than getting a new one.
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });
});
