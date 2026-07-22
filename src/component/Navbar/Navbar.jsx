import "./Navbar.css";
import { HouseDoorFill, Gitlab, Bluesky, TencentQq, Backpack4Fill } from "react-bootstrap-icons";
import { Link, NavLink } from "react-router-dom";
import hero from "../../assets/logo.png";
import SearchForm from "../searchform/search";
import LogoutButton from "../loguot/loagout";

function Navbar() {
  const role = localStorage.getItem("role");

  const linkClass = ({ isActive }) => (isActive ? "links active" : "links");

  return (
    <nav>
      <div className="nav">
        <div className="nav-logo">
          <Link to="/" className="brand">
            <img src={hero} alt="logo" className="rotate" />
          </Link>
          <SearchForm />
        </div>

        <ul>
          <li data-label="Home">
            <NavLink to="/" end className={linkClass}>
              <HouseDoorFill />
              <span className="link-label">Home</span>
            </NavLink>
          </li>

          <li data-label="American">
            <NavLink to="/american" className={linkClass}>
              <Bluesky />
              <span className="link-label">American</span>
            </NavLink>
          </li>

          <li data-label="China">
            <NavLink to="/china" className={linkClass}>
              <TencentQq />
              <span className="link-label">China</span>
            </NavLink>
          </li>
          
          <li data-label="Jav">
            <NavLink to="/jav" className={linkClass}>
              <Gitlab />
              <span className="link-label">China</span>
            </NavLink>
          </li>

          {/* Show Upload icon only for Admin */}
          {role === "admin" && (
            <li data-label="Menu">
              <NavLink to="/menu" className={linkClass}>
                <Backpack4Fill />
                <span className="link-label">Menu</span>
              </NavLink>
            </li>
          )}

          <li className="logout">
            <LogoutButton />
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
