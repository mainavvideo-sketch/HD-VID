import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { isSessionValid, logout, AUTH_CHANGED_EVENT } from "./authStore";

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [valid, setValid] = useState(isSessionValid());

  useEffect(() => {
    const check = () => {
      const stillValid = isSessionValid();
      setValid(stillValid);
      if (!stillValid) {
        logout();
        navigate("/login", { replace: true });
      }
    };

    // Other open tabs/windows: fires automatically on any localStorage write.
    window.addEventListener("storage", check);
    // This tab: fired manually right when a credential change happens.
    window.addEventListener(AUTH_CHANGED_EVENT, check);
    // Catch anything missed while this tab was backgrounded/minimized.
    window.addEventListener("focus", check);

    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener(AUTH_CHANGED_EVENT, check);
      window.removeEventListener("focus", check);
    };
  }, [navigate]);

  return valid ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
