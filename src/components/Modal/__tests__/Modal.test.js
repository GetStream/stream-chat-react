import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import Modal from '../Modal';

afterEach(cleanup); // eslint-disable-line

describe('Modal', () => {
  it('should be closed if the `open` prop is not explicitly set to true', () => {
    const { container } = render(<Modal />);

    expect(container.firstChild).toHaveClass('str-chat__modal--closed');
  });

  it('should be open if the `open` prop is set to true', () => {
    const { container } = render(<Modal open />);

    expect(container.firstChild).toHaveClass('str-chat__modal--open');
  });

  it('should render what is passed as props.children', () => {
    const textContent = 'some text';
    const { queryByText } = render(<Modal>{textContent}</Modal>);

    expect(queryByText(textContent)).toBeInTheDocument();
  });

  it('should call the onClose prop function if the escape key is pressed', () => {
    const onClose = jest.fn();
    render(<Modal open onClose={onClose} />);

    fireEvent(
      document,
      new KeyboardEvent('keyPress', {
        keyCode: 27,
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should clean up the escape keypress handler on unmount', () => {
    const onClose = jest.fn();
    const { unmount } = render(<Modal open onClose={onClose} />);

    unmount();
    fireEvent(
      document,
      new KeyboardEvent('keyPress', {
        keyCode: 27,
      }),
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  describe('clicking on the Modal', () => {
    const textContent = 'Some text';

    it('should not call onClose if the inside of the modal was clicked', () => {
      const onClose = jest.fn();
      const { queryByText } = render(
        <Modal open onClose={onClose}>
          {textContent}
        </Modal>,
      );
      const textContainer = queryByText(textContent);

      fireEvent.click(textContainer);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should call onClose if the outer part of the modal is clicked', () => {
      const onClose = jest.fn();
      const { container } = render(
        <Modal open onClose={onClose}>
          {textContent}
        </Modal>,
      );

      fireEvent.click(container.firstChild);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should render the expected html', () => {
    const tree = renderer.create(<Modal />).toJSON();
    expect(tree).toMatchInlineSnapshot();
  });
});
