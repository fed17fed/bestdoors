"use client";

import { useState, type FormEvent } from "react";
import { Login, LoginForm, Link, useLocation } from "react-admin";
import { Alert, Box, Button, CardContent, CircularProgress, TextField, Typography } from "@mui/material";
import { NEW_PASSWORD_MIN } from "@bestdoors/shared";

/** The normal React Admin login form + a "Forgot password?" link. */
export function LoginPage() {
  return (
    <Login>
      <LoginForm />
      <Box sx={{ textAlign: "center", pb: 2 }}>
        <Link to="/forgot-password">Forgot password?</Link>
      </Box>
    </Login>
  );
}

function BackToLogin() {
  return (
    <Box sx={{ textAlign: "center", mt: 2 }}>
      <Link to="/login">Back to login</Link>
    </Box>
  );
}

async function post(path: string, body: unknown) {
  const res = await fetch(`/api/v1/auth/${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return;
  const data = (await res.json().catch(() => null)) as { message?: string } | null;
  throw new Error(data?.message ?? "Something went wrong. Please try again.");
}

/** Step 1: the admin types their email and gets a link. */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setState("sending");
    try {
      await post("forgot-password", { email });
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  return (
    <Login>
      <CardContent sx={{ width: 320 }}>
        <Typography variant="h6" gutterBottom>
          Forgot password
        </Typography>
        {state === "sent" ? (
          <Alert severity="success">
            If this email is registered, we have sent a link to reset the password. Please check your inbox (and the spam
            folder). The link works for 60 minutes.
          </Alert>
        ) : (
          <form onSubmit={submit}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Type your email. We will send you a link to choose a new password.
            </Typography>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={state === "sending"}>
              {state === "sending" ? <CircularProgress size={22} color="inherit" /> : "Send link"}
            </Button>
          </form>
        )}
        <BackToLogin />
      </CardContent>
    </Login>
  );
}

/** Step 2: the admin opens the link from the email and sets a new password. */
export function ResetPasswordPage() {
  const { search } = useLocation();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");
  // true when the server refused the link (expired, used or wrong)
  const [linkRefused, setLinkRefused] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < NEW_PASSWORD_MIN) return setError(`The password must be at least ${NEW_PASSWORD_MIN} characters.`);
    if (password !== repeat) return setError("The passwords do not match.");
    setState("saving");
    try {
      await post("reset-password", { token, password });
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setLinkRefused(true);
      setState("idle");
    }
  }

  return (
    <Login>
      <CardContent sx={{ width: 320 }}>
        <Typography variant="h6" gutterBottom>
          Choose a new password
        </Typography>
        {!token ? (
          <Alert severity="error">This link is not complete. Please ask for a new one.</Alert>
        ) : state === "done" ? (
          <Alert severity="success">Your password has been changed. You can log in now.</Alert>
        ) : (
          <form onSubmit={submit}>
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              fullWidth
              margin="normal"
              helperText={`At least ${NEW_PASSWORD_MIN} characters`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="Repeat new password"
              type="password"
              autoComplete="new-password"
              required
              fullWidth
              margin="normal"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={state === "saving"}>
              {state === "saving" ? <CircularProgress size={22} color="inherit" /> : "Save new password"}
            </Button>
          </form>
        )}
        {(state === "done" || !token || linkRefused) && (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Link to={state === "done" ? "/login" : "/forgot-password"}>
              {state === "done" ? "Go to login" : "Ask for a new link"}
            </Link>
          </Box>
        )}
      </CardContent>
    </Login>
  );
}
