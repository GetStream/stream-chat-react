import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { LoadingErrorIndicator } from '../LoadingErrorIndicator';

import { Chat } from '../../Chat';

import { getTestClientWithUser } from '../../../mock-builders';

afterEach(cleanup); // eslint-disable-line

describe('LoadingErrorIndicator', () => {
  it('should return null if no error is provided', () => {
    const { container } = render(<LoadingErrorIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render when an error is passed', () => {
    const tree = renderer
      .create(<LoadingErrorIndicator error={{ message: 'this is an error' }} />)
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div>
        Error: {{ errorMessage }}
      </div>
    `);
  });
  it('should actually render the message with translation fn', async () => {
    const chatClient = await getTestClientWithUser({ id: 'test' });
    const { getByText } = render(
      <Chat client={chatClient}>
        <LoadingErrorIndicator error={{ message: 'test error message' }} />,
      </Chat>,
    );
    waitFor(() => {
      expect(getByText('test error message')).toBeInTheDocument();
    });
  });
});
