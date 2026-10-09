import React from 'react';
import { render, screen } from '@testing-library/react';

import ErrorBoundary from '../ErrorBoundary';

const Boom = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary fallback={<div>fallback</div>}>
        <div>child</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('child')).toBeInTheDocument();
    expect(screen.queryByText('fallback')).toBeNull();
  });

  it('renders the fallback when a child throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      render(
        <ErrorBoundary fallback={<div>fallback</div>}>
          <Boom />
        </ErrorBoundary>,
      );
      expect(screen.getByText('fallback')).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});
