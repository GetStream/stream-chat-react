/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';

import Image from '../Image';

const mockImageAssets = 'https://placeimg.com/640/480/any';

afterEach(cleanup); // eslint-disable-line

describe('Image', () => {
  it('should render component with default props', () => {
    const tree = renderer.create(<Image images={mockImageAssets} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should open modal on image click', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => null);
    const { getByTestId, getByTitle } = render(
      <Image images={mockImageAssets} />,
    );
    fireEvent.click(getByTestId('image-test'));

    await waitFor(() => {
      expect(getByTitle('Close (esc)')).toBeInTheDocument();
    });
  });
});
