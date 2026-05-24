"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ArtifactPreviewErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Artifact preview failed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="artifact-preview-host flex flex-col items-center justify-center gap-2 p-6 text-center">
          <AlertCircle
            size={20}
            className="text-danger shrink-0"
            aria-hidden
          />
          <p className="text-sm text-text-secondary">
            Preview failed to load. Check the Code tab for syntax issues.
          </p>
          <p className="max-w-full truncate text-xs font-mono text-text-muted">
            {this.state.error.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
