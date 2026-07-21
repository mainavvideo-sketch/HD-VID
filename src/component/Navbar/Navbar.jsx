import "./Navbar.css";
import { HouseDoorFill, Gitlab, Bluesky, TencentQq, CloudUploadFill } from "react-bootstrap-icons";
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
          <Link to="/">
            <img src={hero} alt="logo" className="rotate" />
          </Link>
          <SearchForm />
        </div>

        <ul>
          <li>
            <NavLink to="/" end className={linkClass}>
              <HouseDoorFill />
            </NavLink>
          </li>

          <li>
            <NavLink to="/american" className={linkClass}>
              <Bluesky />
            </NavLink>
          </li>

          <li>
            <NavLink to="/china" className={linkClass}>
              <TencentQq />
            </NavLink>
          </li>

          {/* Show Upload icon only for Admin */}
          {role === "admin" && (
            <li>
              <NavLink to="/upload" className={linkClass}>
                <CloudUploadFill />
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
