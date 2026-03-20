import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';

import { Dropdown, useDropdownContext } from '../Dropdown';

const TestDropdownItem = () => {
  const { close } = useDropdownContext();

  return <button onClick={close}>Close dropdown</button>;
};

const TestDropdown = () => {
  const [referenceElement, setReferenceElement] = useState(null);

  return (
    <div>
      <button ref={setReferenceElement}>Reference</button>
      <div data-testid='outside'>Outside</div>
      <Dropdown referenceElement={referenceElement}>
        <TestDropdownItem />
      </Dropdown>
    </div>
  );
};

const TestDropdownWithReferenceComponent = () => (
  <div>
    <Dropdown TriggerComponent={TestTrigger} triggerProps={{ children: 'Reference' }}>
      <TestDropdownItem />
    </Dropdown>
  </div>
);

const TestTrigger = ({ children, onClick, referenceRef, ...props }) => (
  <button {...props} onClick={onClick} ref={referenceRef} type='button'>
    {children}
  </button>
);

describe('Dropdown', () => {
  it('closes when clicked inside', async () => {
    render(<TestDropdown />);

    expect(screen.getByText('Close dropdown')).toBeInTheDocument();

    await fireEvent.click(screen.getByText('Close dropdown'));

    expect(screen.queryByText('Close dropdown')).not.toBeInTheDocument();
  });

  it('closes when clicked outside', async () => {
    render(<TestDropdown />);

    expect(screen.getByText('Close dropdown')).toBeInTheDocument();

    await fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(screen.queryByText('Close dropdown')).not.toBeInTheDocument();
  });

  it('toggles when using a reference component', async () => {
    render(<TestDropdownWithReferenceComponent />);

    expect(screen.queryByText('Close dropdown')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByText('Reference'));

    expect(screen.getByText('Close dropdown')).toBeInTheDocument();

    await fireEvent.click(screen.getByText('Reference'));

    expect(screen.queryByText('Close dropdown')).not.toBeInTheDocument();
  });
});
