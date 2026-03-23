import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-4"
          style={{ backgroundColor: "#F5FFF7" }}
        >
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}
            >
              Something went wrong
            </h1>
            <p
              className="text-sm mb-6"
              style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}
            >
              The page encountered an error. Please try reloading.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-3 rounded-xl font-semibold text-sm text-white"
                style={{ backgroundColor: "#00C853" }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 rounded-xl font-semibold text-sm border"
                style={{
                  color: "#1A1A1A",
                  borderColor: "#E0E0E0",
                  backgroundColor: "white",
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
