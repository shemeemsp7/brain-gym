// backend/components/RegisterPage.jsx
import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { PRODUCT_NAME } from "../src/config";

function RegisterPage({ onRegister, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Registration successful! You can now log in.");
        setName("");
        setEmail("");
        setPassword("");
        if (onRegister) onRegister(data.user);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Registration failed");
    }
    setLoading(false);
  }

  return (
    <div className="login-container">
      <h2 className="login-title">Register for {PRODUCT_NAME}</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <TextField
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={loading}
          sx={{ marginTop: "12px" }}
        >
          {loading ? <CircularProgress size={24} /> : "Register"}
        </Button>
        <Button
          variant="text"
          color="secondary"
          onClick={onSwitchToLogin}
          sx={{ marginTop: "8px" }}
        >
          Already have an account? Log In
        </Button>
      </form>
    </div>
  );
}

export default RegisterPage;