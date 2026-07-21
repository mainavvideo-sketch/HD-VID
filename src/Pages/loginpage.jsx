import "./loginpage.css";
import mid from "../assets/6mh.gif";
import loding from "../assets/loading.gif";
import hero from "../assets/logo.png";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Admin Login
    if (id === "admin" && password === "admin") {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("role", "admin");
      navigate("/");
      return;
    }

    // User Login
    if (id === "1234" && password === "1234") {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("role", "user");
      navigate("/");
      return;
    }

    // Invalid Login
    setError("Invalid ID or Password");
  };

  return (
    <div className="login-page">
      {/* <img className="top" src={mid} alt="Top" /> */}

      <form className="login-box" onSubmit={handleLogin}>
        <h2 className="login-i">Login</h2>

        <input
          type="text"
          placeholder="ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <h4 className="login-error">{error}</h4>}

        <button type="submit">Login</button>
      </form>

      {/* <img className="mid" src={loding} alt="Loading" />
      <img className="bottom" src={hero} alt="Logo" /> */}
    </div>
  );
}

export default Login;