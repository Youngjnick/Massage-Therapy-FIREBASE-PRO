import React from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getApp } from "firebase/app";

async function logErrorToFirebase(error: Error, errorInfo: React.ErrorInfo) {
  try {
    const db = getFirestore(getApp());
    await addDoc(collection(db, "errorLogs"), {
      message: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: Date.now(),
    });
  } catch {
    if (typeof window !== "undefined") {
      let safeError: string | boolean | Error | undefined;
      if (error instanceof Error) {
        safeError = error;
      } else if (typeof error === "string" || typeof error === "boolean") {
        safeError = error;
      } else if (error && typeof error === "object" && "message" in error) {
        safeError = String((error as { message?: unknown }).message);
      } else {
        safeError = JSON.stringify(error);
      }
      window.__ERROR_BOUNDARY_FIREBASE_ERROR__ = safeError;
    }
  }
}

export interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  recovered: boolean;
  showFeedback: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  recoveryLiveRef: React.RefObject<HTMLDivElement | null> = React.createRef<HTMLDivElement>();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recovered: false,
      showFeedback: false,
    };
    this.handleFeedback = this.handleFeedback.bind(this);
    this.handleFeedbackSubmit = this.handleFeedbackSubmit.bind(this);
    this.handleCloseFeedback = this.handleCloseFeedback.bind(this);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, recovered: false } as Partial<ErrorBoundaryState>;
  }

  async componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, errorInfo: info });
    if (this.props.onError) this.props.onError(error, info);
    if (typeof window !== "undefined") {
      window.__ERROR_BOUNDARY_ERROR__ = error?.message || error || true;
    }
    await logErrorToFirebase(error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
    if (prevState.hasError && !this.state.hasError) {
      if (this.recoveryLiveRef.current) {
        this.recoveryLiveRef.current.textContent = "The app has recovered from an error.";
        setTimeout(() => {
          if (this.recoveryLiveRef.current) this.recoveryLiveRef.current.textContent = "";
        }, 2000);
      }
      this.setState({ recovered: true });
    }
  }

  handleFeedback() {
    this.setState({ showFeedback: true });
  }

  async handleFeedbackSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const feedbackInput = form.elements.namedItem("feedback");
    const feedback = (feedbackInput && (feedbackInput as HTMLTextAreaElement).value) || "";
    try {
      const db = getFirestore(getApp());
      await addDoc(collection(db, "errorFeedback"), {
        feedback,
        error: this.state.error?.toString(),
        errorInfo: this.state.errorInfo?.componentStack,
        timestamp: Date.now(),
      });
      this.setState({ showFeedback: false });
    } catch {
      this.setState({ showFeedback: false });
    }
  }

  handleCloseFeedback() {
    this.setState({ showFeedback: false });
  }

  render() {
    if (this.state.hasError) {
      // --- E2E/DEV DEBUG: Print error and stack to DOM and console ---
      const isJest =
        typeof process !== "undefined" &&
        process.env &&
        process.env.JEST_WORKER_ID;
      let isE2EOrDev = false;
      if (!isJest) {
        if (typeof window !== "undefined" && window.__E2E_TEST__) {
          isE2EOrDev = true;
        } else {
          let meta;
          try {
            meta =
              typeof eval === "function"
                ? eval(
                    'typeof import !== "undefined" && typeof import.meta !== "undefined" ? import.meta : undefined',
                  )
                : undefined;
          } catch {
            meta = undefined;
          }
          if (
            meta &&
            meta.env &&
            (meta.env.MODE === "development" || meta.env.VITE_E2E)
          ) {
            isE2EOrDev = true;
          }
        }
      }
      if (isE2EOrDev) {
        // eslint-disable-next-line no-console
        console.error("[E2E/DEV][ErrorBoundary] Error:", this.state.error);
        // eslint-disable-next-line no-console
        console.error(
          "[E2E/DEV][ErrorBoundary] ErrorInfo:",
          this.state.errorInfo,
        );
      }
      if (this.state.showFeedback) {
        return (
          <div
            role="alertdialog"
            aria-modal="true"
            style={{
              color: "#222",
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              maxWidth: 400,
              margin: "40px auto",
              textAlign: "center",
            }}
          >
            <h2>Report this issue</h2>
            <form onSubmit={this.handleFeedbackSubmit}>
              <textarea
                name="feedback"
                rows={4}
                style={{ width: "100%", marginBottom: 12 }}
                aria-label="Describe what happened"
                required
              />
              <br />
              <button type="submit" style={{ marginRight: 8 }}>
                Submit
              </button>
              <button type="button" onClick={this.handleCloseFeedback}>
                Cancel
              </button>
            </form>
          </div>
        );
      }
      // Custom fallback support
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          role="alert"
          style={{
            color: "#f66",
            textAlign: "center",
            margin: 32,
            fontSize: 18,
          }}
        >
          Something went wrong. Please reload or contact support.
          <br />
          {/* E2E/DEV: Show error message and stack for debugging */}
          {(() => {
            const isJest =
              typeof process !== "undefined" &&
              process.env &&
              process.env.JEST_WORKER_ID;
            let isE2EOrDev = false;
            if (!isJest) {
              if (typeof window !== "undefined" && window.__E2E_TEST__) {
                isE2EOrDev = true;
              } else {
                let meta;
                try {
                  meta =
                    typeof eval === "function"
                      ? eval(
                          'typeof import !== "undefined" && typeof import.meta !== "undefined" ? import.meta : undefined',
                        )
                      : undefined;
                } catch {
                  meta = undefined;
                }
                if (
                  meta &&
                  meta.env &&
                  (meta.env.MODE === "development" || meta.env.VITE_E2E)
                ) {
                  isE2EOrDev = true;
                }
              }
            }
            return isE2EOrDev && this.state.error ? (
              <pre
                data-testid="e2e-error-stack"
                style={{
                  color: "#a00",
                  background: "#fff0f0",
                  fontSize: 13,
                  margin: "16px auto",
                  maxWidth: 700,
                  overflowX: "auto",
                  padding: 12,
                  borderRadius: 8,
                  textAlign: "left",
                }}
              >
                {String(this.state.error)}\n{this.state.error?.stack}\n
                {this.state.errorInfo?.componentStack}
              </pre>
            ) : null;
          })()}
          <button
            onClick={this.handleFeedback}
            style={{ marginTop: 16 }}
            aria-label="Report this issue"
          >
            Report this issue
          </button>
        </div>
      );
    }
    return (
      <>
        <div
          ref={(el: HTMLDivElement | null): void => {
            this.recoveryLiveRef.current = el;
          }}
          aria-live="polite"
          style={{
            position: "absolute",
            left: -9999,
            top: "auto",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        />
        {this.props.children}
      </>
    );
  }
}
