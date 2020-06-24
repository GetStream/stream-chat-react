import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import DateSeparator from '../DateSeparator';

afterEach(cleanup); // eslint-disable-line

// this changes every time tests are run,
// but by mocking the actual renderers tests are still deterministic
const now = new Date();

describe('DateSeparator', () => {
  it('should use formatDate if it is provided', () => {
    const { queryByText } = render(
      <DateSeparator formatDate={() => 'the date'} date={now} />,
    );

    expect(queryByText('the date')).toBeInTheDocument();
  });

  it.todo(
    "should use tDateTimeParser's calendar method to format dates if formatDate prop is not specified",
  );

  describe('Position prop', () => {
    const renderWithPosition = (position) => (
      <DateSeparator
        formatDate={() => 'the date'}
        date={now}
        position={position}
      />
    );

    const defaultPosition = renderer.create(renderWithPosition()).toJSON();

    it('should render correctly with position==="right", and it should match the default', () => {
      const tree = renderer.create(renderWithPosition('right')).toJSON();
      expect(tree).toMatchInlineSnapshot(`
        <div
          className="str-chat__date-separator"
        >
          <hr
            className="str-chat__date-separator-line"
          />
          <div
            className="str-chat__date-separator-date"
          >
            the date
          </div>
        </div>
      `);
      expect(defaultPosition).toStrictEqual(tree);
    });

    it('should render correctly with position==="left"', () => {
      const tree = renderer.create(renderWithPosition('left')).toJSON();
      expect(tree).toMatchInlineSnapshot(`
        <div
          className="str-chat__date-separator"
        >
          <div
            className="str-chat__date-separator-date"
          >
            the date
          </div>
          <hr
            className="str-chat__date-separator-line"
          />
        </div>
      `);
    });

    it('should render correctly with position==="center"', () => {
      const tree = renderer.create(renderWithPosition('center')).toJSON();
      expect(tree).toMatchInlineSnapshot(`
        <div
          className="str-chat__date-separator"
        >
          <hr
            className="str-chat__date-separator-line"
          />
          <div
            className="str-chat__date-separator-date"
          >
            the date
          </div>
          <hr
            className="str-chat__date-separator-line"
          />
        </div>
      `);
    });
  });
});
