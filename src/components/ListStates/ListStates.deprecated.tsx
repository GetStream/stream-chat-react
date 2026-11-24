import React from 'react';

import {
  ListLoadErrorUI,
  type ListLoadErrorUIComponentProps,
  type ListLoadErrorUIProps,
} from './ListLoadErrorUI';

// Each deprecated name renders its new one. A component, not an alias of the same value: the new
// component is read when the old one renders, so import order cannot leave the old name undefined.

/** @deprecated Use `ListLoadErrorUI`, which it renders. Removed in the next major. */
export const ListLoadErrorIndicator = (props: ListLoadErrorUIComponentProps) => (
  <ListLoadErrorUI {...props} />
);

/** @deprecated Use `ListLoadErrorUIProps`, the same type. Removed in the next major. */
export type ListLoadErrorIndicatorProps = ListLoadErrorUIProps;

/**
 * @deprecated Use `ListLoadErrorUIComponentProps`, where `listType` is optional. Removed in the
 * next major.
 */
export type DefaultListLoadErrorIndicatorProps = ListLoadErrorUIComponentProps &
  Required<Pick<ListLoadErrorUIComponentProps, 'listType'>>;
