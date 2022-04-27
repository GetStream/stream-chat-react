import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChatDown } from '../ChatDown';

describe('ChatDown', () => {
  afterEach(cleanup);
  it('should render component with its default props', () => {
    const tree = renderer.create(<ChatDown />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render component with custom text', async () => {
    const text = 'custom text';
    const { getByText } = render(<ChatDown text={text} />);

    await waitFor(() => {
      expect(getByText(text)).toBeInTheDocument();
    });
  });

  it('should render component with custom image url', async () => {
    const image = 'https://random.url/image.png';
    const Component = <ChatDown image={image} />;
    const { getByTestId } = render(Component);

    await waitFor(() => {
      expect(getByTestId('chatdown-img')).toHaveAttribute('src', image);
    });

    const tree = renderer.create(Component).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render custom image component', async () => {
    const ImageComponent = () => <div data-testid={'chatdown-img-custom'}>custom</div>;
    const Component = <ChatDown image={<ImageComponent />} />;
    const { getByTestId } = render(Component);

    await waitFor(() => {
      expect(getByTestId('chatdown-img-custom')).toBeInTheDocument();
    });

    const tree = renderer.create(Component).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render component with custom type', async () => {
    const type = 'Warning';
    const { getByText } = render(<ChatDown type={type} />);

    await waitFor(() => {
      expect(getByText(type)).toBeInTheDocument();
    });
  });
});
