// src/components/AppErrorBoundary.jsx
// Global error boundary — catches React render crashes and shows a recovery UI
// instead of a blank white screen (critical for iOS Safari debugging).
import { Component } from "react"

export class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error("[AppErrorBoundary] Unhandled render error:", error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#0b0f19",
          color: "#e2e8f0",
          textAlign: "center",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, marginBottom: 20,
          }}>⚠</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 340, margin: "0 0 24px", lineHeight: 1.6 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 24px", borderRadius: 10,
              background: "#6366f1", color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 600,
            }}
          >
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
