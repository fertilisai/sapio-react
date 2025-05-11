import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20">
          <h3 className="text-red-600 dark:text-red-400 font-semibold">Something went wrong</h3>
          {this.props.showError && (
            <details className="mt-2 text-sm text-red-500">
              <summary>Error details</summary>
              <p className="mt-1">{this.state.error?.toString()}</p>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;