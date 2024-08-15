import { Component } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';

type ErrorBoundaryProps = PropsWithChildren<{ fallback?: ReactNode }>;

export class ErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, information: unknown) {
    console.error(error, information);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
