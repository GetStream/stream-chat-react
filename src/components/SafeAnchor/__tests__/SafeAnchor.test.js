import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import sanitizeUrl from '@braintree/sanitize-url';

import SafeAnchor from '../SafeAnchor';

describe('SafeAnchor', () => {
  it('should sanitize urls', () => {
    const sanitizeUrlSpy = jest.spyOn(sanitizeUrl, 'sanitizeUrl');
    const href = 'something';
    render(<SafeAnchor href={href} />);

    expect(sanitizeUrlSpy).toHaveBeenCalledWith(href);
  });
});
