// @vitest-environment node
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StateStore } from '@stream-io/state-store';

import { useStateStore } from '../useStateStore';

const selector = (state: { a: number }) => ({ a: state.a });

const Probe = ({ store }: { store: StateStore<{ a: number }> }) => {
  const { a } = useStateStore(store, selector);
  return <span>{`value:${a}`}</span>;
};

describe('useStateStore (server rendering)', () => {
  it('renders the current store value without a getServerSnapshot error', () => {
    const html = renderToString(<Probe store={new StateStore({ a: 1 })} />);
    expect(html).toContain('value:1');
  });
});
