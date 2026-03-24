import React from 'react';

import { cleanup, render } from '@testing-library/react';

import { CustomNotification } from '../CustomNotification';

afterEach(cleanup);

describe('CustomNotification', () => {
  it('should render nothing if active is false', () => {
    const { container } = render(
      <CustomNotification active={false} type={undefined as any}>
        test
      </CustomNotification>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render children when active', () => {
    const { container } = render(
      <CustomNotification active={true} type={undefined as any}>
        children
      </CustomNotification>,
    );
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          aria-live="polite"
          class="str-chat__custom-notification notification-undefined str-chat__notification str-chat-react__notification"
          data-testid="custom-notification"
        >
          children
        </div>
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

    expect(getByTestId('custom-notification')).toHaveClass(`notification-${type}`);
  });

  it('should add custom class to className', () => {
    const className = 'custom-classname-xxx';

    const { getByTestId } = render(
      <CustomNotification active={true} className={className} type={undefined as any}>
        x
      </CustomNotification>,
    );

    expect(getByTestId('custom-notification')).toHaveClass(className);
  });
});
