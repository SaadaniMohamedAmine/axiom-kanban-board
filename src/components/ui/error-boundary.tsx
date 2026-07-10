"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, eventId: null };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
    this.setState({ eventId });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen bg-background flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-widest mb-3">
                Axiom
              </div>
              <h1 className="text-2xl font-semibold text-on-surface mb-3">
                Something went wrong.
              </h1>
              <p className="text-[14px] text-on-surface-variant mb-8">
                An unexpected error occurred. The team has been notified automatically.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => this.setState({ hasError: false, eventId: null })}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-[14px] font-medium hover:brightness-110 transition-all"
                >
                  Try again
                </button>
                <a
                  href="/"
                  className="px-5 py-2.5 border border-outline-variant text-on-surface rounded-xl text-[14px] font-medium hover:bg-surface-container-high transition-colors"
                >
                  Back to home
                </a>
              </div>
              {this.state.eventId && (
                <p className="mt-6 text-[11px] text-on-surface-variant/30 font-mono">
                  Ref: {this.state.eventId}
                </p>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
