import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as sanitizeUrl from '@braintree/sanitize-url';

import SafeAnchor from '../SafeAnchor';

describe('SafeAnchor', () => {
  it('should sanitize urls', () => {
    const mockSanitizedUrl = 'http://very.clean/';
    const sanitizeUrlSpy = jest
      .spyOn(sanitizeUrl, 'sanitizeUrl')
      .mockImplementation(() => mockSanitizedUrl);
    const href = 'something';
    const anchorText = 'something else';
    const { getByText } = render(
      <SafeAnchor href={href}>{anchorText}</SafeAnchor>,
    );

    expect(sanitizeUrlSpy).toHaveBeenCalledWith(href);
    expect(getByText(anchorText).href).toBe(mockSanitizedUrl);
  });
});
