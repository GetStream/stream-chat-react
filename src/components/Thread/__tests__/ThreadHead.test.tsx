import React from 'react';
import { render, screen } from '@testing-library/react';

import { WithComponents } from '../../../context';
import { generateMessage } from '../../../mock-builders';
import { convertDateToTimestamp } from '../../../mock-builders/generator/time';
import { ThreadHead } from '../ThreadHead';

// The parent message itself is out of scope here; only the separator above it is checked.
vi.mock('../../Message/Message', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../Message/Message')>()),
  Message: () => <div data-testid='parent-message' />,
}));

describe('ThreadHead', () => {
  it('renders the DateSeparator from ComponentContext with the parent message date', () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    const message = generateMessage({ created_at: convertDateToTimestamp(createdAt) });
    const CustomDateSeparator = vi.fn(() => <div data-testid='custom-date-separator' />);
    const ThreadStart = () => null;

    render(
      <WithComponents overrides={{ DateSeparator: CustomDateSeparator, ThreadStart }}>
        <ThreadHead message={message} />
      </WithComponents>,
    );

    expect(screen.getByTestId('custom-date-separator')).toBeInTheDocument();
    expect(screen.getByTestId('parent-message')).toBeInTheDocument();
    expect(CustomDateSeparator).toHaveBeenCalledWith(
      expect.objectContaining({ date: createdAt }),
      undefined,
    );
  });

  it("passes the list's formatDate to the DateSeparator", () => {
    const message = generateMessage({
      created_at: convertDateToTimestamp(new Date('2026-01-02T03:04:05.000Z')),
    });
    const formatDate = vi.fn(() => 'formatted');
    const CustomDateSeparator = vi.fn(() => null);

    render(
      <WithComponents
        overrides={{ DateSeparator: CustomDateSeparator, ThreadStart: () => null }}
      >
        <ThreadHead formatDate={formatDate} message={message} />
      </WithComponents>,
    );

    expect(CustomDateSeparator).toHaveBeenCalledWith(
      expect.objectContaining({ formatDate }),
      undefined,
    );
  });
});
