import { useNavigate } from "react-router-dom";
import "./logout.css";
import { BoxArrowRight } from "react-bootstrap-icons";

function LogoutButton() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("loggedIn");
    navigate("/login");
  };

  return (
    <button className="logout-button" onClick={logout} aria-label="Log out">
      <BoxArrowRight />
      <span className="link-label">Logout</span>
    </button>
  );
}

export default LogoutButton;
