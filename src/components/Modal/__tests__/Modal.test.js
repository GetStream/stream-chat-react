import React from 'react';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
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

  describe('clicking on the Modal', () => {
    const onClose = jest.fn();
    const textContent = 'Some text';

    const { container, queryByText } = render(
      <Modal open onClose={onClose}>
        {textContent}
      </Modal>,
    );
    const textContainer = queryByText(textContent);

    it('should not call onClose if the inside of the modal was clicked', () => {
      fireEvent(textContainer, new MouseEvent('click'));
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should call onClose if the outer part of the modal is clicked', () => {
      fireEvent(container.firstChild, new MouseEvent('click'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  // it('should render component with its default props', () => {
  //   const tree = renderer.create(<ChatDown t={t} />).toJSON();
  //   expect(tree).toMatchSnapshot();
  // });

  // it('should render component with custom text', async () => {
  //   const text = 'custom text';
  //   const { getByText } = render(<ChatDown t={t} text={text} />);

  //   await waitFor(() => {
  //     expect(getByText(text)).toBeInTheDocument();
  //   });
  // });

  // it('should render component with custom image url', async () => {
  //   const image = 'https://random.url/image.png';
  //   const Component = <ChatDown t={t} image={image} />;
  //   const { getByTestId } = render(Component);

  //   await waitFor(() => {
  //     expect(getByTestId('chatdown-img')).toHaveAttribute('src', image);
  //   });

  //   const tree = renderer.create(Component).toJSON();
  //   expect(tree).toMatchSnapshot();
  // });

  // it('should render component with custom type', async () => {
  //   const type = 'Warning';
  //   const { getByText } = render(<ChatDown t={t} type={type} />);

  //   await waitFor(() => {
  //     expect(getByText(type)).toBeInTheDocument();
  //   });
  // });
});
