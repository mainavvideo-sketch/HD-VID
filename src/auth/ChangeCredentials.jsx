import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changeCredentials, getRole } from "./authStore";
import "./loginpage.css";

// Demo screen for the flow you asked about: update the ID and/or password,
// then every open tab/window (this one included) gets logged out and sent
// back to the login page.
function ChangeCredentials() {
  const [newId, setNewId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();
  const role = getRole();

  // This demo only has two seed accounts, distinguished by role. Swap this
  // for however you actually identify "the current account" once real
  // accounts/users exist.
  const currentId = role === "admin" ? "admin" : "user";

  const [formError, setFormError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newId.trim() && !newPassword.trim()) return;

    try {
      changeCredentials(currentId, {
        newId: newId || undefined,
        newPassword: newPassword || undefined,
      });
    } catch (err) {
      setFormError(err.message || "Could not update credentials");
      return;
    }

    // changeCredentials() already invalidated every open tab/window,
    // including this one - so send this tab to the login page too.
    navigate("/login", { replace: true });
  };

  return (
    <div className="login-page">
      <form className="login-box login-box-in" onSubmit={handleSubmit}>
        <h2 className="login-i">Change ID / Password</h2>

        <label className="field-label" htmlFor="new-id">
          New ID (optional)
        </label>
        <input
          id="new-id"
          type="text"
          placeholder="Leave blank to keep current ID"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
        />

        <label className="field-label" htmlFor="new-password">
          New password (optional)
        </label>
        <input
          id="new-password"
          type="password"
          placeholder="Leave blank to keep current password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        {formError && <h4 className="login-error">{formError}</h4>}

        <button type="submit" className="login-submit">
          Save (logs out everywhere)
        </button>
      </form>
    </div>
  );
}

export default ChangeCredentials;
