import React from 'react';
import { cleanup, render } from '@testing-library/react';

import { ChannelListUI } from '../ChannelListUI';
import { TranslationProvider } from '../../../context';
import { mockTranslationContextValue } from '../../../mock-builders';

// Weird hack to avoid big warnings
// Maybe better to find a better solution for it.
console.warn = () => null;

const Component = ({ error = false, loading = false }: any) => (
  <TranslationProvider value={mockTranslationContextValue()}>
    <ChannelListUI
      {...({
        error,
        loading,
        LoadingErrorIndicator: () => <div>Loading Error Indicator</div>,
        LoadingIndicator: () => <div>Loading Indicator</div>,
      } as any)}
    >
      <div>children 1</div>
      <div>children 2</div>
    </ChannelListUI>
  </TranslationProvider>
);

describe('ChannelListMessenger', () => {
  afterEach(cleanup);

  it('by default, children should be rendered', () => {
    const { container } = render(<Component />);
    expect(container).toMatchSnapshot();
  });
  it('when `error` prop is true, `LoadingErrorIndicator` should be rendered', () => {
    const { container } = render(<Component error={true} />);
    expect(container).toMatchSnapshot();
  });
  it('when `loading` prop is true, `LoadingIndicator` should be rendered', () => {
    const { container } = render(<Component loading={true} />);
    expect(container).toMatchSnapshot();
  });
});
