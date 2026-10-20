import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 text-center rounded-xl bg-red-50 text-red-600 text-sm">
          Something went wrong loading this content.
          <div className="mt-2 text-xs opacity-70 truncate">{this.state.error?.message}</div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            className="mt-2 text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-full font-medium transition"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
