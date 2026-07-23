import "./loginpage.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Simple inline icons so the component has zero extra dependencies
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function Login() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ id: false, password: false });
  const [shakeToken, setShakeToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const checkCapsLock = (e) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const navigate = useNavigate();

  // Entrance animation trigger + restore a remembered ID
  useEffect(() => {
    setMounted(true);
    const savedId = localStorage.getItem("rememberedId");
    if (savedId) {
      setId(savedId);
      setRememberMe(true);
    }
  }, []);

  const triggerError = (message) => {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Marks fields invalid. shakeToken flips each call so the CSS class name
  // literally changes every time (input-shake-a <-> input-shake-b), which
  // reliably restarts the animation even on repeated identical failures.
  const markInvalid = (idWrong, passwordWrong) => {
    setFieldErrors({ id: idWrong, password: passwordWrong });
    setShakeToken((t) => t + 1);
  };

  // Known accounts. Swap this out for a real API call when one is available.
  const ACCOUNTS = [
    { id: "admin", password: "admin", role: "admin" },
    { id: "1234", password: "1234", role: "user" },
  ];

  const handleLogin = (e) => {
    e.preventDefault();

    const trimmedId = id.trim();
    const trimmedPassword = password.trim();

    const nextFieldErrors = {
      id: trimmedId.length === 0,
      password: trimmedPassword.length === 0,
    };
    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.id || nextFieldErrors.password) {
      triggerError("Please fill in both fields");
      return;
    }

    setLoading(true);
    setError("");

    // Simulated request delay so the loading state has something to show.
    setTimeout(() => {
      setLoading(false);

      if (rememberMe) {
        localStorage.setItem("rememberedId", trimmedId);
      } else {
        localStorage.removeItem("rememberedId");
      }

      const account = ACCOUNTS.find(
        (a) => a.id === trimmedId && a.password === trimmedPassword
      );

      if (account) {
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("role", account.role);
        navigate("/");
        return;
      }

      // Figure out exactly what's wrong: the ID, the password, or both
      const idRecord = ACCOUNTS.find((a) => a.id === trimmedId);
      const passwordExistsSomewhere = ACCOUNTS.some(
        (a) => a.password === trimmedPassword
      );

      if (!idRecord && !passwordExistsSomewhere) {
        markInvalid(true, true);
        triggerError("ID and password are incorrect");
      } else if (!idRecord) {
        markInvalid(true, false);
        triggerError("ID is incorrect");
      } else {
        markInvalid(false, true);
        triggerError("Password is incorrect");
      }
    }, 600);
  };

  return (
    <div className="login-page">
      <form
        className={`login-box ${mounted ? "login-box-in" : ""} ${shake ? "login-box-shake" : ""}`}
        onSubmit={handleLogin}
        noValidate
      >
        <h2 className="login-i">Login</h2>

        <label className="field-label" htmlFor="login-id">
          ID
        </label>
        <input
          id="login-id"
          type="text"
          placeholder="Enter your ID"
          autoComplete="username"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            if (fieldErrors.id) setFieldErrors((f) => ({ ...f, id: false }));
          }}
          className={
            fieldErrors.id
              ? `input-invalid ${shakeToken % 2 === 0 ? "input-shake-a" : "input-shake-b"}`
              : ""
          }
          aria-invalid={fieldErrors.id}
        />

        <label className="field-label" htmlFor="login-password">
          Password
        </label>
        <div className="password-wrapper">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: false }));
            }}
            onKeyUp={checkCapsLock}
            onKeyDown={checkCapsLock}
            onBlur={() => setCapsLockOn(false)}
            className={
              fieldErrors.password
                ? `input-invalid ${shakeToken % 2 === 0 ? "input-shake-a" : "input-shake-b"}`
                : ""
            }
            aria-invalid={fieldErrors.password}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {capsLockOn && (
          <span className="caps-warning" role="status">
            Caps Lock is on
          </span>
        )}

        <div className="login-row">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>
        </div>

        {error && <h4 className="login-error">{error}</h4>}

        <button type="submit" className="login-submit" disabled={loading}>
          {loading ? <span className="spinner" aria-hidden="true" /> : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;
