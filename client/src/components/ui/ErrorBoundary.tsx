import { Component, type ErrorInfo, type ReactNode } from "react";
import { GIconRotateRight, GIconClose } from "../icons/GravityIcons";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an application error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 h-full w-full flex flex-col items-center justify-center p-6 text-center bg-[#0d0e15]/95 text-white select-none">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <div className="space-y-1 text-center">
              <h3 className="text-sm font-semibold text-white">
                {this.props.fallbackTitle ? `${this.props.fallbackTitle} Encountered an Error` : "Application Crash Prevented"}
              </h3>
              <p className="text-xs text-white/60 font-sans leading-relaxed">
                A runtime exception occurred in this window. The rest of your desktop and open applications remain intact.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="w-full p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] text-rose-300 text-left overflow-x-auto thin-scroll break-all max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-3.5 py-1.5 rounded-xl bg-accent hover:brightness-110 active:scale-95 text-xs font-medium text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/25"
              >
                <GIconRotateRight size={13} />
                <span>Reload App</span>
              </button>
              {this.props.onClose && (
                <button
                  type="button"
                  onClick={this.props.onClose}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-medium text-white/70 hover:text-white transition flex items-center gap-1.5 cursor-pointer border border-white/10"
                >
                  <GIconClose size={13} />
                  <span>Close Window</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
