import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';

import { GlobalModal } from '../GlobalModal';
import { ModalDialogManagerProvider } from '../../../context';

const renderComponent = ({ props } = {}) =>
  render(
    <ModalDialogManagerProvider>
      <GlobalModal {...props} />
    </ModalDialogManagerProvider>,
  );

describe('GlobalModal', () => {
  const textContent = 'some text';
  afterEach(cleanup);

  it('should be closed (null) if the `open` prop is set to false', () => {
    const { container } = renderComponent({ props: { open: false } });

    expect(container).toBeEmptyDOMElement();
  });

  it('should be open if the `open` prop is set to true', () => {
    const { container } = renderComponent({ props: { open: true } });
    const dialogOverlay = container.firstChild;

    expect(dialogOverlay.firstChild).toHaveClass('str-chat__modal--open');
  });

  it('should render what is passed as props.children when opened', () => {
    const { queryByText } = renderComponent({
      props: { children: textContent, open: true },
    });

    expect(queryByText(textContent)).toBeInTheDocument();
  });

  it('should call the onClose prop function if the escape key is pressed', () => {
    const onClose = jest.fn();
    renderComponent({
      props: { onClose, open: true },
    });

    fireEvent(
      document,
      new KeyboardEvent('keydown', {
        key: 'Escape',
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should remove the escape keydown event handler on unmount', () => {
    const onClose = jest.fn();
    const { unmount } = renderComponent({
      props: { onClose, open: true },
    });

    unmount();
    fireEvent(
      document,
      new KeyboardEvent('keydown', {
        key: 'Escape',
      }),
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not call onClose if the inside of the modal was clicked', () => {
    const onClose = jest.fn();
    renderComponent({
      props: { children: textContent, onClose, open: true },
    });
    const textContainer = screen.queryByText(textContent);

    fireEvent.click(textContainer);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onClose if the close button is clicked', () => {
    const onClose = jest.fn();
    renderComponent({
      props: { children: textContent, onClose, open: true },
    });
    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose if the modal overlay is clicked', () => {
    const onClose = jest.fn();
    const { container, debug } = renderComponent({
      props: { children: textContent, onClose, open: true },
    });
    console.log(debug(container));
    const dialogOverlay = container.querySelector('.str-chat__modal');

    fireEvent.click(dialogOverlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
