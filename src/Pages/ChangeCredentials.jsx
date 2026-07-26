import "./loginpage.css";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, changeCredentials, endSession, findAccount } from "../authStore";

// Lets the currently logged-in user change their own ID and/or password.
// On success it bumps that account's credential version, which:
//   - logs this tab out too (you should always re-auth after a change), and
//   - logs out every OTHER tab/window of the SAME BROWSER via the
//     "storage" event that ProtectedRoute listens for.
// (True cross-DEVICE logout needs a backend — see the note in authStore.js.)
function ChangeCredentials() {
  const [newId, setNewId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const session = getSession();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const account = findAccount(session.id);
    if (!account) {
      setError("Account not found");
      return;
    }

    const result = changeCredentials(session.id, {
      newId: newId.trim() || undefined,
      newPassword: newPassword || undefined,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Force this tab to re-authenticate under the new credentials too.
    endSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="login-page">
      <form className="login-box login-box-in" onSubmit={handleSubmit} noValidate>
        <h2 className="login-i">Change ID / Password</h2>

        <label className="field-label" htmlFor="new-id">
          New ID (leave blank to keep current)
        </label>
        <input
          id="new-id"
          type="text"
          placeholder={session ? session.id : "Enter new ID"}
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
        />

        <label className="field-label" htmlFor="new-password">
          New password (leave blank to keep current)
        </label>
        <input
          id="new-password"
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <label className="field-label" htmlFor="confirm-password">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <h4 className="login-error">{error}</h4>}

        <button type="submit" className="login-submit">
          Save changes
        </button>
      </form>
    </div>
  );
}

export default ChangeCredentials;
