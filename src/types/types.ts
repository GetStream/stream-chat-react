import type { PropsWithChildren } from 'react';
import type { LoadingIndicatorProps } from '../components/Loading/LoadingIndicator';

export type UnknownType = Record<string, unknown>;
export type PropsWithChildrenOnly = PropsWithChildren<Record<never, never>>;

export type CustomMessageType = 'channel.intro' | 'message.date';

export type PaginatorProps = {
  /** Loads the next page. */
  loadNextPage: () => void;
  /** Whether there is a next page to load. */
  hasNextPage?: boolean;
  /** Whether there is a previous page to load. */
  hasPreviousPage?: boolean;
  /** Whether a loading request is in progress. */
  isLoading?: boolean;
  /** Loading indicator to use. */
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  /** Loads the previous page. */
  loadPreviousPage?: () => void;
  /** Whether to display the items in opposite order. */
  reverse?: boolean;
  /** Offset from which `loadNextPage` is called. */
  threshold?: number;
};

export interface IconProps {
  className?: string;
}

export type Dimensions = { height?: string; width?: string };

export type Readable<T> = {
  [key in keyof T]: T[key];
} & {};

export type ValuesType<T> = T[keyof T];

export type PartialSelected<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
