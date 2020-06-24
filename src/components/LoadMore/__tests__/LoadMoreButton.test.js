/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';
import LoadMoreButton from '../LoadMoreButton';

describe('LoadMoreButton', () => {
  afterEach(cleanup);

  it('should render component with default props', () => {
    const tree = renderer
      .create(<LoadMoreButton refreshing={false} onClick={() => null} />)
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        className="str-chat__load-more-button"
      >
        <button
          className="str-chat__load-more-button__button"
          data-testid="load-more-button"
          disabled={false}
          onClick={[Function]}
        >
          Load more
        </button>
      </div>
    `);
  });

  it('should trigger onClick function when clicked', () => {
    const onClickMock = jest.fn();
    const { getByTestId } = render(
      <LoadMoreButton refreshing={false} onClick={onClickMock} />,
    );

    fireEvent.click(getByTestId('load-more-button'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should be disabled and show loading indicator when refreshing is true', () => {
    const onClickMock = jest.fn();
    const { getByTestId } = render(
      <LoadMoreButton refreshing={true} onClick={onClickMock} />,
    );
    fireEvent.click(getByTestId('load-more-button'));
    expect(onClickMock).not.toHaveBeenCalledTimes(1);
    const loadingIndicator = getByTestId('load-more-button').querySelector(
      '.rfu-loading-indicator__spinner',
    );
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('should display children', () => {
    const { getByText } = render(
      <LoadMoreButton refreshing={true} onClick={() => null}>
        Test Button
      </LoadMoreButton>,
    );
    waitFor(() => {
      expect(getByText('Test Button')).toBeInTheDocument();
    });
  });
});
