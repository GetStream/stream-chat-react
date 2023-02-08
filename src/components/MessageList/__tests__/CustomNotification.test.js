/* eslint-disable jest-dom/prefer-to-have-class */
import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
// import '@testing-library/jest-dom';

import { CustomNotification } from '../CustomNotification';

afterEach(cleanup); // eslint-disable-line

describe('CustomNotification', () => {
  it('should render nothing if active is false', () => {
    const tree = renderer
      .create(<CustomNotification active={false}>test</CustomNotification>)
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`null`);
  });

  it('should render children when active', () => {
    const tree = renderer
      .create(<CustomNotification active={true}>children</CustomNotification>)
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <div
        aria-live="polite"
        className="str-chat__custom-notification notification-undefined str-chat__notification"
        data-testid="custom-notification"
      >
        children
      </div>
    `);
  });

  it('should append type prop to className', () => {
    const type = 'event_type';

    const { getByTestId } = render(
      <CustomNotification active={true} type={type}>
        x
      </CustomNotification>,
    );

    expect(getByTestId('custom-notification').className).toContain(`notification-${type}`);
  });

  it('should add custom class to className', () => {
    const className = 'custom-classname-xxx';

    const { getByTestId } = render(
      <CustomNotification active={true} className={className}>
        x
      </CustomNotification>,
    );

    expect(getByTestId('custom-notification').className).toContain(className);
  });
});
