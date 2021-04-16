import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import { Modal } from '../Modal';

describe('Modal', () => {
  afterEach(cleanup); // eslint-disable-line

  it('should be closed if the `open` prop is set to false', () => {
    const { container } = render(<Modal onClose={() => {}} open={false} />);

    expect(container.firstChild).toHaveClass('str-chat__modal--closed');
  });

  it('should be open if the `open` prop is set to true', () => {
    const { container } = render(<Modal onClose={() => {}} open />);

    expect(container.firstChild).toHaveClass('str-chat__modal--open');
  });

  it('should render what is passed as props.children', () => {
    const textContent = 'some text';
    const { queryByText } = render(
      <Modal onClose={() => {}} open={false}>
        {textContent}
      </Modal>,
    );

    expect(queryByText(textContent)).toBeInTheDocument();
  });

  it('should call the onClose prop function if the escape key is pressed', () => {
    const onClose = jest.fn();
    render(<Modal onClose={onClose} open />);

    fireEvent(
      document,
      new KeyboardEvent('keypress', {
        key: 'Escape',
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should clean up the escape keypress handler on unmount', () => {
    const onClose = jest.fn();
    const { unmount } = render(<Modal onClose={onClose} open />);

    unmount();
    fireEvent(
      document,
      new KeyboardEvent('keypress', {
        key: 'Escape',
      }),
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  describe('clicking on the Modal', () => {
    const textContent = 'Some text';

    it('should not call onClose if the inside of the modal was clicked', () => {
      const onClose = jest.fn();
      const { queryByText } = render(
        <Modal onClose={onClose} open>
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
        <Modal onClose={onClose} open>
          {textContent}
        </Modal>,
      );

      fireEvent.click(container.firstChild);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should render the expected html', () => {
    const tree = renderer.create(<Modal onClose={() => {}} open={false} />).toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__modal str-chat__modal--closed"
        onClick={[Function]}
      >
        <div
          className="str-chat__modal__close-button"
        >
          Close
          <svg
            height="10"
            width="10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z"
              fillRule="evenodd"
            />
          </svg>
        </div>
        <div
          className="str-chat__modal__inner"
        />
      </div>
    `);
  });
});
