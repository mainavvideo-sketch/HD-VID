import "./loginpage.css"
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

    if (id === "1234" && password === "1234") {
      localStorage.setItem("loggedIn", "true");
      navigate("/");
    } else {
      setError(<h4 className="login-i">Invalid ID or Password</h4>);
    }
  };

  return (
    <div className="login-page">

      <img className="top" src={mid}/>
      <form className="login-box" onSubmit={handleLogin}>
        <h2 className="login-i" >Login</h2>

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

        {error && <p>{error}</p>}

        <button type="submit">Login</button>
      </form>

      <img className="mid" src={loding}/>
      <img className="bottom" src={hero}/>
    </div>
  );
}

export default Login;