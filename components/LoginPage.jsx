// backend/components/LoginPage.jsx
import React, { useState } from "react";
import { PRODUCT_NAME } from "../src/config";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ marginRight: 10 }} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.6 0-14.1 4.3-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5C29.6 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.8 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.5 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="#fff" style={{ marginRight: 10 }} aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
    </svg>
  );
}

function LoginPage() {
  const [error] = useState("");
  const [showGithubWip, setShowGithubWip] = useState(false);

  return (
    <div className="login-page">
      <div className="login-hero">
        <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>
          🧠💪 Welcome to {PRODUCT_NAME}
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#334155", lineHeight: 1.7, marginBottom: 18 }}>
          AI can now write code for you — but the thinking that catches its mistakes still has to be yours.
          {PRODUCT_NAME} is where you train that muscle: unique logic challenges, instant feedback, and belts
          that track real progress.
        </p>
        <ul style={{ fontSize: "1.05rem", color: "#334155", lineHeight: 1.7, marginBottom: 0, paddingLeft: 18 }}>
          <li>
            🏋️‍♂️ <strong>Strengthen your thinking:</strong> Tackle unique, AI-generated challenges that build real problem-solving skills.
          </li>
          <li>
            🥇 <strong>Track your progress:</strong> Earn belts as you master tougher problems and climb the leaderboard.
          </li>
          <li>
            🚀 <strong>Instant feedback:</strong> Get actionable insights to improve your logic and creativity.
          </li>
          <li>
            ⏳ <strong>Flexible learning:</strong> Pause, save, and resume at your own pace.
          </li>
        </ul>
      </div>
      <div className="login-panel">
        <div style={{ width: "100%" }}>
          <h2 style={{
            marginBottom: 18,
            color: "#1e293b",
            fontWeight: 700,
            letterSpacing: 1,
            textAlign: "center"
          }}>
            Sign in to continue
          </h2>
          <div style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            margin: "32px 0"
          }}>
            <img
              src="/images/brain-gym-placeholder.png"
              alt=""
              style={{
                width: "80%",
                height: "auto",
                maxHeight: 260,
                objectFit: "contain",
                borderRadius: 16,
                boxShadow: "0 2px 16px #64748b22",
                marginBottom: 8
              }}
            />
            <div style={{
              color: "#64748b",
              fontSize: "1.05rem",
              textAlign: "center",
              marginBottom: 8
            }}>
              Train your mind with daily logic challenges and join a global community of thinkers.
            </div>
            <div style={{
              color: "#2563eb",
              background: "#f1f5fd",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: "0.98rem",
              marginTop: 8,
              marginBottom: 0,
              textAlign: "center",
              boxShadow: "0 1px 6px #2563eb11"
            }}>
              🧩 <strong>Brain Fact:</strong> Solving puzzles and logic problems regularly can help improve memory, focus, and cognitive flexibility!
            </div>
          </div>
        </div>
        {error && (
          <div style={{ color: "#dc2626", marginBottom: 12, fontWeight: 600 }}>{error}</div>
        )}
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 0
        }}>
          <button
            className="social-login-btn google"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
              color: "#222",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "12px 0",
              fontWeight: 600,
              fontSize: "1.1rem",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onClick={async () => {
              const { signIn } = await import("next-auth/react");
              signIn("google");
            }}
          >
            <GoogleIcon />
            Sign in with Google
          </button>
          <button
            className="social-login-btn github"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#222",
              color: "#fff",
              border: "1px solid #222",
              borderRadius: 8,
              padding: "12px 0",
              fontWeight: 600,
              fontSize: "1.1rem",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onClick={() => setShowGithubWip(true)}
          >
            <GithubIcon />
            Sign in with GitHub
          </button>
        </div>
      </div>
      {showGithubWip && (
        <div
          onClick={() => setShowGithubWip(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "32px 28px",
              maxWidth: 380,
              textAlign: "center",
              boxShadow: "0 12px 48px #0f172a44"
            }}
          >
            <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>🚧🏋️</div>
            <h3 style={{ margin: "0 0 12px", color: "#1e293b" }}>Leg day for our engineers</h3>
            <p style={{ color: "#334155", lineHeight: 1.6, margin: "0 0 20px" }}>
              GitHub sign-in is still stuck under the barbell — we haven&apos;t wired it up yet.
              Give it some time to bulk up, and use Google in the meantime!
            </p>
            <button
              onClick={() => setShowGithubWip(false)}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              Got it, I&apos;ll use Google 💪
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
