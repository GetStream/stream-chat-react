import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as sanitizeUrl from '@braintree/sanitize-url';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import { SafeAnchor } from '../SafeAnchor';

describe('SafeAnchor', () => {
  it('should sanitize urls', async () => {
    const mockSanitizedUrl = 'http://very.clean/';
    const sanitizeUrlSpy = jest
      .spyOn(sanitizeUrl, 'sanitizeUrl')
      .mockImplementation(() => mockSanitizedUrl);
    const href = 'something';
    const anchorText = 'something else';
    const { container, getByText } = render(<SafeAnchor href={href}>{anchorText}</SafeAnchor>);

    expect(sanitizeUrlSpy).toHaveBeenCalledWith(href);
    expect(getByText(anchorText).href).toBe(mockSanitizedUrl);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
