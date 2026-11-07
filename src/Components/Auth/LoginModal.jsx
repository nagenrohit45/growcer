import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/client";
export default function LoginModal({ onLogin, onClose }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.querySelector("input")?.focus();
    const key = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const fields = [
          ...dialog.current.querySelectorAll("button:not(:disabled), input"),
        ];
        const first = fields[0],
          last = fields[fields.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api(register ? "/auth/register" : "/auth/login", {
        method: "POST",
        body,
      });
      onLogin(result.user);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="login-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="login-box"
      >
        <button
          className="modal-close"
          aria-label="Close sign in"
          onClick={onClose}
          disabled={busy}
        >
          ×
        </button>
        <p className="eyebrow">Your everyday market</p>
        <h2 id="auth-title">
          {register ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-muted">Save your orders and keep shopping.</p>
        {error && (
          <div role="alert" className="alert alert-danger">
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          {register && (
            <div className="mb-3">
              <label htmlFor="auth-name" className="form-label">
                Your name
              </label>
              <input
                id="auth-name"
                name="name"
                autoComplete="name"
                className="form-control"
                required
                minLength="2"
                maxLength="100"
              />
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="auth-email" className="form-label">
              Email address
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-control"
              required
              maxLength="254"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="auth-password" className="form-label">
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              className="form-control"
              required
              minLength="8"
              maxLength="128"
            />
            <small className="text-muted">At least 8 characters.</small>
          </div>
          <button className="btn btn-success w-100" disabled={busy}>
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 mb-0 text-center">
          <button
            className="link-button"
            disabled={busy}
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </p>
      </section>
    </div>
  );
}
