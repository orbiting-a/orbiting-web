"use client";

import { Component, type ReactNode } from "react";
import { Button } from "./Button";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h2>
          <p className="text-sm text-text-muted mb-4">{this.state.error?.message || "An unexpected error occurred"}</p>
          <Button variant="primary" onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
