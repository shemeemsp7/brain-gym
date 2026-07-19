// backend/components/LoginPage.jsx
import React, { useState } from "react";

function LoginPage() {
  const [error, setError] = useState("");
  const [showGithubWip, setShowGithubWip] = useState(false);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "stretch",
      justifyContent: "center",
      background: "#f8fafc"
    }}>
      {/* Description Section */}
      <div style={{
        flex: 1,
        maxWidth: 520,
        padding: "48px 32px 48px 140px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minWidth: 800
      }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>
          🧠💪 Welcome to Brain Gym
        </h1>
        <div style={{ fontSize: "1.1rem", color: "#334155", lineHeight: 1.7, marginBottom: 18 }}>
          <p>
            Long ago, daily life kept people physically strong—no gym required. Tasks like farming, walking, and manual labor meant everyone exercised naturally. But the 20th century brought desk jobs, and physical activity declined. Gyms arose to help people stay fit.<br /><br />
            Now, a similar shift is happening for our minds. Programmers once thrived on original thinking and problem-solving. With AI handling routine tasks, our &quot;thinking muscles&quot; risk getting weaker. That’s why Brain Gym exists: a place to train your mind, challenge your logic, and keep your brain in shape for the future.
          </p>
        </div>
        <ul style={{ fontSize: "1.1rem", color: "#334155", lineHeight: 1.7, marginBottom: 0, paddingLeft: 18 }}>
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
          <li>
            🌍 <strong>Global community:</strong> Compare your growth and skills with peers worldwide.
          </li>
        </ul>
        <div style={{ marginTop: 32, color: "#64748b", fontSize: "1rem" }}>
          <em>
            Brain Gym is your space for mental fitness—no syntax, no boilerplate, just pure problem solving. <br />
            <span role="img" aria-label="brain with muscle">🧠💪</span>
          </em>
        </div>
      </div>
      {/* Login Section */}
      <div style={{
        flex: 1,
        maxWidth: 400,
        minWidth: 340,
        height: "80vh",
        background: "#fff",
        borderRadius: 24,
        boxShadow: "0 8px 40px #64748b33",
        padding: "56px 36px",
        margin: "auto 6vw auto 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
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
              alt="Brain Gym"
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
            <img
              src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
              alt="Google"
              style={{ width: 22, height: 22, marginRight: 10, verticalAlign: "middle" }}
            />
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
            <img
              src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
              alt="GitHub"
              style={{ width: 22, height: 22, marginRight: 10, verticalAlign: "middle", filter: "invert(1)" }}
            />
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