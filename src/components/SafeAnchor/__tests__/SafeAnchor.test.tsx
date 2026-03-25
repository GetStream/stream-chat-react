import React from 'react';
import { render } from '@testing-library/react';
import * as sanitizeUrl from '@braintree/sanitize-url';
import { axe } from '../../../../axe-helper';

import { SafeAnchor } from '../SafeAnchor';

describe('SafeAnchor', () => {
  it('should sanitize urls', async () => {
    const mockSanitizedUrl = 'http://very.clean/';
    const sanitizeUrlSpy = vi
      .spyOn(sanitizeUrl, 'sanitizeUrl')
      .mockImplementation(() => mockSanitizedUrl);
    const href = 'something';
    const anchorText = 'something else';
    const { container, getByText } = render(
      <SafeAnchor href={href}>{anchorText}</SafeAnchor>,
    );

    expect(sanitizeUrlSpy).toHaveBeenCalledWith(href);
    expect((getByText(anchorText) as HTMLAnchorElement).href).toBe(mockSanitizedUrl);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
